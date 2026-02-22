const CONFIGS_KEY = "ai-council-configs-v2";
const SESSIONS_KEY = "ai-council-sessions";
const WEBHOOK_KEY = "ai-council-webhook";

export async function loadConfigs() {
  try {
    const r = await window.storage.get(CONFIGS_KEY);
    return r ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}

export async function loadSessions() {
  try {
    const r = await window.storage.get(SESSIONS_KEY);
    return r ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}

export async function loadWebhookUrl() {
  try {
    const r = await window.storage.get(WEBHOOK_KEY);
    return r ? r.value : "";
  } catch {
    return "";
  }
}

export async function saveWebhookUrl(url) {
  try {
    await window.storage.set(WEBHOOK_KEY, url);
  } catch {}
}

export async function persistConfigs(c) {
  try {
    await window.storage.set(CONFIGS_KEY, JSON.stringify(c));
  } catch {}
}

export async function persistSessions(s) {
  try {
    await window.storage.set(SESSIONS_KEY, JSON.stringify(s.slice(-30)));
  } catch {}
}

export async function saveConfig(cfg) {
  const all = await loadConfigs();
  const next = [...all.filter((c) => c.id !== cfg.id), cfg];
  await persistConfigs(next);
  return next;
}

export async function deleteConfig(id) {
  const all = await loadConfigs();
  const next = all.filter((c) => c.id !== id);
  await persistConfigs(next);
  return next;
}
