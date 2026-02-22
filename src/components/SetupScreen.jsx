import { useState, useRef } from "react";
import { tokens, layoutStyles, textStyles, cardStyles, buttonStyles } from "../styles";
import { COUNCIL_TEMPLATES, TEMPLATE_CATEGORIES } from "../constants/templates";
import { PERSONAS } from "../constants/personas";
import { ACCENT_COLORS, ACCENT_ICONS } from "../constants/providers";
import { parseCouncilJSON } from "../lib/importExportConfig";
import { uid } from "../lib/utils";
import { MemberCard } from "./MemberCard";
import { MemberForm } from "./MemberForm";
import { TemplateCard } from "./TemplateCard";

export function SetupScreen({ onLaunch }) {
  const [members, setMembers] = useState([]);
  const [chairmanId, setChairman] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showTpl, setShowTpl] = useState(false);
  const [activeCategory, setActiveCategory] = useState("think-tank");
  const [importErr, setImportErr] = useState("");
  const [importOk, setImportOk] = useState(false);
  const importRef = useRef();
  const editMember = editingId ? members.find((m) => m.id === editingId) : null;

  const addMember = (m) => {
    setMembers((p) => [...p, m]);
    if (m.isChairman) setChairman(m.id);
    setShowForm(false);
  };
  const saveMember = (u) => {
    setMembers((p) => p.map((m) => (m.id === u.id ? u : m)));
    setEditingId(null);
  };
  const removeMember = (id) => {
    setMembers((p) => p.filter((m) => m.id !== id));
    if (chairmanId === id) setChairman(null);
  };
  const toggleChairman = (id) => setChairman((p) => (p === id ? null : id));

  const canLaunch = members.length >= 3 && chairmanId !== null;
  const need = Math.max(0, 3 - members.length);

  const loadTemplate = (tmpl) => {
    setImportErr("");
    setImportOk(false);
    const built = tmpl.members.map((tm, i) => {
      const persona = PERSONAS.find((p) => p.id === tm.personaId) || PERSONAS[0];
      return {
        id: uid(),
        name: tm.name,
        provider: "ollama",
        model: "",
        endpoint: "http://localhost:11434",
        apiKey: "",
        personaLabel: persona.label,
        systemPrompt: persona.prompt,
        color: ACCENT_COLORS[i % ACCENT_COLORS.length],
        icon: ACCENT_ICONS[i % ACCENT_ICONS.length],
        isChairman: tm.isChairman,
      };
    });
    setMembers(built);
    setChairman(built.find((m) => m.isChairman)?.id || null);
    setShowTpl(false);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imp = parseCouncilJSON(ev.target.result);
        setMembers(imp);
        setChairman(imp.find((m) => m.isChairman)?.id || null);
        setImportOk(true);
        setImportErr("");
        setTimeout(() => setImportOk(false), 2500);
      } catch (err) {
        setImportErr(err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportConfig = () => {
    const data = {
      members: members.map((m) => ({
        name: m.name, provider: m.provider, model: m.model, endpoint: m.endpoint,
        apiKey: "", personaLabel: m.personaLabel, systemPrompt: m.systemPrompt,
        color: m.color, icon: m.icon, isChairman: m.isChairman,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "ai-council-config.json" });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filteredTemplates = COUNCIL_TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div style={layoutStyles.page}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${tokens.borderSubtle}`, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 7, background: "linear-gradient(135deg,#a78bfa,#60a5fa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚖</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>AI Council</div>
          <div style={textStyles.sectionLabel}>Council Builder</div>
        </div>
        {members.length > 0 && (
          <button onClick={exportConfig} style={{ ...buttonStyles.ghost, marginLeft: "auto", padding: "5px 12px", fontSize: 12 }}>📤 Export Config</button>
        )}
      </div>

      <div style={layoutStyles.contentWell}>
        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: "clamp(26px,6vw,40px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 14, letterSpacing: -1 }}>
            Assemble your<br />
            <span style={{ background: "linear-gradient(135deg,#a78bfa 0%,#60a5fa 60%,#34d399 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              council of minds.
            </span>
          </h1>
          <p style={{ color: tokens.textMuted, fontSize: 15, lineHeight: 1.65, maxWidth: 500 }}>
            Mix Ollama, OpenAI, Groq, Anthropic, Google — or any compatible endpoint. Start from a template or build manually.
          </p>
        </div>

        {/* Stage overview */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 32 }}>
          {[
            { n: "I", t: "First Opinions", d: "All members respond independently" },
            { n: "II", t: "Peer Review", d: "Members critique each other anonymously" },
            { n: "III", t: "Final Verdict", d: "Chairman synthesizes the best answer" },
          ].map((s) => (
            <div key={s.n} style={{ padding: "13px 15px", background: "rgba(255,255,255,0.02)", border: `1px solid ${tokens.borderSubtle}`, borderRadius: 10 }}>
              <div style={{ ...textStyles.sectionLabel, color: tokens.primary, letterSpacing: 3, marginBottom: 5 }}>{s.n}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc", marginBottom: 3 }}>{s.t}</div>
              <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.45 }}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* Templates */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setShowTpl((s) => !s)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid rgba(167,139,250,0.3)`, background: "rgba(167,139,250,0.05)", color: "#c4b5fd", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <span>✨ Start from a template</span>
            <span style={{ fontSize: 11, opacity: 0.6 }}>{showTpl ? "▲ Collapse" : `▼ Show ${COUNCIL_TEMPLATES.length} templates`}</span>
          </button>

          {showTpl && (
            <div style={{ animation: "slideDown 0.2s ease" }}>
              <div style={{ display: "flex", gap: 6, marginTop: 12, marginBottom: 12, flexWrap: "wrap" }}>
                {TEMPLATE_CATEGORIES.map((cat) => {
                  const count = COUNCIL_TEMPLATES.filter((t) => t.category === cat.id).length;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${isActive ? "rgba(167,139,250,0.5)" : tokens.borderSubtle}`, background: isActive ? "rgba(167,139,250,0.12)" : "transparent", color: isActive ? "#c4b5fd" : tokens.textMuted, cursor: "pointer", fontSize: 12, fontWeight: isActive ? 700 : 400, display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span>{cat.icon}</span><span>{cat.label}</span>
                      <span style={{ fontSize: 10, background: isActive ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 4, color: isActive ? "#c4b5fd" : tokens.textFaint }}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
                {filteredTemplates.map((t) => <TemplateCard key={t.id} tmpl={t} onLoad={loadTemplate} />)}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: tokens.textFaint }}>
                ⚠ Templates load persona structure only — you still need to set provider, model, and API key per member.
              </div>
            </div>
          )}
        </div>

        {/* Members header */}
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={textStyles.sectionLabel}>
            Members ({members.length})
            {members.length >= 3 && !chairmanId && (
              <span style={{ marginLeft: 10, color: tokens.warning, fontSize: 11, textTransform: "none", fontWeight: 500, letterSpacing: 0 }}>← tap 👑 to set chairman</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={() => importRef.current?.click()} style={{ ...buttonStyles.ghost, padding: "5px 12px", fontSize: 12 }}>📥 Import JSON</button>
            <input ref={importRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: "none" }} />
            {!showForm && !editingId && (
              <button onClick={() => setShowForm(true)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid rgba(167,139,250,0.35)`, background: "rgba(167,139,250,0.08)", color: "#c4b5fd", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Member</button>
            )}
          </div>
        </div>

        {importErr && <div style={{ ...cardStyles.errorBox, marginBottom: 12 }}>⚠ Import failed: {importErr}</div>}
        {importOk && <div style={{ ...cardStyles.infoBox, marginBottom: 12 }}>✓ Council imported successfully — set provider/model/keys for each member.</div>}

        {members.length === 0 && !showForm && (
          <div style={{ padding: 36, textAlign: "center", border: `2px dashed ${tokens.borderSubtle}`, borderRadius: 12, color: tokens.textFaint, marginBottom: 14 }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>⚖</div>
            <div style={{ fontSize: 13 }}>No members yet — pick a template above or add members manually</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <div key={m.id}>
              <MemberCard member={m} isChairman={chairmanId === m.id} onRemove={() => removeMember(m.id)} onToggleChairman={() => toggleChairman(m.id)} onEdit={() => setEditingId(editingId === m.id ? null : m.id)} />
              {editingId === m.id && editMember && (
                <MemberForm slotIndex={members.indexOf(m)} currentChairmanId={chairmanId} onAdd={saveMember} onCancel={() => setEditingId(null)} editMember={editMember} />
              )}
            </div>
          ))}
        </div>

        {showForm && <MemberForm slotIndex={members.length} currentChairmanId={chairmanId} onAdd={addMember} onCancel={() => setShowForm(false)} />}

        <button
          onClick={() => canLaunch && onLaunch(members, chairmanId)}
          disabled={!canLaunch}
          style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", fontSize: 15, fontWeight: 700, marginTop: 24, background: canLaunch ? "linear-gradient(135deg,#a78bfa,#60a5fa)" : "rgba(255,255,255,0.04)", color: canLaunch ? "#fff" : tokens.textFaint, cursor: canLaunch ? "pointer" : "not-allowed" }}
        >
          {canLaunch ? `Convene ${members.length}-Member Council →` : need > 0 ? `Add ${need} more member${need !== 1 ? "s" : ""} to continue` : "Designate a Chairman to continue"}
        </button>
      </div>
    </div>
  );
}
