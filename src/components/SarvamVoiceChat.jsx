/**
 * SarvamVoiceChat.jsx
 *
 * Full voice conversation mode using Sarvam APIs:
 *  - STT: saaras:v3 (transcription / translate mode)
 *  - AI:  managed_sarvam (sarvam-m) OR any configured member provider
 *  - TTS: bulbul:v3 (via server proxy) → base64 → play in browser
 *  - Translation: /translate endpoint for UI text
 *
 * Cost optimisations:
 *  - STT fires only after user stops speaking (VAD via volume threshold)
 *  - TTS chunks are limited to 500 chars; long responses are split
 *  - We use saarika:v2.5 (cheaper) for pure transcription; saaras:v3 only when translate mode is on
 *  - TTS requests are debounced and cancelled if a new response starts
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { tokens, buttonStyles, cardStyles, formStyles } from "../styles";
import { useAuth } from "./AuthGate";
import { AGENT_PERSONAS, AGENT_PERSONA_CATEGORIES } from "./AgentScreen";
import { getIdToken } from "../lib/auth";

/* ── Constants ────────────────────────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_URL ?? "backendurl";

const LANGUAGES = [
  { code: "en-IN", label: "English", flag: "🇬🇧" },
  { code: "hi-IN", label: "हिंदी", flag: "🇮🇳" },
  { code: "bn-IN", label: "বাংলা", flag: "🇮🇳" },
  { code: "ta-IN", label: "தமிழ்", flag: "🇮🇳" },
  { code: "te-IN", label: "తెలుగు", flag: "🇮🇳" },
  { code: "mr-IN", label: "मराठी", flag: "🇮🇳" },
  { code: "gu-IN", label: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn-IN", label: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml-IN", label: "മലയാളം", flag: "🇮🇳" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
];

// Exact speakers for bulbul:v3 (verified from Sarvam API error response)
const TTS_SPEAKERS_V3 = [
  { id: "priya", label: "Priya (F)" },
  { id: "neha", label: "Neha (F)" },
  { id: "pooja", label: "Pooja (F)" },
  { id: "ritu", label: "Ritu (F)" },
  { id: "simran", label: "Simran (F)" },
  { id: "kavya", label: "Kavya (F)" },
  { id: "aditya", label: "Aditya (M)" },
  { id: "rahul", label: "Rahul (M)" },
  { id: "rohan", label: "Rohan (M)" },
  { id: "ashutosh", label: "Ashutosh (M)" },
  { id: "amit", label: "Amit (M)" },
  { id: "dev", label: "Dev (M)" },
];

const VOICE_STAGES = {
  idle: { label: "Tap mic to speak", color: tokens.textFaint },
  listening: { label: "Listening…", color: "#60a5fa" },
  processing: { label: "Transcribing…", color: tokens.warning },
  thinking: { label: "Thinking…", color: "#a78bfa" },
  speaking: { label: "Speaking…", color: "#34d399" },
  error: { label: "Error — tap to retry", color: tokens.danger },
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */
async function apiFetch(path, opts = {}) {
  const token = await getIdToken();
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
}

