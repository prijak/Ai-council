import { useState } from "react";
import {
  tokens,
  formStyles,
  textStyles,
  cardStyles,
  buttonStyles,
  skeletonLine,
  skeletonLinePurple,
} from "../styles";
import { PROVIDERS } from "../constants/providers";
import { downloadMarkdown, exportPDF } from "../lib/export";
import { Spin, Badge } from "./atoms";

/* ─── mobile breakpoint helper ─── */
const isMobile = () => typeof window !== "undefined" && window.innerWidth < 640;

export function ResultsView({
  sessionMembers,
  query,
  stage,
  responses,
  reviews,
  errors,
  loading,
  thinkingMap,
  verdict,
  chairLoad,
  onNewQuery,
  cancelled,
  currentSession,
  onFollowUp,
  temperature,
}) {
  const [activeTab, setActiveTab] = useState("opinions");
  const [activeMemberId, setActiveMemberId] = useState(sessionMembers[0]?.id);
  const [followUpText, setFollowUpText] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);

  const chairman = sessionMembers.find((m) => m.isChairman);
  const isDone = (stage >= 3 && !chairLoad) || cancelled;
  const opinionsDone = sessionMembers.filter(
    (m) => responses[m.id] || errors[m.id],
  ).length;
  const reviewsDone = sessionMembers.filter((m) => reviews[m.id]).length;

  /* ── only show spinner in sidebar for the stage that's actually active ── */
  const tabDefs = [
    {
      id: "opinions",
      label: "First Opinions",
      roman: "I",
      done: opinionsDone,
      total: sessionMembers.length,
      loading: sessionMembers.some((m) => loading[m.id]) && stage === 1,
      active: stage >= 1,
    },
    {
      id: "reviews",
      label: "Peer Review",
      roman: "II",
      done: reviewsDone,
      total: sessionMembers.length,
      loading: sessionMembers.some((m) => loading[m.id]) && stage === 2,
      active: stage >= 2,
    },
    {
      id: "verdict",
      label: "Final Verdict",
      roman: "III",
      done: verdict ? 1 : 0,
      total: 1,
      loading: chairLoad,
      active: stage >= 3 || cancelled,
    },
  ];

  const activeMember = sessionMembers.find((m) => m.id === activeMemberId);

  const submitFollowUp = () => {
    if (!followUpText.trim()) return;
    onFollowUp(followUpText.trim());
    setFollowUpText("");
    setShowFollowUp(false);
    setActiveTab("opinions");
  };

  /* ── shared sidebar member pill for opinions tab (stage-aware spinner) ── */
  const OpinionMemberButton = ({ m }) => {
    const pInfo = PROVIDERS[m.provider];
    const isLd = !!loading[m.id] && stage === 1; // ← KEY FIX: gate by stage
    const hasR = !!responses[m.id];
    const hasE = !!errors[m.id];
    const isSel = activeMemberId === m.id;
    return (
      <button
        onClick={() => setActiveMemberId(m.id)}
        style={{
          padding: "10px 11px",
          borderRadius: 9,
          border: `1px solid ${isSel ? m.color + "55" : tokens.borderSubtle}`,
          background: isSel ? `${m.color}12` : "rgba(255,255,255,0.02)",
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.15s",
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {isSel && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg,transparent,${m.color},transparent)`,
            }}
          />
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 3,
          }}
        >
          <span style={{ fontSize: 13, color: m.color, flexShrink: 0 }}>
            {m.icon}
          </span>
          <span
            style={{
              fontSize: "clamp(10px,1.8vw,12px)",
              fontWeight: 700,
              color: isSel ? "#fff" : "#bbb",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {m.name}
          </span>
          {isLd && thinkingMap[m.id] && (
            <span style={{ fontSize: 10, color: "#60a5fa" }} title="Thinking…">
              🧠
            </span>
          )}
          {isLd && !thinkingMap[m.id] && <Spin size={9} color={m.color} />}
          {hasE && !isLd && (
            <span style={{ fontSize: 10, color: tokens.danger }}>⚠</span>
          )}
          {hasR && !isLd && !hasE && (
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: m.color,
              }}
            />
          )}
        </div>
        <div
          style={{
            fontSize: 10,
            color: pInfo.color,
            paddingLeft: 20,
            fontFamily: "monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {pInfo.icon} {m.model.split(":")[0].slice(0, 14)}
        </div>
        {m.isChairman && (
          <div
            style={{
              fontSize: 10,
              color: m.color,
              paddingLeft: 20,
              marginTop: 2,
            }}
          >
            👑 Chairman
          </div>
        )}
      </button>
    );
  };

  /* ── mobile: horizontal member pill strip ── */
  const MobileMemberStrip = ({ showReviewStatus }) => (
    <div
      style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        padding: "8px 12px",
        borderBottom: `1px solid ${tokens.borderSubtle}`,
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        flexShrink: 0,
      }}
    >
      {sessionMembers.map((m) => {
        const isLd = showReviewStatus
          ? !!loading[m.id] && stage === 2
          : !!loading[m.id] && stage === 1;
        const hasDone = showReviewStatus
          ? !!reviews[m.id]
          : !!responses[m.id] || !!errors[m.id];
        const hasE = !showReviewStatus && !!errors[m.id];
        const isSel = activeMemberId === m.id;
        return (
          <button
            key={m.id}
            onClick={() => setActiveMemberId(m.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 10px",
              borderRadius: 20,
              border: `1px solid ${isSel ? m.color + "77" : tokens.borderSubtle}`,
              background: isSel ? `${m.color}18` : "rgba(255,255,255,0.03)",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 12, color: m.color }}>{m.icon}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isSel ? "#fff" : "#aaa",
              }}
            >
              {m.name.split(" ")[0]}
            </span>
            {isLd && <Spin size={7} color={m.color} />}
            {!isLd && hasDone && !hasE && (
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: m.color,
                }}
              />
            )}
            {hasE && (
              <span style={{ fontSize: 9, color: tokens.danger }}>⚠</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 62px)",
        overflow: "hidden",
      }}
    >
      {/* Query bar */}
      <div
        style={{
          padding: "8px 14px",
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          background: "rgba(167,139,250,0.03)",
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
          <div
            style={{
              ...textStyles.queryText,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "clamp(11px,3vw,14px)",
            }}
          >
            "{query}"
          </div>
          {temperature !== undefined && (
            <div
              style={{ fontSize: 10, color: tokens.textFaint, marginTop: 1 }}
            >
              🌡 Temperature: {Math.round(temperature * 100)}%
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          {isDone && verdict && (
            <>
              <button
                onClick={() => downloadMarkdown(currentSession)}
                style={{
                  ...buttonStyles.ghost,
                  padding: "4px 8px",
                  fontSize: 11,
                }}
              >
                ⬇ MD
              </button>
              <button
                onClick={() => exportPDF(currentSession)}
                style={{
                  ...buttonStyles.ghost,
                  padding: "4px 8px",
                  fontSize: 11,
                }}
              >
                🖨 PDF
              </button>
            </>
          )}
          <button
            onClick={onNewQuery}
            style={{ ...buttonStyles.ghost, padding: "4px 8px", fontSize: 11 }}
          >
            ✕ New
          </button>
        </div>
      </div>

      {cancelled && (
        <div
          style={{
            padding: "7px 14px",
            background: "rgba(248,113,113,0.08)",
            borderBottom: `1px solid rgba(248,113,113,0.2)`,
            fontSize: 11,
            color: "#fca5a5",
            flexShrink: 0,
          }}
        >
          ⬛ Run was cancelled — partial results shown below.
        </div>
      )}

      {/* Stage tabs — horizontally scrollable on mobile */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          flexShrink: 0,
          background: "rgba(0,0,0,0.2)",
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {tabDefs.map((t) => {
          const isActive = activeTab === t.id;
          const pct = t.total > 0 ? (t.done / t.total) * 100 : 0;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.active) setActiveTab(t.id);
              }}
              style={{
                flex: 1,
                minWidth: "clamp(90px, 28vw, max-content)",
                padding: "10px 12px",
                border: "none",
                background: isActive ? "rgba(167,139,250,0.08)" : "transparent",
                borderBottom: isActive
                  ? "2px solid #a78bfa"
                  : "2px solid transparent",
                cursor: t.active ? "pointer" : "default",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                opacity: !t.active ? 0.4 : 1,
                transition: "all 0.15s",
                position: "relative",
                overflow: "hidden",
                WebkitTapHighlightColor: "rgba(167,139,250,0.2)",
                touchAction: "manipulation",
              }}
            >
              {t.active && pct > 0 && pct < 100 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: 2,
                    width: `${pct}%`,
                    background: "#a78bfa",
                    transition: "width 0.3s",
                  }}
                />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    fontSize: 9,
                    color: isActive ? "#a78bfa" : tokens.textFaint,
                    fontWeight: 700,
                    letterSpacing: 2,
                  }}
                >
                  {t.roman}
                </span>
                <span
                  style={{
                    fontSize: "clamp(10px,2.5vw,12px)",
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? "#fff" : tokens.textMuted,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </span>
                {t.loading && <Spin size={8} color="#a78bfa" />}
                {!t.loading &&
                  t.done === t.total &&
                  t.total > 0 &&
                  t.active && (
                    <span style={{ fontSize: 10, color: tokens.success }}>
                      ✓
                    </span>
                  )}
              </div>
              {t.active && (
                <div style={{ fontSize: 10, color: tokens.textFaint }}>
                  {t.id === "verdict"
                    ? verdict
                      ? "Ready"
                      : chairLoad
                        ? "Synthesizing…"
                        : "Pending"
                    : `${t.done}/${t.total}`}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Tab I: First Opinions */}
          {activeTab === "opinions" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Mobile: horizontal pill strip */}
              <div
                style={{ display: "none" }}
                className="mobile-strip-opinions"
              >
                <MobileMemberStrip showReviewStatus={false} />
              </div>

              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* Desktop sidebar */}
                <div
                  className="desktop-sidebar"
                  style={{
                    width: "clamp(110px,20vw,180px)",
                    borderRight: `1px solid ${tokens.borderSubtle}`,
                    padding: "10px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    overflowY: "auto",
                    flexShrink: 0,
                  }}
                >
                  {sessionMembers.map((m) => (
                    <OpinionMemberButton key={m.id} m={m} />
                  ))}
                </div>

                {/* Detail pane */}
                <div
                  style={{
                    flex: 1,
                    padding: "14px 16px",
                    overflowY: "auto",
                    minWidth: 0,
                  }}
                >
                  {activeMember && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          marginBottom: 16,
                          paddingBottom: 12,
                          borderBottom: `1px solid ${tokens.borderSubtle}`,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: `${activeMember.color}1a`,
                            border: `1px solid ${activeMember.color}44`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            color: activeMember.color,
                            flexShrink: 0,
                          }}
                        >
                          {activeMember.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#fff",
                              }}
                            >
                              {activeMember.name}
                            </span>
                            {activeMember.isChairman && (
                              <Badge
                                label="👑 Chairman"
                                color={activeMember.color}
                              />
                            )}
                            <Badge
                              label={activeMember.personaLabel}
                              color={activeMember.color}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: tokens.textMuted,
                              marginTop: 3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span
                              style={{
                                color: PROVIDERS[activeMember.provider].color,
                              }}
                            >
                              {PROVIDERS[activeMember.provider].icon}{" "}
                              {PROVIDERS[activeMember.provider].name}
                            </span>{" "}
                            ·{" "}
                            <span style={{ fontFamily: "monospace" }}>
                              {activeMember.model}
                            </span>
                          </div>
                        </div>
                        {loading[activeMemberId] && stage === 1 && (
                          <Spin size={13} color={activeMember.color} />
                        )}
                      </div>

                      {errors[activeMemberId] && (
                        <div style={cardStyles.errorBox}>
                          ⚠ {errors[activeMemberId]}
                        </div>
                      )}
                      {!errors[activeMemberId] && responses[activeMemberId] && (
                        <div style={{ ...textStyles.responseBody }}>
                          {responses[activeMemberId]}
                        </div>
                      )}
                      {!errors[activeMemberId] &&
                        !responses[activeMemberId] &&
                        loading[activeMemberId] && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                              marginTop: 8,
                            }}
                          >
                            {thinkingMap[activeMemberId] ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 9,
                                  padding: "10px 14px",
                                  background: "rgba(96,165,250,0.06)",
                                  border: "1px solid rgba(96,165,250,0.15)",
                                  borderRadius: 8,
                                  marginBottom: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: "#60a5fa",
                                    animation: "pulse 1s ease-in-out infinite",
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "#93c5fd",
                                    fontStyle: "italic",
                                  }}
                                >
                                  Thinking deeply — answer coming shortly…
                                </span>
                              </div>
                            ) : (
                              <div
                                style={{
                                  fontSize: 13,
                                  color: tokens.textFaint,
                                  fontStyle: "italic",
                                  marginBottom: 8,
                                }}
                              >
                                Generating response…
                              </div>
                            )}
                            {[85, 70, 92, 60, 78].map((w, i) => (
                              <div
                                key={i}
                                style={{
                                  ...skeletonLine(`${w}%`),
                                  animation: "pulse 1.4s ease-in-out infinite",
                                  animationDelay: `${i * 0.15}s`,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      {!errors[activeMemberId] &&
                        !responses[activeMemberId] &&
                        !loading[activeMemberId] && (
                          <div
                            style={{
                              color: tokens.textFaint,
                              fontSize: 13,
                              fontStyle: "italic",
                            }}
                          >
                            Waiting to generate…
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab II: Peer Review */}
          {activeTab === "reviews" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Mobile: horizontal pill strip for reviews */}
              <div style={{ display: "none" }} className="mobile-strip-reviews">
                <MobileMemberStrip showReviewStatus={true} />
              </div>

              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* Desktop sidebar */}
                <div
                  className="desktop-sidebar"
                  style={{
                    width: "clamp(110px,20vw,180px)",
                    borderRight: `1px solid ${tokens.borderSubtle}`,
                    padding: "10px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    overflowY: "auto",
                    flexShrink: 0,
                  }}
                >
                  {sessionMembers.map((m) => {
                    const hasRev = !!reviews[m.id];
                    const isLd = !!loading[m.id] && stage === 2;
                    const isSel = activeMemberId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setActiveMemberId(m.id)}
                        style={{
                          padding: "10px 11px",
                          borderRadius: 9,
                          border: `1px solid ${isSel ? m.color + "55" : tokens.borderSubtle}`,
                          background: isSel
                            ? `${m.color}12`
                            : "rgba(255,255,255,0.02)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              color: m.color,
                              flexShrink: 0,
                            }}
                          >
                            {m.icon}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: isSel ? "#fff" : "#bbb",
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {m.name}
                          </span>
                          {isLd && <Spin size={9} color={tokens.success} />}
                          {hasRev && !isLd && (
                            <div
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: tokens.success,
                              }}
                            />
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: tokens.textFaint,
                            paddingLeft: 20,
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Peer review
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: "14px 16px",
                    overflowY: "auto",
                    minWidth: 0,
                  }}
                >
                  {activeMember && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 16,
                          paddingBottom: 12,
                          borderBottom: `1px solid ${tokens.borderSubtle}`,
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            color: activeMember.color,
                            flexShrink: 0,
                          }}
                        >
                          {activeMember.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            {activeMember.name}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: tokens.textMuted,
                              marginLeft: 8,
                            }}
                          >
                            evaluating other responses
                          </span>
                        </div>
                        {loading[activeMemberId] && stage === 2 && (
                          <Spin size={12} color={tokens.success} />
                        )}
                      </div>
                      {reviews[activeMemberId] ? (
                        <div
                          style={{
                            ...textStyles.responseBody,
                            color: "#9998aa",
                            borderLeft: `3px solid ${activeMember.color}33`,
                            paddingLeft: 16,
                          }}
                        >
                          {reviews[activeMemberId]}
                        </div>
                      ) : loading[activeMemberId] && stage === 2 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              color: tokens.textFaint,
                              fontStyle: "italic",
                              marginBottom: 8,
                            }}
                          >
                            Evaluating other responses…
                          </div>
                          {[75, 88, 62, 80].map((w, i) => (
                            <div
                              key={i}
                              style={{
                                ...skeletonLine(`${w}%`),
                                background: "rgba(52,211,153,0.1)",
                                animation: "pulse 1.4s ease-in-out infinite",
                                animationDelay: `${i * 0.2}s`,
                              }}
                            />
                          ))}
                        </div>
                      ) : stage < 2 ? (
                        <div
                          style={{
                            color: tokens.textFaint,
                            fontSize: 13,
                            fontStyle: "italic",
                          }}
                        >
                          Peer review begins after all first opinions are
                          collected.
                        </div>
                      ) : (
                        <div
                          style={{
                            color: tokens.textFaint,
                            fontSize: 13,
                            fontStyle: "italic",
                          }}
                        >
                          No peer review recorded.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab III: Final Verdict */}
          {activeTab === "verdict" && (
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {chairman && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${tokens.borderSubtle}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(167,139,250,0.03)",
                    flexShrink: 0,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: `${chairman.color}1a`,
                      border: `1px solid ${chairman.color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      color: chairman.color,
                      flexShrink: 0,
                    }}
                  >
                    {chairman.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}
                      >
                        {chairman.name}
                      </span>
                      <Badge label="👑 Chairman" color={chairman.color} />
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: tokens.textMuted,
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {PROVIDERS[chairman.provider].icon}{" "}
                      {PROVIDERS[chairman.provider].name} ·{" "}
                      <span style={{ fontFamily: "monospace" }}>
                        {chairman.model}
                      </span>
                    </div>
                  </div>
                  {chairLoad && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: 12,
                        color: "#a78bfa",
                      }}
                    >
                      <Spin size={11} color="#a78bfa" /> Synthesizing…
                    </div>
                  )}
                  {verdict && !chairLoad && (
                    <div
                      style={{
                        fontSize: 11,
                        color: tokens.success,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: tokens.success,
                        }}
                      />{" "}
                      Verdict ready
                    </div>
                  )}
                  {!verdict && !chairLoad && stage < 3 && (
                    <div style={{ fontSize: 11, color: tokens.textFaint }}>
                      Awaiting deliberation…
                    </div>
                  )}
                </div>
              )}
              <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
                {verdict ? (
                  <div
                    style={{
                      ...textStyles.verdictBody,
                      lineHeight: 2,
                      animation: "fadeIn 0.4s ease",
                    }}
                  >
                    {verdict}
                  </div>
                ) : chairLoad ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "#a78bfa",
                        fontStyle: "italic",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#a78bfa",
                          animation: "pulse 1s ease-in-out infinite",
                        }}
                      />
                      Chairman is synthesizing all arguments…
                    </div>
                    {[90, 72, 84, 65, 78, 88].map((w, i) => (
                      <div
                        key={i}
                        style={skeletonLinePurple(`${w}%`, i * 0.18)}
                      />
                    ))}
                  </div>
                ) : stage < 3 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: tokens.textFaint,
                        fontStyle: "italic",
                        marginBottom: 8,
                      }}
                    >
                      Waiting for all opinions and reviews to complete…
                    </div>
                    {[85, 68, 76, 60, 72].map((w, i) => (
                      <div key={i} style={skeletonLine(`${w}%`, 0.15)} />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      color: tokens.textFaint,
                      fontSize: 13,
                      fontStyle: "italic",
                    }}
                  >
                    Verdict not yet generated.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Follow-up bar */}
        {isDone && verdict && (
          <div
            style={{
              borderTop: `1px solid ${tokens.borderSubtle}`,
              flexShrink: 0,
              background: "rgba(96,165,250,0.03)",
            }}
          >
            {!showFollowUp ? (
              <div style={{ padding: "10px 14px" }}>
                <button
                  onClick={() => setShowFollowUp(true)}
                  style={{
                    ...buttonStyles.dashed,
                    border: `1px dashed rgba(96,165,250,0.3)`,
                    background: "rgba(96,165,250,0.04)",
                    color: "#93c5fd",
                    fontSize: 12,
                  }}
                >
                  🔗 Ask a follow-up question — council keeps full context
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: "12px 14px",
                  animation: "slideDown 0.15s ease",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#60a5fa",
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  🔗 Follow-up — council will see the full previous verdict as
                  context
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                        submitFollowUp();
                    }}
                    placeholder="Ask a follow-up…"
                    style={{ ...formStyles.input, flex: 1, minWidth: 160 }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => {
                        setShowFollowUp(false);
                        setFollowUpText("");
                      }}
                      style={{
                        ...buttonStyles.ghost,
                        padding: "9px 12px",
                        fontSize: 12,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitFollowUp}
                      disabled={!followUpText.trim()}
                      style={{
                        padding: "9px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: followUpText.trim()
                          ? "linear-gradient(135deg,#60a5fa,#a78bfa)"
                          : "rgba(255,255,255,0.05)",
                        color: followUpText.trim() ? "#fff" : tokens.textFaint,
                        cursor: followUpText.trim() ? "pointer" : "not-allowed",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Reconvene →
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: tokens.textFaint,
                    marginTop: 6,
                  }}
                >
                  ⌘+Enter to submit
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Responsive CSS injected into head */}
      <style>{`
        @media (max-width: 600px) {
          .desktop-sidebar { display: none !important; }
          .mobile-strip-opinions { display: block !important; }
          .mobile-strip-reviews { display: block !important; }
        }
        @media (min-width: 601px) {
          .mobile-strip-opinions { display: none !important; }
          .mobile-strip-reviews { display: none !important; }
        }
      `}</style>
    </div>
  );
}
