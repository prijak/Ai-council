import { tokens } from "../../styles";

export function Spin({ size = 14, color = tokens.primary }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        border: `2px solid ${color}28`,
        borderTop: `2px solid ${color}`,
        borderRight: `2px solid ${color}`,
        borderRadius: "50%",
        animation: "spin 0.65s linear infinite",
      }}
    />
  );
}

export function Badge({ label, color }) {
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 4,
        fontSize: tokens.fontSm,
        fontWeight: 600,
        background: `${color}1a`,
        color,
        border: `1px solid ${color}44`,
        letterSpacing: 0.4,
      }}
    >
      {label}
    </span>
  );
}

export function Toggle({ on, onChange, label }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      onClick={onChange}
    >
      <div
        style={{
          width: 38,
          height: 21,
          borderRadius: 11,
          position: "relative",
          background: on ? tokens.primary : "rgba(255,255,255,0.1)",
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            width: 15,
            height: 15,
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: 3,
            left: on ? 19 : 3,
            transition: "left 0.2s",
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: on ? "#c4b5fd" : tokens.textMuted }}>
        {label}
      </span>
    </div>
  );
}

export function TemperatureSlider({ value, onChange }) {
  const color = value < 0.35 ? "#60a5fa" : value < 0.65 ? "#a78bfa" : "#f472b6";
  const label = value < 0.35 ? "Precise" : value < 0.65 ? "Balanced" : "Creative";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${tokens.borderSubtle}`,
        borderRadius: 9,
      }}
    >
      <span style={{ fontSize: 11, color: tokens.textFaint, whiteSpace: "nowrap" }}>🎯</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: color, cursor: "pointer", height: 4 }}
      />
      <span style={{ fontSize: 11, color: tokens.textFaint, whiteSpace: "nowrap" }}>🎨</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          background: `${color}18`,
          border: `1px solid ${color}44`,
          borderRadius: 5,
          padding: "2px 10px",
          minWidth: 80,
          textAlign: "center",
        }}
      >
        {label} {Math.round(value * 100)}%
      </span>
    </div>
  );
}
