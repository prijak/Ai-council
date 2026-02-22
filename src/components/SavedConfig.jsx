import { useState } from "react";
import { tokens, formStyles, buttonStyles } from "../styles";
import { PROVIDERS } from "../constants/providers";
import { saveConfig } from "../lib/storage";
import { Toggle } from "./atoms";

export function SavedConfigCard({ cfg, onLoad, onDelete }) {
  const pInfo = PROVIDERS[cfg.provider] || PROVIDERS.custom;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${tokens.borderSubtle}`,
        borderRadius: 9,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = pInfo.color + "66")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = tokens.borderSubtle)}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: `${pInfo.color}15`,
          border: `1px solid ${pInfo.color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: pInfo.color,
          flexShrink: 0,
        }}
      >
        {pInfo.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onLoad(cfg)}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#ddd",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cfg.label}
        </div>
        <div
          style={{
            fontSize: 11,
            color: tokens.textMuted,
            display: "flex",
            gap: 6,
            marginTop: 1,
          }}
        >
          <span style={{ color: pInfo.color }}>{pInfo.name}</span>
          <span>·</span>
          <span style={{ fontFamily: "monospace" }}>{(cfg.model || "").split(":")[0].slice(0, 20)}</span>
          {cfg.apiKey && (
            <>
              <span>·</span>
              <span style={{ color: tokens.success }}>🔑 key saved</span>
            </>
          )}
        </div>
      </div>
      <button
        onClick={() => onLoad(cfg)}
        style={{
          padding: "4px 10px",
          borderRadius: 6,
          border: `1px solid rgba(167,139,250,0.3)`,
          background: "rgba(167,139,250,0.08)",
          color: "#c4b5fd",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        Load
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(cfg.id); }}
        style={{ ...buttonStyles.iconSquare, fontSize: 13, flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  );
}

export function SaveConfigRow({ prov, endpoint, apiKey, model, onSaved }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveKey, setSaveKey] = useState(true);

  const doSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    const cfg = {
      id: `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      label: label.trim(),
      provider: prov,
      endpoint,
      apiKey: saveKey ? apiKey : "",
      model,
    };
    const next = await saveConfig(cfg);
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); setLabel(""); }, 1200);
    onSaved(next);
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: 9,
          borderRadius: 8,
          border: `1px dashed rgba(52,211,153,0.25)`,
          background: "rgba(52,211,153,0.04)",
          color: "#6ee7b7",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        💾 Save this config for reuse
      </button>
    );

  return (
    <div
      style={{
        padding: 14,
        background: "rgba(52,211,153,0.05)",
        border: `1px solid rgba(52,211,153,0.2)`,
        borderRadius: 10,
        animation: "slideDown 0.15s ease",
      }}
    >
      <div style={{ fontSize: 12, color: "#6ee7b7", fontWeight: 600, marginBottom: 10 }}>
        Save Config
      </div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder='e.g. "Google Gemini Flash"'
        style={{ ...formStyles.input, marginBottom: 10 }}
        onKeyDown={(e) => { if (e.key === "Enter") doSave(); }}
      />
      {PROVIDERS[prov]?.needsKey && apiKey && (
        <div style={{ marginBottom: 10 }}>
          <Toggle
            on={saveKey}
            onChange={() => setSaveKey((s) => !s)}
            label={saveKey ? "API key will be saved" : "Don't save API key"}
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => { setOpen(false); setLabel(""); }}
          style={{ ...buttonStyles.ghost, flex: 1, padding: 8 }}
        >
          Cancel
        </button>
        <button
          onClick={doSave}
          disabled={!label.trim() || saving}
          style={{
            flex: 2,
            padding: 8,
            borderRadius: 7,
            border: "none",
            background: saved
              ? tokens.success
              : label.trim()
                ? `linear-gradient(135deg,${tokens.success},${tokens.secondary})`
                : "rgba(255,255,255,0.05)",
            color: label.trim() ? "#fff" : tokens.textFaint,
            cursor: label.trim() ? "pointer" : "not-allowed",
            fontSize: 13,
            fontWeight: 600,
            transition: "background 0.2s",
          }}
        >
          {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Config"}
        </button>
      </div>
    </div>
  );
}
