import { useState, useRef, useEffect } from "react";
import { tokens, buttonStyles, formStyles } from "../styles";
import { useAuth } from "./AuthGate";
import { UserAvatar, SignInButton } from "./AuthGate";
import { dispatchMember } from "../lib/api";
import { uid } from "../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Built-in agent personas
// ─────────────────────────────────────────────────────────────────────────────
export const AGENT_PERSONAS = [
  {
    id: "ceo",
    name: "The CEO",
    icon: "👔",
    color: "#a78bfa",
    badge: "Strategy",
    tagline: "Strategic. Decisive. Big-picture thinking.",
    description:
      "A seasoned CEO who thinks in first principles, speaks candidly, and cuts through noise to find the core of any problem.",
    prompt: `You are a seasoned, strategic CEO with 20+ years of experience building and scaling companies. You think in first principles, speak candidly without corporate fluff, and always tie advice back to business impact and long-term vision. You are direct, occasionally provocative, and you ask the questions no one else will. You never give generic advice — you always want specific context before prescribing solutions. When uncertain, say so.`,
  },
  {
    id: "analyst",
    name: "The Analyst",
    icon: "📊",
    color: "#60a5fa",
    badge: "Analytics",
    tagline: "Data-driven. Rigorous. No assumptions.",
    description:
      "A sharp financial and business analyst who lives in spreadsheets and loves tearing apart assumptions with real data.",
    prompt: `You are a rigorous financial and business analyst with deep expertise in quantitative modeling, market research, and data interpretation. You question every assumption, demand evidence, and hate vague statements. You use frameworks (MECE, Porter's Five Forces, DCF, etc.) and always ask: what does the data actually say? You present multiple scenarios and are comfortable saying "I don't have enough data to conclude that."`,
  },
  {
    id: "mentor",
    name: "The Mentor",
    icon: "🎓",
    color: "#34d399",
    badge: "Growth",
    tagline: "Wise. Empathetic. Growth-focused.",
    description:
      "A wise, experienced guide who helps you find clarity, challenge your thinking, and grow through deep reflection.",
    prompt: `You are a warm but challenging mentor with decades of experience in personal and professional development. You believe in the Socratic method — you rarely give direct answers but ask powerful questions that help people discover their own answers. You balance empathy with accountability. You draw on philosophy, psychology, and lived experience.`,
  },
  {
    id: "lawyer",
    name: "The Lawyer",
    icon: "⚖",
    color: "#f59e0b",
    badge: "Legal",
    tagline: "Precise. Risk-aware. Legally sharp.",
    description:
      "A sharp legal mind who identifies risks, navigates grey areas, and always asks 'but what does it actually say?'",
    prompt: `You are an experienced corporate and commercial lawyer with expertise across contracts, IP, employment law, and regulatory compliance. You are precise with language, skeptical of vague claims, and always ask to see the actual document. You identify risks proactively and present options with tradeoffs. You always caveat that your analysis is informational and not legal advice.`,
  },
  {
    id: "coach",
    name: "The Coach",
    icon: "🧠",
    color: "#f472b6",
    badge: "Coaching",
    tagline: "Reflective. Grounding. Evidence-based.",
    description:
      "A certified life and executive coach who helps you get unstuck and make decisions with real confidence.",
    prompt: `You are a certified executive and life coach trained in cognitive-behavioral techniques and positive psychology. You help people get clarity on what they actually want, identify limiting beliefs, and design concrete action plans. You ask powerful questions, reflect back what you hear, and challenge excuses gently but firmly. You are not a therapist and don't diagnose.`,
  },
  {
    id: "cto",
    name: "The CTO",
    icon: "🛠",
    color: "#f97316",
    badge: "Tech",
    tagline: "Technical. Pragmatic. Systems thinker.",
    description:
      "A battle-hardened CTO who's shipped at scale and knows when to build, buy, or walk away entirely.",
    prompt: `You are a pragmatic CTO and senior engineer who has built and shipped production systems at scale. You think about tradeoffs constantly — build vs buy, fast vs correct, simple vs extensible. You are fluent in software architecture, team dynamics, and the business implications of technical decisions. You speak directly, use concrete examples, and are refreshingly honest about what's actually hard vs what's hype.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PersonaCard
// ─────────────────────────────────────────────────────────────────────────────
function PersonaCard({ p, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onSelect(p)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "16px",
        borderRadius: 14,
        border: `1px solid ${hov ? p.color + "55" : "rgba(255,255,255,0.07)"}`,
        background: hov ? `${p.color}0e` : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        transition: "all 0.18s",
        boxShadow: hov ? `0 0 28px ${p.color}18` : "none",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 11,
            background: `${p.color}18`,
            border: `1.5px solid ${p.color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {p.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 3,
            }}
          >
            {p.name}
          </div>
          <span
            style={{
              fontSize: 10,
              padding: "1px 8px",
              borderRadius: 20,
              background: `${p.color}18`,
              border: `1px solid ${p.color}30`,
              color: p.color,
              fontWeight: 600,
            }}
          >
            {p.badge}
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: hov ? p.color : tokens.textFaint,
            fontWeight: 600,
            transition: "color 0.15s",
          }}
        >
          Chat →
        </div>
      </div>
      <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.55 }}>
        {p.description}
      </div>
      <div style={{ fontSize: 11, color: `${p.color}99`, fontStyle: "italic" }}>
        {p.tagline}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MessageBubble
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ msg, persona }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        marginBottom: 18,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          flexShrink: 0,
          background: isUser ? "rgba(255,255,255,0.06)" : `${persona.color}1a`,
          border: isUser
            ? "1px solid rgba(255,255,255,0.1)"
            : `1.5px solid ${persona.color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isUser ? 11 : 16,
          color: isUser ? tokens.textMuted : persona.color,
          fontWeight: isUser ? 600 : 400,
        }}
      >
        {isUser ? "You" : persona.icon}
      </div>
      <div
        style={{
          maxWidth: "74%",
          padding: "12px 16px",
          borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          background: isUser ? "rgba(167,139,250,0.1)" : `${persona.color}0a`,
          border: isUser
            ? "1px solid rgba(167,139,250,0.22)"
            : `1px solid ${persona.color}22`,
          fontSize: 14,
          color: "#ddd8f0",
          lineHeight: 1.8,
          fontFamily: "Georgia, serif",
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.content}
        {msg.streaming && (
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 15,
              marginLeft: 3,
              background: persona.color,
              borderRadius: 2,
              verticalAlign: "middle",
              animation: "pulse 0.75s ease-in-out infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Login gate
// ─────────────────────────────────────────────────────────────────────────────
function LoginGate({ onBack }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        gap: 20,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 38,
          boxShadow: "0 16px 48px rgba(167,139,250,0.3)",
        }}
      >
        🤝
      </div>
      <div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Agent Chat requires sign-in
        </div>
        <div
          style={{
            fontSize: 14,
            color: tokens.textMuted,
            lineHeight: 1.7,
            maxWidth: 360,
          }}
        >
          Sign in with Google to unlock 1-on-1 conversations with AI personas.
          Includes free access to Sarvam AI — India's own LLM. 🇮🇳
        </div>
      </div>
      <div
        style={{
          padding: "10px 20px",
          borderRadius: 12,
          background: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.25)",
          fontSize: 12,
          color: "#fb923c",
        }}
      >
        🇮🇳 Made in Bharat · Powered by Sarvam AI · Free with sign-in
      </div>
      <SignInButton />
      <button
        onClick={onBack}
        style={{ ...buttonStyles.ghost, fontSize: 12, padding: "6px 16px" }}
      >
        ← Back to Setup
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp coming soon sheet
// ─────────────────────────────────────────────────────────────────────────────
function WaSheet({ onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "min(420px,93vw)",
          background: "linear-gradient(160deg,#0e0e1a,#070710)",
          border: "1px solid rgba(37,211,102,0.3)",
          borderRadius: 22,
          padding: "32px 28px",
          boxShadow: "0 40px 120px rgba(0,0,0,0.85)",
          animation: "slideDown 0.22s ease",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>💬</div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 6,
          }}
        >
          WhatsApp Integration
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 14px",
            borderRadius: 20,
            marginBottom: 18,
            background: "rgba(37,211,102,0.1)",
            border: "1px solid rgba(37,211,102,0.3)",
            fontSize: 11,
            fontWeight: 700,
            color: "#25d366",
          }}
        >
          🚧 Coming Soon
        </div>
        <p
          style={{
            fontSize: 13,
            color: tokens.textMuted,
            lineHeight: 1.75,
            marginBottom: 22,
          }}
        >
          Soon you'll scan a QR code, link your WhatsApp number, and chat with
          your AI persona directly on WhatsApp — continuing your session outside
          our UI.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 22,
          }}
        >
          {[
            "🔗  Scan QR → link your WhatsApp",
            "💬  Chat your AI persona on WhatsApp",
            "🔔  Proactive nudges & check-ins",
            "🔒  End-to-end encrypted sessions",
          ].map((f) => (
            <div
              key={f}
              style={{
                padding: "9px 14px",
                borderRadius: 9,
                textAlign: "left",
                background: "rgba(37,211,102,0.05)",
                border: "1px solid rgba(37,211,102,0.12)",
                fontSize: 12,
                color: "#6ee7b7",
              }}
            >
              {f}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 11,
            border: "none",
            background: "linear-gradient(135deg,#25d366,#128c7e)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Got it — I'll check back soon 🔔
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared header
// ─────────────────────────────────────────────────────────────────────────────
function AgentHeader({ onBack, backLabel, persona }) {
  return (
    <div
      style={{
        padding: "12px 20px",
        borderBottom: `1px solid ${tokens.borderSubtle}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background:
          "linear-gradient(90deg, rgba(167,139,250,0.04), rgba(249,115,22,0.03), transparent)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
      }}
    >
      <button
        onClick={onBack}
        style={{
          ...buttonStyles.ghost,
          padding: "5px 12px",
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        {backLabel}
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: persona
                ? `linear-gradient(135deg,${persona.color},${persona.color}88)`
                : "linear-gradient(135deg,#a78bfa,#60a5fa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              boxShadow: "0 4px 12px rgba(167,139,250,0.3)",
            }}
          >
            {persona ? persona.icon : "🤝"}
          </div>
          <div
            style={{ position: "absolute", bottom: -4, right: -5, fontSize: 9 }}
          >
            🇮🇳
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: -0.2,
            }}
          >
            {persona ? persona.name : "Agent Chat"}
          </div>
          <div
            style={{
              fontSize: 8,
              letterSpacing: 1.5,
              color: "rgba(249,115,22,0.6)",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {persona ? persona.badge : "1-on-1"} · Made in Bharat
          </div>
        </div>
      </div>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <SignInButton />
        <UserAvatar />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AgentScreen
// ─────────────────────────────────────────────────────────────────────────────
export function AgentScreen({
  onBack,
  customPersonas = [],
  initialPersona = null,
}) {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!(user && !isAnonymous);

  const allPersonas = [...AGENT_PERSONAS, ...customPersonas];
  const [persona, setPersona] = useState(null);
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showWA, setShowWA] = useState(false);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-start if launched with a pre-selected persona
  useEffect(() => {
    if (initialPersona && isLoggedIn && !persona) {
      startChat(initialPersona);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPersona, isLoggedIn]);

  const startChat = (p) => {
    setPersona(p);
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content: `${p.icon} Hey! I'm ${p.name}.\n\n${p.tagline}\n\nWhat's on your mind today?`,
      },
    ]);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming || !persona) return;
    setInput("");

    const userMsg = { id: uid(), role: "user", content: text };
    const asstId = uid();
    const asstMsg = {
      id: asstId,
      role: "assistant",
      content: "",
      streaming: true,
    };
    setMessages((prev) => [...prev, userMsg, asstMsg]);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // Build prompt with conversation history
    const history = [...messages, userMsg].slice(-16);
    const convoText = history
      .map((m) => `${m.role === "user" ? "User" : persona.name}: ${m.content}`)
      .join("\n\n");
    const fullPrompt = `${convoText}\n\n${persona.name}:`;

    const fakeMember = {
      provider: "managed_sarvam",
      model: "sarvam-m",
      apiKey: "",
      endpoint: "",
      systemPrompt: persona.prompt,
    };

    try {
      await dispatchMember(
        fakeMember,
        persona.prompt,
        fullPrompt,
        (text) =>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId ? { ...m, content: text, streaming: true } : m,
            ),
          ),
        ctrl.signal,
        0.75,
        "opinion",
      );
    } catch (e) {
      if (e.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId
              ? {
                  ...m,
                  content: "⚠ Something went wrong. Try again.",
                  streaming: false,
                }
              : m,
          ),
        );
      }
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === asstId ? { ...m, streaming: false } : m)),
      );
      setStreaming(false);
    }
  };

  const resetChat = () => {
    abortRef.current?.abort();
    setPersona(null);
    setMessages([]);
    setInput("");
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#050508",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes floatBadge { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
      `}</style>

      {showWA && <WaSheet onClose={() => setShowWA(false)} />}

      <AgentHeader
        onBack={persona ? resetChat : onBack}
        backLabel={persona ? "← Change Persona" : "← Back to Setup"}
        persona={persona}
      />

      {!isLoggedIn ? (
        <LoginGate onBack={onBack} />
      ) : !persona ? (
        /* ── Persona picker ── */
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 20px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ marginBottom: 28, textAlign: "center" }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: -1,
                  marginBottom: 8,
                }}
              >
                Who do you want to talk to?
              </div>
              <div style={{ fontSize: 14, color: tokens.textMuted }}>
                Pick an AI persona for a focused 1-on-1 conversation
              </div>
            </div>

            {/* Sarvam badge */}
            <div
              style={{
                marginBottom: 20,
                padding: "11px 16px",
                borderRadius: 12,
                background: "rgba(249,115,22,0.07)",
                border: "1px solid rgba(249,115,22,0.22)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  animation: "floatBadge 3s ease-in-out infinite",
                }}
              >
                🇮🇳
              </span>
              <div style={{ flex: 1 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#fb923c" }}
                >
                  Powered by Sarvam AI
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(249,115,22,0.5)",
                    marginLeft: 8,
                  }}
                >
                  — India's own LLM · free with sign-in
                </span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 10px",
                  borderRadius: 20,
                  background: "rgba(249,115,22,0.15)",
                  border: "1px solid rgba(249,115,22,0.3)",
                  color: "#f97316",
                  fontWeight: 700,
                }}
              >
                🔥 FREE
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {allPersonas.map((p) => (
                <PersonaCard key={p.id} p={p} onSelect={startChat} />
              ))}
            </div>

            {/* WhatsApp teaser */}
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 13,
                border: "1px dashed rgba(37,211,102,0.2)",
                background: "rgba(37,211,102,0.03)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 24 }}>💬</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#25d366",
                    marginBottom: 2,
                  }}
                >
                  WhatsApp Integration — Coming Soon
                </div>
                <div style={{ fontSize: 11, color: tokens.textFaint }}>
                  Scan a QR code and continue chatting with your persona on
                  WhatsApp
                </div>
              </div>
              <button
                onClick={() => setShowWA(true)}
                style={{
                  padding: "5px 13px",
                  borderRadius: 8,
                  border: "1px solid rgba(37,211,102,0.3)",
                  background: "rgba(37,211,102,0.07)",
                  color: "#25d366",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Learn more
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Chat view ── */
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Persona context bar */}
          <div
            style={{
              padding: "9px 20px",
              background: `${persona.color}07`,
              borderBottom: `1px solid ${persona.color}18`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 18 }}>{persona.icon}</div>
            <div style={{ flex: 1 }}>
              <span
                style={{ fontSize: 12, fontWeight: 600, color: persona.color }}
              >
                {persona.name}
              </span>
              <span
                style={{ fontSize: 11, color: tokens.textFaint, marginLeft: 8 }}
              >
                {persona.tagline}
              </span>
            </div>
            <button
              onClick={() => setShowWA(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 11px",
                borderRadius: 7,
                border: "1px solid rgba(37,211,102,0.25)",
                background: "rgba(37,211,102,0.05)",
                color: "#25d366",
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              💬 WhatsApp{" "}
              <span style={{ opacity: 0.6, fontSize: 9 }}>soon</span>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 4px" }}>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} persona={persona} />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input bar */}
          <div
            style={{
              padding: "14px 20px 20px",
              borderTop: `1px solid ${tokens.borderSubtle}`,
              background: "rgba(5,5,8,0.97)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-end",
                  background: "rgba(255,255,255,0.035)",
                  border: `1px solid ${streaming ? persona.color + "40" : "rgba(255,255,255,0.09)"}`,
                  borderRadius: 14,
                  padding: "10px 14px",
                  transition: "border-color 0.2s",
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={streaming}
                  placeholder={
                    streaming
                      ? `${persona.name} is thinking…`
                      : `Message ${persona.name}… (Enter to send)`
                  }
                  rows={1}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: tokens.textPrimary,
                    fontSize: 14,
                    resize: "none",
                    fontFamily: "'Syne', sans-serif",
                    lineHeight: 1.55,
                    maxHeight: 120,
                    overflowY: "auto",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    border: "none",
                    flexShrink: 0,
                    background:
                      input.trim() && !streaming
                        ? `linear-gradient(135deg,${persona.color},${persona.color}99)`
                        : "rgba(255,255,255,0.05)",
                    color:
                      input.trim() && !streaming ? "#fff" : tokens.textFaint,
                    cursor:
                      input.trim() && !streaming ? "pointer" : "not-allowed",
                    fontSize: 16,
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ↑
                </button>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: tokens.textFaint,
                  textAlign: "center",
                  marginTop: 6,
                }}
              >
                Enter to send · Shift+Enter for new line · 🇮🇳 Powered by Sarvam
                AI
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
