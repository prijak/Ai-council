// Shared PageHeader component for inner pages
export function PageHeader({ icon, iconColor, title, subtitle, extra }) {
  return (
    <div style={{ padding: "clamp(28px,4vw,48px) clamp(20px,5vw,72px) 0", marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 8 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: `${iconColor}14`, border: `1.5px solid ${iconColor}32`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(22px,3.5vw,34px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.5 }}>{title}</h2>
          </div>
          {subtitle && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", margin: 0, maxWidth: 520, lineHeight: 1.65 }}>{subtitle}</p>}
        </div>
        {extra && <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>{extra}</div>}
      </div>
    </div>
  );
}
