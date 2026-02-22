/**
 * Drop this in as src/lib/api.js — replaces the original.
 * Only change: adds managed_ollama / managed_sarvam routing via backend proxy.
 */
import { PROVIDERS } from "../constants/providers";
import { streamManagedProvider } from "./auth";

const ollamaQueues = {};
function enqueueOllama(endpoint, fn) {
  const key = endpoint.replace(/\/$/, "").toLowerCase();
  if (!ollamaQueues[key]) ollamaQueues[key] = Promise.resolve();
  const next = ollamaQueues[key].then(() => fn());
  ollamaQueues[key] = next.catch(() => {});
  return next;
}

async function sseStream(res, onChunk, extractFn, signal) {
  if (!res.ok) { const txt = await res.text().catch(() => res.statusText); throw new Error(`HTTP ${res.status}: ${txt.slice(0, 160)}`); }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  try {
    while (true) {
      if (signal?.aborted) { reader.cancel(); break; }
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value).split("\n")) { const t = extractFn(line.trim()); if (t) { full += t; onChunk(full); } }
    }
  } catch (e) { if (e.name !== "AbortError") throw e; }
  return full;
}

async function visibilityAwareOllamaStream(member, msgs, onChunk, signal, temp, seedText = "") {
  const base = member.endpoint.replace(/\/$/, "");
  const sendMsgs = seedText ? [...msgs, { role: "assistant", content: seedText }] : msgs;
  const res = await fetch(`${base}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit", body: JSON.stringify({ model: member.model, messages: sendMsgs, stream: true, options: { temperature: temp } }), signal });
  if (!res.ok) { const b = await res.text().catch(() => ""); throw new Error(`Ollama ${res.status}${b ? ": " + b.slice(0, 80) : ""}. Ensure CORS is enabled.`); }
  const reader = res.body.getReader(); const dec = new TextDecoder();
  let accumulated = seedText; let streamDied = false;
  const onVis = () => { if (document.visibilityState === "hidden") { reader.cancel().catch(() => {}); streamDied = true; } };
  document.addEventListener("visibilitychange", onVis);
  try {
    while (true) {
      if (signal?.aborted) { reader.cancel(); break; }
      let r; try { r = await reader.read(); } catch { streamDied = document.visibilityState === "hidden" || streamDied; break; }
      const { done, value } = r; if (done) break;
      for (const line of dec.decode(value).split("\n").filter(Boolean)) { try { const d = JSON.parse(line); if (d.message?.content) { accumulated += d.message.content; onChunk(accumulated); } if (d.done === true) streamDied = false; } catch { /* skip */ } }
    }
  } finally { document.removeEventListener("visibilitychange", onVis); }
  if (streamDied && !signal?.aborted) { await waitForVisible(); if (signal?.aborted) return accumulated; return visibilityAwareOllamaStream(member, msgs, onChunk, signal, temp, accumulated); }
  return accumulated;
}
function waitForVisible() { if (document.visibilityState === "visible") return Promise.resolve(); return new Promise(r => { const h = () => { if (document.visibilityState === "visible") { document.removeEventListener("visibilitychange", h); r(); } }; document.addEventListener("visibilitychange", h); }); }

async function callOllamaDirect(member, system, prompt, onChunk, signal, temp) { const msgs = []; if (system) msgs.push({ role: "system", content: system }); msgs.push({ role: "user", content: prompt }); return visibilityAwareOllamaStream(member, msgs, onChunk, signal, temp); }
const callOllama = (m, sys, p, cb, sig, temp) => enqueueOllama(m.endpoint, () => callOllamaDirect(m, sys, p, cb, sig, temp));

async function callOpenAICompat(member, system, prompt, onChunk, signal, temp) {
  const msgs = []; if (system) msgs.push({ role: "system", content: system }); msgs.push({ role: "user", content: prompt });
  const base = (member.endpoint || PROVIDERS[member.provider].defaultEndpoint).replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, { method: "POST", signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${member.apiKey}` }, body: JSON.stringify({ model: member.model, messages: msgs, stream: true, max_tokens: 2000, temperature: temp }) });
  return sseStream(res, onChunk, line => { if (!line.startsWith("data: ")) return null; const raw = line.slice(6).trim(); if (raw === "[DONE]") return null; try { return JSON.parse(raw).choices?.[0]?.delta?.content ?? null; } catch { return null; } }, signal);
}

