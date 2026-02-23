// pages/VoicePage.jsx
const LANGS = ["हिन्दी", "தமிழ்", "বাংলা", "ಕನ್ನಡ", "తెలుగు", "मराठी", "ਪੰਜਾਬੀ", "ગુજરાતી", "മലയാളം", "ଓଡ଼ିଆ"];

const WHY = [
  { icon: "🧠", t: "Cultural context", d: "Understands idioms, references, and the way Indians actually speak — not just translated English." },
  { icon: "⚡", t: "Real-time streaming", d: "Responses stream as you speak. No waiting. Feels like a real conversation." },
  { icon: "🔄", t: "Code-switching", d: "Mix Hindi and English freely. Hinglish is a first-class language here." },
  { icon: "🤝", t: "All personas", d: "Every Agent Chat persona by voice — CEO, Coach, Philosopher and 40+ more." },
];

export function VoicePage({ onLaunch }) {
  return (
    <div style={{ animation: "pageIn 0.28s ease" }}>
      {/* Hero */}
      <div style={{
        padding: "clamp(40px,6vw,80px) clamp(20px,6vw,80px)",
        background: "linear-gradient(160deg,rgba(192,132,252,0.07),rgba(167,139,250,0.02),transparent)",
        borderBottom: "1px solid rgba(192,132,252,0.09)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 45%,rgba(192,132,252,0.06),transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(192,132,252,0.14)", border: "1.5px solid rgba(192,132,252,0.38)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🎙</div>
            <div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,4.5vw,52px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.8, lineHeight: 1 }}>Voice AI</h2>
              <div style={{ fontSize: 11, color: "#c084fc", fontWeight: 600, marginTop: 3 }}>India's own AI voice platform · Powered by Sarvam</div>
            </div>
          </div>
          <p style={{ fontSize: "clamp(14px,1.6vw,17px)", color: "rgba(255,255,255,0.44)", lineHeight: 1.7, marginBottom: 30, maxWidth: 480 }}>
            Speak naturally in Hindi, Tamil, Bengali and 10+ Indian languages. AI that understands your accent, dialect, and cultural context — not just your words.
          </p>
          <button onClick={onLaunch} style={{
            display: "inline-flex", alignItems: "center", gap: 11,
            padding: "14px 32px", borderRadius: 13,
            background: "linear-gradient(135deg,#c084fc,#a78bfa,#8b5cf6)",
            color: "#fff", fontSize: 15, fontWeight: 800,
            fontFamily: "'Syne',sans-serif",
            border: "none", cursor: "pointer",
            boxShadow: "0 10px 36px rgba(167,139,250,0.38)",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(167,139,250,0.48)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 10px 36px rgba(167,139,250,0.38)"; }}
          >🎙 Start Speaking</button>
        </div>
      </div>

      {/* Language pills */}
      <div style={{ padding: "24px clamp(20px,6vw,80px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 1.8, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Supported languages</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LANGS.map(l => <div key={l} style={{ padding: "7px 15px", borderRadius: 100, background: "rgba(192,132,252,0.07)", border: "1px solid rgba(192,132,252,0.16)", fontSize: 14, color: "#d8b4fe", fontWeight: 500 }}>{l}</div>)}
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ padding: "28px clamp(20px,6vw,80px) 52px" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 1.8, fontWeight: 700, textTransform: "uppercase", marginBottom: 18 }}>Why it's different</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
          {WHY.map(f => (
            <div key={f.t} style={{ padding: "20px 18px", borderRadius: 15, background: "rgba(192,132,252,0.04)", border: "1px solid rgba(192,132,252,0.1)" }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{f.t}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.36)", lineHeight: 1.65 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
