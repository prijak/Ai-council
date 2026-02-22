import { useState, useCallback, useRef, useEffect } from "react";
import {
  tokens,
  layoutStyles,
  textStyles,
  formStyles,
  buttonStyles,
} from "../styles";
import { PROVIDERS, ACCENT_COLORS, ACCENT_ICONS } from "../constants/providers";
import { CHAIRMAN_SYNTHESIS } from "../constants/templates";
import { dispatchMember, fireWebhook } from "../lib/api";
import { loadSessions, persistSessions, loadWebhookUrl } from "../lib/storage";
import { stripThinking, isThinking, sid } from "../lib/utils";
import { Spin, TemperatureSlider } from "./atoms";
import { ManagePanel } from "./ManagePanel";
import { HistoryModal } from "./HistoryModal";
import { SettingsModal } from "./SettingsModal";
import { ResultsView } from "./ResultsView";

export function DeliberationScreen({
  initialMembers,
  initialChairmanId,
  onReset,
}) {
  const [liveMembers, setLiveMembers] = useState(initialMembers);
  const [liveChairId, setLiveChairId] = useState(initialChairmanId);
  const [sessionMembers, setSessionMembers] = useState([]);
  const [query, setQ] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [stage, setStage] = useState(0);
  const [responses, setResponses] = useState({});
  const [reviews, setReviews] = useState({});
  const [errors, setErrors] = useState({});
  const [verdict, setVerdict] = useState("");
  const [loading, setLoading] = useState({});
  const [chairLoad, setChairLoad] = useState(false);
  const [started, setStarted] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [showManage, setManage] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [thinkingMap, setThinkingMap] = useState({});
  const [followUpChain, setFollowUpChain] = useState([]);
  const [webhookStatus, setWebhookStatus] = useState(null);

  const abortRef = useRef(null);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

  // Show a "Reconnecting…" banner when app returns from background mid-run
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && isRunningRef.current) {
        setReconnecting(true);
        setTimeout(() => setReconnecting(false), 3000);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Keep a ref so the visibilitychange handler can read isRunning
  // without needing it in the dependency array
  const isRunningRef = useRef(false);

  const displayChairman = liveMembers.find((m) => m.id === liveChairId);
  const setLoad = (id, v) => setLoading((p) => ({ ...p, [id]: v }));
  const setResp = useCallback(
    (id, t) => setResponses((p) => ({ ...p, [id]: t })),
    [],
  );
  const setRevw = useCallback(
    (id, t) => setReviews((p) => ({ ...p, [id]: t })),
    [],
  );
  const setErr = (id, t) => setErrors((p) => ({ ...p, [id]: t }));

  const doCancel = () => {
    if (abortRef.current) abortRef.current.abort();
    setCancelled(true);
    setChairLoad(false);
  };

  const runQuery = async (q, chain = [], snap = null, temp = temperature) => {
    const chairId = liveChairId;
    const chairMember = liveMembers.find((m) => m.id === chairId);
    if (!chairMember || !q.trim()) return;

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const members =
      snap || liveMembers.map((m) => ({ ...m, isChairman: m.id === chairId }));
    setSessionMembers(members);
    setStarted(true);
    setCancelled(false);
    setResponses({});
    setReviews({});
    setErrors({});
    setVerdict("");
    setLoading({});
    setThinkingMap({});
    setChairLoad(false);
    setWebhookStatus(null);
    setStage(1);

    let contextPrefix = "";
    if (chain.length > 0) {
      contextPrefix = `IMPORTANT CONTEXT — previous council deliberation rounds:\n\n`;
      chain.forEach((item, i) => {
        contextPrefix += `Round ${i + 1} query: "${item.query}"\nRound ${i + 1} verdict: ${item.verdict}\n\n`;
      });
      contextPrefix += `Now address this new follow-up question in light of the above:\n\n`;
    }

    /* Stage 1 — First opinions */
    const finalR = {};
    await Promise.all(
      members.map(async (m) => {
        setLoad(m.id, true);
        try {
          const t = await dispatchMember(
            m,
            m.systemPrompt,
            contextPrefix + q,
            (rawT) => {
              const cleaned = stripThinking(rawT);
              finalR[m.id] = cleaned;
              setResp(m.id, cleaned);
              setThinkingMap((p) => ({ ...p, [m.id]: isThinking(rawT) }));
            },
            signal,
            temp,
          );
          finalR[m.id] = stripThinking(t);
          setThinkingMap((p) => ({ ...p, [m.id]: false }));
        } catch (e) {
          if (e.name !== "AbortError") setErr(m.id, e.message);
        } finally {
          setLoad(m.id, false);
        }
      }),
    );

    if (signal.aborted) {
      setCancelled(true);
      setStage(3);
      return;
    }
    setStage(2);

    /* Stage 2 — Peer review */
    const letters = ["A", "B", "C", "D", "E", "F", "G"];
    const finalRevw = {};
    await Promise.all(
      members.map(async (reviewer) => {
        setLoad(reviewer.id, true);
        const others = members.filter((m) => m.id !== reviewer.id);
        let rp = `The council is deliberating: "${q}"\n\nYour initial response was submitted. Now evaluate these anonymized responses:\n\n`;
        others.forEach((m, i) => {
          rp += `**Response ${letters[i]}:**\n${finalR[m.id] || "(no response)"}\n\n`;
        });
        rp += `As ${reviewer.name}, briefly evaluate these. What's most valuable? What's missing? Under 150 words.`;
        try {
          const t = await dispatchMember(
            reviewer,
            reviewer.systemPrompt,
            rp,
            (rawTxt) => setRevw(reviewer.id, stripThinking(rawTxt)),
            signal,
            temp,
          );
          finalRevw[reviewer.id] = stripThinking(t);
        } catch {
        } finally {
          setLoad(reviewer.id, false);
        }
      }),
    );

    if (signal.aborted) {
      setCancelled(true);
      setStage(3);
      return;
    }
    setStage(3);
    setChairLoad(true);

    /* Stage 3 — Chairman synthesis */
    let sp = `The council has deliberated on: "${q}"\n\n`;
    if (contextPrefix) sp += contextPrefix;
    sp += `=== MEMBER RESPONSES ===\n\n`;
    members.forEach((m) => {
      sp += `**${m.name}** (${m.personaLabel} · ${PROVIDERS[m.provider].name}/${m.model}):\n${finalR[m.id] || "(failed)"}\n\n`;
    });
    sp += `=== PEER REVIEWS ===\n\n`;
    members.forEach((m) => {
      sp += `**${m.name}:**\n${finalRevw[m.id] || "(unavailable)"}\n\n`;
    });

    let finalVerdict = "";
    try {
      finalVerdict = await dispatchMember(
        chairMember,
        CHAIRMAN_SYNTHESIS,
        sp,
        (rawT) => setVerdict(stripThinking(rawT)),
        signal,
        temp,
      );
      finalVerdict = stripThinking(finalVerdict);
    } catch (e) {
      if (e.name !== "AbortError") {
        finalVerdict = `Chairman synthesis failed: ${e.message}`;
        setVerdict(finalVerdict);
      }
    } finally {
      setChairLoad(false);
    }

    if (signal.aborted) {
      setCancelled(true);
      return;
    }

    const newChain = [...chain, { query: q, verdict: finalVerdict }];
    setFollowUpChain(newChain);

    const sess = {
      id: sid(),
      ts: Date.now(),
      query: q,
      temperature: temp,
      memberIds: members.map((m) => m.id),
      memberNames: members.map((m) => m.name),
      responses: { ...finalR },
      reviews: { ...finalRevw },
      verdict: finalVerdict,
      followUpChain: chain,
    };
    const nextSessions = [...sessions, sess];
    setSessions(nextSessions);
    persistSessions(nextSessions);

    const webhookUrl = await loadWebhookUrl();
    if (webhookUrl) {
      const r = await fireWebhook(webhookUrl, {
        type: "session_complete",
        ts: sess.ts,
        query: q,
        temperature: temp,
        memberNames: members.map((m) => m.name),
        responses: finalR,
        reviews: finalRevw,
        verdict: finalVerdict,
      });
      setWebhookStatus(r);
    }
  };

  const run = () => runQuery(query, [], null, temperature);

  const handleFollowUp = async (followUpQ) => {
    const prevVerdict = verdict;
    setQ(followUpQ);
    await runQuery(
      followUpQ,
      [...followUpChain, { query, verdict: prevVerdict }],
      sessionMembers,
      temperature,
    );
  };

  const resetQuery = () => {
    setStarted(false);
    setStage(0);
    setQ("");
    setResponses({});
    setReviews({});
    setErrors({});
    setVerdict("");
    setLoading({});
    setCancelled(false);
    setFollowUpChain([]);
    setWebhookStatus(null);
  };

  const restoreSession = (sess) => {
    const synthetic = (sess.memberIds || []).map((id, i) => ({
      id,
      name: (sess.memberNames || [])[i] || id,
      provider: "anthropic",
      model: "unknown",
      color: ACCENT_COLORS[i % ACCENT_COLORS.length],
      icon: ACCENT_ICONS[i % ACCENT_ICONS.length],
      personaLabel: "—",
      systemPrompt: "",
      isChairman: i === 0,
    }));
    setSessionMembers(synthetic);
    setQ(sess.query);
    setResponses(sess.responses || {});
    setReviews(sess.reviews || {});
    setErrors({});
    setVerdict(sess.verdict || "");
    setLoading({});
    setChairLoad(false);
    setStage(4);
    setStarted(true);
    setCancelled(false);
    if (sess.temperature !== undefined) setTemperature(sess.temperature);
  };

  const isRunning = Object.values(loading).some(Boolean) || chairLoad;
  isRunningRef.current = isRunning;
  const currentSession = {
    id: "live",
    ts: Date.now(),
    query,
    temperature,
    memberIds: sessionMembers.map((m) => m.id),
    memberNames: sessionMembers.map((m) => m.name),
    responses,
    reviews,
    verdict,
    followUpChain,
  };

  return (
    <div style={layoutStyles.page}>
      {showManage && (
        <ManagePanel
          members={liveMembers}
          chairmanId={liveChairId}
          onClose={() => setManage(false)}
          onUpdateMembers={setLiveMembers}
          onUpdateChairman={setLiveChairId}
        />
      )}
      {showHistory && (
        <HistoryModal
          sessions={sessions}
          onClose={() => setShowHistory(false)}
          onLoad={(sess) => {
            restoreSession(sess);
            setShowHistory(false);
          }}
        />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Header */}
      <div
        style={{
          ...layoutStyles.header,
          flexWrap: "nowrap",
          overflow: "hidden",
        }}
      >
        {/* Logo + title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "linear-gradient(135deg,#f97316,#a78bfa,#60a5fa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                boxShadow: "0 2px 10px rgba(167,139,250,0.3)",
              }}
            >
              ⚖
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -4,
                right: -5,
                fontSize: 9,
                lineHeight: 1,
              }}
            >
              🇮🇳
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: -0.2,
                whiteSpace: "nowrap",
              }}
            >
              AI Council
            </div>
            <div
              style={{
                fontSize: 8,
                letterSpacing: 1.5,
                color: "rgba(249,115,22,0.55)",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Deliberation · Made in Bharat
            </div>
          </div>
        </div>

        {/* Right controls — scroll horizontally if needed */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            overflowX: "auto",
            scrollbarWidth: "none",
            flexShrink: 1,
            justifyContent: "flex-end",
          }}
        >
          {/* Member avatars — hidden on very small screens via inline max-width cap */}
          <div
            style={{ display: "flex", gap: 3, flexShrink: 0 }}
            className="header-avatars"
          >
            {liveMembers.slice(0, 5).map((m) => (
              <div
                key={m.id}
                title={`${m.name} · ${PROVIDERS[m.provider].name}/${m.model}${liveChairId === m.id ? " · Chairman" : ""}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: `${m.color}1a`,
                  border: `1px solid ${m.color}${liveChairId === m.id ? "99" : "44"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: m.color,
                  flexShrink: 0,
                }}
              >
                {m.icon}
              </div>
            ))}
            {liveMembers.length > 5 && (
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: tokens.textMuted,
                  flexShrink: 0,
                }}
              >
                +{liveMembers.length - 5}
              </div>
            )}
          </div>

          {/* Cancel button — always visible when running */}
          {isRunning && !cancelled && (
            <button
              onClick={doCancel}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: `1px solid rgba(248,113,113,0.4)`,
                background: "rgba(248,113,113,0.1)",
                color: "#fca5a5",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              <Spin size={9} color="#fca5a5" /> Cancel
            </button>
          )}

          {webhookStatus && !isRunning && (
            <span
              style={{
                fontSize: 11,
                color: webhookStatus.ok ? tokens.success : "#fca5a5",
                flexShrink: 0,
              }}
            >
              {webhookStatus.ok ? "🔗✓" : "🔗✗"}
            </span>
          )}

          {/* Icon-only buttons (label hidden on mobile via CSS) */}
          <button
            onClick={() => setShowHistory(true)}
            style={{
              padding: "5px 9px",
              borderRadius: 6,
              border: `1px solid rgba(52,211,153,0.3)`,
              background: "rgba(52,211,153,0.07)",
              color: "#6ee7b7",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            📋
            <span className="btn-label">
              {sessions.length > 0 ? ` (${sessions.length})` : ""}
            </span>
          </button>
          <button
            onClick={() => setManage(true)}
            style={{
              padding: "5px 9px",
              borderRadius: 6,
              border: `1px solid rgba(167,139,250,0.3)`,
              background: "rgba(167,139,250,0.07)",
              color: "#c4b5fd",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            ⚙<span className="btn-label"> Manage</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              ...buttonStyles.iconSquare,
              color: tokens.textMuted,
              flexShrink: 0,
            }}
            title="Settings"
          >
            ⚙︎
          </button>
          <button
            onClick={onReset}
            style={{
              ...buttonStyles.ghost,
              padding: "5px 9px",
              fontSize: 12,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            ↩<span className="btn-label"> Rebuild</span>
          </button>
        </div>
      </div>

      {/* Reconnecting banner — shown when app returns from background mid-stream */}
      <style>{`
        @keyframes reconnect-pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.6; }
        }
        @media (max-width: 480px) {
          .header-avatars { display: none !important; }
          .btn-label { display: none; }
        }
        @media (max-width: 600px) {
          .btn-label { display: none; }
        }
      `}</style>

      {reconnecting && (
        <div
          style={{
            padding: "7px 14px",
            background: "rgba(96,165,250,0.1)",
            borderBottom: `1px solid rgba(96,165,250,0.25)`,
            fontSize: 12,
            color: "#93c5fd",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            animation: "reconnect-pulse 1.2s ease-in-out infinite",
          }}
        >
          <span>↺</span>
          Reconnecting streams after returning from background — responses will
          continue automatically.
        </div>
      )}

      {/* Pre-run query input */}
      {!started && (
        <div
          style={{
            maxWidth: 660,
            margin: "0 auto",
            padding: "clamp(20px,5vw,48px) clamp(16px,4vw,24px)",
            animation: "fadeIn 0.4s ease",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1
              style={{
                fontSize: "clamp(24px,5vw,34px)",
                fontWeight: 800,
                letterSpacing: -1,
                color: "#fff",
                lineHeight: 1.15,
                marginBottom: 9,
              }}
            >
              Ask the council
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg,#a78bfa,#60a5fa,#34d399)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                anything.
              </span>
            </h1>
            {displayChairman ? (
              <p style={{ color: tokens.textMuted, fontSize: 13 }}>
                {liveMembers.length} members · Chairman:{" "}
                <span style={{ color: displayChairman.color }}>
                  {displayChairman.icon} {displayChairman.name}
                </span>
              </p>
            ) : (
              <p style={{ color: tokens.warning, fontSize: 13 }}>
                ⚠ No Chairman — open Manage to designate one
              </p>
            )}
            {sessions.length > 0 && (
              <p
                style={{
                  color: tokens.textFaint,
                  fontSize: 12,
                  marginTop: 6,
                  cursor: "pointer",
                }}
                onClick={() => setShowHistory(true)}
              >
                📋 {sessions.length} past session
                {sessions.length !== 1 ? "s" : ""} in history →
              </p>
            )}
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid rgba(255,255,255,0.1)`,
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <textarea
              value={query}
              onChange={(e) => setQ(e.target.value)}
              rows={5}
              placeholder="A hard question, a decision, a topic that deserves multiple sharp perspectives…"
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: tokens.textPrimary,
                fontSize: 16,
                padding: 20,
                resize: "none",
                fontFamily: '"DM Sans",sans-serif',
                lineHeight: 1.65,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run();
              }}
            />
            <div
              style={{
                padding: "11px 16px",
                borderTop: `1px solid ${tokens.borderSubtle}`,
              }}
            >
              <TemperatureSlider
                value={temperature}
                onChange={setTemperature}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 16px",
                borderTop: `1px solid ${tokens.borderSubtle}`,
              }}
            >
              <span style={{ fontSize: 12, color: tokens.textFaint }}>
                ⌘+Enter to submit
              </span>
              <button
                onClick={run}
                disabled={!query.trim() || !displayChairman}
                style={{
                  padding: "9px 22px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  background:
                    query.trim() && displayChairman
                      ? "linear-gradient(135deg,#a78bfa,#60a5fa)"
                      : "rgba(255,255,255,0.04)",
                  color:
                    query.trim() && displayChairman ? "#fff" : tokens.textFaint,
                  cursor:
                    query.trim() && displayChairman ? "pointer" : "not-allowed",
                }}
              >
                Convene →
              </button>
            </div>
          </div>
        </div>
      )}

      {started && (
        <ResultsView
          sessionMembers={sessionMembers}
          query={query}
          stage={stage}
          responses={responses}
          reviews={reviews}
          errors={errors}
          loading={loading}
          thinkingMap={thinkingMap}
          verdict={verdict}
          chairLoad={chairLoad}
          onNewQuery={resetQuery}
          cancelled={cancelled}
          currentSession={currentSession}
          onFollowUp={handleFollowUp}
          temperature={temperature}
        />
      )}
    </div>
  );
}
