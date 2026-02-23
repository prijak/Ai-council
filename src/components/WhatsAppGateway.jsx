/**
 * WhatsAppGateway.jsx
 *
 * Connects users to their AI Council personas via WhatsApp.
 * Flow:
 *   1. Backend generates a WA session / QR code (via whatsapp-web.js on server)
 *   2. User scans QR → their WA number becomes the gateway
 *   3. User inputs the "sender number" they'll text FROM
 *   4. User picks a persona — that persona's system prompt is used for every message
 *   5. Backend proxies messages: incoming WA msg → AI → reply via WA
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { tokens, buttonStyles, cardStyles, formStyles } from "../styles";
import { useAuth } from "./AuthGate";
import { AGENT_PERSONAS, AGENT_PERSONA_CATEGORIES } from "./AgentScreen";
import { getIdToken } from "../lib/auth";

/* ── helpers ─────────────────────────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_URL ?? "backendurl";

async function apiFetch(path, opts = {}) {
  const token = await getIdToken();
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
}

const WHATSAPP_STATUS = {
  idle: { label: "Not connected", color: tokens.textFaint, dot: "#444" },
  initializing: {
    label: "Initializing…",
    color: tokens.warning,
    dot: "#f59e0b",
  },
  qr: { label: "Scan QR code", color: "#60a5fa", dot: "#60a5fa" },
  connecting: { label: "Connecting…", color: tokens.warning, dot: "#f59e0b" },
  ready: { label: "Connected ✓", color: tokens.success, dot: "#34d399" },
  error: { label: "Error", color: tokens.danger, dot: "#f87171" },
  disconnected: { label: "Disconnected", color: tokens.textFaint, dot: "#666" },
};

const INDIA_LANGS = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi" },
  { code: "bn-IN", label: "Bengali" },
  { code: "ta-IN", label: "Tamil" },
  { code: "te-IN", label: "Telugu" },
  { code: "mr-IN", label: "Marathi" },
  { code: "gu-IN", label: "Gujarati" },
  { code: "kn-IN", label: "Kannada" },
  { code: "ml-IN", label: "Malayalam" },
  { code: "pa-IN", label: "Punjabi" },
  { code: "od-IN", label: "Odia" },
];

/* ─────────────────────────────────────────────────────────────────────────── */
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

