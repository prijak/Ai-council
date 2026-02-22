import { useState } from "react";
import { tokens, formStyles, buttonStyles, cardStyles } from "../styles";
import { useAuth } from "./AuthGate";
import { SignInButton } from "./AuthGate";
import { uid } from "../lib/utils";

const ICON_OPTIONS = [
  "🧑‍💼",
  "👩‍💻",
  "🎯",
  "🔬",
  "📐",
  "🌍",
  "💡",
  "🎤",
  "🤖",
  "🏛",
  "🧬",
  "🎭",
  "📡",
  "🦅",
  "🐉",
  "🌱",
  "⚡",
  "🔭",
  "🧲",
  "🎪",
];
const COLOR_OPTIONS = [
  "#a78bfa",
  "#60a5fa",
  "#34d399",
  "#f59e0b",
  "#f472b6",
  "#f97316",
  "#e879f9",
  "#2dd4bf",
  "#fb7185",
  "#a3e635",
];

function ColorDot({ color, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: color,
        border: `2px solid ${selected ? "#fff" : "transparent"}`,
        cursor: "pointer",
        transition: "transform 0.12s",
        transform: selected ? "scale(1.25)" : "scale(1)",
        boxShadow: selected ? `0 0 10px ${color}88` : "none",
      }}
    />
  );
}

