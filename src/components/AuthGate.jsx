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
function LoginScreen({ onSkip, onShowTerms }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // On localhost: page navigates away immediately, nothing below runs.
      // On production: popup resolves, onUserChange fires, component unmounts.
    } catch (e) {
      // Only show error for real failures, not user-closed-popup
      if (
        e.code !== "auth/popup-closed-by-user" &&
        e.code !== "auth/cancelled-popup-request"
      ) {
        setError(e.message);
      }
      setLoading(false); // only reset on error / cancelled
    }
  };

  const features = [
    {
      icon: "🇮🇳",
      label: "Sarvam AI",
      sub: "India's own LLM — built with pride",
      color: "#f97316",
      glow: "rgba(249,115,22,0.3)",
    },
    {
      icon: "🦙",
      label: "Hosted Ollama",
      sub: "Open-source models, zero setup",
      color: "#34d399",
      glow: "rgba(52,211,153,0.3)",
    },
    {
      icon: "⚖",
      label: "3-Stage Deliberation",
      sub: "Opinion → Peer review → Verdict",
      color: "#a78bfa",
      glow: "rgba(167,139,250,0.3)",
    },
    {
      icon: "◈",
      label: "Multi-Provider",
      sub: "OpenAI, Anthropic, Groq, Google",
      color: "#60a5fa",
      glow: "rgba(96,165,250,0.3)",
    },
    {
      icon: "🔗",
      label: "Follow-ups",
      sub: "Chain questions with full context",
      color: "#f59e0b",
      glow: "rgba(245,158,11,0.3)",
    },
    {
      icon: "📤",
      label: "Export",
      sub: "Markdown, PDF, Webhook",
      color: "#f472b6",
      glow: "rgba(244,114,182,0.3)",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(ellipse at 20% 10%, rgba(249,115,22,0.12) 0%, transparent 40%), radial-gradient(ellipse at 80% 80%, rgba(167,139,250,0.15) 0%, transparent 45%), radial-gradient(ellipse at 60% 30%, rgba(96,165,250,0.08) 0%, transparent 40%), #050508",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* Floating ambient orbs */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "12%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(249,115,22,0.07), transparent 70%)",
            animation: "loginPulse 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            right: "8%",
            width: 260,
            height: 260,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(167,139,250,0.07), transparent 70%)",
            animation: "loginPulse 8s ease-in-out infinite 2s",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "45%",
            right: "18%",
            width: 130,
            height: 130,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(96,165,250,0.06), transparent 70%)",
            animation: "loginPulse 5s ease-in-out infinite 1s",
          }}
        />
      </div>

      <style>{`
        @keyframes loginPulse   { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.15);opacity:1} }
        @keyframes loginFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes loginShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes spin         { to{transform:rotate(360deg)} }
        @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
        @keyframes slideDown    { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(500px, 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: "center", animation: "slideDown 0.5s ease" }}>
          <div
            style={{
              position: "relative",
              display: "inline-block",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 24,
                background:
                  "linear-gradient(135deg, #f97316 0%, #a78bfa 55%, #60a5fa 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                margin: "0 auto",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.1), 0 24px 64px rgba(167,139,250,0.35), 0 0 80px rgba(249,115,22,0.2)",
                animation: "loginFloat 4s ease-in-out infinite",
              }}
            >
              ⚖
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -8,
                right: -12,
                fontSize: 24,
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.6))",
              }}
            >
              🇮🇳
            </div>
          </div>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: -2,
              margin: "0 0 6px",
              lineHeight: 1,
            }}
          >
            AI Council
          </h1>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 3.5,
              background:
                "linear-gradient(90deg, #f97316, #a78bfa, #60a5fa, #f97316)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "loginShimmer 4s linear infinite",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            Multi-Model Deliberation
          </div>
          <p
            style={{
              color: "#7a6f9a",
              fontSize: 14,
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 360,
              marginInline: "auto",
            }}
          >
            Assemble a council of AI minds. They debate, challenge each other,
            and synthesize the truth — powered partly by{" "}
            <strong style={{ color: "#fb923c" }}>India's own Sarvam AI</strong>.
          </p>
        </div>

        {/* Sarvam spotlight banner */}
        <div
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 16,
            background:
              "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.04))",
            border: "1px solid rgba(249,115,22,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            animation: "slideDown 0.55s ease 0.05s both",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 13,
              flexShrink: 0,
              background:
                "linear-gradient(135deg, rgba(249,115,22,0.22), rgba(249,115,22,0.08))",
              border: "1px solid rgba(249,115,22,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            🇮🇳
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 3,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fb923c" }}>
                Powered by Sarvam AI
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 8px",
                  borderRadius: 20,
                  background: "rgba(249,115,22,0.15)",
                  border: "1px solid rgba(249,115,22,0.35)",
                  color: "#f97316",
                  fontWeight: 700,
                }}
              >
                🔥 NEW
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "rgba(249,115,22,0.6)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              India's own large language model — built with ❤️ in Bharat. Sign
              in to use it free, no API key needed.
            </p>
          </div>
        </div>

        {/* Feature grid */}
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            animation: "slideDown 0.55s ease 0.1s both",
          }}
        >
          {features.map((f, i) => (
            <div
              key={f.label}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                padding: "12px 12px 10px",
                borderRadius: 12,
                background:
                  hoveredFeature === i
                    ? `${f.color}12`
                    : "rgba(255,255,255,0.025)",
                border: `1px solid ${hoveredFeature === i ? f.color + "55" : "rgba(255,255,255,0.07)"}`,
                transition: "all 0.18s",
                cursor: "default",
                boxShadow: hoveredFeature === i ? `0 0 20px ${f.glow}` : "none",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 5 }}>{f.icon}</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: hoveredFeature === i ? f.color : "#b8a9e8",
                  marginBottom: 2,
                  transition: "color 0.18s",
                  lineHeight: 1.3,
                }}
              >
                {f.label}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.28)",
                  lineHeight: 1.35,
                }}
              >
                {f.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Auth card */}
        <div
          style={{
            width: "100%",
            padding: "22px",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.09)",
            background: "rgba(255,255,255,0.025)",
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            animation: "slideDown 0.55s ease 0.15s both",
          }}
        >
          {error && (
            <div
              style={{
                padding: "10px 13px",
                borderRadius: 9,
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.25)",
                color: "#fca5a5",
                fontSize: 13,
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
              transition: "transform 0.15s, box-shadow 0.15s",
              boxShadow: loading ? "none" : "0 4px 24px rgba(255,255,255,0.1)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 6px 32px rgba(255,255,255,0.18)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 24px rgba(255,255,255,0.1)";
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {[
              ["🇮🇳", "#f97316", "Sarvam AI"],
              ["🦙", "#34d399", "Hosted Ollama"],
              ["☁", "#60a5fa", "Cloud configs"],
              ["🔒", "#a78bfa", "Encrypted keys"],
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

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,0.06)",
              }}
            />
            <span style={{ fontSize: 11, color: "#383058" }}>
              or explore without signing in
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,0.06)",
              }}
            />
          </div>

          <button
            onClick={onSkip}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent",
              color: "#524870",
              cursor: "pointer",
              fontSize: 13,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#c4b5fd";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)";
              e.currentTarget.style.background = "rgba(167,139,250,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#524870";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.background = "transparent";
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
              margin: 0,
            }}
          >
            Your API keys are never stored on our servers. By continuing, you
            agree to our{" "}
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

        {/* Made in India footer */}
        <div
          style={{
            textAlign: "center",
            paddingBottom: 8,
            animation: "slideDown 0.55s ease 0.2s both",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 24,
              background: "rgba(249,115,22,0.06)",
              border: "1px solid rgba(249,115,22,0.15)",
            }}
          >
            <span style={{ fontSize: 16 }}>🇮🇳</span>
            <span style={{ fontSize: 12, color: "#7a6a50" }}>Built with</span>
            <span style={{ fontSize: 14 }}>❤️</span>
            <span style={{ fontSize: 12, color: "#7a6a50" }}>in</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                background:
                  "linear-gradient(90deg, #f97316 0%, #ffffff 50%, #138808 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Bharat
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#2a2035", marginTop: 8 }}>
            Proudly using Sarvam AI — India's own LLM 🚀
          </div>
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
export function UserAvatar() {
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
              top: "calc(100% + 8px)",
              right: 0,
              width: 220,
              zIndex: 50,
              background: "#0e0e1a",
              border: "1px solid rgba(167,139,250,0.25)",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
              overflow: "hidden",
              animation: "slideDown 0.15s ease",
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

  return (
    <AuthCtx.Provider value={{ user, isAnonymous }}>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
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
