import { useState } from "react";
import { tokens, formStyles, buttonStyles } from "../styles";
import { PROVIDERS } from "../constants/providers";
import { saveConfig, deleteConfig as localDeleteConfig } from "../lib/storage";
import { cloudSaveConfig, cloudDeleteConfig } from "../lib/cloudStorage";
import { useAuth } from "./AuthGate";
import { Toggle } from "./atoms";

export function SavedConfigCard({ cfg, onLoad, onDelete }) {
  const pInfo = PROVIDERS[cfg.provider] || PROVIDERS.custom;
  const { user, isAnonymous } = useAuth();
  const isCloud = !!(user && !isAnonymous);

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
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = pInfo.color + "66")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = tokens.borderSubtle)
      }
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

      <div
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
        onClick={() => onLoad(cfg)}
      >
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
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: pInfo.color }}>{pInfo.name}</span>
          <span>·</span>
          <span style={{ fontFamily: "monospace" }}>
            {(cfg.model || "").split(":")[0].slice(0, 20)}
          </span>
          {cfg.apiKey && (
            <>
              <span>·</span>
              <span style={{ color: tokens.success }}>🔑 key saved</span>
            </>
          )}
          {isCloud && (
            <>
              <span>·</span>
              <span style={{ color: "#60a5fa", fontSize: 10 }}>
                ☁ cloud · 🔒 encrypted
              </span>
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
        onClick={(e) => {
          e.stopPropagation();
          onDelete(cfg.id);
        }}
        style={{ ...buttonStyles.iconSquare, fontSize: 13, flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  );
}

export function SaveConfigRow({ prov, endpoint, apiKey, model, onSaved }) {
  const { user, isAnonymous } = useAuth();
  const isCloud = !!(user && !isAnonymous);

  const [open, setSaveOpen] = useState(false);
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
      createdAt: Date.now(),
    };

    let next;
    if (isCloud) {
      await cloudSaveConfig(user.uid, cfg);
      // Return the config as-is for UI (already decrypted locally)
      next = [cfg]; // parent will reload from cloud on next open
    } else {
      next = await saveConfig(cfg);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSaveOpen(false);
      setLabel("");
    }, 1200);
    onSaved(next);
  };

  if (!open)
    return (
      <button
        onClick={() => setSaveOpen(true)}
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
        }}
      >
        💾 Save this config{isCloud ? " to cloud" : " for reuse"}
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 12, color: "#6ee7b7", fontWeight: 600 }}>
          Save Config{isCloud ? " to Cloud" : ""}
        </div>
        {isCloud && (
          <span
            style={{
              fontSize: 10,
              color: "#60a5fa",
              background: "rgba(96,165,250,0.08)",
              border: "1px solid rgba(96,165,250,0.2)",
              borderRadius: 4,
              padding: "2px 7px",
            }}
          >
            ☁ synced · 🔒 encrypted
          </span>
        )}
      </div>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder='e.g. "Google Gemini Flash"'
        style={{ ...formStyles.input, marginBottom: 10 }}
        onKeyDown={(e) => {
          if (e.key === "Enter") doSave();
        }}
        autoFocus
      />

      {PROVIDERS[prov]?.needsKey && apiKey && (
        <div style={{ marginBottom: 10 }}>
          <Toggle
            on={saveKey}
            onChange={() => setSaveKey((s) => !s)}
            label={
              saveKey
                ? isCloud
                  ? "API key saved (encrypted end-to-end)"
                  : "API key will be saved locally"
                : "Don't save API key"
            }
          />
          {saveKey && isCloud && (
            <div
              style={{
                marginTop: 6,
                marginLeft: 48,
                fontSize: 11,
                color: tokens.textFaint,
                lineHeight: 1.5,
              }}
            >
              Encrypted in your browser before upload. The server only stores
              ciphertext — your key is never visible to us.
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => {
            setSaveOpen(false);
            setLabel("");
          }}
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
