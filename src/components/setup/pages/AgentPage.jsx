import { useState } from "react";
// NOTE: Adjust paths to match your project structure.
// Assumes: src/components/setup/pages/AgentPage.jsx
import { useAuth, SignInButton } from "../../AuthGate";
import { AGENT_PERSONAS, AGENT_PERSONA_CATEGORIES } from "../../AgentScreen";
import { PageHeader } from "../PageHeader";

export function AgentPage({ onLaunchAgent, customPersonas, onOpenCreator }) {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!(user && !isAnonymous);
  const [activeCategory, setActiveCategory] = useState("all");

  const all = [...AGENT_PERSONAS, ...customPersonas.map(p => ({ ...p, isCustom: true }))];
  const filtered = activeCategory === "all" ? all
    : all.filter(p => p.category === activeCategory || (activeCategory === "custom" && p.isCustom));

  const cats = [
    { id: "all", label: "All", icon: "✦", count: all.length },
    ...AGENT_PERSONA_CATEGORIES.map(c => ({ ...c, count: all.filter(p => p.category === c.id).length })),
    ...(customPersonas.length > 0 ? [{ id: "custom", label: "Mine", icon: "✨", count: customPersonas.length }] : []),
  ];

  if (!isLoggedIn) return (
    <div style={{ animation: "pageIn 0.28s ease", padding: "clamp(40px,6vw,72px) clamp(20px,5vw,72px)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "48px 36px", textAlign: "center", borderRadius: 22, border: "1px solid rgba(244,114,182,0.18)", background: "linear-gradient(145deg,rgba(244,114,182,0.07),rgba(249,115,22,0.02))" }}>
        <div style={{ fontSize: 52, marginBottom: 18 }}>🤝</div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, color: "#fff", marginBottom: 10 }}>Sign in to unlock Agent Chat</h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", lineHeight: 1.7, marginBottom: 26 }}>Deep 1-on-1 conversations with {AGENT_PERSONAS.length} expert AI personas — CEOs to Philosophers to Indian Founders. Free with your account.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {["👔 CEO", "⚖ Lawyer", "🏛 Philosopher", "🇮🇳 Founder", "🧘 Coach"].map(p => (
            <span key={p} style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(244,114,182,0.18)", background: "rgba(244,114,182,0.06)", color: "#f9a8d4", fontSize: 12, fontWeight: 600 }}>{p}</span>
          ))}
        </div>
        <SignInButton />
      </div>
    </div>
  );

  return (
    <div style={{ animation: "pageIn 0.28s ease" }}>
      <PageHeader
        icon="🤝" iconColor="#f472b6" title="Agent Chat"
        subtitle={`${all.length} expert AI personas — choose one for a deep 1-on-1 conversation. Powered by Sarvam AI, free with sign-in.`}
        extra={<button onClick={onOpenCreator} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.24)", color: "#c4b5fd", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>✨ Custom Persona</button>}
      />

      <div style={{ padding: "0 clamp(20px,5vw,72px) 52px" }}>
        {/* Category filter */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
          {cats.filter(c => c.count > 0).map(c => {
            const active = activeCategory === c.id;
            return (
              <button key={c.id} onClick={() => setActiveCategory(c.id)} className="ai-ghost" style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 13px", borderRadius: 20, cursor: "pointer",
                border: `1px solid ${active ? "rgba(244,114,182,0.45)" : "rgba(255,255,255,0.07)"}`,
                background: active ? "rgba(244,114,182,0.12)" : "rgba(255,255,255,0.02)",
                color: active ? "#f9a8d4" : "rgba(255,255,255,0.38)",
                fontSize: 12, fontWeight: active ? 700 : 400, transition: "all 0.15s", fontFamily: "inherit",
              }}>
                <span>{c.icon}</span><span>{c.label}</span>
                <span style={{ fontSize: 9, background: active ? "rgba(244,114,182,0.18)" : "rgba(255,255,255,0.06)", padding: "0 5px", borderRadius: 8, color: active ? "#f472b6" : "rgba(255,255,255,0.22)" }}>{c.count}</span>
              </button>
            );
          })}
        </div>

        {/* Persona grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%,248px),1fr))", gap: 11 }}>
          {filtered.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onLaunchAgent(p)}
              className="ai-persona"
              style={{
                "--c": p.color,
                padding: "15px", borderRadius: 13, cursor: "pointer",
                border: `1px solid ${p.color}16`,
                background: `${p.color}04`,
                textAlign: "left", transition: "all 0.2s",
                animation: `fadeUp 0.4s ${i * 0.025}s ease both`,
                fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 9 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${p.color}14`, border: `1.5px solid ${p.color}32`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>{p.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{p.name}</span>
                    {p.isCustom && <span style={{ fontSize: 8, color: "#a78bfa", background: "rgba(167,139,250,0.12)", padding: "1px 6px", borderRadius: 4, border: "1px solid rgba(167,139,250,0.24)" }}>CUSTOM</span>}
                    {p.badge && !p.isCustom && <span style={{ fontSize: 8, color: p.color, background: `${p.color}16`, padding: "1px 6px", borderRadius: 4, border: `1px solid ${p.color}28` }}>{p.badge}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>{p.tagline}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: p.color, fontWeight: 700 }}>Chat →</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
