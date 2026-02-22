import { useState, useEffect } from "react";
import { tokens, formStyles, layoutStyles, buttonStyles } from "../styles";
import { loadWebhookUrl, saveWebhookUrl } from "../lib/storage";
import { fireWebhook } from "../lib/api";
import { Spin } from "./atoms";

export function SettingsModal({ onClose }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => { loadWebhookUrl().then(setWebhookUrl); }, []);

  const doSave = async () => {
    setSaving(true);
    await saveWebhookUrl(webhookUrl.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const doTest = async () => {
    if (!webhookUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    const r = await fireWebhook(webhookUrl.trim(), { type: "test", ts: Date.now(), source: "ai-council" });
    setTesting(false);
    setTestResult(r);
  };

  return (
    <>
      <div onClick={onClose} style={layoutStyles.backdrop} />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "min(480px,95vw)",
          background: "#0e0e1a",
          border: `1px solid rgba(167,139,250,0.25)`,
          borderRadius: 16,
          zIndex: 60,
          boxShadow: "0 40px 120px rgba(0,0,0,0.8)",
          animation: "slideDown 0.2s ease",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${tokens.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>⚙ Settings</div>
          <button onClick={onClose} style={buttonStyles.iconSquare}>✕</button>
        </div>

        <div style={{ padding: 22 }}>
          <label style={formStyles.label}>🔗 Webhook URL</label>
          <div style={{ fontSize: 12, color: tokens.textMuted, marginBottom: 10, lineHeight: 1.55 }}>
            After every completed session, AI Council POSTs the full session JSON to this URL. Works with Zapier, Make, n8n, Slack, Notion, Pipedream, etc.
          </div>
          <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/…" style={{ ...formStyles.input, marginBottom: 10 }} />

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              onClick={doTest}
              disabled={!webhookUrl.trim() || testing}
              style={{ ...buttonStyles.ghost, padding: "7px 14px", fontSize: 12, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              {testing ? <><Spin size={11} /> Testing…</> : "🧪 Send Test Ping"}
            </button>
            <button
              onClick={doSave}
              disabled={saving}
              style={{ flex: 2, padding: "7px 14px", borderRadius: 7, border: "none", background: saved ? tokens.success : "linear-gradient(135deg,#a78bfa,#60a5fa)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "background 0.2s" }}
            >
              {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Webhook"}
            </button>
          </div>

          {testResult && (
            <div style={{ padding: "7px 11px", borderRadius: 7, fontSize: 12, background: testResult.ok ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${testResult.ok ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`, color: testResult.ok ? "#6ee7b7" : "#fca5a5" }}>
              {testResult.ok ? `✓ Webhook responded with HTTP ${testResult.status}` : testResult.skipped ? "No URL configured." : testResult.error ? `✕ ${testResult.error}` : `✕ HTTP ${testResult.status}`}
            </div>
          )}

          <div style={formStyles.divider} />
          <label style={formStyles.label}>📋 Payload shape</label>
          <pre style={{ fontSize: 10, color: tokens.textMuted, background: "rgba(0,0,0,0.3)", borderRadius: 7, padding: "10px 12px", lineHeight: 1.6, overflow: "auto" }}>{`{ type: "session_complete",\n  ts: 1234567890,\n  query: "…",\n  temperature: 0.7,\n  memberNames: ["…"],\n  responses: { memberId: "…" },\n  reviews:   { memberId: "…" },\n  verdict: "…" }`}</pre>
        </div>
      </div>
    </>
  );
}
