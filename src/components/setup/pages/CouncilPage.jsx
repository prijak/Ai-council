import { useState, useRef } from "react";
// NOTE: Adjust these paths to match your project structure.
// These assume: src/components/setup/pages/CouncilPage.jsx
import { COUNCIL_TEMPLATES, TEMPLATE_CATEGORIES } from "../../../constants/templates";
import { PERSONAS } from "../../../constants/personas";
import { PROVIDERS, ACCENT_COLORS, ACCENT_ICONS } from "../../../constants/providers";
import { parseCouncilJSON } from "../../../lib/importExportConfig";
import { uid } from "../../../lib/utils";
import { MemberCard } from "../../MemberCard";
import { useAuth } from "../../AuthGate";
import { MemberForm } from "../../MemberForm";
import { TemplateCard } from "../../TemplateCard";
import { PageHeader } from "../PageHeader";
import { ghostBtn, alertBox } from "../design";

const STAGES = [
  { n: "I",   t: "First Opinions", d: "All members respond independently", c: "#a78bfa" },
  { n: "II",  t: "Peer Review",    d: "Members critique each other",       c: "#60a5fa" },
  { n: "III", t: "Final Verdict",  d: "Chairman synthesizes the answer",   c: "#34d399" },
];

export function CouncilPage({ onLaunch }) {
  const [members, setMembers] = useState([]);
  const [chairmanId, setChairman] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("think-tank");
  const [importErr, setImportErr] = useState("");
  const [importOk, setImportOk] = useState(false);
  const importRef = useRef();
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!(user && !isAnonymous);
  const editMember = editingId ? members.find(m => m.id === editingId) : null;

  const errs = members.map(m => {
    const p = PROVIDERS[m.provider]; const miss = [];
    if (!m.model?.trim()) miss.push("model");
    if (p?.needsKey && !m.apiKey?.trim()) miss.push("API key");
    if (p?.needsEndpoint && !m.endpoint?.trim()) miss.push("endpoint");
    return { id: m.id, name: m.name, missing: miss };
  });
  const incomplete = errs.filter(e => e.missing.length > 0);
  const canLaunch = members.length >= 3 && chairmanId !== null && incomplete.length === 0;
  const need = Math.max(0, 3 - members.length);

  const addMember = m => { setMembers(p => [...p, m]); if (m.isChairman) setChairman(m.id); setShowForm(false); };
  const saveMember = u => { setMembers(p => p.map(m => m.id === u.id ? u : m)); setEditingId(null); };
  const removeMember = id => { setMembers(p => p.filter(m => m.id !== id)); if (chairmanId === id) setChairman(null); };
  const toggleChairman = id => setChairman(p => p === id ? null : id);

  const loadTemplate = tmpl => {
    const built = tmpl.members.map((tm, i) => {
      const persona = PERSONAS.find(p => p.id === tm.personaId) || PERSONAS[0];
      return { id: uid(), name: tm.name, provider: isLoggedIn ? "managed_sarvam" : "ollama", model: isLoggedIn ? "sarvam-m" : "", endpoint: isLoggedIn ? "" : "http://localhost:11434", apiKey: "", personaLabel: persona.label, systemPrompt: persona.prompt, color: ACCENT_COLORS[i % ACCENT_COLORS.length], icon: ACCENT_ICONS[i % ACCENT_ICONS.length], isChairman: tm.isChairman };
    });
    setMembers(built); setChairman(built.find(m => m.isChairman)?.id || null);
  };

  const handleImport = e => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try { const imp = parseCouncilJSON(ev.target.result); setMembers(imp); setChairman(imp.find(m => m.isChairman)?.id || null); setImportOk(true); setImportErr(""); setTimeout(() => setImportOk(false), 2500); }
      catch (err) { setImportErr(err.message); }
    };
    r.readAsText(file); e.target.value = "";
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify({ members: members.map(m => ({ ...m, apiKey: "" })) }, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "ai-council-config.json" });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ animation: "pageIn 0.28s ease" }}>
      <PageHeader
        icon="⚖" iconColor="#a78bfa" title="Council"
        subtitle="Assemble multiple AI models. Each gives an independent opinion, reviews each other, then Chairman delivers a final synthesized verdict."
        extra={<>
          {members.length > 0 && <button className="ai-ghost" onClick={exportConfig} style={ghostBtn()}>📤 Export</button>}
          <button className="ai-ghost" onClick={() => importRef.current?.click()} style={ghostBtn()}>📥 Import</button>
          <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
        </>}
      />

      {/* Stages */}
      <div style={{ padding: "0 clamp(20px,5vw,72px) 24px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {STAGES.map(s => (
            <div key={s.n} style={{ flex: "1 1 160px", padding: "12px 14px", borderRadius: 11, background: `${s.c}07`, border: `1px solid ${s.c}20` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 9, color: s.c, fontWeight: 800, background: `${s.c}18`, padding: "2px 7px", borderRadius: 20, border: `1px solid ${s.c}28` }}>{s.n}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{s.t}</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", lineHeight: 1.5 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="council-cols" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 22, padding: "0 clamp(20px,5vw,72px) 52px" }}>
        {/* Left — members */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase" }}>Members ({members.length})</span>
            {!showForm && !editingId && (
              <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.28)", color: "#c4b5fd", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>+ Add Member</button>
            )}
          </div>

          {importErr && <div style={alertBox("err")}>⚠ Import failed: {importErr}</div>}
          {importOk  && <div style={alertBox("ok")}>✓ Imported successfully.</div>}

          {members.length === 0 && !showForm && (
            <div style={{ padding: "48px 32px", textAlign: "center", border: "2px dashed rgba(167,139,250,0.12)", borderRadius: 16, color: "rgba(255,255,255,0.18)", marginBottom: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⚖</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>No members yet</div>
              <div style={{ fontSize: 12 }}>Pick a template → or add manually</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: showForm ? 12 : 0 }}>
            {members.map(m => (
              <div key={m.id}>
                <MemberCard member={m} isChairman={chairmanId === m.id} onRemove={() => removeMember(m.id)} onToggleChairman={() => toggleChairman(m.id)} onEdit={() => setEditingId(editingId === m.id ? null : m.id)} />
                {editingId === m.id && editMember && <MemberForm slotIndex={members.indexOf(m)} currentChairmanId={chairmanId} onAdd={saveMember} onCancel={() => setEditingId(null)} editMember={editMember} />}
              </div>
            ))}
          </div>
          {showForm && <MemberForm slotIndex={members.length} currentChairmanId={chairmanId} onAdd={addMember} onCancel={() => setShowForm(false)} />}

          {members.length >= 3 && chairmanId && incomplete.length > 0 && (
            <div style={{ ...alertBox("warn"), marginTop: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠ Complete setup to launch:</div>
              {incomplete.map(e => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 12 }}>
                  <span>›</span><span style={{ color: "#e5c55a" }}>{e.name}</span>
                  <span style={{ color: "rgba(245,158,11,0.6)" }}>missing {e.missing.join(", ")}</span>
                  <button onClick={() => setEditingId(e.id)} style={{ marginLeft: "auto", padding: "2px 9px", borderRadius: 5, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#fcd34d", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Edit →</button>
                </div>
              ))}
            </div>
          )}
          {!chairmanId && members.length >= 3 && <div style={{ ...alertBox("warn"), marginTop: 14 }}>⚠ No Chairman — tap 👑 to designate one.</div>}

          <button
            onClick={() => canLaunch && onLaunch(members, chairmanId)}
            disabled={!canLaunch}
            style={{
              width: "100%", marginTop: 18, padding: "15px",
              borderRadius: 12, border: "none", cursor: canLaunch ? "pointer" : "not-allowed",
              fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800,
              background: canLaunch ? "linear-gradient(135deg,#a78bfa,#60a5fa)" : "rgba(255,255,255,0.04)",
              color: canLaunch ? "#fff" : "rgba(255,255,255,0.18)",
              boxShadow: canLaunch ? "0 8px 28px rgba(167,139,250,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            {canLaunch ? `⚖ Convene ${members.length}-Member Council →`
              : need > 0 ? `Add ${need} more member${need !== 1 ? "s" : ""} to continue`
              : !chairmanId ? "Designate a Chairman to continue"
              : `Complete ${incomplete.length} member setup to continue`}
          </button>
        </div>

        {/* Right — templates */}
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Quick Templates</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {TEMPLATE_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="ai-ghost" style={{
                padding: "4px 11px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
                border: `1px solid ${activeCategory === cat.id ? "rgba(167,139,250,0.45)" : "rgba(255,255,255,0.07)"}`,
                background: activeCategory === cat.id ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.02)",
                color: activeCategory === cat.id ? "#c4b5fd" : "rgba(255,255,255,0.35)",
                fontSize: 11, fontWeight: activeCategory === cat.id ? 700 : 400, transition: "all 0.15s",
              }}>{cat.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {COUNCIL_TEMPLATES.filter(t => t.category === activeCategory).map(tmpl => (
              <TemplateCard key={tmpl.id} tmpl={tmpl} onLoad={loadTemplate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