/** Split text into TTS-safe chunks ≤ maxLen chars at sentence boundaries */
function chunkText(text, maxLen = 450) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let buf = "";
  for (const sentence of text.split(/(?<=[।.!?])\s+/)) {
    if ((buf + sentence).length > maxLen && buf) {
      chunks.push(buf.trim());
      buf = sentence + " ";
    } else {
      buf += sentence + " ";
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

/** Decode base64 WAV → AudioBuffer and play */
async function playBase64Audio(b64, audioCtxRef) {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const ctx = audioCtxRef.current ?? (audioCtxRef.current = new AudioContext());
  if (ctx.state === "suspended") await ctx.resume();
  const buf = await ctx.decodeAudioData(bytes.buffer);
  const source = ctx.createBufferSource();
  source.buffer = buf;
  source.connect(ctx.destination);
  return new Promise((resolve) => {
    source.onended = resolve;
    source.start(0);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════ */
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

export function SarvamVoiceChat({ onClose }) {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  /* persona */
  const [selectedPersona, setSelectedPersona] = useState(AGENT_PERSONAS[0]);
  const [activeCat, setActiveCat] = useState("leadership");
  const [personaSearch, setPersonaSearch] = useState("");
  const [showPersonaPanel, setShowPersonaPanel] = useState(false);

  /* voice settings */
  const [lang, setLang] = useState("en-IN");
  const [speaker, setSpeaker] = useState("priya");
  const speakerRef = useRef("priya"); // kept in sync — avoids stale closure in speakText
  const [autoPlay, setAutoPlay] = useState(true);
  const autoPlayRef = useRef(true);
  const [pace, setPace] = useState(1.0);
  const paceRef = useRef(1.0);
  const [translate, setTranslate] = useState(false); // translate input to English for AI

  /* conversation */
  const [messages, setMessages] = useState([]);
  const [stage, setStage] = useState("idle");
  const [liveText, setLiveText] = useState(""); // streaming AI text
  const [error, setError] = useState("");

  /* refs */
  const mediaRef = useRef(null); // MediaRecorder
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const abortRef = useRef(null);
  const silenceTimer = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const messagesEnd = useRef(null);
  const ttsAbortRef = useRef(null);

  /* mic volume for visualiser */
  const [volume, setVolume] = useState(0);

  /* scroll to bottom */
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveText]);

  /* cleanup */
  useEffect(
    () => () => {
      stopMic();
      cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close();
    },
    [],
  );

  /* ── MIC + VAD ── */
  const startMic = useCallback(async () => {
    setError("");
    setStage("listening");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx =
        audioCtxRef.current ?? (audioCtxRef.current = new AudioContext());
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;

      /* volume visualiser + silence VAD */
      const data = new Uint8Array(analyser.frequencyBinCount);
      let silentMs = 0;
      const SILENCE_THRESHOLD = 8;
      const SILENCE_DURATION = 1800; // stop after 1.8s silence
      const TICK = 80;

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVolume(avg);

        if (avg < SILENCE_THRESHOLD) {
          silentMs += TICK;
          if (
            silentMs >= SILENCE_DURATION &&
            mediaRef.current?.state === "recording"
          ) {
            stopMic();
            return;
          }
        } else {
          silentMs = 0;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        handleRecordingDone();
      };
      recorder.start(200);
      mediaRef.current = recorder;
    } catch (e) {
      setError("Microphone access denied: " + e.message);
      setStage("error");
    }
  }, []);

  const stopMic = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setVolume(0);
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.stop();
    }
    mediaRef.current = null;
  }, []);

  /* ── STT ── */
  const handleRecordingDone = useCallback(async () => {
    if (!chunksRef.current.length) {
      setStage("idle");
      return;
    }
    setStage("processing");

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const form = new FormData();
    form.append("file", blob, "audio.webm");
    form.append("lang", lang);
    form.append("translate", String(translate));

    try {
      const res = await apiFetch("/api/sarvam/stt", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`STT HTTP ${res.status}`);
      const data = await res.json();
      const text = data.transcript?.trim();
      if (!text) {
        setStage("idle");
        return;
      }

      // add user message
      setMessages((prev) => [...prev, { role: "user", text, ts: Date.now() }]);
      await generateAIReply(text);
    } catch (e) {
      setError(e.message);
      setStage("error");
    }
  }, [lang, translate, selectedPersona]);

  /* ── AI reply ── */
  const generateAIReply = useCallback(
    async (userText) => {
      setStage("thinking");
      setLiveText("");
      abortRef.current = new AbortController();

      try {
        const res = await apiFetch("/api/sarvam/ai-reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userText,
            personaPrompt: selectedPersona.prompt,
            personaName: selectedPersona.name,
            replyLang: lang,
            translate,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error(`AI reply HTTP ${res.status}`);

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            const t = line.trim();
            if (!t.startsWith("data: ")) continue;
            const raw = t.slice(6);
            if (raw === "[DONE]") break;
            try {
              const tok = JSON.parse(raw)?.choices?.[0]?.delta?.content ?? null;
              if (tok) {
                full += tok;
                setLiveText(full);
              }
            } catch {
              /* skip */
            }
          }
        }

        setLiveText("");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: full,
            ts: Date.now(),
            persona: selectedPersona,
          },
        ]);

        if (autoPlayRef.current && full) {
          await speakText(full);
        } else {
          setStage("idle");
        }
      } catch (e) {
        if (e.name === "AbortError") {
          setStage("idle");
          return;
        }
        setError(e.message);
        setStage("error");
      }
    },
    [selectedPersona, lang, translate],
  );

  /* ── TTS — send full text as one request, server handles chunking ── */
  const speakText = useCallback(
    async (text) => {
      setStage("speaking");

      ttsAbortRef.current?.abort();
      const ctrl = new AbortController();
      ttsAbortRef.current = ctrl;

      try {
        const res = await apiFetch("/api/sarvam/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            lang,
            speaker: speakerRef.current,
            pace: paceRef.current,
          }),
          signal: ctrl.signal,
        });

        if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
        const { audio } = await res.json();
        if (!ctrl.signal.aborted) await playBase64Audio(audio, audioCtxRef);
      } catch (e) {
        if (e.name !== "AbortError") setError("TTS: " + e.message);
      }
      setStage("idle");
    },
    [lang],
  );

  const stopSpeaking = useCallback(() => {
    ttsAbortRef.current?.abort();
    // Suspend (don't close) AudioContext so it can be reused for next recording.
    // Closing it would require re-creating it and re-connecting the mic stream,
    // which causes the "mic stops on 1st/2nd click" bug.
    audioCtxRef.current?.suspend().catch(() => {});
    setStage("idle");
  }, []);

  /* ── mic button handler ── */
  const handleMicButton = () => {
    if (stage === "listening") {
      stopMic();
      return;
    }
    if (stage === "speaking") {
      stopSpeaking();
      return;
    }
    if (stage === "idle" || stage === "error") {
      startMic();
      return;
    }
  };

  /* ── filtered personas ── */
  const filteredPersonas = AGENT_PERSONAS.filter((p) => {
    if (personaSearch)
      return (p.name + p.tagline)
        .toLowerCase()
        .includes(personaSearch.toLowerCase());
    return p.category === activeCat;
  });

  const stageInfo = VOICE_STAGES[stage] ?? VOICE_STAGES.idle;

  /* ── visualiser bars ── */
  const bars = 16;
  const barHeights = Array.from({ length: bars }, (_, i) => {
    const angle = (i / bars) * Math.PI * 2;
    return stage === "listening"
      ? 4 +
          (volume / 255) *
            40 *
            (0.5 + 0.5 * Math.sin(angle * 3 + Date.now() / 200))
      : stage === "speaking"
        ? 4 + 18 * Math.abs(Math.sin(i * 0.9 + Date.now() / 300))
        : 4;
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
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(10px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          width: isMobile ? "100vw" : "min(920px, 100vw)",
          height: isMobile ? "100dvh" : "min(740px, 100dvh)",
          background: "linear-gradient(160deg, #090915, #060610)",
          border: isMobile ? "none" : "1px solid rgba(167,139,250,0.2)",
          borderRadius: isMobile ? "0" : "clamp(0px,2vw,20px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 120px rgba(0,0,0,0.9)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: `1px solid ${tokens.borderSubtle}`,
            background: "rgba(167,139,250,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🎙
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
                Sarvam Voice Chat
              </div>
              <div style={{ fontSize: 11, color: tokens.textFaint }}>
                Speak in any Indian language · AI replies in your language
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 11px",
                borderRadius: 20,
                color: stageInfo.color,
                border: `1px solid ${stageInfo.color}44`,
                background: `${stageInfo.color}0a`,
              }}
            >
              {stageInfo.label}
            </div>
            <button
              onClick={onClose}
              style={{ ...buttonStyles.iconSquare, width: 30, height: 30 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {/* LEFT: settings sidebar */}
          <div
            style={{
              width: isMobile ? "100%" : 260,
              flexShrink: 0,
              borderRight: isMobile
                ? "none"
                : `1px solid ${tokens.borderSubtle}`,
              borderBottom: isMobile
                ? `1px solid ${tokens.borderSubtle}`
                : "none",
              overflowY: "auto",
              padding: "14px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxHeight: isMobile ? "42dvh" : undefined,
            }}
          >
            {/* current persona */}
            <div
              onClick={() => setShowPersonaPanel((p) => !p)}
              style={{
                padding: "12px 13px",
                background: `${selectedPersona.color}10`,
                border: `1px solid ${selectedPersona.color}44`,
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>
                {selectedPersona.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: selectedPersona.color,
                  }}
                >
                  {selectedPersona.name}
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
                  {selectedPersona.tagline}
                </div>
              </div>
              <span style={{ fontSize: 10, color: tokens.textFaint }}>
                {showPersonaPanel ? "▲" : "▼"}
              </span>
            </div>

            {/* persona panel */}
            {showPersonaPanel && (
              <div style={{ animation: "slideDown 0.15s ease" }}>
                <input
                  value={personaSearch}
                  onChange={(e) => setPersonaSearch(e.target.value)}
                  placeholder="Search personas…"
                  style={{ ...formStyles.input, marginBottom: 7, fontSize: 12 }}
                />
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
                          padding: "3px 8px",
                          borderRadius: 20,
                          fontSize: 9,
                          fontWeight: 700,
                          border: `1px solid ${activeCat === cat.id ? "#a78bfa55" : tokens.borderSubtle}`,
                          background:
                            activeCat === cat.id
                              ? "rgba(167,139,250,0.1)"
                              : "transparent",
                          color:
                            activeCat === cat.id ? "#a78bfa" : tokens.textMuted,
                          cursor: "pointer",
                        }}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                )}
                <div
                  style={{
                    maxHeight: 160,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {filteredPersonas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPersona(p);
                        setShowPersonaPanel(false);
                        setPersonaSearch("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1px solid ${selectedPersona.id === p.id ? p.color + "55" : tokens.borderSubtle}`,
                        background:
                          selectedPersona.id === p.id
                            ? `${p.color}10`
                            : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 14, flexShrink: 0 }}>
                        {p.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color:
                              selectedPersona.id === p.id ? p.color : "#ddd",
                          }}
                        >
                          {p.name}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: tokens.textFaint,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.tagline}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* divider */}
            <div style={{ height: 1, background: tokens.borderSubtle }} />

            {/* language */}
            <div>
              <label style={{ ...formStyles.label, fontSize: 9 }}>
                Speak & Reply In
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    style={{
                      padding: "5px 9px",
                      borderRadius: 16,
                      fontSize: 11,
                      fontWeight: 600,
                      border: `1px solid ${lang === l.code ? "#a78bfa55" : tokens.borderSubtle}`,
                      background:
                        lang === l.code
                          ? "rgba(167,139,250,0.1)"
                          : "rgba(255,255,255,0.02)",
                      color: lang === l.code ? "#c4b5fd" : tokens.textMuted,
                      cursor: "pointer",
                    }}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* translate toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 11px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${tokens.borderSubtle}`,
                borderRadius: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#ddd" }}>
                  🔁 Auto-translate Input
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: tokens.textMuted,
                    marginTop: 1,
                    lineHeight: 1.4,
                  }}
                >
                  Translate your speech to English before sending to AI
                </div>
              </div>
              <button
                onClick={() => setTranslate((v) => !v)}
                style={{
                  width: 38,
                  height: 21,
                  borderRadius: 11,
                  border: "none",
                  cursor: "pointer",
                  background: translate
                    ? "linear-gradient(90deg,#a78bfa,#60a5fa)"
                    : "#2a2a3a",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2.5,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.2s",
                    left: translate ? 19 : 3,
                  }}
                />
              </button>
            </div>

            {/* TTS speaker */}
            <div>
              <label style={{ ...formStyles.label, fontSize: 9 }}>Voice</label>
              <select
                value={speaker}
                onChange={(e) => {
                  setSpeaker(e.target.value);
                  speakerRef.current = e.target.value;
                }}
                style={{ ...formStyles.input, fontSize: 12 }}
              >
                {TTS_SPEAKERS_V3.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* pace */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <label
                  style={{ ...formStyles.label, marginBottom: 0, fontSize: 9 }}
                >
                  Speech Pace
                </label>
                <span style={{ fontSize: 10, color: "#a78bfa" }}>
                  {pace.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pace}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setPace(v);
                  paceRef.current = v;
                }}
                style={{ width: "100%", accentColor: "#a78bfa" }}
              />
            </div>

            {/* auto-play TTS */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 11px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${tokens.borderSubtle}`,
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: "#ddd" }}>
                🔊 Auto-play Replies
              </div>
              <button
                onClick={() =>
                  setAutoPlay((v) => {
                    autoPlayRef.current = !v;
                    return !v;
                  })
                }
                style={{
                  width: 38,
                  height: 21,
                  borderRadius: 11,
                  border: "none",
                  cursor: "pointer",
                  background: autoPlay
                    ? "linear-gradient(90deg,#a78bfa,#60a5fa)"
                    : "#2a2a3a",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2.5,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.2s",
                    left: autoPlay ? 19 : 3,
                  }}
                />
              </button>
            </div>

            {/* clear */}
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                style={{
                  ...buttonStyles.ghost,
                  fontSize: 11,
                  padding: "7px 10px",
                }}
              >
                🗑 Clear conversation
              </button>
            )}
          </div>

          {/* CENTER: conversation + mic orb */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {messages.length === 0 && !liveText && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    color: tokens.textFaint,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 48, opacity: 0.4 }}>🎙</div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: tokens.textSecondary,
                    }}
                  >
                    Start speaking to {selectedPersona.name}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 300 }}>
                    Tap the mic button below, speak your question in{" "}
                    {LANGUAGES.find((l) => l.code === lang)?.label ??
                      "your language"}
                    , and get an instant voice response.
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    gap: 10,
                    alignItems: "flex-start",
                    animation: "fadeIn 0.2s ease",
                  }}
                >
                  {/* avatar */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      flexShrink: 0,
                      background:
                        msg.role === "user"
                          ? "rgba(96,165,250,0.2)"
                          : `${msg.persona?.color ?? "#a78bfa"}20`,
                      border: `1px solid ${msg.role === "user" ? "rgba(96,165,250,0.3)" : (msg.persona?.color ?? "#a78bfa") + "44"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                    }}
                  >
                    {msg.role === "user" ? "🧑" : (msg.persona?.icon ?? "🤖")}
                  </div>
                  {/* bubble */}
                  <div
                    style={{
                      maxWidth: "72%",
                      padding: "11px 14px",
                      borderRadius:
                        msg.role === "user"
                          ? "14px 4px 14px 14px"
                          : "4px 14px 14px 14px",
                      background:
                        msg.role === "user"
                          ? "rgba(96,165,250,0.1)"
                          : `${msg.persona?.color ?? "#a78bfa"}0d`,
                      border: `1px solid ${msg.role === "user" ? "rgba(96,165,250,0.2)" : (msg.persona?.color ?? "#a78bfa") + "33"}`,
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: "#ddd",
                      fontFamily: "Georgia, serif",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.role === "assistant" && (
                      <div
                        style={{
                          fontSize: 10,
                          color: msg.persona?.color ?? "#a78bfa",
                          fontWeight: 700,
                          marginBottom: 5,
                          fontFamily: "inherit",
                        }}
                      >
                        {msg.persona?.name ?? "AI"}
                      </div>
                    )}
                    {msg.text}
                    {/* replay TTS button */}
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => speakText(msg.text)}
                        disabled={stage !== "idle"}
                        style={{
                          display: "block",
                          marginTop: 8,
                          background: "none",
                          border: "none",
                          color: msg.persona?.color ?? "#a78bfa",
                          cursor: stage === "idle" ? "pointer" : "not-allowed",
                          fontSize: 11,
                          fontFamily: "inherit",
                          padding: 0,
                          opacity: stage === "idle" ? 0.7 : 0.3,
                        }}
                      >
                        🔊 Replay
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* streaming preview */}
              {liveText && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${selectedPersona.color}20`,
                      border: `1px solid ${selectedPersona.color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                    }}
                  >
                    {selectedPersona.icon}
                  </div>
                  <div
                    style={{
                      maxWidth: "72%",
                      padding: "11px 14px",
                      borderRadius: "4px 14px 14px 14px",
                      background: `${selectedPersona.color}0a`,
                      border: `1px solid ${selectedPersona.color}22`,
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: "#ccc",
                      fontFamily: "Georgia, serif",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: selectedPersona.color,
                        fontWeight: 700,
                        marginBottom: 5,
                      }}
                    >
                      {selectedPersona.name}
                    </div>
                    {liveText}
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 14,
                        background: selectedPersona.color,
                        marginLeft: 2,
                        animation: "pulse 0.8s ease-in-out infinite",
                        verticalAlign: "middle",
                      }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEnd} />
            </div>

            {/* error */}
            {error && (
              <div
                style={{
                  ...cardStyles.errorBox,
                  margin: "0 20px 8px",
                  flexShrink: 0,
                }}
              >
                ⚠ {error}
              </div>
            )}

            {/* mic orb area */}
            <div
              style={{
                flexShrink: 0,
                padding: "16px 20px 20px",
                borderTop: `1px solid ${tokens.borderSubtle}`,
                background: "rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* visualiser + mic button */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* radial bars */}
                <svg width={120} height={120} style={{ position: "absolute" }}>
                  {Array.from({ length: bars }, (_, i) => {
                    const angle = (i / bars) * 360 - 90;
                    const rad = angle * (Math.PI / 180);
                    const h =
                      stage === "listening"
                        ? 6 + (volume / 255) * 30
                        : stage === "speaking"
                          ? 6 + 14 * Math.abs(Math.sin(i * 0.7))
                          : 4;
                    const r1 = 32,
                      r2 = r1 + h;
                    const x1 = 60 + r1 * Math.cos(rad),
                      y1 = 60 + r1 * Math.sin(rad);
                    const x2 = 60 + r2 * Math.cos(rad),
                      y2 = 60 + r2 * Math.sin(rad);
                    const col =
                      stage === "listening"
                        ? "#60a5fa"
                        : stage === "speaking"
                          ? "#a78bfa"
                          : "#333";
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={col}
                        strokeWidth={3}
                        strokeLinecap="round"
                        style={{ transition: "all 0.08s ease" }}
                      />
                    );
                  })}
                </svg>

                {/* mic button */}
                <button
                  onClick={handleMicButton}
                  disabled={stage === "processing" || stage === "thinking"}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    border: "none",
                    cursor:
                      stage === "processing" || stage === "thinking"
                        ? "wait"
                        : "pointer",
                    background:
                      stage === "listening"
                        ? "linear-gradient(135deg,#3b82f6,#1d4ed8)"
                        : stage === "speaking"
                          ? "linear-gradient(135deg,#a78bfa,#7c3aed)"
                          : stage === "processing" || stage === "thinking"
                            ? "linear-gradient(135deg,#f59e0b,#d97706)"
                            : "linear-gradient(135deg,#334155,#1e293b)",
                    fontSize: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                      stage === "listening"
                        ? "0 0 0 8px rgba(59,130,246,0.15), 0 0 0 16px rgba(59,130,246,0.07)"
                        : stage === "speaking"
                          ? "0 0 0 8px rgba(167,139,250,0.15), 0 0 0 16px rgba(167,139,250,0.07)"
                          : "0 4px 20px rgba(0,0,0,0.5)",
                    transition: "all 0.2s ease",
                    zIndex: 1,
                  }}
                >
                  {stage === "listening"
                    ? "⏹"
                    : stage === "processing"
                      ? "⏳"
                      : stage === "thinking"
                        ? "💭"
                        : stage === "speaking"
                          ? "⏹"
                          : "🎙"}
                </button>
              </div>

              {/* hint */}
              <div
                style={{
                  fontSize: 11,
                  color: tokens.textFaint,
                  textAlign: "center",
                }}
              >
                {stage === "listening"
                  ? "Tap to stop · Auto-stops on silence"
                  : stage === "speaking"
                    ? "Tap to stop speaking"
                    : stage === "processing" || stage === "thinking"
                      ? "Please wait…"
                      : "Tap mic to start speaking"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
