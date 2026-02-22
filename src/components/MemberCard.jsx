import { tokens, cardStyles, buttonStyles } from "../styles";
import { PROVIDERS } from "../constants/providers";
import { Badge } from "./atoms";

export function MemberCard({ member, isChairman, onRemove, onToggleChairman, onEdit }) {
  const pInfo = PROVIDERS[member.provider];
  return (
    <div
      style={{
        ...cardStyles.base,
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "13px 16px",
        border: `1px solid ${isChairman ? member.color + "66" : tokens.borderSubtle}`,
      }}
    >
      {isChairman && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg,transparent,${member.color},transparent)`,
          }}
        />
      )}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${member.color}1a`,
          border: `1px solid ${member.color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          color: member.color,
          flexShrink: 0,
        }}
      >
        {member.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, color: tokens.textPrimary, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {member.name}
          </span>
          {isChairman && <Badge label="👑 Chairman" color={member.color} />}
        </div>
        <div style={{ fontSize: 11, color: tokens.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ color: pInfo.color }}>{pInfo.icon} {pInfo.name}</span>
          <span style={{ margin: "0 4px" }}>·</span>
          <span style={{ fontFamily: "monospace" }}>{member.model.split(":")[0].slice(0, 18)}</span>
          <span style={{ margin: "0 4px" }}>·</span>
          <span>{member.personaLabel}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 5 }}>
        <button
          onClick={onToggleChairman}
          title="Toggle Chairman"
          style={{
            ...buttonStyles.iconSquare,
            border: `1px solid ${isChairman ? member.color + "55" : tokens.borderSubtle}`,
            background: isChairman ? `${member.color}18` : "transparent",
            color: isChairman ? member.color : tokens.textMuted,
          }}
        >
          👑
        </button>
        {onEdit && (
          <button onClick={onEdit} title="Edit" style={{ ...buttonStyles.iconSquare, color: tokens.textMuted }}>
            ✎
          </button>
        )}
        <button onClick={onRemove} title="Remove" style={buttonStyles.iconSquare}>
          ✕
        </button>
      </div>
    </div>
  );
}