export function WhatsAppGateway({ onClose }) {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  /* connection state */
  const [status, setStatus] = useState("idle");
  const [qrData, setQrData] = useState(null); // base64 QR image
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState("");

  /* config */
  const [senderNumber, setSenderNumber] = useState("");
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [replyLang, setReplyLang] = useState("en-IN");
  const [activeCat, setActiveCat] = useState("leadership");
  const [personaSearch, setPersonaSearch] = useState("");

  /* live log */
  const [log, setLog] = useState([]);
  const logRef = useRef(null);
  const pollRef = useRef(null);
  const savedRef = useRef(false);

  const addLog = useCallback((msg, type = "info") => {
    setLog((prev) => [...prev.slice(-49), { msg, type, ts: Date.now() }]);
  }, []);

  /* scroll log to bottom */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  /* poll QR / status */
  const pollStatus = useCallback(
    async (sid) => {
      try {
        const res = await apiFetch(`/api/whatsapp/status?sessionId=${sid}`);
        if (!res.ok) {
          addLog(`⚠ Poll error: HTTP ${res.status}`, "warn");
          return;
        }
        const data = await res.json();

        if (data.logs?.length) {
          data.logs.forEach((l) => addLog(l));
        }

        if (data.status === "qr") {
          setQrData(data.qr);
          setStatus("qr");
        } else if (data.status === "ready") {
          setStatus("ready");
          setQrData(null);
          addLog("✅ WhatsApp connected successfully!", "success");
          clearInterval(pollRef.current);
        } else if (data.status === "disconnected" || data.status === "error") {
          setStatus(data.status);
          clearInterval(pollRef.current);
          addLog(`⚠ Session ${data.status}: ${data.message ?? ""}`, "warn");
        }
      } catch (e) {
        addLog(`⚠ Poll failed: ${e.message}`, "warn");
      }
    },
    [addLog],
  );

  /* start session */
  const startSession = async () => {
    setError("");
    setStatus("initializing");
    setQrData(null);
    setLog([]);
    addLog("Requesting WhatsApp session from server…", "info");

    try {
      const res = await apiFetch("/api/whatsapp/start", {
        method: "POST",
        body: JSON.stringify({
          senderNumber: senderNumber.replace(/\D/g, ""),
          personaId: selectedPersona?.id,
          personaPrompt: selectedPersona?.prompt,
          personaName: selectedPersona?.name,
          replyLang,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      addLog(`Session created: ${data.sessionId}`, "info");

      // start polling
      pollRef.current = setInterval(() => pollStatus(data.sessionId), 2500);
      pollStatus(data.sessionId);
    } catch (e) {
      setStatus("error");
      setError(e.message);
      addLog(`❌ ${e.message}`, "error");
    }
  };

  /* update persona/config on running session */
  const updateSession = async () => {
    if (!sessionId) return;
    try {
      await apiFetch("/api/whatsapp/update", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          personaId: selectedPersona?.id,
          personaPrompt: selectedPersona?.prompt,
          personaName: selectedPersona?.name,
          replyLang,
        }),
      });
      addLog(
        `🔄 Config updated — now using ${selectedPersona?.name ?? "default"}`,
        "success",
      );
    } catch (e) {
      addLog(`⚠ Update failed: ${e.message}`, "warn");
    }
  };

  /* disconnect */
  const disconnect = async () => {
    clearInterval(pollRef.current);
    if (sessionId) {
      try {
        await apiFetch("/api/whatsapp/stop", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });
      } catch (_e) {}
    }
    setStatus("idle");
    setQrData(null);
    setSessionId(null);
    addLog("Session disconnected.", "info");
  };

  /* cleanup on unmount */
  useEffect(() => () => clearInterval(pollRef.current), []);

  const statusInfo = WHATSAPP_STATUS[status] ?? WHATSAPP_STATUS.idle;
  const connected = status === "ready";

  // My Assistant is a special built-in — always shown at top
  const ASSISTANT_PERSONA = {
    id: "assistant",
    name: "My Assistant",
    icon: "🧠",
    tagline: "Memory · Files · Reminders · Drafts",
    prompt: `You are an intelligent personal assistant with automatic memory detection. Your job is to read every user message carefully, decide whether it contains information worth saving, extract and structure that information automatically, and respond naturally without mentioning internal processing. The user should never need to use special commands. Detect and classify the following: date-based memories (future expiries, events, deadlines), reminders (explicit or implied future tasks), notes (important facts, credentials, preferences), contacts (names with phone numbers or emails), commitments or promises, personal preferences (likes, dislikes, routines), financial information (subscriptions, payments, dues), and goals (fitness, career, business, learning). If a message contains something important, extract it into structured memory format. Infer context when reasonable (e.g., "My gym ends March 2026" should become an expiry memory). Detect reminders even if phrased casually (e.g., "I need to renew passport next month"). Avoid storing trivial small talk. Never expose internal memory logic. If uncertain, lean toward saving important life data. Internal memory output format (for system use only): { "type": "reminder | note | contact | date_memory | goal | preference | financial", "title": "...", "details": "...", "date": "ISO format if applicable", "urgency": "low | medium | high", "recurring": "none | daily | weekly | monthly | yearly | custom", "secure": true/false, "confidence": 0-1 }. Advanced behavior: detect urgency level automatically; detect recurring reminders; detect sensitive information (passwords, IDs, financial credentials) and mark them as secure; intelligently merge duplicate memories; update existing memories if the user provides new information; adjust reminders if dates change; prioritize high-impact life events; avoid overwriting accurate stored data unless clearly corrected. After processing memory internally, respond normally and conversationally. Do not tell the user that something was stored unless explicitly asked.`,
    category: "_assistant",
  };

  const filteredPersonas = AGENT_PERSONAS.filter((p) => {
    const matchCat = !personaSearch && p.category === activeCat;
    const matchSearch = personaSearch
      ? (p.name + p.tagline).toLowerCase().includes(personaSearch.toLowerCase())
      : false;
    return matchCat || matchSearch;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          width: isMobile ? "100vw" : "min(960px, 100vw)",
          height: isMobile ? "100dvh" : "min(720px, 100dvh)",
          background: "linear-gradient(160deg, #0b0b1a, #080810)",
          border: isMobile ? "none" : "1px solid rgba(52,211,153,0.25)",
          borderRadius: isMobile ? "0" : "clamp(0px,2vw,18px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 120px rgba(0,0,0,0.85)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: `1px solid ${tokens.borderSubtle}`,
            background: "rgba(52,211,153,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #25d366, #128c7e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              💬
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                WhatsApp AI Gateway
              </div>
              <div
                style={{ fontSize: 11, color: tokens.textFaint, marginTop: 1 }}
              >
                Talk to your AI personas through WhatsApp
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* status pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${statusInfo.dot}44`,
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: statusInfo.dot,
                  boxShadow: `0 0 6px ${statusInfo.dot}`,
                  display: "inline-block",
                  animation:
                    status === "initializing" || status === "connecting"
                      ? "pulse 1s ease-in-out infinite"
                      : "none",
                }}
              />
              <span style={{ color: statusInfo.color, fontWeight: 600 }}>
                {statusInfo.label}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{ ...buttonStyles.iconSquare, width: 32, height: 32 }}
            >
              ✕
            </button>
          </div>
        </div>
        {/* ── QR SCREEN — takes over entire body when QR is ready ── */}
        {status === "qr" && qrData ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 28,
              padding: "32px 24px",
              background:
                "radial-gradient(ellipse at center, rgba(37,211,102,0.06) 0%, transparent 70%)",
              animation: "fadeIn 0.25s ease",
            }}
          >
            {/* pulsing ring + QR */}
            <div style={{ position: "relative", display: "inline-flex" }}>
              {/* animated ring */}
              <div
                style={{
                  position: "absolute",
                  inset: -12,
                  borderRadius: 20,
                  border: "2px solid rgba(37,211,102,0.35)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: -24,
                  borderRadius: 28,
                  border: "1px solid rgba(37,211,102,0.15)",
                  animation: "pulse 2s ease-in-out infinite 0.4s",
                }}
              />
              <img
                src={qrData}
                alt="WhatsApp QR Code"
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 14,
                  background: "#fff",
                  padding: 10,
                  display: "block",
                  boxShadow:
                    "0 0 40px rgba(37,211,102,0.25), 0 8px 32px rgba(0,0,0,0.6)",
                }}
              />
            </div>

            {/* title + steps */}
            <div style={{ textAlign: "center", maxWidth: 380 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#34d399",
                  marginBottom: 6,
                }}
              >
                Scan with WhatsApp
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: tokens.textMuted,
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                Open WhatsApp → tap{" "}
                <strong style={{ color: "#aaa" }}>⋮ / Settings</strong> →{" "}
                <strong style={{ color: "#aaa" }}>Linked Devices</strong> →{" "}
                <strong style={{ color: "#aaa" }}>Link a Device</strong>
              </div>

              {/* step pills */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {[
                  "Open WhatsApp",
                  "Linked Devices",
                  "Link a Device",
                  "Scan QR",
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: "rgba(37,211,102,0.08)",
                      border: "1px solid rgba(37,211,102,0.2)",
                      fontSize: 11,
                      color: "#34d399",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: "rgba(37,211,102,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 800,
                      }}
                    >
                      {i + 1}
                    </span>
                    {s}
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 16,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.2)",
                  fontStyle: "italic",
                }}
              >
                QR refreshes automatically if it expires · Linked to session{" "}
                {sessionId?.slice(-8)}
              </div>
            </div>

            {/* back link */}
            <button
              onClick={() => {
                setStatus("initializing");
                setQrData(null);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: tokens.textFaint,
                fontSize: 12,
                fontFamily: "inherit",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              ← Back to settings
            </button>
          </div>
        ) : (
          /* ── Normal body layout ── */
          <div
            style={{
              display: "flex",
              flex: 1,
              overflow: "hidden",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            {/* LEFT: config panel */}
            <div
              style={{
                width: isMobile ? "100%" : 320,
                flexShrink: 0,
                borderRight: isMobile
                  ? "none"
                  : `1px solid ${tokens.borderSubtle}`,
                borderBottom: isMobile
                  ? `1px solid ${tokens.borderSubtle}`
                  : "none",
                overflowY: "auto",
                padding: "18px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
                flex: isMobile ? "none" : undefined,
                maxHeight: isMobile ? "100%" : undefined,
              }}
            >
              {connected && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {/* Connected badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      background: "rgba(37,211,102,0.07)",
                      border: "1px solid rgba(37,211,102,0.25)",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontSize: 26 }}>✅</div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#34d399",
                        }}
                      >
                        Connected!
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: tokens.textMuted,
                          marginTop: 2,
                        }}
                      >
                        Chatting as{" "}
                        <strong style={{ color: "#fff" }}>
                          {selectedPersona?.name ?? "AI"}
                        </strong>{" "}
                        with{" "}
                        <strong style={{ color: "#fff" }}>
                          {senderNumber}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Chat commands reference */}
                  <div
                    style={{
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${tokens.borderSubtle}`,
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: tokens.textFaint,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        marginBottom: 10,
                      }}
                    >
                      💬 Chat Commands
                    </div>
                    {[
                      { cmd: "menu", icon: "📋", desc: "Show main menu" },
                      { cmd: "switch", icon: "🔄", desc: "Change AI persona" },
                      { cmd: "clear", icon: "🗑️", desc: "Reset conversation" },
                      { cmd: "help", icon: "❓", desc: "Tips & tricks" },
                      { cmd: "stop", icon: "❌", desc: "Disconnect from chat" },
                    ].map(({ cmd, icon, desc }) => (
                      <div
                        key={cmd}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "6px 0",
                          borderBottom: `1px solid ${tokens.borderSubtle}`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            width: 20,
                            textAlign: "center",
                          }}
                        >
                          {icon}
                        </span>
                        <code
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#34d399",
                            background: "rgba(37,211,102,0.1)",
                            padding: "2px 7px",
                            borderRadius: 4,
                            minWidth: 48,
                          }}
                        >
                          {cmd}
                        </code>
                        <span style={{ fontSize: 11, color: tokens.textMuted }}>
                          {desc}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 10,
                        color: tokens.textFaint,
                        lineHeight: 1.5,
                      }}
                    >
                      Or just type normally to chat with your persona. Commands
                      are case-insensitive.
                    </div>
                  </div>

                  {/* Persona switcher shortcut */}
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${tokens.borderSubtle}`,
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: tokens.textFaint,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      🔄 Switch Persona via App
                    </div>
                    <button
                      onClick={updateSession}
                      style={{
                        ...buttonStyles.primary,
                        width: "100%",
                        padding: "9px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Apply Selected Persona
                    </button>
                    <div
                      style={{
                        fontSize: 10,
                        color: tokens.textFaint,
                        marginTop: 6,
                        lineHeight: 1.5,
                      }}
                    >
                      Select a persona below then tap above — or send{" "}
                      <code style={{ color: "#34d399" }}>switch</code> in
                      WhatsApp.
                    </div>
                  </div>
                </div>
              )}

              {/* Sender number */}
              <div>
                <label style={formStyles.label}>Your WhatsApp Number</label>
                <div
                  style={{
                    fontSize: 11,
                    color: tokens.textMuted,
                    marginBottom: 7,
                    lineHeight: 1.5,
                  }}
                >
                  With country code, no spaces (e.g. 919876543210)
                </div>
                <input
                  value={senderNumber}
                  onChange={(e) =>
                    setSenderNumber(e.target.value.replace(/[^0-9+]/g, ""))
                  }
                  placeholder="919876543210"
                  style={{ ...formStyles.input }}
                  disabled={connected}
                />
              </div>

              {/* Persona picker */}
              <div>
                <label style={formStyles.label}>AI Persona</label>

                {/* search */}
                <input
                  value={personaSearch}
                  onChange={(e) => setPersonaSearch(e.target.value)}
                  placeholder="Search personas…"
                  style={{ ...formStyles.input, marginBottom: 8 }}
                />

                {/* category tabs */}
                {!personaSearch && (
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    {AGENT_PERSONA_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCat(cat.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          border: `1px solid ${activeCat === cat.id ? "rgba(52,211,153,0.5)" : tokens.borderSubtle}`,
                          background:
                            activeCat === cat.id
                              ? "rgba(52,211,153,0.1)"
                              : "transparent",
                          color:
                            activeCat === cat.id ? "#34d399" : tokens.textMuted,
                          cursor: "pointer",
                        }}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── My Assistant — always pinned at top ── */}
                <button
                  onClick={() => setSelectedPersona(ASSISTANT_PERSONA)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 13px",
                    borderRadius: 10,
                    textAlign: "left",
                    width: "100%",
                    border: `1px solid ${selectedPersona?.id === "assistant" ? "rgba(167,139,250,0.6)" : "rgba(167,139,250,0.2)"}`,
                    background:
                      selectedPersona?.id === "assistant"
                        ? "rgba(167,139,250,0.12)"
                        : "rgba(167,139,250,0.04)",
                    cursor: "pointer",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      flexShrink: 0,
                      background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                    }}
                  >
                    🧠
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color:
                            selectedPersona?.id === "assistant"
                              ? "#c4b5fd"
                              : "#ddd",
                        }}
                      >
                        My Assistant
                      </span>
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 800,
                          padding: "1px 5px",
                          borderRadius: 4,
                          background: "rgba(167,139,250,0.2)",
                          color: "#a78bfa",
                          letterSpacing: 0.5,
                        }}
                      >
                        PERSONAL
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: tokens.textFaint,
                        marginTop: 1,
                      }}
                    >
                      Memory · Files · Reminders · Message drafting
                    </div>
                  </div>
                  {selectedPersona?.id === "assistant" && (
                    <span style={{ fontSize: 14, color: "#a78bfa" }}>✓</span>
                  )}
                </button>

                {/* persona list */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  {filteredPersonas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 9,
                        textAlign: "left",
                        border: `1px solid ${selectedPersona?.id === p.id ? p.color + "66" : tokens.borderSubtle}`,
                        background:
                          selectedPersona?.id === p.id
                            ? `${p.color}12`
                            : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>
                        {p.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color:
                              selectedPersona?.id === p.id ? p.color : "#ddd",
                          }}
                        >
                          {p.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: tokens.textFaint,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.tagline}
                        </div>
                      </div>
                      {selectedPersona?.id === p.id && (
                        <span
                          style={{
                            color: p.color,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply language */}
              <div>
                <label style={formStyles.label}>Reply Language</label>
                <select
                  value={replyLang}
                  onChange={(e) => setReplyLang(e.target.value)}
                  style={{ ...formStyles.input }}
                >
                  {INDIA_LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    fontSize: 11,
                    color: tokens.textMuted,
                    marginTop: 5,
                    lineHeight: 1.5,
                  }}
                >
                  AI responses will be translated to this language via Sarvam.
                </div>
              </div>

              {/* error */}
              {error && <div style={{ ...cardStyles.errorBox }}>⚠ {error}</div>}

              {/* action buttons */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: "auto",
                  paddingTop: 4,
                }}
              >
                {status === "idle" ||
                status === "error" ||
                status === "disconnected" ? (
                  <button
                    onClick={startSession}
                    disabled={!selectedPersona || !senderNumber.trim()}
                    style={{
                      padding: "11px 14px",
                      borderRadius: 9,
                      border: "none",
                      background:
                        selectedPersona && senderNumber.trim()
                          ? "linear-gradient(135deg, #25d366, #128c7e)"
                          : "rgba(255,255,255,0.06)",
                      color:
                        selectedPersona && senderNumber.trim()
                          ? "#fff"
                          : tokens.textFaint,
                      cursor:
                        selectedPersona && senderNumber.trim()
                          ? "pointer"
                          : "not-allowed",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    📱 Start WhatsApp Session
                  </button>
                ) : connected ? (
                  <>
                    {/* "you can close this" notice */}
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "rgba(37,211,102,0.06)",
                        border: "1px solid rgba(37,211,102,0.2)",
                        borderRadius: 9,
                        fontSize: 11,
                        color: tokens.textMuted,
                        lineHeight: 1.6,
                      }}
                    >
                      ✅ Session is running in the background —{" "}
                      <strong style={{ color: "#34d399" }}>
                        you can safely close this window
                      </strong>
                      . WhatsApp will keep responding even with the app closed.
                      Reopen anytime to manage or disconnect.
                    </div>
                    <button
                      onClick={onClose}
                      style={{
                        padding: "11px 14px",
                        borderRadius: 9,
                        border: "none",
                        background: "linear-gradient(135deg,#25d366,#128c7e)",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      ✓ Done — Close Window
                    </button>
                    <button
                      onClick={updateSession}
                      style={{
                        padding: "9px 14px",
                        borderRadius: 9,
                        border: "1px solid rgba(52,211,153,0.3)",
                        background: "transparent",
                        color: "#34d399",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "inherit",
                      }}
                    >
                      🔄 Apply Persona Change
                    </button>
                    <button
                      onClick={disconnect}
                      style={{ ...buttonStyles.ghost, padding: "9px 14px" }}
                    >
                      ✕ Disconnect Session
                    </button>
                  </>
                ) : (
                  <button
                    onClick={disconnect}
                    style={{ ...buttonStyles.ghost, padding: "9px 14px" }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: live log + info */}
            <div
              style={{
                flex: 1,
                display: isMobile ? "none" : "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* how it works */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${tokens.borderSubtle}`,
                  background: "rgba(255,255,255,0.015)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: tokens.textFaint,
                    fontWeight: 700,
                    letterSpacing: 1,
                    marginBottom: 10,
                    textTransform: "uppercase",
                  }}
                >
                  How it works
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    {
                      icon: "🎭",
                      step: "1",
                      title: "Pick Persona",
                      desc: "Choose which AI will reply to your messages",
                    },
                    {
                      icon: "📞",
                      step: "2",
                      title: "Enter Your Number",
                      desc: "The number you'll text FROM (with country code)",
                    },
                    {
                      icon: "🔌",
                      step: "3",
                      title: "Click Connect",
                      desc: "Server spins up your personal WhatsApp gateway",
                    },
                    {
                      icon: "📱",
                      step: "4",
                      title: "Scan QR Code",
                      desc: "Scan with WhatsApp → Settings → Linked Devices",
                    },
                    {
                      icon: "💬",
                      step: "5",
                      title: "Text & Get Replies",
                      desc: "Message the linked number — AI responds instantly",
                    },
                  ].map((s) => (
                    <div
                      key={s.step}
                      style={{
                        flex: "1 1 110px",
                        padding: "8px 10px",
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${tokens.borderSubtle}`,
                        borderRadius: 9,
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 3 }}>
                        {s.icon}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#34d399",
                          marginBottom: 2,
                        }}
                      >
                        STEP {s.step} · {s.title}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: tokens.textMuted,
                          lineHeight: 1.4,
                        }}
                      >
                        {s.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* live log */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "10px 20px 8px",
                    fontSize: 10,
                    color: tokens.textFaint,
                    letterSpacing: 1,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    borderBottom: `1px solid ${tokens.borderSubtle}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: connected ? "#34d399" : "#444",
                      display: "inline-block",
                      animation: connected
                        ? "pulse 2s ease-in-out infinite"
                        : "none",
                    }}
                  />
                  Live Log
                </div>
                <div
                  ref={logRef}
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "12px 20px",
                    fontFamily: "monospace",
                    fontSize: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {log.length === 0 ? (
                    <div
                      style={{
                        color: tokens.textFaint,
                        fontStyle: "italic",
                        textAlign: "center",
                        marginTop: 40,
                      }}
                    >
                      Session log will appear here…
                    </div>
                  ) : (
                    log.map((entry, i) => (
                      <div
                        key={i}
                        style={{
                          color:
                            entry.type === "error"
                              ? "#f87171"
                              : entry.type === "success"
                                ? "#34d399"
                                : entry.type === "warn"
                                  ? "#f59e0b"
                                  : tokens.textMuted,
                          lineHeight: 1.5,
                        }}
                      >
                        <span
                          style={{ color: tokens.textFaint, marginRight: 6 }}
                        >
                          {new Date(entry.ts).toLocaleTimeString()}
                        </span>
                        {entry.msg}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* server-side note */}
              <div
                style={{
                  padding: "10px 20px",
                  borderTop: `1px solid ${tokens.borderSubtle}`,
                  background: "rgba(245,158,11,0.04)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{ fontSize: 11, color: "#d4a44e", lineHeight: 1.5 }}
                >
                  ⚠ <strong>Server requirement:</strong> WhatsApp gateway runs
                  on your backend via{" "}
                  <code
                    style={{
                      fontSize: 10,
                      background: "rgba(255,255,255,0.05)",
                      padding: "1px 5px",
                      borderRadius: 3,
                    }}
                  >
                    whatsapp-web.js
                  </code>
                  . Ensure{" "}
                  <code
                    style={{
                      fontSize: 10,
                      background: "rgba(255,255,255,0.05)",
                      padding: "1px 5px",
                      borderRadius: 3,
                    }}
                  >
                    WHATSAPP_ENABLED=true
                  </code>{" "}
                  in your server env. Replies can be text or Sarvam TTS audio
                  (set in config).
                </div>
              </div>
            </div>
          </div>
        )}{" "}
        {/* end QR ternary */}
      </div>
    </div>
  );
}
