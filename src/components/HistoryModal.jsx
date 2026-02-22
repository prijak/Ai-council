import { useState } from "react";
import { tokens, textStyles, buttonStyles } from "../styles";
import { downloadMarkdown, exportPDF } from "../lib/export";

function HistoryDetailView({ session }) {
  const [tab, setTab] = useState("opinions");
  const ids = session.memberIds || Object.keys(session.responses || {});
  const names = session.memberNames || [];
  const [activeId, setActiveId] = useState(ids[0]);

  const tabs = [
    { id: "opinions", label: "I · First Opinions", hasData: Object.keys(session.responses || {}).length > 0 },
    { id: "reviews", label: "II · Peer Review", hasData: Object.keys(session.reviews || {}).length > 0 },
    { id: "verdict", label: "III · Final Verdict", hasData: !!session.verdict },
  ];
  const pool = tab === "opinions" ? session.responses || {} : session.reviews || {};

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${tokens.borderSubtle}`, background: "rgba(167,139,250,0.03)" }}>
        <div style={textStyles.queryText}>"{session.query}"</div>
        {session.followUpChain?.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#60a5fa" }}>
            🔗 {session.followUpChain.length} follow-up round{session.followUpChain.length !== 1 ? "s" : ""} in this session
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 2, padding: "12px 20px 0", borderBottom: `1px solid ${tokens.borderSubtle}` }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px 8px 0 0",
              border: "none",
              background: tab === t.id ? "rgba(167,139,250,0.12)" : "transparent",
              color: tab === t.id ? "#c4b5fd" : tokens.textMuted,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: tab === t.id ? 700 : 400,
              borderBottom: tab === t.id ? "2px solid #a78bfa" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {t.label}
            {!t.hasData && <span style={{ marginLeft: 5, opacity: 0.4, fontSize: 10 }}>—</span>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {(tab === "opinions" || tab === "reviews") && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ width: "clamp(110px,20vw,180px)", borderRight: `1px solid ${tokens.borderSubtle}`, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
              {ids.map((id, i) => (
                <button
                  key={id}
                  onClick={() => setActiveId(id)}
                  style={{
                    padding: "9px 11px",
                    borderRadius: 8,
                    border: `1px solid ${activeId === id ? "rgba(167,139,250,0.4)" : tokens.borderSubtle}`,
                    background: activeId === id ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.02)",
                    color: activeId === id ? "#c4b5fd" : tokens.textMuted,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: activeId === id ? 600 : 400,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{names[i] || id}</span>
                  {pool[id] && <div style={{ width: 5, height: 5, borderRadius: "50%", background: tab === "opinions" ? tokens.primary : tokens.success, flexShrink: 0, marginLeft: 6 }} />}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, padding: "18px 20px", overflowY: "auto" }}>
              {activeId && pool[activeId] ? (
                <div style={{ ...textStyles.responseBody, ...(tab === "reviews" ? { color: "#9998aa" } : {}) }}>
                  {pool[activeId]}
                </div>
              ) : (
                <div style={{ color: tokens.textFaint, fontSize: 13, fontStyle: "italic" }}>
                  No {tab === "opinions" ? "response" : "peer review"} recorded.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "verdict" && (
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
            {session.verdict ? (
              <div style={textStyles.verdictBody}>{session.verdict}</div>
            ) : (
              <div style={{ color: tokens.textFaint, fontSize: 13, fontStyle: "italic" }}>
                No verdict was recorded for this session.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function HistoryModal({ sessions, onClose, onLoad }) {
  const [selected, setSelected] = useState(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          width: "min(900px,100vw)",
          height: "min(700px,100dvh)",
          background: "linear-gradient(160deg,#0e0e1a,#080810)",
          border: `1px solid rgba(167,139,250,0.2)`,
          borderRadius: "clamp(0px,2vw,18px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 120px rgba(0,0,0,0.8)",
          animation: "slideDown 0.2s ease",
        }}
      >
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${tokens.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(167,139,250,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {selected && (
              <button onClick={() => setSelected(null)} style={{ ...buttonStyles.ghost, padding: "4px 10px", fontSize: 12 }}>← Back</button>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{selected ? "Session Detail" : "Session History"}</div>
              <div style={{ fontSize: 10, color: tokens.textFaint, letterSpacing: 1, marginTop: 1 }}>{sessions.length} PAST {sessions.length === 1 ? "QUERY" : "QUERIES"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {selected && (
              <>
                <button onClick={() => downloadMarkdown(selected)} style={{ ...buttonStyles.ghost, padding: "5px 12px", fontSize: 12 }}>⬇ Markdown</button>
                <button onClick={() => exportPDF(selected)} style={{ ...buttonStyles.ghost, padding: "5px 12px", fontSize: 12 }}>🖨 PDF</button>
                <button
                  onClick={() => { onLoad(selected); onClose(); }}
                  style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid rgba(167,139,250,0.35)`, background: "rgba(167,139,250,0.1)", color: "#c4b5fd", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                >
                  Restore Session →
                </button>
              </>
            )}
            <button onClick={onClose} style={{ ...buttonStyles.iconSquare, width: 32, height: 32 }}>✕</button>
          </div>
        </div>

        {!selected && (
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {sessions.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: tokens.textFaint }}>
                <div style={{ fontSize: 40, opacity: 0.3 }}>📋</div>
                <div style={{ fontSize: 14 }}>No history yet — run a query to start.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...sessions].reverse().map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => setSelected(sess)}
                    style={{ padding: "16px 18px", background: "rgba(255,255,255,0.025)", border: `1px solid ${tokens.borderSubtle}`, borderRadius: 12, cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)"; e.currentTarget.style.background = "rgba(167,139,250,0.05)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = tokens.borderSubtle; e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                  >
                    <div style={{ fontSize: 14, color: "#c4b8f0", fontFamily: "Georgia,serif", fontStyle: "italic", marginBottom: 8, lineHeight: 1.45 }}>
                      "{sess.query.slice(0, 140)}{sess.query.length > 140 ? "…" : ""}"
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: tokens.textFaint }}>{new Date(sess.ts).toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: tokens.textMuted }}>·</span>
                      <span style={{ fontSize: 11, color: tokens.textMuted }}>{(sess.memberNames || []).join(", ") || "unknown members"}</span>
                      {sess.temperature !== undefined && (
                        <span style={{ fontSize: 10, color: "#a78bfa", background: "rgba(167,139,250,0.08)", padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(167,139,250,0.2)" }}>
                          🌡 {Math.round(sess.temperature * 100)}%
                        </span>
                      )}
                      {sess.verdict && <span style={{ fontSize: 10, color: tokens.success, background: "rgba(52,211,153,0.08)", padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(52,211,153,0.2)" }}>✓ verdict</span>}
                      {sess.followUpChain?.length > 0 && (
                        <span style={{ fontSize: 10, color: "#60a5fa", background: "rgba(96,165,250,0.08)", padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(96,165,250,0.2)" }}>
                          🔗 {sess.followUpChain.length} follow-up{sess.followUpChain.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selected && <HistoryDetailView session={selected} />}
      </div>
    </div>
  );
}
