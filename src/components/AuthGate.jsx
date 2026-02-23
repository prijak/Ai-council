import { useState, useEffect, createContext, useContext } from "react";
import {
  signInWithGoogle,
  signOut,
  onUserChange,
  handleRedirectResult,
  isRedirectPending,
} from "../lib/auth";
import { tokens, buttonStyles } from "../styles";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onSkip, onShowTerms, compact = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      if (
        e.code !== "auth/popup-closed-by-user" &&
        e.code !== "auth/cancelled-popup-request"
      ) {
        setError(e.message);
      }
      setLoading(false);
    }
  };

  const FEATURES = [
    {
      id: "council",
      icon: "⚖",
      title: "Council",
      sub: "Multi-model deliberation",
      color: "#a78bfa",
      desc: "Independent opinions → peer review → final verdict.",
    },
    {
      id: "agent",
      icon: "🤝",
      title: "Agent Chat",
      sub: "40+ expert personas",
      color: "#f472b6",
      desc: "CEO, Philosopher, Life Coach, Indian Founder.",
      badge: "FREE",
    },
    {
      id: "voice",
      icon: "🎙",
      title: "Voice AI",
      sub: "Hindi, Tamil & 10+ langs",
      color: "#c084fc",
      desc: "Speak naturally. AI that gets your accent.",
      badge: "🇮🇳 NEW",
    },
    {
      id: "whatsapp",
      icon: "💬",
      title: "WhatsApp AI",
      sub: "Your AI on WhatsApp",
      color: "#25d366",
      desc: "No new apps. AI persona in the app you use.",
      badge: "NEW",
    },
  ];

  // ── Compact (modal) mode ──────────────────────────────────────────────────
  if (compact) {
    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        {error && (
          <div
            style={{
              padding: "10px 13px",
              borderRadius: 9,
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              color: "#fca5a5",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            ⚠ {error}
          </div>
        )}
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 12,
            border: "none",
            background: loading ? "rgba(255,255,255,0.06)" : "#fff",
            color: loading ? "#888" : "#1a1a2e",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: loading ? "none" : "0 4px 24px rgba(255,255,255,0.1)",
            transition: "transform 0.15s, box-shadow 0.15s",
            marginBottom: 10,
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "scale(1.02)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {loading ? (
            <>
              <SpinRing /> Signing in…
            </>
          ) : (
            <>
              <GoogleLogo /> Continue with Google
            </>
          )}
        </button>
        <button
          onClick={onSkip}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "transparent",
            color: "#4a3f6a",
            cursor: "pointer",
            fontSize: 13,
            transition: "all 0.15s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#c4b5fd";
            e.currentTarget.style.borderColor = "rgba(167,139,250,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#4a3f6a";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
          }}
        >
          🔑 Use my own API keys (no sign-in)
        </button>
        <p
          style={{
            fontSize: 11,
            color: "#2e2a42",
            textAlign: "center",
            lineHeight: 1.7,
            margin: "10px 0 0",
          }}
        >
          By continuing you agree to our{" "}
          <button
            onClick={onShowTerms}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#5a4e8a",
              cursor: "pointer",
              fontSize: 11,
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#5a4e8a")}
          >
            Terms &amp; Conditions
          </button>
        </p>
      </div>
    );
  }

  // ── Full-page login ──────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        background: "#060609",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes slideDown  { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp    { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn     { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeUp     { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer    { 0%{background-position:-300% center} 100%{background-position:300% center} }
        @keyframes orb1       { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(50px,-40px) scale(1.08)} 70%{transform:translate(-25px,20px) scale(0.96)} }
        @keyframes orb2       { 0%,100%{transform:translate(0,0) scale(1)} 35%{transform:translate(-60px,30px) scale(1.06)} 65%{transform:translate(35px,-20px) scale(1.02)} }
        .login-card:hover { transform:translateY(-3px)!important; border-color:var(--card-c)!important; box-shadow:0 16px 48px rgba(0,0,0,0.4)!important; }
        .login-card { transition: all 0.2s cubic-bezier(0.34,1.4,0.64,1)!important; }
        @media(max-width:860px){ .login-split-right{ display:none!important; } .login-split-left{ max-width:100%!important; padding:36px 24px!important; } }
      `}</style>

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
            width: "55vw",
            height: "55vw",
            maxWidth: 640,
            maxHeight: 640,
            background:
              "radial-gradient(circle,rgba(249,115,22,0.08) 0%,transparent 65%)",
            top: "-12%",
            left: "-8%",
            animation: "orb1 22s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "45vw",
            height: "45vw",
            maxWidth: 520,
            maxHeight: 520,
            background:
              "radial-gradient(circle,rgba(167,139,250,0.07) 0%,transparent 65%)",
            bottom: "-10%",
            right: "-6%",
            animation: "orb2 26s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Left — auth panel ── */}
      <div
        className="login-split-left"
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(460px,100%)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "52px 48px",
          minHeight: "100dvh",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(5,5,11,0.85)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Logo — exact match to Shell.jsx sidebar logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 40,
            animation: "fadeUp 0.4s ease both",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              flexShrink: 0,
              background: "linear-gradient(135deg,#f97316,#a78bfa,#60a5fa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 19,
              boxShadow: "0 4px 18px rgba(249,115,22,0.3)",
            }}
          >
            ✦
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 17,
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
                color: "rgba(249,115,22,0.6)",
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

        {/* Headline */}
        <div
          style={{ marginBottom: 28, animation: "fadeUp 0.4s 0.07s ease both" }}
        >
          <h1
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: "clamp(28px,4vw,38px)",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: -0.8,
              lineHeight: 1.1,
              margin: "0 0 10px",
            }}
          >
            Think. Talk.{" "}
            <span
              style={{
                background:
                  "linear-gradient(110deg,#f97316 0%,#a78bfa 40%,#60a5fa 65%,#25d366 100%)",
                backgroundSize: "300% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 7s linear infinite",
              }}
            >
              Connect.
            </span>
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.38)",
              lineHeight: 1.65,
              margin: 0,
              maxWidth: 340,
            }}
          >
            India's AI platform — council deliberations, expert conversations,
            voice in your language, and WhatsApp AI.
          </p>
        </div>

        {/* Made in Bharat pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 12px",
            borderRadius: 100,
            background: "rgba(249,115,22,0.08)",
            border: "1px solid rgba(249,115,22,0.18)",
            marginBottom: 28,
            animation: "fadeUp 0.4s 0.12s ease both",
            alignSelf: "flex-start",
          }}
        >
          <span>🇮🇳</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#fb923c" }}>
            Made in Bharat · Powered by Sarvam AI
          </span>
          <span
            style={{
              fontSize: 9,
              padding: "1px 7px",
              borderRadius: 20,
              background: "rgba(249,115,22,0.18)",
              color: "#f97316",
              fontWeight: 800,
            }}
          >
            FREE
          </span>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "10px 13px",
              borderRadius: 9,
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.22)",
              color: "#fca5a5",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Google sign-in */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: loading ? "rgba(255,255,255,0.06)" : "#fff",
            color: loading ? "#888" : "#1a1a2e",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: loading ? "none" : "0 4px 28px rgba(255,255,255,0.12)",
            transition: "transform 0.15s, box-shadow 0.15s",
            fontFamily: "inherit",
            marginBottom: 10,
            animation: "fadeUp 0.4s 0.16s ease both",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 36px rgba(255,255,255,0.2)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow =
              "0 4px 28px rgba(255,255,255,0.12)";
          }}
        >
          {loading ? (
            <>
              <SpinRing /> Signing in…
            </>
          ) : (
            <>
              <GoogleLogo /> Continue with Google
            </>
          )}
        </button>

        {/* Sign-in perks */}
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 16,
            animation: "fadeUp 0.4s 0.18s ease both",
          }}
        >
          {[
            ["🧠", "#25d366", "WhatsApp AI"],
            ["🎙️", "#c084fc", "Voice Chat"],
            ["🇮🇳", "#f97316", "Sarvam AI"],
            ["🔒", "#a78bfa", "Encrypted"],
          ].map(([icon, color, label]) => (
            <span
              key={label}
              style={{
                fontSize: 10,
                padding: "3px 9px",
                borderRadius: 20,
                background: `${color}12`,
                border: `1px solid ${color}28`,
                color,
              }}
            >
              {icon} {label}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
            animation: "fadeUp 0.4s 0.2s ease both",
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }}
          />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            or explore without signing in
          </span>
          <div
            style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }}
          />
        </div>

        {/* Skip / own keys */}
        <button
          onClick={onSkip}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 11,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "transparent",
            color: "rgba(255,255,255,0.28)",
            cursor: "pointer",
            fontSize: 13,
            transition: "all 0.15s",
            fontFamily: "inherit",
            animation: "fadeUp 0.4s 0.22s ease both",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#c4b5fd";
            e.currentTarget.style.borderColor = "rgba(167,139,250,0.25)";
            e.currentTarget.style.background = "rgba(167,139,250,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.28)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          🔑 Use my own API keys (no sign-in)
        </button>

        {/* Terms */}
        <p
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.14)",
            textAlign: "center",
            lineHeight: 1.7,
            margin: "16px 0 0",
            animation: "fadeUp 0.4s 0.24s ease both",
          }}
        >
          By continuing, you agree to our{" "}
          <button
            onClick={onShowTerms}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "rgba(167,139,250,0.45)",
              cursor: "pointer",
              fontSize: 10,
              textDecoration: "underline",
              textUnderlineOffset: 2,
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(167,139,250,0.45)")
            }
          >
            Terms &amp; Conditions
          </button>
        </p>
      </div>

      {/* ── Right — feature showcase ── */}
      <div
        className="login-split-right"
        style={{
          flex: 1,
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "52px 56px",
        }}
      >
        {/* Section label */}
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: 1.8,
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 18,
            animation: "fadeUp 0.4s 0.1s ease both",
          }}
        >
          Platform
        </div>

        {/* Feature cards — match HomePage.jsx style */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 12,
            marginBottom: 32,
            animation: "fadeUp 0.4s 0.14s ease both",
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.id}
              className="login-card"
              style={{
                "--card-c": f.color,
                padding: "18px 18px 16px",
                borderRadius: 16,
                background: `linear-gradient(145deg,${f.color}10,${f.color}04)`,
                border: `1px solid ${f.color}1e`,
                position: "relative",
                overflow: "hidden",
                animationDelay: `${0.16 + i * 0.06}s`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(90deg,transparent,${f.color}55,transparent)`,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 11,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: `${f.color}16`,
                    border: `1.5px solid ${f.color}32`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
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
                  fontSize: 14,
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
                  marginBottom: 6,
                }}
              >
                {f.sub}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.36)",
                  lineHeight: 1.6,
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Stats strip — match HomePage.jsx */}
        <div
          style={{
            display: "flex",
            gap: 0,
            padding: "14px 20px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            animation: "fadeUp 0.4s 0.42s ease both",
          }}
        >
          {[
            { v: "40+", l: "Personas", c: "#f472b6" },
            { v: "10+", l: "Languages", c: "#c084fc" },
            { v: "6+", l: "Providers", c: "#60a5fa" },
            { v: "Free", l: "with login", c: "#34d399" },
          ].map((s, i) => (
            <div
              key={s.l}
              style={{
                flex: "1 1 80px",
                textAlign: "center",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                padding: "4px 12px",
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 22,
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
                  color: "rgba(255,255,255,0.26)",
                  marginTop: 4,
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "fadeUp 0.4s 0.48s ease both",
          }}
        >
          <span style={{ fontSize: 14 }}>🇮🇳</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>
            Built with ❤️ in
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              background:
                "linear-gradient(90deg,#f97316 0%,#fff 50%,#138808 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Bharat
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              color: "rgba(255,255,255,0.12)",
            }}
          >
            Proudly using Sarvam AI 🚀
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Shared SVG / Spinner ──────────────────────────────────────────────────────
function GoogleLogo({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={{ flexShrink: 0 }}
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function SpinRing() {
  return (
    <span
      style={{
        width: 18,
        height: 18,
        border: "2px solid rgba(255,255,255,0.2)",
        borderTop: "2px solid #a78bfa",
        borderRadius: "50%",
        animation: "spin 0.65s linear infinite",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

// ── TermsModal ────────────────────────────────────────────────────────────────
function TermsModal({ onClose }) {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      body: `By accessing or using AI Council ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service. These terms apply to all users, whether accessing via a browser, installed PWA, or API integrations.`,
    },
    {
      title: "2. Description of Service",
      body: `AI Council is a multi-model AI deliberation tool that allows users to pose questions to multiple large language models (LLMs) simultaneously — including models from Ollama, OpenAI, Anthropic, Groq, Google, and others — and receive structured, synthesized responses.`,
    },
    {
      title: "3. AI-Generated Content Disclaimer",
      body: `All responses generated through AI Council are produced by third-party AI models and are provided for informational purposes only. AI-generated content:\n\n• May be inaccurate, incomplete, outdated, or misleading\n• Does not constitute professional advice of any kind\n• Should not be relied upon as a substitute for qualified professional consultation\n• May reflect biases present in the underlying model's training data\n\nYou assume full responsibility for how you interpret and act on AI-generated content.`,
    },
    {
      title: "4. User Responsibilities",
      body: `You agree to use the Service only for lawful purposes. You must not use the Service to:\n\n• Generate content that is illegal, harmful, defamatory, obscene, or harassing\n• Attempt to extract training data or circumvent safety measures\n• Violate the terms of any underlying AI provider\n• Impersonate any person or entity\n• Transmit malware or spam`,
    },
    {
      title: "5. API Keys & Credentials",
      body: `When using your own API keys, you are solely responsible for their security and any charges incurred. AI Council does not store your API keys on its servers. Keys are held in browser memory only for the session duration.`,
    },
    {
      title: "6. Hosted Models & Authentication",
      body: `Certain hosted models are available only to authenticated users. Access is subject to fair use limits and may be modified or withdrawn at any time. Abuse may result in account suspension.`,
    },
    {
      title: "7. Data & Privacy",
      body: `Queries you submit are sent to the respective AI providers according to their own privacy policies. We do not sell your personal data. When signed in with Google, your account info is used solely for authentication and to sync saved configurations.`,
    },
    {
      title: "8. Intellectual Property",
      body: `The AI Council application, its design, and branding are the intellectual property of the Service operator. AI-generated outputs are governed by the terms of the respective AI providers.`,
    },
    {
      title: "9. Third-Party Services",
      body: `AI Council integrates with Firebase, OpenAI, Anthropic, Groq, Google AI and others. Your use is additionally subject to each provider's terms. AI Council is not responsible for the availability or conduct of these services.`,
    },
    {
      title: "10. Limitation of Liability",
      body: `To the maximum extent permitted by law, AI Council and its operators shall not be liable for any indirect, incidental, or consequential damages. The Service is provided "as is" without warranties of any kind.`,
    },
    {
      title: "11. Modifications",
      body: `We reserve the right to modify or discontinue the Service at any time. Continued use after changes constitutes acceptance of the revised Terms.`,
    },
    {
      title: "12. Governing Law",
      body: `These Terms shall be governed by applicable laws. Disputes shall be subject to the exclusive jurisdiction of the relevant courts.`,
    },
    {
      title: "13. Contact",
      body: `For questions, contact us through the project's GitHub repository or the contact information listed on the application's website.`,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "min(680px, 95vw)",
          height: "min(82vh, 700px)",
          background: "linear-gradient(160deg,#0e0e1a,#080810)",
          border: "1px solid rgba(167,139,250,0.25)",
          borderRadius: 18,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 120px rgba(0,0,0,0.8)",
          overflow: "hidden",
          animation: "slideDown 0.2s ease",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: -0.3,
              }}
            >
              Terms &amp; Conditions
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(167,139,250,0.6)",
                marginTop: 2,
                letterSpacing: 0.5,
              }}
            >
              AI COUNCIL · LAST UPDATED FEBRUARY 2026
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(248,113,113,0.4)";
              e.currentTarget.style.color = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "rgba(167,139,250,0.7)",
              lineHeight: 1.7,
              margin: 0,
              padding: "12px 16px",
              background: "rgba(167,139,250,0.06)",
              borderRadius: 10,
              border: "1px solid rgba(167,139,250,0.15)",
            }}
          >
            Please read these Terms carefully before using AI Council. By using
            this service, you agree to be bound by these terms.
          </p>
          {sections.map((s) => (
            <div key={s.title}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#c4b5fd",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 3,
                    height: 14,
                    borderRadius: 2,
                    background: "#a78bfa",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {s.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-line",
                }}
              >
                {s.body}
              </div>
            </div>
          ))}
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              textAlign: "center",
              paddingTop: 8,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            These terms are subject to change. Continued use constitutes
            acceptance.
          </div>
        </div>
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 24px",
              borderRadius: 9,
              border: "none",
              background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

// ── UserAvatar ────────────────────────────────────────────────────────────────
export function UserAvatar({ dropUp = false }) {
  const { user, isAnonymous } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user || isAnonymous) return null;

  const firstName = user.displayName?.split(" ")[0] ?? "there";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={user.displayName ?? user.email}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(167,139,250,0.07)",
          border: `1px solid ${open ? "rgba(167,139,250,0.4)" : "rgba(167,139,250,0.18)"}`,
          borderRadius: 20,
          padding: "3px 10px 3px 4px",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)")
        }
        onMouseLeave={(e) => {
          if (!open)
            e.currentTarget.style.borderColor = "rgba(167,139,250,0.18)";
        }}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            referrerPolicy="no-referrer"
            alt=""
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "1.5px solid rgba(167,139,250,0.4)",
            }}
          />
        ) : (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {user.displayName?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#c4b5fd",
            maxWidth: 90,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {firstName}
        </span>
        <span
          style={{
            fontSize: 9,
            color: "rgba(196,181,253,0.5)",
            marginLeft: -2,
          }}
        >
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
          />
          <div
            style={{
              position: "absolute",
              ...(dropUp
                ? {
                    bottom: "calc(100% + 8px)",
                    top: "auto",
                    left: 0,
                    right: "auto",
                  }
                : {
                    top: "calc(100% + 8px)",
                    bottom: "auto",
                    right: 0,
                    left: "auto",
                  }),
              width: 220,
              zIndex: 50,
              background: "#0e0e1a",
              border: "1px solid rgba(167,139,250,0.25)",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
              overflow: "hidden",
              animation: "slideUp 0.15s ease",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  referrerPolicy="no-referrer"
                  alt=""
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(167,139,250,0.4)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {user.displayName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.displayName ?? "User"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </div>
              </div>
            </div>
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "#60a5fa",
                  background: "rgba(96,165,250,0.08)",
                  border: "1px solid rgba(96,165,250,0.2)",
                  borderRadius: 4,
                  padding: "2px 7px",
                }}
              >
                ☁ Cloud configs
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "#34d399",
                  background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: 4,
                  padding: "2px 7px",
                }}
              >
                🔒 Encrypted
              </span>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              style={{
                width: "100%",
                padding: "11px 16px",
                border: "none",
                background: "transparent",
                color: "rgba(248,113,113,0.8)",
                cursor: "pointer",
                fontSize: 13,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(248,113,113,0.06)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span>→</span> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── SignInButton — shown to anonymous users anywhere in the app ───────────────
export function SignInButton() {
  const { user, isAnonymous } = useContext(AuthCtx);
  const [loading, setLoading] = useState(false);

  if (!isAnonymous || (user && !isAnonymous)) return null;

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // On localhost: page redirects away. On prod: component unmounts on success.
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 13px",
        borderRadius: 9,
        border: "1px solid rgba(167,139,250,0.35)",
        background: loading
          ? "rgba(167,139,250,0.05)"
          : "rgba(167,139,250,0.1)",
        color: loading ? "rgba(196,181,253,0.5)" : "#c4b5fd",
        cursor: loading ? "wait" : "pointer",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.background = "rgba(167,139,250,0.18)";
          e.currentTarget.style.borderColor = "rgba(167,139,250,0.6)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(167,139,250,0.1)";
        e.currentTarget.style.borderColor = "rgba(167,139,250,0.35)";
      }}
    >
      {loading ? (
        <>
          <SpinRing /> Signing in…
        </>
      ) : (
        <>
          <GoogleLogo size={14} /> Sign in
        </>
      )}
    </button>
  );
}