function PersonaChip({ p, onDelete }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 11,
        background: `${p.color}0d`,
        border: `1px solid ${p.color}33`,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: `${p.color}18`,
          border: `1.5px solid ${p.color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {p.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
          {p.name}
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
          {p.description || p.prompt?.slice(0, 60) + "…"}
        </div>
      </div>
      <button
        onClick={() => onDelete(p.id)}
        style={{
          ...buttonStyles.iconSquare,
          border: "none",
          color: tokens.textFaint,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

export function PersonaCreator({ customPersonas, onUpdate, onClose }) {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!(user && !isAnonymous);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [color, setColor] = useState("#a78bfa");
  const [badge, setBadge] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const canSave = name.trim() && prompt.trim();

  const doSave = () => {
    if (!canSave) {
      setError("Name and system prompt are required.");
      return;
    }
    const newPersona = {
      id: `custom_${uid()}`,
      name: name.trim(),
      icon,
      color,
      badge: badge.trim() || "Custom",
      tagline: tagline.trim() || "Your custom AI persona",
      description: description.trim() || "A custom AI persona",
      prompt: prompt.trim(),
      isCustom: true,
    };
    onUpdate([...customPersonas, newPersona]);
    setSaved(true);
    setError("");
    setTimeout(() => {
      setSaved(false);
      setName("");
      setBadge("");
      setTagline("");
      setDescription("");
      setPrompt("");
      setIcon("🎯");
      setColor("#a78bfa");
    }, 1400);
  };

  const deletePersona = (id) => {
    onUpdate(customPersonas.filter((p) => p.id !== id));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(0,0,0,0.78)",
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
          width: "min(560px, 96vw)",
          maxHeight: "92dvh",
          background: "linear-gradient(160deg,#0d0d1c,#070710)",
          border: "1px solid rgba(167,139,250,0.25)",
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 120px rgba(0,0,0,0.85)",
          overflow: "hidden",
          animation: "slideDown 0.22s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: `1px solid ${tokens.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(167,139,250,0.04)",
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
              ✨ Persona Creator
            </div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 1.5,
                color: "rgba(249,115,22,0.6)",
                fontWeight: 700,
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              Made in Bharat · AI Council
            </div>
          </div>
          <button onClick={onClose} style={{ ...buttonStyles.iconSquare }}>
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {!isLoggedIn ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>🔐</div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                Sign in to create personas
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: tokens.textMuted,
                  marginBottom: 20,
                }}
              >
                Custom personas are saved to your account and available in Agent
                Chat.
              </div>
              <SignInButton />
            </div>
          ) : (
            <>
              {/* Existing custom personas */}
              {customPersonas.length > 0 && (
                <div style={{ marginBottom: 22 }}>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: 1.2,
                      color: tokens.textFaint,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    Your Personas ({customPersonas.length})
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {customPersonas.map((p) => (
                      <PersonaChip key={p.id} p={p} onDelete={deletePersona} />
                    ))}
                  </div>
                  <div
                    style={{
                      height: 1,
                      background: tokens.borderSubtle,
                      margin: "20px 0",
                    }}
                  />
                </div>
              )}

              {/* Create form */}
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 1.2,
                  color: tokens.textFaint,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                Create New Persona
              </div>

              {/* Preview */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  marginBottom: 16,
                  background: `${color}0a`,
                  border: `1px solid ${color}30`,
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${color}18`,
                    border: `1.5px solid ${color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {name || "Persona Name"}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 8px",
                      borderRadius: 20,
                      background: `${color}18`,
                      border: `1px solid ${color}30`,
                      color,
                      fontWeight: 600,
                    }}
                  >
                    {badge || "Custom"}
                  </span>
                </div>
              </div>

              {/* Name + Badge */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  <label style={formStyles.label}>Persona Name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g. "The Strategist"'
                    style={formStyles.input}
                  />
                </div>
                <div>
                  <label style={formStyles.label}>Badge Label</label>
                  <input
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder='e.g. "Strategy"'
                    style={formStyles.input}
                  />
                </div>
              </div>

              {/* Icon picker */}
              <div style={{ marginBottom: 12 }}>
                <label style={formStyles.label}>Icon</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ICON_OPTIONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setIcon(ic)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: `1.5px solid ${icon === ic ? color : tokens.borderSubtle}`,
                        background:
                          icon === ic ? `${color}18` : "rgba(255,255,255,0.03)",
                        cursor: "pointer",
                        fontSize: 18,
                        boxShadow: icon === ic ? `0 0 10px ${color}44` : "none",
                        transition: "all 0.12s",
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div style={{ marginBottom: 12 }}>
                <label style={formStyles.label}>Accent Color</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {COLOR_OPTIONS.map((c) => (
                    <ColorDot
                      key={c}
                      color={c}
                      selected={color === c}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>

              {/* Tagline */}
              <div style={{ marginBottom: 12 }}>
                <label style={formStyles.label}>Tagline</label>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder='e.g. "Strategic. Bold. Future-focused."'
                  style={formStyles.input}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 12 }}>
                <label style={formStyles.label}>Short Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="1-2 sentences describing this persona"
                  style={formStyles.input}
                />
              </div>

              {/* System prompt */}
              <div style={{ marginBottom: 16 }}>
                <label style={formStyles.label}>System Prompt *</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  placeholder={`Describe how this persona should think and respond.\n\ne.g. "You are a seasoned venture capitalist with expertise in early-stage startups. You think in terms of market size, team quality, and defensibility…"`}
                  style={{
                    ...formStyles.input,
                    resize: "vertical",
                    lineHeight: 1.65,
                    fontSize: 13,
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    color: tokens.textFaint,
                    marginTop: 4,
                  }}
                >
                  This is the instruction the AI model receives. Be specific
                  about the persona's expertise, tone, and approach.
                </div>
              </div>

              {error && (
                <div style={{ ...cardStyles.errorBox, marginBottom: 12 }}>
                  ⚠ {error}
                </div>
              )}
            </>
          )}
        </div>

        {isLoggedIn && (
          <div
            style={{
              padding: "14px 22px",
              borderTop: `1px solid ${tokens.borderSubtle}`,
              display: "flex",
              gap: 10,
            }}
          >
            <button
              onClick={onClose}
              style={{ ...buttonStyles.ghost, flex: 1, padding: 10 }}
            >
              Cancel
            </button>
            <button
              onClick={doSave}
              disabled={!canSave}
              style={{
                flex: 2,
                padding: 10,
                borderRadius: 8,
                border: "none",
                background: saved
                  ? tokens.success
                  : canSave
                    ? `linear-gradient(135deg,${color},${color}99)`
                    : "rgba(255,255,255,0.05)",
                color: canSave ? "#fff" : tokens.textFaint,
                cursor: canSave ? "pointer" : "not-allowed",
                fontSize: 13,
                fontWeight: 700,
                transition: "background 0.2s",
              }}
            >
              {saved ? "✓ Persona Saved!" : "Save Persona"}
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
