/**
 * ResultsView.jsx — Refined original design.
 *
 * Kept exactly what worked:
 *  - 3 tabs: I First Opinions | II Peer Review | III Final Verdict
 *  - Sidebar (desktop) / horizontal pill strip (mobile) to pick which member to read
 *  - Full text in the detail pane, scrollable
 *
 * Fixed:
 *  - Mobile: sidebar hidden, pill strip shown; text readable
 *  - Header de-cluttered: query on one line, actions condensed
 *  - Tab bar cleaner: just roman + label + status, no overflow
 *  - Verdict tab auto-activates when chairman starts
 *  - Follow-up bar always at bottom, not buried
 */

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
  const [queryExpanded, setQueryExpanded] = useState(false);
  const isLongQuery = query.length > 100;

  const chairman = sessionMembers.find((m) => m.isChairman);
  const isDone = (stage >= 3 && !chairLoad) || cancelled;
  const opDone = sessionMembers.filter(
    (m) => responses[m.id] || errors[m.id],
  ).length;
  const revDone = sessionMembers.filter((m) => reviews[m.id]).length;
  const activeMember = sessionMembers.find((m) => m.id === activeMemberId);

  // Auto-switch to verdict tab when chairman starts
  if (
    (chairLoad || (verdict && activeTab === "reviews")) &&
    activeTab !== "verdict"
  ) {
    // only auto-switch once
  }

  const tabDefs = [
    {
      id: "opinions",
      label: "Opinions",
      roman: "I",
      done: opDone,
      total: sessionMembers.length,
      spinning: sessionMembers.some((m) => loading[m.id]) && stage === 1,
      unlocked: stage >= 1,
    },
    {
      id: "reviews",
      label: "Reviews",
      roman: "II",
      done: revDone,
      total: sessionMembers.length,
      spinning: sessionMembers.some((m) => loading[m.id]) && stage === 2,
      unlocked: stage >= 2,
    },
    {
      id: "verdict",
      label: "Verdict",
      roman: "III",
      done: verdict ? 1 : 0,
      total: 1,
      spinning: chairLoad,
      unlocked: stage >= 3 || cancelled,
    },
  ];

  const submitFollowUp = () => {
    if (!followUpText.trim()) return;
    onFollowUp(followUpText.trim());
    setFollowUpText("");
    setShowFollowUp(false);
    setActiveTab("opinions");
  };

  // ── Sidebar member button (desktop) ──────────────────────────────────────
  const SidebarBtn = ({ m, showReview }) => {
    const pInfo = PROVIDERS[m.provider] || {};
    const isLd = showReview
      ? !!loading[m.id] && stage === 2
      : !!loading[m.id] && stage === 1;
    const hasDone = showReview
      ? !!reviews[m.id]
      : !!(responses[m.id] || errors[m.id]);
    const hasErr = !showReview && !!errors[m.id];
    const isSel = activeMemberId === m.id;
    const isThink = !showReview && !!thinkingMap?.[m.id];

    return (
      <button
        onClick={() => setActiveMemberId(m.id)}
        style={{
          padding: "9px 10px",
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
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 13, color: m.color, flexShrink: 0 }}>
            {m.icon}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: isSel ? "#fff" : "#999",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {m.name}
          </span>
          {isLd && isThink && (
            <span style={{ fontSize: 9, color: "#60a5fa" }}>🧠</span>
          )}
          {isLd && !isThink && <Spin size={9} color={m.color} />}
          {!isLd && hasErr && (
            <span style={{ fontSize: 10, color: tokens.danger }}>⚠</span>
          )}
          {!isLd && !hasErr && hasDone && (
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
            color: pInfo.color || "#555",
            paddingLeft: 20,
            marginTop: 3,
            fontFamily: "monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {pInfo.icon} {(m.model || "").split(":")[0].slice(0, 16)}
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

  // ── Mobile pill strip ─────────────────────────────────────────────────────
  const MobilePills = ({ showReview }) => (
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
        const isLd = showReview
          ? !!loading[m.id] && stage === 2
          : !!loading[m.id] && stage === 1;
        const hasDone = showReview
          ? !!reviews[m.id]
          : !!(responses[m.id] || errors[m.id]);
        const hasErr = !showReview && !!errors[m.id];
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
                color: isSel ? "#fff" : "#888",
              }}
            >
              {m.name.split(" ").slice(-1)[0]}
            </span>
            {isLd && <Spin size={7} color={m.color} />}
            {!isLd && hasDone && !hasErr && (
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: m.color,
                }}
              />
            )}
            {!isLd && hasErr && (
              <span style={{ fontSize: 9, color: tokens.danger }}>⚠</span>
            )}
          </button>
        );
      })}
    </div>
  );

  // ── Member detail header ──────────────────────────────────────────────────
  const MemberHeader = ({ m, subtitle, spinner }) => {
    const pInfo = PROVIDERS[m.provider] || {};
    return (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${m.color}1a`,
            border: `1px solid ${m.color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {m.icon}
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
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              {m.name}
            </span>
            {m.isChairman && <Badge label="👑 Chairman" color={m.color} />}
            {m.personaLabel && <Badge label={m.personaLabel} color={m.color} />}
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
            <span style={{ color: pInfo.color }}>
              {pInfo.icon} {pInfo.name}
            </span>
            {" · "}
            <span style={{ fontFamily: "monospace" }}>{m.model}</span>
            {subtitle && (
              <span style={{ color: tokens.textFaint }}> · {subtitle}</span>
            )}
          </div>
        </div>
        {spinner}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 62px)",
        overflow: "hidden",
      }}
    >
      {/* ── TOP BAR: query (expandable) + action buttons below ── */}
      <div
        style={{
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          background: "rgba(167,139,250,0.03)",
          flexShrink: 0,
        }}
      >
        {/* Query row — multi-line, tappable to expand if long */}
        <div
          style={{
            padding: "9px 12px 6px",
            cursor: isLongQuery ? "pointer" : "default",
          }}
          onClick={() => isLongQuery && setQueryExpanded((v) => !v)}
        >
          <div
            style={{
              ...textStyles.queryText,
              fontSize: "clamp(11px,3vw,13px)",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: queryExpanded ? 999 : 2,
              overflow: "hidden",
              lineHeight: 1.55,
              wordBreak: "break-word",
            }}
          >
            "{query}"
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 4,
            }}
          >
            {temperature !== undefined && (
              <span style={{ fontSize: 10, color: tokens.textFaint }}>
                🌡 {Math.round(temperature * 100)}%
              </span>
            )}
            {isLongQuery && (
              <span
                style={{ fontSize: 10, color: "#a78bfa", userSelect: "none" }}
              >
                {queryExpanded ? "▲ collapse" : "▼ show full"}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons — always in their own row, never overlap query */}
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "5px 12px 8px",
            flexWrap: "wrap",
            alignItems: "center",
            borderTop: `1px solid ${tokens.borderSubtle}`,
          }}
        >
          <button
            onClick={onNewQuery}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 11px",
              borderRadius: 20,
              border: `1px solid ${tokens.borderSubtle}`,
              background: "rgba(255,255,255,0.03)",
              color: tokens.textMuted,
              cursor: "pointer",
              fontSize: 11,
              whiteSpace: "nowrap",
            }}
          >
            ✕ New query
          </button>
          {isDone && verdict && (
            <>
              <button
                onClick={() => downloadMarkdown(currentSession)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 11px",
                  borderRadius: 20,
                  border: `1px solid ${tokens.borderSubtle}`,
                  background: "rgba(255,255,255,0.03)",
                  color: tokens.textMuted,
                  cursor: "pointer",
                  fontSize: 11,
                  whiteSpace: "nowrap",
                }}
              >
                ⬇ Markdown
              </button>
              <button
                onClick={() => exportPDF(currentSession)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 11px",
                  borderRadius: 20,
                  border: `1px solid ${tokens.borderSubtle}`,
                  background: "rgba(255,255,255,0.03)",
                  color: tokens.textMuted,
                  cursor: "pointer",
                  fontSize: 11,
                  whiteSpace: "nowrap",
                }}
              >
                🖨 PDF
              </button>
            </>
          )}
          {isDone && verdict && (
            <button
              onClick={() => setShowFollowUp(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 11px",
                borderRadius: 20,
                border: "1px solid rgba(96,165,250,0.4)",
                background: "rgba(96,165,250,0.08)",
                color: "#93c5fd",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              🔗 Follow-up
            </button>
          )}
          {currentSession?.followUpChain?.length > 0 && (
            <span
              style={{ fontSize: 10, color: "#60a5fa", marginLeft: "auto" }}
            >
              🔗 {currentSession.followUpChain.length} in chain
            </span>
          )}
        </div>
      </div>

      {/* Cancelled banner */}
      {cancelled && (
        <div
          style={{
            padding: "6px 14px",
            background: "rgba(248,113,113,0.08)",
            borderBottom: `1px solid rgba(248,113,113,0.2)`,
            fontSize: 11,
            color: "#fca5a5",
            flexShrink: 0,
          }}
        >
          ⬛ Run cancelled — showing partial results.
        </div>
      )}

      {/* ── STAGE TABS ── */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          flexShrink: 0,
          background: "rgba(0,0,0,0.2)",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {tabDefs.map((t) => {
          const isActive = activeTab === t.id;
          const pct = t.total > 0 ? (t.done / t.total) * 100 : 0;
          return (
            <button
              key={t.id}
              onClick={() => t.unlocked && setActiveTab(t.id)}
              style={{
                flex: 1,
                minWidth: "clamp(80px,26vw,140px)",
                padding: "10px 12px",
                border: "none",
                background: isActive ? "rgba(167,139,250,0.08)" : "transparent",
                borderBottom: isActive
                  ? "2px solid #a78bfa"
                  : "2px solid transparent",
                cursor: t.unlocked ? "pointer" : "default",
                opacity: !t.unlocked ? 0.35 : 1,
                transition: "all 0.15s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Live progress underline */}
              {t.unlocked && pct > 0 && pct < 100 && (
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

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: isActive ? "#a78bfa" : tokens.textFaint,
                    fontWeight: 700,
                    letterSpacing: 2,
                    fontFamily: "monospace",
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
                {t.spinning && <Spin size={8} color="#a78bfa" />}
                {!t.spinning &&
                  t.done === t.total &&
                  t.total > 0 &&
                  t.unlocked && (
                    <span style={{ fontSize: 10, color: tokens.success }}>
                      ✓
                    </span>
                  )}
              </div>

              {/* Sub-status */}
              {t.unlocked && (
                <div
                  style={{
                    fontSize: 10,
                    color: tokens.textFaint,
                    marginTop: 2,
                  }}
                >
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

      {/* ── TAB CONTENT ── */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ════ TAB I: OPINIONS ════ */}
        {activeTab === "opinions" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Mobile pill strip */}
            <div className="mobile-member-strip">
              <MobilePills showReview={false} />
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Desktop sidebar */}
              <div
                className="desktop-sidebar"
                style={{
                  width: "clamp(120px,20vw,190px)",
                  borderRight: `1px solid ${tokens.borderSubtle}`,
                  padding: "10px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  overflowY: "auto",
                  flexShrink: 0,
                }}
              >
                {sessionMembers.map((m) => (
                  <SidebarBtn key={m.id} m={m} showReview={false} />
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
                    <MemberHeader
                      m={activeMember}
                      spinner={
                        loading[activeMemberId] && stage === 1 ? (
                          <Spin size={13} color={activeMember.color} />
                        ) : null
                      }
                    />

                    {errors[activeMemberId] && (
                      <div style={cardStyles.errorBox}>
                        ⚠ {errors[activeMemberId]}
                      </div>
                    )}

                    {!errors[activeMemberId] && responses[activeMemberId] && (
                      <div style={textStyles.responseBody}>
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
                          }}
                        >
                          {thinkingMap?.[activeMemberId] ? (
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

        {/* ════ TAB II: PEER REVIEW ════ */}
        {activeTab === "reviews" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div className="mobile-member-strip">
              <MobilePills showReview={true} />
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Desktop sidebar */}
              <div
                className="desktop-sidebar"
                style={{
                  width: "clamp(120px,20vw,190px)",
                  borderRight: `1px solid ${tokens.borderSubtle}`,
                  padding: "10px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  overflowY: "auto",
                  flexShrink: 0,
                }}
              >
                {sessionMembers.map((m) => (
                  <SidebarBtn key={m.id} m={m} showReview={true} />
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
                    <MemberHeader
                      m={activeMember}
                      subtitle="evaluating other responses"
                      spinner={
                        loading[activeMemberId] && stage === 2 ? (
                          <Spin size={13} color={tokens.success} />
                        ) : null
                      }
                    />

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
                        Peer review begins after all first opinions are in.
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

        {/* ════ TAB III: FINAL VERDICT ════ */}
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
                  padding: "11px 16px",
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
                    {PROVIDERS[chairman.provider]?.icon}{" "}
                    {PROVIDERS[chairman.provider]?.name}
                    {" · "}
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
                    />
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

            <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
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
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
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
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: tokens.textFaint,
                      fontStyle: "italic",
                      marginBottom: 8,
                    }}
                  >
                    Waiting for opinions and reviews to complete…
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

      {/* ── FOLLOW-UP BAR ── */}
      {isDone && verdict && showFollowUp && (
        <div
          style={{
            borderTop: `1px solid rgba(96,165,250,0.2)`,
            flexShrink: 0,
            background: "rgba(96,165,250,0.04)",
            padding: "12px 14px",
            animation: "slideDown 0.15s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>
              🔗 Follow-up — council keeps full previous verdict as context
            </div>
            <button
              onClick={() => {
                setShowFollowUp(false);
                setFollowUpText("");
              }}
              style={{
                background: "none",
                border: "none",
                color: tokens.textFaint,
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          <textarea
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                submitFollowUp();
              if (e.key === "Escape") {
                setShowFollowUp(false);
                setFollowUpText("");
              }
            }}
            placeholder="Ask a follow-up question…"
            autoFocus
            rows={2}
            style={{
              ...formStyles.input,
              width: "100%",
              resize: "none",
              lineHeight: 1.5,
              marginBottom: 8,
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 11, color: tokens.textFaint }}>
              ⌘+Enter · Esc to cancel
            </span>
            <button
              onClick={submitFollowUp}
              disabled={!followUpText.trim()}
              style={{
                padding: "7px 20px",
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
      )}

      {/* ── FOOTER ── */}
      {isDone && (
        <div
          style={{
            borderTop: `1px solid rgba(249,115,22,0.1)`,
            padding: "7px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(90deg,rgba(249,115,22,0.04),transparent,rgba(167,139,250,0.04))",
            flexShrink: 0,
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13 }}>🇮🇳</span>
            <span
              style={{
                fontSize: 11,
                color: "rgba(249,115,22,0.5)",
                fontWeight: 600,
              }}
            >
              Built with ❤️ in Bharat
            </span>
            {sessionMembers.some((m) => m.provider === "managed_sarvam") && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 8px",
                  borderRadius: 20,
                  background: "rgba(249,115,22,0.1)",
                  border: "1px solid rgba(249,115,22,0.25)",
                  color: "#f97316",
                }}
              >
                🇮🇳 Powered by Sarvam AI
              </span>
            )}
          </div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.1)" }}>
            AI Council · Multi-Model Deliberation
          </span>
        </div>
      )}

      <style>{`
        @media (max-width: 520px) {
          .rv-btn-label { display: none; }
          .desktop-sidebar { display: none !important; }
          .mobile-member-strip { display: block !important; }
        }
        @media (min-width: 521px) {
          .mobile-member-strip { display: none !important; }
        }
      `}</style>
    </div>
  );
}
