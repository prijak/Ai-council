const CONFIGS_KEY  = "ai-council-configs-v2";
const SESSIONS_KEY = "ai-council-sessions";
const WEBHOOK_KEY  = "ai-council-webhook";

// ── helpers ───────────────────────────────────────────────────────────────────
function lsGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

// ── Configs ───────────────────────────────────────────────────────────────────
export async function loadConfigs() {
  try {
    const r = lsGet(CONFIGS_KEY);
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}

export async function persistConfigs(c) {
  lsSet(CONFIGS_KEY, JSON.stringify(c));
}

export async function saveConfig(cfg) {
  const all  = await loadConfigs();
  const next = [...all.filter((c) => c.id !== cfg.id), cfg];
  await persistConfigs(next);
  return next;
}

export async function deleteConfig(id) {
  const all  = await loadConfigs();
  const next = all.filter((c) => c.id !== id);
  await persistConfigs(next);
  return next;
}

// ── Sessions ──────────────────────────────────────────────────────────────────
export async function loadSessions() {
  try {
    const r = lsGet(SESSIONS_KEY);
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}

export async function persistSessions(s) {
  lsSet(SESSIONS_KEY, JSON.stringify(s.slice(-30)));
}

// ── Webhook URL ───────────────────────────────────────────────────────────────
export async function loadWebhookUrl() {
  return lsGet(WEBHOOK_KEY) ?? "";
}

export async function saveWebhookUrl(url) {
  lsSet(WEBHOOK_KEY, url);
}