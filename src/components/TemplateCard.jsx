import { tokens } from "../styles";

export function TemplateCard({ tmpl, onLoad }) {
  return (
    <div
      onClick={() => onLoad(tmpl)}
      style={{
        padding: "14px 16px",
        background: `${tmpl.color}08`,
        border: `1px solid ${tmpl.color}33`,
        borderRadius: 12,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${tmpl.color}14`;
        e.currentTarget.style.borderColor = `${tmpl.color}66`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${tmpl.color}08`;
        e.currentTarget.style.borderColor = `${tmpl.color}33`;
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
        <span style={{ fontSize: 18 }}>{tmpl.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{tmpl.name}</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: tmpl.color,
            background: `${tmpl.color}1a`,
            border: `1px solid ${tmpl.color}33`,
            borderRadius: 4,
            padding: "1px 7px",
          }}
        >
          {tmpl.members.length} members
        </span>
      </div>
      <div style={{ fontSize: 11, color: tokens.textMuted, lineHeight: 1.5, marginBottom: 8 }}>
        {tmpl.description}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {tmpl.members.map((m, i) => (
          <span
            key={i}
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 4,
              background: `${tmpl.color}15`,
              color: tmpl.color,
              border: `1px solid ${tmpl.color}30`,
            }}
          >
            {m.isChairman ? "👑 " : ""}{m.name}
          </span>
        ))}
      </div>
    </div>
  );
}
