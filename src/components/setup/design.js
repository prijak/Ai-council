// ─── Shared design system ───────────────────────────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes pageIn   { from { opacity:0; transform:translateX(10px) } to { opacity:1; transform:translateX(0) } }
  @keyframes shimmer  { 0%{background-position:-300% center} 100%{background-position:300% center} }
  @keyframes orb1     { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(50px,-40px) scale(1.08)} 70%{transform:translate(-25px,20px) scale(0.96)} }
  @keyframes orb2     { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(-60px,30px) scale(1.06)} 65%{transform:translate(35px,-20px) scale(1.02)} }
  @keyframes pulseRing { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0.35)} 50%{box-shadow:0 0 0 8px rgba(249,115,22,0)} }
  @keyframes spin      { to{transform:rotate(360deg)} }

  .ai-nav-item { display:flex; align-items:center; gap:11px; width:100%; padding:10px 16px; background:transparent; border:none; border-left:3px solid transparent; border-radius:0 9px 9px 0; color:rgba(255,255,255,0.38); cursor:pointer; text-align:left; transition:all 0.15s; margin-bottom:2px; font-family:'DM Sans',sans-serif; }
  .ai-nav-item:hover { background:rgba(255,255,255,0.05)!important; color:rgba(255,255,255,0.7)!important; }
  .ai-nav-item.active { color:#fff!important; }

  .ai-card { transition:all 0.25s cubic-bezier(0.34,1.4,0.64,1)!important; cursor:pointer; }
  .ai-card:hover { transform:translateY(-4px)!important; box-shadow:0 24px 64px rgba(0,0,0,0.5)!important; }

  .ai-ghost:hover { background:rgba(255,255,255,0.08)!important; }
  .ai-persona:hover { border-color:var(--c)!important; background:color-mix(in srgb,var(--c) 11%,transparent)!important; }

  @media(max-width:767px) {
    .ai-sidebar      { display:none!important; }
    .ai-mobile-hdr   { display:flex!important; }
    .ai-mobile-nav   { display:flex!important; }
    .council-cols    { grid-template-columns:1fr!important; }
  }
  @media(min-width:768px) {
    .ai-mobile-hdr   { display:none!important; }
    .ai-mobile-nav   { display:none!important; }
  }

  /* Modal mobile fixes */
  @media(max-width:640px) {
    .modal-body-2col { flex-direction:column!important; }
    .modal-sidebar   { width:100%!important; border-right:none!important; border-bottom:1px solid rgba(255,255,255,0.07)!important; max-height:55vh; flex-shrink:0; }
    .modal-right     { flex:1!important; min-height:240px; border-top:none!important; }
    .modal-howto     { display:none!important; }
    .modal-actions   { padding:12px 14px!important; }
  }
`;

export const NAV_ITEMS = [
  { id: "home",     icon: "⌂",  label: "Home",       color: "#f97316" },
  { id: "council",  icon: "⚖",  label: "Council",    color: "#a78bfa" },
  { id: "agent",    icon: "🤝", label: "Agent Chat", color: "#f472b6" },
  { id: "voice",    icon: "🎙", label: "Voice AI",   color: "#c084fc", badge: "🇮🇳" },
  { id: "whatsapp", icon: "💬", label: "WhatsApp",   color: "#25d366", badge: "NEW" },
  { id: "videogen", icon: "🎬", label: "Video Gen",  color: "#c084fc", badge: "NEW" },
];

export const ghostBtn = (extra = {}) => ({
  padding: "7px 14px", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.55)",
  cursor: "pointer", fontSize: 12, fontWeight: 600,
  transition: "background 0.15s", fontFamily: "inherit",
  ...extra,
});

export const alertBox = (type) => ({
  padding: "11px 14px", borderRadius: 11, fontSize: 12, lineHeight: 1.6,
  background: type === "err" ? "rgba(248,113,113,0.07)" : type === "ok" ? "rgba(52,211,153,0.07)" : "rgba(245,158,11,0.07)",
  border: `1px solid ${type === "err" ? "rgba(248,113,113,0.2)" : type === "ok" ? "rgba(52,211,153,0.2)" : "rgba(245,158,11,0.2)"}`,
  color: type === "err" ? "#fca5a5" : type === "ok" ? "#6ee7b7" : "#fcd34d",
  marginBottom: 12,
});