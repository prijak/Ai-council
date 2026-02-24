// VideoGenPage.jsx — SkyReels V3 Digital Avatar Video Generator
// Proxies all API calls through your own server (server key used by default).
// Assumes: src/components/setup/pages/VideoGenPage.jsx
// NOTE: Adjust import paths to match your project structure.

import { useState, useRef, useCallback } from "react";
import { useAuth, SignInButton } from "../../AuthGate";
import { PageHeader } from "../PageHeader";
import { alertBox, ghostBtn } from "../design";

// ─── API helpers (calls YOUR server, not SkyReels directly) ──────────────────
const SERVER_BASE = import.meta.env.VITE_SERVER_URL ?? "backendurl";

async function serverPost(path, body, firebaseToken, userSkyKey) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${firebaseToken}`,
  };
  if (userSkyKey) headers["x-skycoding-key"] = userSkyKey;

  const res = await fetch(`${SERVER_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
  return data;
}

async function serverGet(path, firebaseToken, userSkyKey) {
  const headers = { Authorization: `Bearer ${firebaseToken}` };
  if (userSkyKey) headers["x-skycoding-key"] = userSkyKey;

  const res = await fetch(`${SERVER_BASE}${path}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
  return data;
}

// ─── ImageDropZone ────────────────────────────────────────────────────────────
function ImageDropZone({ imageUrl, onImageUrl, onClear }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [converting, setConverting] = useState(false);

  const toDataUrl = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = (e) => res(e.target.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setConverting(true);
    try {
      onImageUrl(await toDataUrl(file));
    } finally {
      setConverting(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const onPaste = useCallback(async (e) => {
    const items = e.clipboardData?.items ?? [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        handleFile(item.getAsFile());
        return;
      }
    }
  }, []);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          value={imageUrl?.startsWith("data:") ? "" : (imageUrl ?? "")}
          onChange={(e) => onImageUrl(e.target.value)}
          onPaste={onPaste}
          placeholder="Paste image URL or clipboard image"
          style={{
            flex: 1,
            padding: "10px 13px",
            borderRadius: 9,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "#fff",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 14px",
            borderRadius: 9,
            cursor: "pointer",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          ⬆ Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {imageUrl ? (
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={imageUrl}
            alt="First frame"
            style={{
              width: 110,
              height: 110,
              objectFit: "cover",
              borderRadius: 11,
              border: "1.5px solid rgba(192,132,252,0.25)",
            }}
          />
          <button
            onClick={onClear}
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.75)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              fontSize: 11,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            padding: "22px",
            borderRadius: 11,
            cursor: "pointer",
            textAlign: "center",
            border: `1.5px dashed ${dragging ? "rgba(192,132,252,0.55)" : "rgba(255,255,255,0.1)"}`,
            background: dragging
              ? "rgba(192,132,252,0.06)"
              : "rgba(255,255,255,0.02)",
            transition: "all 0.15s",
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 6 }}>🖼</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
            {converting
              ? "Converting…"
              : "Drag & drop, paste, or click to upload"}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AudioInput ───────────────────────────────────────────────────────────────
function AudioInput({ audioUrl, onAudioUrl, onClear }) {
  const fileRef = useRef();
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("audio/")) return;
    const r = new FileReader();
    r.onload = (e) => onAudioUrl(e.target.result);
    r.readAsDataURL(file);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: audioUrl ? 10 : 0 }}>
        <input
          value={audioUrl?.startsWith("data:") ? "" : (audioUrl ?? "")}
          onChange={(e) => onAudioUrl(e.target.value)}
          placeholder="Enter audio URL (https://...) or upload a file"
          style={{
            flex: 1,
            padding: "10px 13px",
            borderRadius: 9,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(192,132,252,0.22)",
            color: "#fff",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 14px",
            borderRadius: 9,
            cursor: "pointer",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          ⬆ Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {audioUrl && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(192,132,252,0.06)",
            border: "1px solid rgba(192,132,252,0.14)",
          }}
        >
          <button
            onClick={togglePlay}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              flexShrink: 0,
              background: "rgba(192,132,252,0.2)",
              border: "1.5px solid rgba(192,132,252,0.4)",
              color: "#c084fc",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setPlaying(false)}
            style={{ display: "none" }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 4,
              }}
            >
              {audioUrl.startsWith("data:")
                ? "Local file — will be uploaded when you Generate"
                : "Audio ready"}
            </div>
            <div
              style={{
                height: 3,
                borderRadius: 2,
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  width: playing ? "40%" : "0%",
                  height: "100%",
                  background: "#c084fc",
                  borderRadius: 2,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
          <button
            onClick={onClear}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              flexShrink: 0,
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.2)",
              color: "#f87171",
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    idle: {
      label: "Ready",
      color: "rgba(255,255,255,0.25)",
      bg: "rgba(255,255,255,0.05)",
    },
    uploading: {
      label: "Uploading audio…",
      color: "#fb923c",
      bg: "rgba(251,146,60,0.1)",
    },
    submitting: {
      label: "Submitting…",
      color: "#c084fc",
      bg: "rgba(192,132,252,0.1)",
    },
    processing: {
      label: "Generating…",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.1)",
    },
    success: {
      label: "Complete ✓",
      color: "#34d399",
      bg: "rgba(52,211,153,0.1)",
    },
    error: { label: "Error", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  };
  const s = map[status] || map.idle;
  return (
    <span
      style={{
        fontSize: 10,
        padding: "3px 10px",
        borderRadius: 20,
        fontWeight: 700,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.color}33`,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {(status === "processing" || status === "uploading") && (
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: s.color,
            animation: "pulseRing 1.4s ease-in-out infinite",
          }}
        />
      )}
      {s.label}
    </span>
  );
}

