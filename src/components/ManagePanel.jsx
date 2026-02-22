import { useState } from "react";
import { tokens, layoutStyles, cardStyles, buttonStyles } from "../styles";
import { MemberCard } from "./MemberCard";
import { MemberForm } from "./MemberForm";

export function ManagePanel({ members, chairmanId, onClose, onUpdateMembers, onUpdateChairman }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editMember = editingId ? members.find((m) => m.id === editingId) : null;

  const addMember = (m) => {
    onUpdateMembers([...members, m]);
    if (m.isChairman) onUpdateChairman(m.id);
    setShowForm(false);
  };

  const saveMember = (u) => {
    onUpdateMembers(members.map((m) => (m.id === u.id ? u : m)));
    setEditingId(null);
  };

  const removeMember = (id) => {
    onUpdateMembers(members.filter((m) => m.id !== id));
    if (chairmanId === id) onUpdateChairman(null);
  };

  const toggleChairman = (id) => onUpdateChairman(chairmanId === id ? null : id);

  return (
    <>
      <div onClick={onClose} style={layoutStyles.backdrop} />
      <div style={{
        ...layoutStyles.sidePanel,
        /* On mobile: full screen overlay instead of side panel */
        width: "min(420px, 100vw)",
        right: 0,
        left: "auto",
      }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${tokens.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: tokens.bgPanel, zIndex: 1 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Manage Council</div>
            <div style={{ fontSize: 10, color: tokens.textFaint, letterSpacing: 1, marginTop: 1 }}>{members.length} MEMBERS</div>
          </div>
          <button onClick={onClose} style={buttonStyles.iconSquare}>✕</button>
        </div>

        <div style={{ padding: "16px 18px", overflowY: "auto", flex: 1 }}>
          <div style={{ ...cardStyles.infoBox, marginBottom: 16, fontSize: 12 }}>
            ✓ Changes apply to the <strong>next query</strong> — current session is untouched.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {members.map((m) => (
              <div key={m.id}>
                <MemberCard
                  member={m}
                  isChairman={chairmanId === m.id}
                  onRemove={() => removeMember(m.id)}
                  onToggleChairman={() => toggleChairman(m.id)}
                  onEdit={() => setEditingId(editingId === m.id ? null : m.id)}
                />
                {editingId === m.id && editMember && (
                  <MemberForm
                    slotIndex={members.indexOf(m)}
                    currentChairmanId={chairmanId}
                    onAdd={saveMember}
                    onCancel={() => setEditingId(null)}
                    editMember={editMember}
                  />
                )}
              </div>
            ))}
          </div>

          {!showForm && !editingId && (
            <button onClick={() => setShowForm(true)} style={buttonStyles.dashed}>
              + Add Another Member
            </button>
          )}

          {showForm && (
            <MemberForm
              slotIndex={members.length}
              currentChairmanId={chairmanId}
              onAdd={addMember}
              onCancel={() => setShowForm(false)}
            />
          )}

          {!chairmanId && members.length >= 3 && (
            <div style={{ ...cardStyles.warnBox, marginTop: 14 }}>
              ⚠ No Chairman — tap 👑 to designate one.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
