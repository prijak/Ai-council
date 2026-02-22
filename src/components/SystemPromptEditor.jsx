import { useState } from "react";
import { tokens, formStyles } from "../styles";

export function SystemPromptEditor({ prompt, override, accentColor, onChange }) {
  const [open, setOpen] = useState(!!override);
  const hasOverride = override.trim().length > 0;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 7,
        }}
      >
        <label style={{ ...formStyles.label, marginBottom: 0 }}>
          System Prompt{" "}
          {hasOverride && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                fontWeight: 700,
                color: tokens.warning,
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.3)",
                padding: "1px 7px",
                borderRadius: 4,
              }}
            >
              ✎ customized
            </span>
          )}
        </label>
        <div style={{ display: "flex", gap: 6 }}>
          {hasOverride && (
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              style={{
                fontSize: 11,
                color: tokens.textMuted,
                background: "none",
                border: `1px solid ${tokens.borderSubtle}`,
                borderRadius: 5,
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              ↺ Reset
            </button>
          )}
          {!open && (
            <button
              onClick={() => setOpen(true)}
              style={{
                fontSize: 11,
                color: accentColor,
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}44`,
                borderRadius: 5,
                padding: "2px 9px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ✎ Customize
            </button>
          )}
          {open && (
            <button
              onClick={() => setOpen(false)}
              style={{
                fontSize: 11,
                color: tokens.textMuted,
                background: "none",
                border: `1px solid ${tokens.borderSubtle}`,
                borderRadius: 5,
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              ▲ Collapse
            </button>
          )}
        </div>
      </div>

      {!open && (
        <div
          onClick={() => setOpen(true)}
          style={{
            padding: "9px 12px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 7,
            fontSize: 11,
            color: hasOverride ? "#d4c97a" : tokens.textMuted,
            lineHeight: 1.6,
            borderLeft: `2px solid ${hasOverride ? tokens.warning : accentColor}44`,
            fontStyle: "italic",
            cursor: "pointer",
          }}
        >
          {(hasOverride ? override : prompt).slice(0, 140)}
          {(hasOverride ? override : prompt).length > 140 ? "…" : ""}
        </div>
      )}

      {open && (
        <div style={{ animation: "slideDown 0.15s ease" }}>
          {!hasOverride && (
            <div
              style={{
                marginBottom: 8,
                padding: "7px 11px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 6,
                borderLeft: `2px solid ${accentColor}33`,
                fontSize: 11,
                color: tokens.textFaint,
                fontStyle: "italic",
                lineHeight: 1.55,
              }}
            >
              Default: {prompt}
            </div>
          )}
          <textarea
            value={override}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            placeholder="Override the default prompt…"
            style={{
              ...formStyles.input,
              resize: "vertical",
              lineHeight: 1.6,
              borderColor: hasOverride ? "rgba(245,158,11,0.4)" : undefined,
              fontSize: 13,
            }}
          />
          <div style={{ fontSize: 11, color: tokens.textFaint, marginTop: 5 }}>
            Leave empty to use the default persona prompt.
          </div>
        </div>
      )}
    </div>
  );
}