async function callAnthropic(member, system, prompt, onChunk, signal, temp) {
  const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal, headers: { "Content-Type": "application/json", "x-api-key": member.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-allow-browser": "true" }, body: JSON.stringify({ model: member.model, max_tokens: 2000, stream: true, temperature: temp, ...(system ? { system } : {}), messages: [{ role: "user", content: prompt }] }) });
  return sseStream(res, onChunk, line => { if (!line.startsWith("data: ")) return null; try { const d = JSON.parse(line.slice(6)); return d.type === "content_block_delta" ? (d.delta?.text ?? null) : null; } catch { return null; } }, signal);
}

async function callGoogle(member, system, prompt, onChunk, signal, temp) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${member.model}:streamGenerateContent?key=${member.apiKey}&alt=sse`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}), generationConfig: { maxOutputTokens: 2000, temperature: temp } }), signal });
  return sseStream(res, onChunk, line => { if (!line.startsWith("data: ")) return null; try { return JSON.parse(line.slice(6)).candidates?.[0]?.content?.parts?.[0]?.text ?? null; } catch { return null; } }, signal);
}

// ── NEW: managed providers go through your backend ────────────────────────────
async function callManaged(member, system, prompt, onChunk, signal, temp, stage) {
  const readAll = await streamManagedProvider({ provider: member.provider, model: member.model, system, prompt, temperature: temp, stage });
  return readAll(onChunk, signal);
}

export function dispatchMember(member, system, prompt, onChunk, signal, temperature = 0.7, stage = "opinion") {
  const compat = PROVIDERS[member.provider]?.compat;
  if (compat === "managed")   return callManaged(member, system, prompt, onChunk, signal, temperature, stage);
  if (compat === "ollama")    return callOllama(member, system, prompt, onChunk, signal, temperature);
  if (compat === "openai")    return callOpenAICompat(member, system, prompt, onChunk, signal, temperature);
  if (compat === "anthropic") return callAnthropic(member, system, prompt, onChunk, signal, temperature);
  if (compat === "google")    return callGoogle(member, system, prompt, onChunk, signal, temperature);
  throw new Error(`Unknown provider: ${member.provider}`);
}

export async function fetchModels(provider, endpoint, apiKey) {
  const pInfo = PROVIDERS[provider];
  if (pInfo?.managed) return pInfo.suggestedModels;
  if (provider === "ollama") { const res = await fetch(`${endpoint.replace(/\/$/, "")}/api/tags`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "omit" }); if (!res.ok) throw new Error(`Cannot reach Ollama (HTTP ${res.status})`); return (await res.json()).models?.map(m => m.name) || []; }
  if (["openai","groq","custom"].includes(provider)) { const base = (endpoint || pInfo.defaultEndpoint).replace(/\/$/, ""); const res = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${apiKey}` } }); if (!res.ok) throw new Error(`HTTP ${res.status}`); return ((await res.json()).data || []).map(m => m.id).filter(pInfo.modelFilter || (() => true)).sort(); }
  if (provider === "anthropic") { const res = await fetch("https://api.anthropic.com/v1/models", { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-allow-browser": "true" } }); if (!res.ok) throw new Error(`HTTP ${res.status}`); return ((await res.json()).data || []).map(m => m.id).sort(); }
  if (provider === "google") { const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`); if (!res.ok) throw new Error(`HTTP ${res.status}`); return ((await res.json()).models || []).map(m => m.name.replace("models/","")).filter(n => n.includes("gemini")).sort(); }
  throw new Error("Not supported");
}

export async function fireWebhook(url, data) {
  if (!url?.trim()) return { ok: false, skipped: true };
  try { const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); return { ok: res.ok, status: res.status }; }
  catch (e) { return { ok: false, error: e.message }; }
}
