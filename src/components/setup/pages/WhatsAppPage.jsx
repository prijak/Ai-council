// pages/WhatsAppPage.jsx
const HOW = [
  { n: "01", icon: "🔗", t: "Connect",       d: "Link your number in seconds. Scan a QR code or enter your number." },
  { n: "02", icon: "🤝", t: "Pick Persona",  d: "Choose any AI persona — CEO, Coach, Philosopher, or a custom one." },
  { n: "03", icon: "💬", t: "Just Chat",     d: "Message naturally. Your AI responds instantly, like any contact." },
  { n: "04", icon: "🔔", t: "Stay Connected",d: "AI checks in proactively — morning brief, EOD debrief, habit tracking." },
];

const USE_CASES = [
  { icon: "🌅", t: "Morning Clarity",  d: "AI mentor sets your intention and top 3 priorities for the day." },
  { icon: "💼", t: "Deal Coach",        d: "Negotiating a raise? Your personal deal coach, one message away." },
  { icon: "🧘", t: "Evening Debrief",  d: "Reflect on the day, celebrate wins, process what didn't go right." },
  { icon: "📈", t: "Startup Advisor",  d: "Stuck on product decisions? Instant VC or founder perspective." },
];

export function WhatsAppPage({ onLaunch }) {
  return (
    <div style={{ animation: "pageIn 0.28s ease" }}>
      {/* Hero */}
      <div style={{
        padding: "clamp(40px,6vw,80px) clamp(20px,6vw,80px)",
        background: "linear-gradient(160deg,rgba(37,211,102,0.06),rgba(18,140,126,0.02),transparent)",
        borderBottom: "1px solid rgba(37,211,102,0.09)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 45%,rgba(37,211,102,0.05),transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(37,211,102,0.1)", border: "1.5px solid rgba(37,211,102,0.32)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>💬</div>
            <div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,4.5vw,52px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.8, lineHeight: 1 }}>WhatsApp</h2>
              <div style={{ fontSize: 11, color: "#25d366", fontWeight: 600, marginTop: 3 }}>Your AI, in the app you already use</div>
            </div>
          </div>
          <p style={{ fontSize: "clamp(14px,1.6vw,17px)", color: "rgba(255,255,255,0.44)", lineHeight: 1.7, marginBottom: 30, maxWidth: 480 }}>
            No new apps. No browser tabs. Your AI persona lives right inside WhatsApp — available when you need it, proactively checking in when you don't.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={onLaunch} style={{
              display: "inline-flex", alignItems: "center", gap: 11,
              padding: "14px 32px", borderRadius: 13,
              background: "linear-gradient(135deg,#25d366,#128c7e)",
              color: "#fff", fontSize: 15, fontWeight: 800,
              fontFamily: "'Syne',sans-serif",
              border: "none", cursor: "pointer",
              boxShadow: "0 10px 36px rgba(37,211,102,0.3)",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(37,211,102,0.42)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 10px 36px rgba(37,211,102,0.3)"; }}
            >💬 Connect WhatsApp</button>
            <span style={{ fontSize: 12, color: "rgba(37,211,102,0.45)", display: "flex", alignItems: "center", gap: 5 }}>🔒 End-to-end encrypted</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: "28px clamp(20px,6vw,80px) 0" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 1.8, fontWeight: 700, textTransform: "uppercase", marginBottom: 20 }}>How it works</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 0 }}>
          {HOW.map((s, i) => (
            <div key={s.n} style={{ padding: "20px 18px", borderTop: "1.5px solid rgba(255,255,255,0.05)", borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.03)", position: "relative" }}>
              <div style={{ position: "absolute", top: -1.5, left: 0, width: 40, height: 1.5, background: "#25d366" }} />
              <div style={{ fontSize: 10, color: "#25d366", fontWeight: 800, letterSpacing: 1.2, marginBottom: 10 }}>{s.n}</div>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{s.t}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.36)", lineHeight: 1.65 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Use cases */}
      <div style={{ padding: "28px clamp(20px,6vw,80px) 52px" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 1.8, fontWeight: 700, textTransform: "uppercase", marginBottom: 16 }}>Use cases</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 11 }}>
          {USE_CASES.map(c => (
            <div key={c.t} style={{ padding: "17px 16px", borderRadius: 13, background: "rgba(37,211,102,0.04)", border: "1px solid rgba(37,211,102,0.1)" }}>
              <div style={{ fontSize: 22, marginBottom: 9 }}>{c.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7", marginBottom: 5 }}>{c.t}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.36)", lineHeight: 1.65 }}>{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