// ─── HistoryItem ──────────────────────────────────────────────────────────────
function HistoryItem({ job, onPlay }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          flexShrink: 0,
          background: "rgba(192,132,252,0.08)",
          border: "1px solid rgba(192,132,252,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        🎬
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.6)",
            fontWeight: 600,
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {job.prompt}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>
          {job.completedAt
            ? new Date(job.completedAt).toLocaleDateString()
            : ""}
          {job.cost != null && (
            <span style={{ marginLeft: 8, color: "rgba(52,211,153,0.5)" }}>
              ${job.cost.toFixed(4)}
            </span>
          )}
          {job.keySource === "user" && (
            <span style={{ marginLeft: 8, color: "rgba(192,132,252,0.4)" }}>
              own key
            </span>
          )}
        </div>
      </div>
      {job.videoUrl && (
        <button
          onClick={() => onPlay(job.videoUrl)}
          style={{
            padding: "5px 10px",
            borderRadius: 7,
            cursor: "pointer",
            fontSize: 10,
            fontWeight: 700,
            background: "rgba(192,132,252,0.1)",
            border: "1px solid rgba(192,132,252,0.22)",
            color: "#c084fc",
            fontFamily: "inherit",
            flexShrink: 0,
          }}
        >
          ▶ Play
        </button>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Page
// ═════════════════════════════════════════════════════════════════════════════
const EXAMPLE_PROMPT =
  "The person speaks affectionately to the camera. Use a static shot.";

export function VideoGenPage() {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!(user && !isAnonymous);

  // Form
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  // Own-key panel (collapsed by default — server key is free default)
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [userSkyKey, setUserSkyKey] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);

  // Generation
  const [genStatus, setGenStatus] = useState("idle");
  const [requestId, setRequestId] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [cost, setCost] = useState(null);
  const [keySource, setKeySource] = useState(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const pollRef = useRef(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [playingUrl, setPlayingUrl] = useState(null);

  // Rate limit cooldown
  const [retryCooldown, setRetryCooldown] = useState(false);

  const canGenerate =
    prompt.trim() &&
    imageUrl.trim() &&
    audioUrl.trim() &&
    !retryCooldown &&
    genStatus !== "uploading" &&
    genStatus !== "submitting" &&
    genStatus !== "processing";

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const getToken = async () => {
    if (user?.getIdToken) return await user.getIdToken();
    throw new Error("Not authenticated");
  };

  // ── Load history ──────────────────────────────────────────────────────────
  const loadHistory = async () => {
    if (historyLoaded) {
      setShowHistory(true);
      return;
    }
    try {
      const token = await getToken();
      const data = await serverGet(
        "/api/videogen/history",
        token,
        userSkyKey || null,
      );
      setHistory(data.jobs ?? []);
      setHistLoaded(true);
    } catch (e) {
      console.error("History:", e.message);
    }
    setShowHistory(true);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!canGenerate) return;
    setError("");
    setVideoUrl(null);
    setCost(null);
    setKeySource(null);
    startTimer();

    try {
      const token = await getToken();
      const ownKey = userSkyKey.trim() || null;

      // Step 1: If audio is a local base64 data URL, upload it to the server
      // first to get a public HTTPS URL. SkyReels cannot fetch data: URIs.
      let resolvedAudioUrl = audioUrl;
      if (audioUrl.startsWith("data:")) {
        setGenStatus("uploading");
        const { url } = await serverPost(
          "/api/videogen/upload-audio",
          { dataUrl: audioUrl },
          token,
          ownKey,
        );
        resolvedAudioUrl = url;
      }

      // Step 2: Submit job to SkyReels via server
      setGenStatus("submitting");
      const { requestId: rid, keySource: ks } = await serverPost(
        "/api/videogen/submit",
        { prompt, first_frame_image: imageUrl, audio_url: resolvedAudioUrl },
        token,
        ownKey,
      );
      setRequestId(rid);
      setKeySource(ks);
      setGenStatus("processing");

      // Step 3: Poll for status every 10s (avoid rate limiting)
      pollRef.current = setInterval(async () => {
        try {
          const data = await serverGet(
            `/api/videogen/${rid}/status`,
            token,
            ownKey,
          );
          const { status } = data;

          if (status === "success") {
            clearInterval(pollRef.current);
            stopTimer();
            const { videoUrl: vUrl, cost: c } = await serverGet(
              `/api/videogen/${rid}/result`,
              token,
              ownKey,
            );
            setVideoUrl(vUrl);
            setCost(c);
            setGenStatus("success");
            setHistLoaded(false);
          } else if (status === "error" || status === "failed") {
            clearInterval(pollRef.current);
            stopTimer();
            const reason = data.errorMsg
              ? `SkyReels error: ${data.errorMsg}`
              : "Video generation failed on the SkyReels server.";
            setError(reason);
            setGenStatus("error");
          }
        } catch (err) {
          clearInterval(pollRef.current);
          stopTimer();
          setError(err.message);
          setGenStatus("error");
        }
      }, 10000);
    } catch (e) {
      stopTimer();
      const isRateLimit =
        e.message.includes("429") || e.message.toLowerCase().includes("rate");
      setError(
        isRateLimit
          ? "SkyReels is rate limited — please wait 15 seconds before trying again."
          : e.message,
      );
      setGenStatus("error");
      if (isRateLimit) {
        setRetryCooldown(true);
        setTimeout(() => setRetryCooldown(false), 15000);
      }
    }
  };

  const handleReset = () => {
    clearInterval(pollRef.current);
    stopTimer();
    setGenStatus("idle");
    setVideoUrl(null);
    setRequestId(null);
    setCost(null);
    setError("");
    setElapsed(0);
    setPrompt(EXAMPLE_PROMPT);
    setImageUrl("");
    setAudioUrl("");
  };

  // ── Login gate ────────────────────────────────────────────────────────────
  if (!isLoggedIn)
    return (
      <div
        style={{
          animation: "pageIn 0.28s ease",
          padding: "clamp(40px,6vw,72px) clamp(20px,5vw,72px)",
        }}
      >
        <div
          style={{
            maxWidth: 540,
            margin: "0 auto",
            padding: "52px 40px",
            textAlign: "center",
            borderRadius: 24,
            border: "1px solid rgba(192,132,252,0.2)",
            background:
              "linear-gradient(145deg,rgba(192,132,252,0.07),rgba(167,139,250,0.02))",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 18 }}>🎬</div>
          <h2
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: "clamp(22px,3vw,30px)",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 10,
            }}
          >
            Sign in to generate videos
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.38)",
              lineHeight: 1.7,
              marginBottom: 28,
            }}
          >
            Create lip-synced digital avatar videos powered by SkyReels V3 — HD
            720p, audio-driven, up to 200 seconds. Free with your account.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 26,
            }}
          >
            {[
              "🎙 Lip-sync",
              "🖼 Any portrait",
              "🎵 Custom audio",
              "📹 HD 720p",
              "⚡ Free with login",
            ].map((t) => (
              <span
                key={t}
                style={{
                  padding: "5px 13px",
                  borderRadius: 20,
                  border: "1px solid rgba(192,132,252,0.2)",
                  background: "rgba(192,132,252,0.07)",
                  color: "#d8b4fe",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <SignInButton />
        </div>
      </div>
    );

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div style={{ animation: "pageIn 0.28s ease" }}>
      <PageHeader
        icon="🎬"
        iconColor="#c084fc"
        title="Video Gen"
        subtitle="Transform any portrait into a talking digital avatar. Upload a face image + audio, SkyReels V3 generates a lip-synced HD video — free with your account."
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={genStatus} />
            {(genStatus === "uploading" ||
              genStatus === "processing" ||
              genStatus === "submitting") && (
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "monospace",
                }}
              >
                {fmt(elapsed)}
              </span>
            )}
            <button
              onClick={loadHistory}
              style={{
                ...ghostBtn(),
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              🕐 History
            </button>
          </div>
        }
      />

      {/* ── History slide-over ── */}
      {showHistory && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            onClick={() => setShowHistory(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(2px)",
            }}
          />
          <div
            style={{
              position: "relative",
              width: 340,
              height: "100%",
              background: "#08080f",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "pageIn 0.22s ease",
            }}
          >
            <div
              style={{
                padding: "18px 18px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 800,
                  color: "#fff",
                  fontSize: 15,
                }}
              >
                🎬 Past Videos
              </span>
              <button
                onClick={() => setShowHistory(false)}
                style={{ ...ghostBtn(), padding: "4px 10px" }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {history.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 13,
                  }}
                >
                  No completed videos yet.
                </div>
              ) : (
                history.map((job) => (
                  <HistoryItem
                    key={job.requestId}
                    job={job}
                    onPlay={(url) => {
                      setPlayingUrl(url);
                      setShowHistory(false);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Video lightbox (from history) ── */}
      {playingUrl && (
        <div
          onClick={() => setPlayingUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: 640,
              width: "90vw",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <video
              src={playingUrl}
              controls
              autoPlay
              style={{ width: "100%", display: "block" }}
            />
            <button
              onClick={() => setPlayingUrl(null)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.7)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div
        className="videogen-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
          gap: 22,
          padding: "0 clamp(20px,5vw,72px) 52px",
        }}
      >
        {/* ═══ LEFT — Inputs ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* ── API Key toggle ── */}
          <div
            style={{
              borderRadius: 13,
              overflow: "hidden",
              border: "1px solid rgba(192,132,252,0.13)",
              background: "rgba(192,132,252,0.03)",
            }}
          >
            <div
              onClick={() => setShowKeyPanel((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 16px",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🔑</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  API Key
                </span>
                {userSkyKey.trim() ? (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 8px",
                      borderRadius: 20,
                      fontWeight: 800,
                      background: "rgba(192,132,252,0.15)",
                      border: "1px solid rgba(192,132,252,0.3)",
                      color: "#c084fc",
                    }}
                  >
                    YOUR KEY
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 8px",
                      borderRadius: 20,
                      fontWeight: 800,
                      background: "rgba(52,211,153,0.1)",
                      border: "1px solid rgba(52,211,153,0.25)",
                      color: "#34d399",
                    }}
                  >
                    FREE · SERVER KEY
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.28)",
                  transform: showKeyPanel ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                  display: "inline-block",
                }}
              >
                ▾
              </span>
            </div>

            {showKeyPanel && (
              <div
                style={{
                  padding: "0 16px 14px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.25)",
                    lineHeight: 1.7,
                    margin: "12px 0 10px",
                  }}
                >
                  We use our server key by default — free for all signed-in
                  users. Optionally paste your own{" "}
                  <a
                    href="https://www.skycoding.ai/manage/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#c084fc", textDecoration: "none" }}
                  >
                    SkyReels key
                  </a>{" "}
                  to use your own quota.
                </p>
                <div style={{ display: "flex", gap: 7 }}>
                  <input
                    type={showKeyText ? "text" : "password"}
                    value={userSkyKey}
                    onChange={(e) => setUserSkyKey(e.target.value)}
                    placeholder="sk-… (leave blank to use server key)"
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      color: "#fff",
                      fontSize: 13,
                      outline: "none",
                      fontFamily: "monospace",
                    }}
                  />
                  <button
                    onClick={() => setShowKeyText((v) => !v)}
                    style={{ ...ghostBtn(), padding: "9px 12px", fontSize: 14 }}
                  >
                    {showKeyText ? "🙈" : "👁"}
                  </button>
                  {userSkyKey && (
                    <button
                      onClick={() => setUserSkyKey("")}
                      style={{
                        ...ghostBtn(),
                        padding: "9px 12px",
                        color: "#f87171",
                        borderColor: "rgba(248,113,113,0.2)",
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.18)",
                    marginTop: 7,
                  }}
                >
                  Your key is never stored — forwarded per-request and never
                  logged.
                </div>
              </div>
            )}
          </div>

          {/* ── Prompt ── */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 8,
              }}
            >
              <span style={{ color: "#c084fc", fontSize: 12 }}>✦</span>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Prompt
              </label>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder={EXAMPLE_PROMPT}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                resize: "vertical",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#fff",
                fontSize: 13,
                lineHeight: 1.6,
                outline: "none",
                fontFamily: "inherit",
                minHeight: 78,
              }}
            />
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.2)",
                marginTop: 5,
              }}
            >
              Describe scene, expression, camera angle. "Use a static shot."
              works well.
            </div>
          </div>

          {/* ── First Frame Image ── */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 10,
              }}
            >
              <span style={{ color: "#c084fc", fontSize: 12 }}>✦</span>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                First Frame Image
              </label>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.2)",
                  marginLeft: 4,
                }}
              >
                Portrait recommended
              </span>
            </div>
            <ImageDropZone
              imageUrl={imageUrl}
              onImageUrl={setImageUrl}
              onClear={() => setImageUrl("")}
            />
          </div>

          {/* ── Audio ── */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 10,
              }}
            >
              <span style={{ color: "#c084fc", fontSize: 12 }}>✦</span>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Audio
              </label>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.2)",
                  marginLeft: 4,
                }}
              >
                Drives the lip-sync
              </span>
            </div>
            <AudioInput
              audioUrl={audioUrl}
              onAudioUrl={setAudioUrl}
              onClear={() => setAudioUrl("")}
            />
          </div>

          {/* ── Error ── */}
          {error && <div style={alertBox("err")}>⚠ {error}</div>}

          {/* ── Actions ── */}
          <div style={{ display: "flex", gap: 9 }}>
            <button
              onClick={handleReset}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                cursor: "pointer",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              ↺ Reset
            </button>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              style={{
                flex: 1,
                padding: "13px",
                borderRadius: 10,
                border: "none",
                cursor: canGenerate ? "pointer" : "not-allowed",
                fontFamily: "'Syne',sans-serif",
                fontSize: 14,
                fontWeight: 800,
                background: canGenerate
                  ? "linear-gradient(135deg, #c084fc, #a78bfa, #8b5cf6)"
                  : "rgba(255,255,255,0.05)",
                color: canGenerate ? "#fff" : "rgba(255,255,255,0.2)",
                boxShadow: canGenerate
                  ? "0 8px 28px rgba(192,132,252,0.28)"
                  : "none",
                transition: "all 0.2s",
              }}
            >
              {genStatus === "uploading"
                ? "⬆ Uploading audio…"
                : genStatus === "submitting"
                  ? "Submitting…"
                  : genStatus === "processing"
                    ? `🎬 Generating… ${fmt(elapsed)}`
                    : retryCooldown
                      ? "⏳ Please wait…"
                      : "🎬 Generate Video"}
            </button>
          </div>

          {/* ── Meta badges ── */}
          {(requestId || keySource) && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {keySource && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "3px 9px",
                    borderRadius: 20,
                    background:
                      keySource === "user"
                        ? "rgba(192,132,252,0.1)"
                        : "rgba(52,211,153,0.08)",
                    border: `1px solid ${keySource === "user" ? "rgba(192,132,252,0.22)" : "rgba(52,211,153,0.18)"}`,
                    color: keySource === "user" ? "#c084fc" : "#6ee7b7",
                  }}
                >
                  {keySource === "user"
                    ? "🔑 Using your key"
                    : "✓ Using server key"}
                </span>
              )}
              {requestId && (
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.18)",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {requestId.slice(0, 20)}…
                </span>
              )}
            </div>
          )}
        </div>

        {/* ═══ RIGHT — Preview ═══ */}
        <div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.28)",
              letterSpacing: 1.5,
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Preview
          </div>

          <div
            style={{
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(192,132,252,0.15)",
              background: "rgba(255,255,255,0.02)",
              minHeight: 360,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {videoUrl ? (
              <>
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  style={{
                    width: "100%",
                    display: "block",
                    borderRadius: "17px 17px 0 0",
                  }}
                />
                <div
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 11, color: "#34d399" }}>
                    ✓ Generated successfully
                    {cost != null && (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.28)",
                          marginLeft: 8,
                        }}
                      >
                        Cost: ${cost.toFixed(4)}
                      </span>
                    )}
                    {keySource && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: "rgba(255,255,255,0.22)",
                        }}
                      >
                        ({keySource} key)
                      </span>
                    )}
                  </div>
                  <a
                    href={videoUrl}
                    download="skyreels-avatar.mp4"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      textDecoration: "none",
                      background: "rgba(52,211,153,0.1)",
                      border: "1px solid rgba(52,211,153,0.25)",
                      color: "#34d399",
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "inherit",
                    }}
                  >
                    ⬇ Download
                  </a>
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 40,
                  textAlign: "center",
                }}
              >
                {genStatus === "idle" && (
                  <>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 20,
                        marginBottom: 18,
                        background: "rgba(192,132,252,0.08)",
                        border: "1.5px solid rgba(192,132,252,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 36,
                      }}
                    >
                      🎬
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.3)",
                        marginBottom: 8,
                      }}
                    >
                      Your video appears here
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.18)",
                        lineHeight: 1.6,
                        maxWidth: 260,
                      }}
                    >
                      Fill in the form and click Generate. Your key costs are
                      covered — free with your account.
                    </div>
                  </>
                )}

                {(genStatus === "uploading" ||
                  genStatus === "submitting" ||
                  genStatus === "processing") && (
                  <>
                    <div
                      style={{
                        position: "relative",
                        width: 80,
                        height: 80,
                        marginBottom: 22,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          border: "2px solid rgba(192,132,252,0.15)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          border: "2.5px solid transparent",
                          borderTopColor:
                            genStatus === "uploading" ? "#fb923c" : "#c084fc",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 10,
                          borderRadius: "50%",
                          background: "rgba(192,132,252,0.06)",
                          border: "1px solid rgba(192,132,252,0.14)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                        }}
                      >
                        {genStatus === "uploading" ? "⬆" : "🎬"}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color:
                          genStatus === "uploading" ? "#fb923c" : "#c084fc",
                        marginBottom: 6,
                      }}
                    >
                      {genStatus === "uploading"
                        ? "Uploading audio to server…"
                        : genStatus === "submitting"
                          ? "Submitting request…"
                          : "Generating your video…"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.28)",
                        marginBottom: 10,
                      }}
                    >
                      {genStatus === "uploading"
                        ? "Converting your file to a public URL…"
                        : "This takes 1–3 minutes. Grab a chai ☕"}
                    </div>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 22,
                        fontWeight: 800,
                        color: "rgba(255,255,255,0.35)",
                        letterSpacing: 2,
                      }}
                    >
                      {fmt(elapsed)}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 240,
                        height: 3,
                        borderRadius: 2,
                        background: "rgba(255,255,255,0.06)",
                        marginTop: 20,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background:
                            genStatus === "uploading"
                              ? "linear-gradient(90deg, #fb923c, #f97316)"
                              : "linear-gradient(90deg, #c084fc, #a78bfa)",
                          borderRadius: 2,
                          width: `${Math.min(90, (elapsed / 120) * 100)}%`,
                          transition: "width 1s linear",
                        }}
                      />
                    </div>
                  </>
                )}

                {genStatus === "error" && (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#f87171",
                        marginBottom: 6,
                      }}
                    >
                      Generation failed
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.3)",
                        lineHeight: 1.6,
                        maxWidth: 260,
                      }}
                    >
                      {error}
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={!canGenerate}
                      style={{
                        marginTop: 18,
                        padding: "9px 20px",
                        borderRadius: 9,
                        cursor: canGenerate ? "pointer" : "not-allowed",
                        background: "rgba(248,113,113,0.1)",
                        border: "1px solid rgba(248,113,113,0.25)",
                        color: canGenerate
                          ? "#f87171"
                          : "rgba(248,113,113,0.35)",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      {retryCooldown ? "⏳ Cooling down…" : "↺ Try Again"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Model specs */}
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {[
              { label: "Resolution", value: "HD 720p" },
              { label: "Max duration", value: "200 sec" },
              { label: "Architecture", value: "DiT + Multimodal" },
              { label: "Sync type", value: "Audio-driven" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "10px 13px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.22)",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    marginBottom: 3,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseRing {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 767px) {
          .videogen-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
