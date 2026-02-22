import { useState, useRef } from "react";
import {
  tokens,
  layoutStyles,
  textStyles,
  cardStyles,
  buttonStyles,
} from "../styles";
import { COUNCIL_TEMPLATES, TEMPLATE_CATEGORIES } from "../constants/templates";
import { PERSONAS } from "../constants/personas";
import { PROVIDERS, ACCENT_COLORS, ACCENT_ICONS } from "../constants/providers";
import { parseCouncilJSON } from "../lib/importExportConfig";
import { uid } from "../lib/utils";
import { MemberCard } from "./MemberCard";
import { UserAvatar, SignInButton, useAuth } from "./AuthGate";
import { MemberForm } from "./MemberForm";
import { TemplateCard } from "./TemplateCard";
import { PersonaCreator } from "./PersonaCreator";
import { AGENT_PERSONAS } from "./AgentScreen";

// ─────────────────────────────────────────────────────────────────────────────
// Mode tab bar
// ─────────────────────────────────────────────────────────────────────────────
function ModeTabs({ mode, setMode }) {
  const tabs = [
    {
      id: "council",
      icon: "⚖",
      label: "Council",
      sub: "Multi-model deliberation",
    },
    {
      id: "agent",
      icon: "🤝",
      label: "Agent Chat",
      sub: "1-on-1 AI persona",
      badge: "NEW",
    },
    {
      id: "coming",
      icon: "🚀",
      label: "Coming Soon",
      sub: "What's next",
      badge: "…",
    },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 28,
        padding: "6px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${tokens.borderSubtle}`,
      }}
    >
      {tabs.map((t) => {
        const active = mode === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            style={{
              flex: 1,
              padding: "11px 10px",
              borderRadius: 11,
              border: `1px solid ${active ? "rgba(167,139,250,0.4)" : "transparent"}`,
              background: active ? "rgba(167,139,250,0.1)" : "transparent",
              cursor: "pointer",
              transition: "all 0.18s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#c4b5fd" : tokens.textMuted,
                }}
              >
                {t.label}
              </span>
              {t.badge && (
                <span
                  style={{
                    fontSize: 9,
                    padding: "1px 6px",
                    borderRadius: 10,
                    fontWeight: 700,
                    background:
                      t.badge === "NEW"
                        ? "rgba(52,211,153,0.15)"
                        : "rgba(167,139,250,0.15)",
                    border:
                      t.badge === "NEW"
                        ? "1px solid rgba(52,211,153,0.3)"
                        : "1px solid rgba(167,139,250,0.3)",
                    color: t.badge === "NEW" ? "#34d399" : "#a78bfa",
                  }}
                >
                  {t.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 10,
                color: active ? "rgba(196,181,253,0.6)" : tokens.textFaint,
              }}
            >
              {t.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent mode — persona picker + login gate inside SetupScreen
// ─────────────────────────────────────────────────────────────────────────────
function AgentModePanel({ onLaunchAgent, customPersonas, onOpenCreator }) {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!(user && !isAnonymous);
  const allPersonas = [...AGENT_PERSONAS, ...customPersonas];

  if (!isLoggedIn) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          border: `1px dashed ${tokens.borderSubtle}`,
          borderRadius: 16,
        }}
      >
        <div style={{ fontSize: 42, marginBottom: 16 }}>🤝</div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Agent Chat — sign in to unlock
        </div>
        <div
          style={{
            fontSize: 13,
            color: tokens.textMuted,
            lineHeight: 1.7,
            marginBottom: 20,
            maxWidth: 380,
            marginInline: "auto",
          }}
        >
          1-on-1 conversations with AI personas — CEO, Analyst, Coach and more.
          Includes free access to Sarvam AI 🇮🇳
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 18px",
            borderRadius: 12,
            marginBottom: 20,
            background: "rgba(249,115,22,0.08)",
            border: "1px solid rgba(249,115,22,0.22)",
            fontSize: 12,
            color: "#fb923c",
          }}
        >
          🇮🇳 Made in Bharat · Powered by Sarvam AI · Free with sign-in
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SignInButton />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Sarvam callout */}
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
        <span style={{ fontSize: 20 }}>🇮🇳</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fb923c" }}>
          Powered by Sarvam AI
        </span>
        <span style={{ fontSize: 12, color: "rgba(249,115,22,0.5)" }}>
          — India's own LLM, free with your sign-in
        </span>
        <span
          style={{
            fontSize: 10,
            marginLeft: "auto",
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
          fontSize: 11,
          letterSpacing: 1.2,
          color: tokens.textFaint,
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Choose a Persona to Chat With
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {allPersonas.map((p) => (
          <div
            key={p.id}
            onClick={() => onLaunchAgent(p)}
            style={{
              padding: "13px 15px",
              borderRadius: 12,
              cursor: "pointer",
              border: `1px solid ${p.color}30`,
              background: `${p.color}07`,
              display: "flex",
              alignItems: "center",
              gap: 11,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = p.color + "66";
              e.currentTarget.style.background = `${p.color}12`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = p.color + "30";
              e.currentTarget.style.background = `${p.color}07`;
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                flexShrink: 0,
                background: `${p.color}18`,
                border: `1.5px solid ${p.color}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              {p.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 2,
                }}
              >
                {p.name}
                {p.isCustom && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 9,
                      color: "#a78bfa",
                      background: "rgba(167,139,250,0.12)",
                      padding: "1px 6px",
                      borderRadius: 6,
                      border: "1px solid rgba(167,139,250,0.25)",
                    }}
                  >
                    CUSTOM
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: tokens.textMuted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.tagline}
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                color: p.color,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              Chat →
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onOpenCreator}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 10,
          border: `1px dashed rgba(167,139,250,0.3)`,
          background: "rgba(167,139,250,0.04)",
          color: "#9f7aea",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        ✨ Create Custom Persona
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Coming Soon panel
// ─────────────────────────────────────────────────────────────────────────────
function ComingSoonPanel() {
  const roadmap = [
    {
      icon: "💬",
      title: "WhatsApp Integration",
      desc: "Scan a QR code, link your number, and chat with your AI persona directly on WhatsApp — outside our UI.",
      color: "#25d366",
      eta: "Q1 2026",
    },
    {
      icon: "🏆",
      title: "Council Tournaments",
      desc: "Run the same query across multiple council configurations and compare who gave the best verdict.",
      color: "#f59e0b",
      eta: "Q2 2026",
    },
    {
      icon: "📁",
      title: "Document Council",
      desc: "Upload a PDF or doc, and let your council analyse, critique, and summarise it in depth.",
      color: "#60a5fa",
      eta: "Q2 2026",
    },
    {
      icon: "🎙",
      title: "Voice Mode",
      desc: "Speak to your AI persona and hear responses — fully voice-driven Agent Chat sessions.",
      color: "#a78bfa",
      eta: "Q2 2026",
    },
    {
      icon: "🔔",
      title: "Scheduled Check-ins",
      desc: "Your AI mentor reaches out at set times — morning mindset, EOD debrief, weekly review.",
      color: "#f472b6",
      eta: "Q3 2026",
    },
    {
      icon: "🌐",
      title: "Public Persona Gallery",
      desc: "Publish your custom personas and browse community creations — verified, rated, and remixable.",
      color: "#f97316",
      eta: "Q3 2026",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 6,
          }}
        >
          What's Coming
        </div>
        <div style={{ fontSize: 13, color: tokens.textMuted }}>
          We're building fast. Here's what's on the horizon for AI Council.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {roadmap.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 14,
              padding: "14px 16px",
              borderRadius: 13,
              border: `1px solid ${item.color}25`,
              background: `${item.color}06`,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = item.color + "50";
              e.currentTarget.style.background = `${item.color}0d`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = item.color + "25";
              e.currentTarget.style.background = `${item.color}06`;
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                flexShrink: 0,
                background: `${item.color}14`,
                border: `1.5px solid ${item.color}35`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {item.title}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    padding: "1px 7px",
                    borderRadius: 10,
                    fontWeight: 700,
                    background: `${item.color}18`,
                    border: `1px solid ${item.color}30`,
                    color: item.color,
                  }}
                >
                  {item.eta}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: tokens.textMuted,
                  lineHeight: 1.55,
                }}
              >
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          padding: "14px 18px",
          borderRadius: 13,
          background: "rgba(249,115,22,0.06)",
          border: "1px solid rgba(249,115,22,0.2)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 22 }}>🇮🇳</span>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#fb923c",
              marginBottom: 2,
            }}
          >
            Built with pride in Bharat
          </div>
          <div style={{ fontSize: 11, color: "rgba(249,115,22,0.5)" }}>
            AI Council is proudly made in India, powered by Sarvam AI — India's
            own LLM.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SetupScreen
// ─────────────────────────────────────────────────────────────────────────────
export function SetupScreen({ onLaunch, onLaunchAgent }) {
  const [mode, setMode] = useState("council");
  const [members, setMembers] = useState([]);
  const [chairmanId, setChairman] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showTpl, setShowTpl] = useState(false);
  const [activeCategory, setActiveCategory] = useState("think-tank");
  const [importErr, setImportErr] = useState("");
  const [importOk, setImportOk] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [customPersonas, setCustomPersonas] = useState([]);
  const importRef = useRef();
  const editMember = editingId ? members.find((m) => m.id === editingId) : null;

  const addMember = (m) => {
    setMembers((p) => [...p, m]);
    if (m.isChairman) setChairman(m.id);
    setShowForm(false);
  };
  const saveMember = (u) => {
    setMembers((p) => p.map((m) => (m.id === u.id ? u : m)));
    setEditingId(null);
  };
  const removeMember = (id) => {
    setMembers((p) => p.filter((m) => m.id !== id));
    if (chairmanId === id) setChairman(null);
  };
  const toggleChairman = (id) => setChairman((p) => (p === id ? null : id));

  const memberErrors = members.map((m) => {
    const pInfo = PROVIDERS[m.provider];
    const missing = [];
    if (!m.model?.trim()) missing.push("model");
    if (pInfo?.needsKey && !m.apiKey?.trim()) missing.push("API key");
    if (pInfo?.needsEndpoint && !m.endpoint?.trim()) missing.push("endpoint");
    return { id: m.id, name: m.name, missing };
  });
  const incompleteMembers = memberErrors.filter((e) => e.missing.length > 0);
  const allMembersComplete = incompleteMembers.length === 0;
  const canLaunch =
    members.length >= 3 && chairmanId !== null && allMembersComplete;
  const need = Math.max(0, 3 - members.length);

  const loadTemplate = (tmpl) => {
    setImportErr("");
    setImportOk(false);
    const built = tmpl.members.map((tm, i) => {
      const persona =
        PERSONAS.find((p) => p.id === tm.personaId) || PERSONAS[0];
      return {
        id: uid(),
        name: tm.name,
        provider: "ollama",
        model: "",
        endpoint: "http://localhost:11434",
        apiKey: "",
        personaLabel: persona.label,
        systemPrompt: persona.prompt,
        color: ACCENT_COLORS[i % ACCENT_COLORS.length],
        icon: ACCENT_ICONS[i % ACCENT_ICONS.length],
        isChairman: tm.isChairman,
      };
    });
    setMembers(built);
    setChairman(built.find((m) => m.isChairman)?.id || null);
    setShowTpl(false);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imp = parseCouncilJSON(ev.target.result);
        setMembers(imp);
        setChairman(imp.find((m) => m.isChairman)?.id || null);
        setImportOk(true);
        setImportErr("");
        setTimeout(() => setImportOk(false), 2500);
      } catch (err) {
        setImportErr(err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportConfig = () => {
    const data = { members: members.map((m) => ({ ...m, apiKey: "" })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "ai-council-config.json",
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filteredTemplates = COUNCIL_TEMPLATES.filter(
    (t) => t.category === activeCategory,
  );

  return (
    <div style={layoutStyles.page}>
      <style>{`
        @keyframes shimmerSetup { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes floatBadge   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
        @keyframes slideDown    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse        { 0%,100%{opacity:.7} 50%{opacity:1} }
      `}</style>

      {showCreator && (
        <PersonaCreator
          customPersonas={customPersonas}
          onUpdate={setCustomPersonas}
          onClose={() => setShowCreator(false)}
        />
      )}

      {/* ── Header ── */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          background:
            "linear-gradient(90deg, rgba(249,115,22,0.04), rgba(167,139,250,0.04), transparent)",
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "linear-gradient(135deg,#f97316,#a78bfa,#60a5fa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              boxShadow: "0 4px 16px rgba(167,139,250,0.3)",
            }}
          >
            ⚖
          </div>
          <div
            style={{
              position: "absolute",
              bottom: -4,
              right: -5,
              fontSize: 11,
              animation: "floatBadge 3s ease-in-out infinite",
            }}
          >
            🇮🇳
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: -0.3,
            }}
          >
            AI Council
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: 2,
              color: "rgba(249,115,22,0.6)",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Made in Bharat · Powered by Sarvam AI
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginLeft: "auto",
          }}
        >
          {mode === "council" && members.length > 0 && (
            <button
              onClick={exportConfig}
              style={{
                ...buttonStyles.ghost,
                padding: "5px 12px",
                fontSize: 12,
              }}
            >
              📤 Export
            </button>
          )}
          <button
            onClick={() => setShowCreator(true)}
            style={{ ...buttonStyles.ghost, padding: "5px 12px", fontSize: 12 }}
          >
            ✨ Personas
          </button>
          <SignInButton />
          <UserAvatar />
        </div>
      </div>

      <div style={layoutStyles.contentWell}>
        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: "clamp(26px,6vw,40px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.15,
              marginBottom: 10,
              letterSpacing: -1,
            }}
          >
            {mode === "council" && (
              <>
                Assemble your
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #f97316 0%, #a78bfa 50%, #60a5fa 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    animation: "shimmerSetup 4s linear infinite",
                  }}
                >
                  council of minds.
                </span>
              </>
            )}
            {mode === "agent" && (
              <>
                Chat 1-on-1 with
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #f97316 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    animation: "shimmerSetup 4s linear infinite",
                  }}
                >
                  your AI persona.
                </span>
              </>
            )}
            {mode === "coming" && (
              <>
                What's coming
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #a78bfa 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    animation: "shimmerSetup 4s linear infinite",
                  }}
                >
                  to AI Council.
                </span>
              </>
            )}
          </h1>
          <p
            style={{
              color: tokens.textMuted,
              fontSize: 14,
              lineHeight: 1.65,
              marginBottom: 12,
              maxWidth: 500,
            }}
          >
            {mode === "council" &&
              "Mix Ollama, OpenAI, Groq, Anthropic, Google — or any compatible endpoint. Start from a template or build manually."}
            {mode === "agent" &&
              "Have a focused conversation with an expert AI persona — CEO, Analyst, Coach, Lawyer and more. Sign in to unlock."}
            {mode === "coming" &&
              "We're building fast. Here's the roadmap for AI Council — made with pride in Bharat."}
          </p>

          {/* Sarvam callout — shown on council + agent tabs */}
          {mode !== "coming" && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(249,115,22,0.04))",
                border: "1px solid rgba(249,115,22,0.25)",
              }}
            >
              <span style={{ fontSize: 18 }}>🇮🇳</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fb923c" }}>
                Sarvam AI available
              </span>
              <span style={{ fontSize: 12, color: "rgba(249,115,22,0.55)" }}>
                — India's own LLM · sign in to use free
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 7px",
                  borderRadius: 20,
                  background: "rgba(249,115,22,0.15)",
                  border: "1px solid rgba(249,115,22,0.3)",
                  color: "#f97316",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                🔥 FREE
              </span>
            </div>
          )}
        </div>

        {/* Mode tabs */}
        <ModeTabs mode={mode} setMode={setMode} />

        {/* ── Council mode ── */}
        {mode === "council" && (
          <>
            {/* Stage overview */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                gap: 10,
                marginBottom: 32,
              }}
            >
              {[
                {
                  n: "I",
                  t: "First Opinions",
                  d: "All members respond independently",
                  color: "#a78bfa",
                },
                {
                  n: "II",
                  t: "Peer Review",
                  d: "Members critique each other anonymously",
                  color: "#60a5fa",
                },
                {
                  n: "III",
                  t: "Final Verdict",
                  d: "Chairman synthesizes the best answer",
                  color: "#34d399",
                },
              ].map((s) => (
                <div
                  key={s.n}
                  style={{
                    padding: "13px 15px",
                    background: `${s.color}08`,
                    border: `1px solid ${s.color}30`,
                    borderRadius: 10,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 20px ${s.color}28`;
                    e.currentTarget.style.borderColor = `${s.color}66`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = `${s.color}30`;
                  }}
                >
                  <div
                    style={{
                      ...textStyles.sectionLabel,
                      color: s.color,
                      letterSpacing: 3,
                      marginBottom: 5,
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#ccc",
                      marginBottom: 3,
                    }}
                  >
                    {s.t}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: tokens.textMuted,
                      lineHeight: 1.45,
                    }}
                  >
                    {s.d}
                  </div>
                </div>
              ))}
            </div>

            {/* Templates */}
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => setShowTpl((s) => !s)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid rgba(167,139,250,0.3)`,
                  background: "rgba(167,139,250,0.05)",
                  color: "#c4b5fd",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>✨ Start from a template</span>
                <span style={{ fontSize: 11, opacity: 0.6 }}>
                  {showTpl
                    ? "▲ Collapse"
                    : `▼ Show ${COUNCIL_TEMPLATES.length} templates`}
                </span>
              </button>
              {showTpl && (
                <div style={{ animation: "slideDown 0.2s ease" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 12,
                      marginBottom: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    {TEMPLATE_CATEGORIES.map((cat) => {
                      const count = COUNCIL_TEMPLATES.filter(
                        (t) => t.category === cat.id,
                      ).length;
                      const isActive = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: `1px solid ${isActive ? "rgba(167,139,250,0.5)" : tokens.borderSubtle}`,
                            background: isActive
                              ? "rgba(167,139,250,0.12)"
                              : "transparent",
                            color: isActive ? "#c4b5fd" : tokens.textMuted,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: isActive ? 700 : 400,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                          <span
                            style={{
                              fontSize: 10,
                              background: isActive
                                ? "rgba(167,139,250,0.2)"
                                : "rgba(255,255,255,0.06)",
                              padding: "1px 6px",
                              borderRadius: 4,
                              color: isActive ? "#c4b5fd" : tokens.textFaint,
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                      gap: 10,
                    }}
                  >
                    {filteredTemplates.map((t) => (
                      <TemplateCard key={t.id} tmpl={t} onLoad={loadTemplate} />
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      color: tokens.textFaint,
                    }}
                  >
                    ⚠ Templates load persona structure only — set provider,
                    model and API key per member.
                  </div>
                </div>
              )}
            </div>

            {/* Members header */}
            <div
              style={{
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={textStyles.sectionLabel}>
                Members ({members.length})
                {members.length >= 3 && !chairmanId && (
                  <span
                    style={{
                      marginLeft: 10,
                      color: tokens.warning,
                      fontSize: 11,
                      textTransform: "none",
                      fontWeight: 500,
                      letterSpacing: 0,
                    }}
                  >
                    ← tap 👑 to set chairman
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 7 }}>
                <button
                  onClick={() => importRef.current?.click()}
                  style={{
                    ...buttonStyles.ghost,
                    padding: "5px 12px",
                    fontSize: 12,
                  }}
                >
                  📥 Import
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  style={{ display: "none" }}
                />
                {!showForm && !editingId && (
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: `1px solid rgba(167,139,250,0.35)`,
                      background: "rgba(167,139,250,0.08)",
                      color: "#c4b5fd",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    + Add Member
                  </button>
                )}
              </div>
            </div>

            {importErr && (
              <div style={{ ...cardStyles.errorBox, marginBottom: 12 }}>
                ⚠ Import failed: {importErr}
              </div>
            )}
            {importOk && (
              <div style={{ ...cardStyles.infoBox, marginBottom: 12 }}>
                ✓ Council imported successfully.
              </div>
            )}

            {members.length === 0 && !showForm && (
              <div
                style={{
                  padding: 36,
                  textAlign: "center",
                  border: `2px dashed ${tokens.borderSubtle}`,
                  borderRadius: 12,
                  color: tokens.textFaint,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 8 }}>⚖</div>
                <div style={{ fontSize: 13 }}>
                  No members yet — pick a template or add members manually
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {members.map((m) => (
                <div key={m.id}>
                  <MemberCard
                    member={m}
                    isChairman={chairmanId === m.id}
                    onRemove={() => removeMember(m.id)}
                    onToggleChairman={() => toggleChairman(m.id)}
                    onEdit={() =>
                      setEditingId(editingId === m.id ? null : m.id)
                    }
                  />
                  {editingId === m.id && editMember && (
                    <MemberForm
                      slotIndex={members.indexOf(m)}
                      currentChairmanId={chairmanId}
                      onAdd={saveMember}
                      onCancel={() => setEditingId(null)}
                      editMember={editMember}
                    />
                  )}
                </div>
              ))}
            </div>

            {showForm && (
              <MemberForm
                slotIndex={members.length}
                currentChairmanId={chairmanId}
                onAdd={addMember}
                onCancel={() => setShowForm(false)}
              />
            )}

            {members.length >= 3 && chairmanId && !allMembersComplete && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  background: "rgba(245,158,11,0.07)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#fcd34d",
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  ⚠ Complete setup for all members before launching:
                </div>
                {incompleteMembers.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 3,
                    }}
                  >
                    <span style={{ color: "#f59e0b" }}>›</span>
                    <span style={{ color: "#e5c55a" }}>{e.name}</span>
                    <span style={{ color: "rgba(245,158,11,0.7)" }}>
                      — missing {e.missing.join(", ")}
                    </span>
                    <button
                      onClick={() => setEditingId(e.id)}
                      style={{
                        marginLeft: "auto",
                        padding: "2px 9px",
                        borderRadius: 5,
                        border: "1px solid rgba(245,158,11,0.35)",
                        background: "rgba(245,158,11,0.1)",
                        color: "#fcd34d",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      Edit →
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => canLaunch && onLaunch(members, chairmanId)}
              disabled={!canLaunch}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 10,
                border: "none",
                fontSize: 15,
                fontWeight: 700,
                marginTop: 16,
                background: canLaunch
                  ? "linear-gradient(135deg,#a78bfa,#60a5fa)"
                  : "rgba(255,255,255,0.04)",
                color: canLaunch ? "#fff" : tokens.textFaint,
                cursor: canLaunch ? "pointer" : "not-allowed",
              }}
            >
              {canLaunch
                ? `Convene ${members.length}-Member Council →`
                : need > 0
                  ? `Add ${need} more member${need !== 1 ? "s" : ""} to continue`
                  : !chairmanId
                    ? "Designate a Chairman to continue"
                    : `Complete setup for ${incompleteMembers.length} member${incompleteMembers.length !== 1 ? "s" : ""} to continue`}
            </button>
          </>
        )}

        {/* ── Agent mode ── */}
        {mode === "agent" && (
          <AgentModePanel
            onLaunchAgent={onLaunchAgent}
            customPersonas={customPersonas}
            onOpenCreator={() => setShowCreator(true)}
          />
        )}

        {/* ── Coming Soon ── */}
        {mode === "coming" && <ComingSoonPanel />}

        {/* Footer */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: `1px solid ${tokens.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 16px",
              borderRadius: 24,
              background: "rgba(249,115,22,0.06)",
              border: "1px solid rgba(249,115,22,0.15)",
            }}
          >
            <span style={{ fontSize: 14 }}>🇮🇳</span>
            <span style={{ fontSize: 11, color: "#7a6a50" }}>Built with</span>
            <span style={{ fontSize: 13 }}>❤️</span>
            <span style={{ fontSize: 11, color: "#7a6a50" }}>in</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                background:
                  "linear-gradient(90deg,#f97316 0%,#ffffff 50%,#138808 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Bharat
            </span>
          </div>
          <span style={{ fontSize: 11, color: "#2a2035" }}>
            Proudly using Sarvam AI 🚀
          </span>
        </div>
      </div>
    </div>
  );
}
