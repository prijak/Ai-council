import { GLOBAL_CSS, NAV_ITEMS } from "./design";
// Assumes: src/components/setup/Shell.jsx
import { UserAvatar, SignInButton } from "../AuthGate";

export function Shell({ page, setPage, onOpenCreator, children }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
        background: "#060609",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* ── Desktop Sidebar ── */}
      <aside
        className="ai-sidebar"
        style={{
          width: 220,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "rgba(5,5,11,0.98)",
          borderRight: "1px solid rgba(255,255,255,0.055)",
          overflow: "visible",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "20px 18px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.045)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flexShrink: 0,
                background: "linear-gradient(135deg,#f97316,#a78bfa,#60a5fa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
                boxShadow: "0 4px 18px rgba(249,115,22,0.25)",
              }}
            >
              ✦
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: -0.3,
                }}
              >
                AI Studio
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(249,115,22,0.55)",
                  fontWeight: 600,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginTop: 1,
                }}
              >
                Bharat · Sarvam AI
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          <div
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.18)",
              letterSpacing: 1.8,
              fontWeight: 700,
              textTransform: "uppercase",
              padding: "0 8px 10px",
            }}
          >
            Platform
          </div>
          {NAV_ITEMS.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                className={`ai-nav-item${active ? " active" : ""}`}
                onClick={() => setPage(item.id)}
                style={{
                  background: active ? `${item.color}11` : undefined,
                  borderLeftColor: active ? item.color : undefined,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    width: 20,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    flex: 1,
                  }}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: 8,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: `${item.color}1a`,
                      border: `1px solid ${item.color}33`,
                      color: item.color,
                      fontWeight: 800,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          style={{
            padding: "12px 10px 16px",
            borderTop: "1px solid rgba(255,255,255,0.045)",
          }}
        >
          <button
            onClick={onOpenCreator}
            className="ai-ghost"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "9px 14px",
              borderRadius: 9,
              background: "rgba(167,139,250,0.07)",
              border: "1px solid rgba(167,139,250,0.15)",
              color: "#c4b5fd",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 10,
              transition: "background 0.15s",
              fontFamily: "inherit",
            }}
          >
            ✨ My Personas
          </button>
          {/* position:relative + bottom anchor so any dropdown opens UPWARD */}
          <div
            className="user-anchor"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
            }}
          >
            <UserAvatar dropUp />
            <SignInButton compact />
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Mobile header */}
        <header
          className="ai-mobile-hdr"
          style={{
            padding: "10px 16px",
            background: "rgba(5,5,11,0.97)",
            borderBottom: "1px solid rgba(255,255,255,0.055)",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "linear-gradient(135deg,#f97316,#a78bfa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              ✦
            </div>
            <span
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 14,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              AI Studio
            </span>
            <span style={{ fontSize: 11 }}>🇮🇳</span>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <button
              onClick={onOpenCreator}
              style={{
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 7,
                border: "1px solid rgba(167,139,250,0.25)",
                background: "rgba(167,139,250,0.08)",
                color: "#c4b5fd",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ✨
            </button>
            <SignInButton compact />
            <UserAvatar />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="ai-mobile-nav"
          style={{
            background: "rgba(4,4,10,0.98)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingBottom: "env(safe-area-inset-bottom,0px)",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  padding: "9px 2px 7px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  fontFamily: "inherit",
                }}
              >
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "20%",
                      right: "20%",
                      height: 2,
                      background: item.color,
                      borderRadius: "0 0 2px 2px",
                    }}
                  />
                )}
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: active ? 700 : 400,
                    color: active ? item.color : "rgba(255,255,255,0.3)",
                    letterSpacing: 0.2,
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
