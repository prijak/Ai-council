import { useState, useEffect } from "react";
import { tokens, buttonStyles } from "../styles";

/**
 * InstallPrompt
 * Drop this once into App.jsx — it manages its own visibility.
 * - Chrome/Edge/Android: shows a native install button
 * - iOS Safari: shows Share → Add to Home Screen instructions
 * - Already installed (standalone): never shows
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already running as installed PWA — don't show
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't nag again this session
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return;

    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) && !("MSStream" in window);

    if (ios) {
      // Show iOS manual instructions after a short delay
      const t = setTimeout(() => { setIsIOS(true); setShow(true); }, 3000);
      return () => clearTimeout(t);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "max(16px, env(safe-area-inset-bottom, 16px))",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(400px, calc(100vw - 32px))",
        background: "linear-gradient(160deg,#13132a,#0e0e1e)",
        border: "1px solid rgba(167,139,250,0.35)",
        borderRadius: 14,
        padding: "14px 16px",
        zIndex: 200,
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        gap: 13,
        animation: "slideDown 0.25s ease",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        ⚖
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>
          Install AI Council
        </div>
        {isIOS ? (
          <div style={{ fontSize: 11, color: tokens.textMuted, lineHeight: 1.5 }}>
            Tap <strong style={{ color: "#60a5fa" }}>Share</strong> →{" "}
            <strong style={{ color: "#60a5fa" }}>Add to Home Screen</strong>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: tokens.textMuted, lineHeight: 1.5 }}>
            Add to home screen — loads faster, works offline
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {!isIOS && (
          <button
            onClick={install}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          style={{
            ...buttonStyles.iconSquare,
            width: 30,
            height: 30,
            color: tokens.textMuted,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
