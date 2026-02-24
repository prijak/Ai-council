// pages/HomePage.jsx — compact single-screen layout

const FEATURES = [
  {
    id: "council",
    icon: "⚖",
    title: "Council",
    sub: "Multi-model deliberation",
    color: "#a78bfa",
    desc: "Assemble AI minds across providers. Independent opinions, peer reviews, final verdict.",
  },
  {
    id: "agent",
    icon: "🤝",
    title: "Agent Chat",
    sub: "40+ expert personas",
    color: "#f472b6",
    desc: "CEO, Philosopher, Life Coach, Indian Founder — deep 1-on-1 conversations.",
    badge: "FREE",
  },
  {
    id: "voice",
    icon: "🎙",
    title: "Voice AI",
    sub: "Hindi, Tamil & 10+ langs",
    color: "#c084fc",
    desc: "Speak naturally in your language. AI that gets your accent and context.",
    badge: "🇮🇳 NEW",
  },
  {
    id: "whatsapp",
    icon: "💬",
    title: "WhatsApp",
    sub: "Your AI on WhatsApp",
    color: "#25d366",
    desc: "No new apps. AI persona inside WhatsApp — chat, nudges, habits.",
    badge: "NEW",
  },
  {
    id: "videogen",
    icon: "🎬",
    title: "Video Gen",
    sub: "Lip-synced avatars · HD 720p",
    color: "#c084fc",
    desc: "Turn any portrait into a talking digital avatar. Audio-driven, up to 200 seconds.",
    badge: "NEW",
  },
];

const STATS = [
  { v: "40+", l: "Personas", c: "#f472b6" },
  { v: "10+", l: "Languages", c: "#c084fc" },
  { v: "6+", l: "Providers", c: "#60a5fa" },
  { v: "Free", l: "with login", c: "#34d399" },
];

export function HomePage({ setPage }) {
  return (
    <div style={{ position: "relative", minHeight: "100%" }}>
      {/* Ambient orbs */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "50vw",
            height: "50vw",
            maxWidth: 600,
            maxHeight: 600,
            background:
              "radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 65%)",
            top: "-10%",
            left: "-5%",
            animation: "orb1 20s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "40vw",
            height: "40vw",
            maxWidth: 480,
            maxHeight: 480,
            background:
              "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 65%)",
            top: "10%",
            right: "-5%",
            animation: "orb2 24s ease-in-out infinite",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding:
            "clamp(28px,4vw,52px) clamp(24px,6vw,80px) clamp(24px,4vw,40px)",
        }}
      >
        {/* ── Eyebrow ── */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            borderRadius: 100,
            background: "rgba(249,115,22,0.09)",
            border: "1px solid rgba(249,115,22,0.2)",
            marginBottom: "clamp(16px,2.5vw,24px)",
            animation: "fadeUp 0.4s ease both",
          }}
        >
          <span>🇮🇳</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#fb923c" }}>
            Made in Bharat · Powered by Sarvam AI
          </span>
          <span
            style={{
              fontSize: 10,
              padding: "1px 8px",
              borderRadius: 20,
              background: "rgba(249,115,22,0.18)",
              color: "#f97316",
              fontWeight: 800,
            }}
          >
            🔥 FREE
          </span>
        </div>

        {/* ── Headline ── */}
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(30px, 4.5vw, 58px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "#fff",
            margin: "0 0 clamp(12px,1.5vw,16px)",
            animation: "fadeUp 0.45s 0.07s ease both",
          }}
        >
          Think. Talk.{" "}
          <span
            style={{
              background:
                "linear-gradient(110deg, #f97316 0%, #a78bfa 38%, #60a5fa 65%, #25d366 100%)",
              backgroundSize: "300% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 7s linear infinite",
            }}
          >
            Connect.
          </span>
        </h1>

        {/* ── Subtext ── */}
        <p
          style={{
            fontSize: "clamp(13px,1.4vw,16px)",
            color: "rgba(255,255,255,0.42)",
            lineHeight: 1.6,
            maxWidth: 480,
            margin: "0 0 clamp(18px,2.5vw,28px)",
            animation: "fadeUp 0.45s 0.13s ease both",
          }}
        >
          India's AI platform — multi-model council deliberations, expert
          conversations, voice in your language, WhatsApp integration, and AI
          video generation.
        </p>

        {/* ── CTAs ── */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: "clamp(28px,4vw,44px)",
            animation: "fadeUp 0.45s 0.18s ease both",
          }}
        >
          <button
            onClick={() => setPage("council")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 24px",
              borderRadius: 11,
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 6px 24px rgba(249,115,22,0.35)",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
          >
            ⚖ Start a Council
          </button>
          <button
            onClick={() => setPage("agent")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 24px",
              borderRadius: 11,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.8)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.09)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
            }
          >
            🤝 Try Agent Chat
          </button>
          <button
            onClick={() => setPage("videogen")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 24px",
              borderRadius: 11,
              background: "rgba(192,132,252,0.1)",
              border: "1px solid rgba(192,132,252,0.25)",
              color: "#c4b5fd",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(192,132,252,0.18)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(192,132,252,0.1)";
              e.currentTarget.style.transform = "";
            }}
          >
            🎬 Generate Video
          </button>
        </div>

        {/* ── Feature cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
            gap: 12,
            marginBottom: "clamp(20px,3vw,32px)",
          }}
        >
          {FEATURES.map((f, i) => (
            <button
              key={f.id}
              className="ai-card"
              onClick={() => setPage(f.id)}
              style={{
                padding: "18px 18px 16px",
                borderRadius: 16,
                textAlign: "left",
                cursor: "pointer",
                background: `linear-gradient(145deg, ${f.color}10, ${f.color}04)`,
                border: `1px solid ${f.color}1e`,
                animation: `fadeUp 0.4s ${0.06 + i * 0.07}s ease both`,
                position: "relative",
                overflow: "hidden",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${f.color}55, transparent)`,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: `${f.color}16`,
                    border: `1.5px solid ${f.color}32`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 21,
                  }}
                >
                  {f.icon}
                </div>
                {f.badge && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: `${f.color}18`,
                      border: `1px solid ${f.color}33`,
                      color: f.color,
                      fontWeight: 800,
                    }}
                  >
                    {f.badge}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#fff",
                  marginBottom: 2,
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: f.color,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {f.sub}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: 1.6,
                }}
              >
                {f.desc}
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 11,
                  fontWeight: 700,
                  color: f.color,
                }}
              >
                Explore →
              </div>
            </button>
          ))}
        </div>

        {/* ── Stats strip ── */}
        <div
          style={{
            display: "flex",
            gap: 0,
            padding: "16px 24px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            flexWrap: "wrap",
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.l}
              style={{
                flex: "1 1 80px",
                textAlign: "center",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                padding: "6px 16px",
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: "clamp(18px,2.5vw,26px)",
                  fontWeight: 800,
                  color: s.c,
                  lineHeight: 1,
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.28)",
                  marginTop: 4,
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