// ── AuthGate ──────────────────────────────────────────────────────────────────
export function AuthGate({ children }) {
  /**
   * user state machine:
   *   undefined  →  still resolving (spinner shown)
   *   null       →  resolved, no logged-in user (LoginScreen shown)
   *   object     →  resolved, user logged in (app shown)
   *
   * THE BUG THAT WAS HERE:
   *   useState(isRedirectPending() ? undefined : undefined)
   *   Both branches returned `undefined` → spinner never cleared → app stuck forever.
   *
   * THE FIX:
   *   useState(isRedirectPending() ? undefined : null)
   *   When no redirect is pending, start as `null` (resolved, no user).
   *   The onUserChange listener will update to the real user if one is already
   *   logged in via a persisted Firebase session.
   */
  const [user, setUser] = useState(isRedirectPending() ? undefined : null);
  const [isAnonymous, setAnon] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [redirectDone, setRedirectDone] = useState(!isRedirectPending());
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    /**
     * handleRedirectResult() MUST be called on every page load.
     * It is the function that actually exchanges the Google OAuth token for a
     * Firebase session. Without calling it, getRedirectResult is never invoked
     * and the user is never logged in — even if they completed the Google flow.
     *
     * When there was no redirect (normal page load), it resolves immediately
     * with null and has no side effects.
     */
    handleRedirectResult().then(() => setRedirectDone(true));

    /**
     * onUserChange (onAuthStateChanged) fires:
     *  1. Immediately on mount with current auth state (logged-in user or null)
     *  2. After handleRedirectResult completes and signs in a new user
     *  3. After signOut()
     *
     * This covers all cases: persisted sessions, fresh redirects, sign-outs.
     */
    const unsub = onUserChange((firebaseUser) => {
      setUser(firebaseUser ?? null);
      if (firebaseUser) setAnon(false);
    });

    return unsub;
  }, []);

  // Keep spinner up while redirect is being processed OR user state is unknown
  if (user === undefined || !redirectDone) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "#050508",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid rgba(167,139,250,0.2)",
            borderTop: "3px solid #a78bfa",
            animation: "spin 0.65s linear infinite",
          }}
        />
      </div>
    );
  }

  const openLogin = () => setShowLoginModal(true);

  return (
    <AuthCtx.Provider value={{ user, isAnonymous, openLogin }}>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      {/* Login modal — shown when a gated feature is clicked while anonymous */}
      {showLoginModal && !user && (
        <div
          onClick={(e) =>
            e.target === e.currentTarget && setShowLoginModal(false)
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.82)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            animation: "fadeIn 0.18s ease",
          }}
        >
          <div
            style={{
              width: "min(460px, 100%)",
              background: "linear-gradient(160deg,#0d0d1c,#07070f)",
              border: "1px solid rgba(167,139,250,0.25)",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 40px 120px rgba(0,0,0,0.9)",
              animation: "slideDown 0.2s ease",
              position: "relative",
            }}
          >
            {/* close X */}
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                zIndex: 10,
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
            <div style={{ padding: "28px 24px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔐</div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#fff",
                  marginBottom: 6,
                }}
              >
                Sign in to unlock this feature
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "#6b5f8a",
                  lineHeight: 1.6,
                  marginBottom: 20,
                }}
              >
                Voice chat, WhatsApp assistant & persona chat require a free
                account — no API key needed.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                {[
                  ["🧠", "#25d366", "WhatsApp AI"],
                  ["🎙️", "#f472b6", "Voice Chat"],
                  ["🎭", "#60a5fa", "Agent Chat"],
                  ["🇮🇳", "#f97316", "Sarvam AI"],
                ].map(([icon, color, label]) => (
                  <span
                    key={label}
                    style={{
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: `${color}14`,
                      border: `1px solid ${color}30`,
                      color,
                    }}
                  >
                    {icon} {label}
                  </span>
                ))}
              </div>
              <LoginScreen
                onSkip={() => {
                  setShowLoginModal(false);
                  if (isAnonymous) {
                  } else setAnon(true);
                }}
                onShowTerms={() => {
                  setShowLoginModal(false);
                  setShowTerms(true);
                }}
                compact
              />
            </div>
          </div>
        </div>
      )}

      {user || isAnonymous ? (
        children
      ) : (
        <LoginScreen
          onSkip={() => setAnon(true)}
          onShowTerms={() => setShowTerms(true)}
        />
      )}
    </AuthCtx.Provider>
  );
}
