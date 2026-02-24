import express from "express";
import cors from "cors";
import multer from "multer";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fetch from "node-fetch";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from "qrcode";
import FormDataNode from "form-data";
import fs from "fs";
import path from "path";

if (!getApps().length) initializeApp();
const auth = getAuth();
const db      = getFirestore();

// ── Env vars ──────────────────────────────────────────────────────────────────
const PORT                  = process.env.PORT ?? 8103;
const OLLAMA_BASE_URL       = process.env.OLLAMA_BASE_URL ?? "backendurl";
const SARVAM_API_KEY        = process.env.SARVAM_API_KEY ?? "";
const SKYCODING_API_KEY     = process.env.SKYCODING_API_KEY ?? "";   // SkyReels V3 video gen
const MANAGED_OLLAMA_MODELS = (process.env.MANAGED_OLLAMA_MODELS ?? "").split(",").map(s => s.trim()).filter(Boolean);
const ADMIN_UIDS            = (process.env.ADMIN_UIDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
const ALLOWED_ORIGINS       = (process.env.ALLOWED_ORIGINS ?? "*").split(",").map(s => s.trim());
const RATE_LIMIT_PER_MIN    = parseInt(process.env.RATE_LIMIT_PER_MIN ?? "30");
const WHATSAPP_ENABLED      = process.env.WHATSAPP_ENABLED === "true";
const TTS_MODEL             = process.env.SARVAM_TTS_MODEL ?? "bulbul:v3";
const MEDIA_DIR             = process.env.MEDIA_DIR ?? "/media/prijak/MyDrive/html/AiStudio";
const MEDIA_BASE_URL        = process.env.MEDIA_BASE_URL ?? "backendurl";
const STT_MODEL_CHEAP       = "saarika:v2.5";  // plain transcription — cheaper
const STT_MODEL_SMART       = "saaras:v3";     // translate mode — understands Indic better

// ── Express setup ─────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS.includes("*") ? "*" : ALLOWED_ORIGINS }));
app.use(express.json({ limit: "250mb" }));
app.use(express.urlencoded({ limit: "250mb", extended: true }));

// ── Request logger ────────────────────────────────────────────────────────────
// Every inbound request gets a short unique ID so you can trace it end-to-end.
let _reqCounter = 0;
app.use((req, res, next) => {
  const id = `REQ-${Date.now()}-${(++_reqCounter).toString().padStart(5, "0")}`;
  req.reqId = id;

  const ip =
    (req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const authHeader = req.headers["authorization"] ?? "";
  const tokenSnippet = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7, 17) + "…"   // first 10 chars of token — never the full key
    : "(no token)";

  console.log(
    `[${id}] ${new Date().toISOString()} ${req.method} ${req.path}` +
    ` | ip=${ip} | token=${tokenSnippet}`
  );

  // Log response status when the response finishes
  res.on("finish", () => {
    console.log(`[${id}] → ${res.statusCode}`);
  });

  next();
});

// multer for audio file uploads (STT)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
const rateMap = new Map();
function checkRate(uid) {
  const now   = Date.now();
  const entry = rateMap.get(uid) ?? { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
  entry.count++;
  rateMap.set(uid, entry);
  return entry.count <= RATE_LIMIT_PER_MIN;
}

// ── Auth middleware ───────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization ?? "").replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    req.user = await auth.verifyIdToken(token);
    next();
  } catch (_e) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── Analytics ─────────────────────────────────────────────────────────────────
async function logUsage({ uid, email, provider, model, stage, inputChars, outputChars, durationMs, error }) {
  try {
    const batch = db.batch();
    batch.set(db.collection("usage").doc(), {
      userId: uid, userEmail: email, provider, model, stage,
      inputChars, outputChars, durationMs, error: error ?? null, ts: new Date(),
    });
    batch.set(db.collection("users").doc(uid), {
      email, lastRequest: new Date(),
      totalRequests: FieldValue.increment(1),
      totalChars:    FieldValue.increment(inputChars + outputChars),
    }, { merge: true });
    await batch.commit();
  } catch (_e) { /* non-critical */ }
}

// ═════════════════════════════════════════════════════════════════════════════
// ORIGINAL ROUTES (unchanged)
// ═════════════════════════════════════════════════════════════════════════════

app.get("/api/health", (_req, res) => res.json({ status: "ok", port: PORT }));

app.get("/api/models", requireAuth, (_req, res) => {
  res.json({
    managed_ollama: MANAGED_OLLAMA_MODELS,
    managed_sarvam: ["sarvam-m"],
  });
});

app.post("/api/stream", requireAuth, async (req, res) => {
  if (!checkRate(req.user.uid)) {
    return res.status(429).json({ error: "Rate limit exceeded — try again in a minute." });
  }
  const { provider, model, system, prompt, temperature = 0.7, stage = "opinion" } = req.body;
  if (!provider || !model || !prompt) {
    return res.status(400).json({ error: "provider, model, prompt are required" });
  }

  const inputChars = (system?.length ?? 0) + prompt.length;
  let outputChars  = 0;
  let errorMsg     = null;
  const start      = Date.now();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (text) => {
    outputChars += text.length;
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
  };

  try {
    if (provider === "managed_ollama")      await streamOllama(model, system, prompt, temperature, send);
    else if (provider === "managed_sarvam") await streamSarvam(model, system, prompt, temperature, send);
    else throw new Error(`Unknown provider: ${provider}`);
  } catch (e) {
    errorMsg = e.message;
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
  }

  res.write("data: [DONE]\n\n");
  res.end();

  logUsage({
    uid: req.user.uid, email: req.user.email,
    provider, model, stage, inputChars, outputChars,
    durationMs: Date.now() - start, error: errorMsg,
  });
});

app.post("/api/session", requireAuth, async (req, res) => {
  const { sessionId, query, memberCount, hadFollowup, temperature, verdictChars } = req.body;
  await db.collection("sessions").doc(sessionId).set({
    userId: req.user.uid, userEmail: req.user.email,
    query: (query ?? "").slice(0, 100),
    memberCount, hadFollowup: !!hadFollowup,
    temperature, verdictChars: verdictChars ?? 0, ts: new Date(),
  }).catch(() => {});
  res.json({ ok: true });
});

app.get("/api/admin/stats", requireAuth, async (req, res) => {
  if (!ADMIN_UIDS.includes(req.user.uid)) {
    return res.status(403).json({ error: "Admin only" });
  }
  const [usersSnap, usageSnap] = await Promise.all([
    db.collection("users").orderBy("totalRequests", "desc").limit(20).get(),
    db.collection("usage").orderBy("ts", "desc").limit(500).get(),
  ]);
  const users   = usersSnap.docs.map(d => d.data());
  const usages  = usageSnap.docs.map(d => d.data());
  const reqs24h = usages.filter(u => (u.ts?.toMillis?.() ?? 0) > Date.now() - 86_400_000).length;
  const modelCounts = {};
  usages.forEach(u => { const k = `${u.provider}/${u.model}`; modelCounts[k] = (modelCounts[k] ?? 0) + 1; });
  const topModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, count]) => ({ key, count }));
  res.json({ totalUsers: users.length, totalReqs: usages.length, reqs24h, topModels, topUsers: users.slice(0, 10) });
});

// ── Ollama streaming ──────────────────────────────────────────────────────────
async function streamOllama(model, system, prompt, temperature, onToken) {
  const msgs = [];
  if (system) msgs.push({ role: "system", content: system });
  msgs.push({ role: "user", content: prompt });
  const res = await fetch(`${OLLAMA_BASE_URL.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: msgs, stream: true, options: { temperature } }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0, 120)}`);
  for await (const chunk of res.body) {
    for (const line of chunk.toString().split("\n").filter(Boolean)) {
      try { const d = JSON.parse(line); if (d?.message?.content) onToken(d.message.content); }
      catch (_e) { /* skip */ }
    }
  }
}

// ── Sarvam streaming ──────────────────────────────────────────────────────────
async function streamSarvam(model, system, prompt, temperature, onToken) {
  const msgs = [];
  if (system) msgs.push({ role: "system", content: system });
  msgs.push({ role: "user", content: prompt });
  const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${SARVAM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: msgs, stream: true, max_tokens: 2000, temperature }),
  });
  if (!res.ok) throw new Error(`Sarvam ${res.status}: ${(await res.text()).slice(0, 120)}`);
  for await (const chunk of res.body) {
    for (const line of chunk.toString().split("\n")) {
      const t = line.trim();
      if (!t.startsWith("data: ") || t.slice(6) === "[DONE]") continue;
      try { const tok = JSON.parse(t.slice(6))?.choices?.[0]?.delta?.content; if (tok) onToken(tok); }
      catch (_e) { /* skip */ }
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SARVAM VOICE HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * STT — transcribe audio buffer via Sarvam.
 * Cost tip: use saarika:v2.5 (cheap) for plain transcription.
 *           use saaras:v3 + mode=translate only when translate=true.
 *           This saves ~30-40% on STT costs for English-only sessions.
 */
async function sarvamSTT(audioBuffer, mimeType = "audio/webm", langCode = "en-IN", translateMode = false) {
  const form = new FormDataNode();
  form.append("file", audioBuffer, { filename: "audio.webm", contentType: mimeType });

  if (translateMode) {
    // saaras:v3 understands Indic accents + translates to English in one call
    form.append("model", STT_MODEL_SMART);
    form.append("mode", "translate");
  } else {
    // cheaper model — just transcribe in the spoken language
    form.append("model", STT_MODEL_CHEAP);
    if (langCode && langCode !== "auto") form.append("language_code", langCode);
  }

  const res = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Sarvam STT ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    transcript:    data.transcript ?? "",
    language_code: data.language_code ?? langCode,
  };
}

/**
 * Translate via Sarvam /translate.
 * Cost tip: only called when replyLang !== "en-IN" — zero cost for English sessions.
 */
async function sarvamTranslate(text, targetLang, sourceLang = "en-IN") {
  if (!text?.trim() || targetLang === "en-IN" || targetLang === sourceLang) return text;

  const res = await fetch("https://api.sarvam.ai/translate", {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      source_language_code: sourceLang,
      target_language_code: targetLang,
      speaker_gender: "Female",
      mode: "formal",
      enable_preprocessing: false, // save cost — not needed for conversational text
    }),
  });

  if (!res.ok) return text; // fail gracefully — return untranslated

  const data = await res.json();
  return data.translated_text ?? text;
}

/**
 * TTS — convert text to base64 WAV via Sarvam bulbul.
 * Cost tip: text is capped at 2400 chars (bulbul:v3) / 1400 chars (v2).
 *           enable_preprocessing handles Hinglish + numbers correctly.
 */
async function sarvamTTS(text, langCode = "en-IN", speaker = "Shubh", pace = 1.0) {
  const maxChars = TTS_MODEL === "bulbul:v3" ? 2400 : 1400;
  const safeText = text.slice(0, maxChars);

  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [safeText],
      target_language_code: langCode,
      speaker,
      model: TTS_MODEL,
      pace,
      speech_sample_rate: 22050,
      enable_preprocessing: true, // handles numbers, abbreviations, Hinglish
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Sarvam TTS ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.audios?.[0] ?? null; // base64 WAV string
}

// ═════════════════════════════════════════════════════════════════════════════
// SARVAM VOICE ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/sarvam/stt
 * Multipart form with fields: file (audio blob), lang (BCP-47), translate ("true"/"false")
 * Returns: { transcript, language_code }
 */
app.post("/api/sarvam/stt", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const audioBuffer  = req.file?.buffer;
    const mimeType     = req.file?.mimetype ?? "audio/webm";
    const langCode     = req.body?.lang ?? "en-IN";
    const translateOn  = req.body?.translate === "true";

    if (!audioBuffer) return res.status(400).json({ error: "No audio file received" });

    const result = await sarvamSTT(audioBuffer, mimeType, langCode, translateOn);
    res.json(result);
  } catch (e) {
    console.error("[STT]", e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/sarvam/tts
 * Body: { text, lang, speaker, pace }
 * Returns: { audio } — base64 WAV string ready to play in browser
 */
app.post("/api/sarvam/tts", requireAuth, async (req, res) => {
  try {
    const VALID_SPEAKERS = new Set([
      // Exact list for bulbul:v3 (from Sarvam API validation error)
      "aditya","ritu","ashutosh","priya","neha","rahul","pooja","rohan","simran","kavya","amit","dev",
    ]);

    const { text, lang = "en-IN", pace = 1.0 } = req.body;
    // Normalize: accept any casing from client, send lowercase to Sarvam
    let speaker = (req.body.speaker ?? "priya").toLowerCase();
    if (!VALID_SPEAKERS.has(speaker)) speaker = "priya"; // safe fallback

    if (!text?.trim()) return res.status(400).json({ error: "text is required" });

    const audio = await sarvamTTS(text, lang, speaker, parseFloat(pace));
    if (!audio) return res.status(500).json({ error: "TTS returned no audio" });

    res.json({ audio });
  } catch (e) {
    console.error("[TTS]", e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/sarvam/translate
 * Body: { text, targetLang, sourceLang? }
 * Returns: { translated }
 */
app.post("/api/sarvam/translate", requireAuth, async (req, res) => {
  try {
    const { text, targetLang, sourceLang = "en-IN" } = req.body;
    if (!text || !targetLang) return res.status(400).json({ error: "text and targetLang are required" });
    const translated = await sarvamTranslate(text, targetLang, sourceLang);
    res.json({ translated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/sarvam/ai-reply  (SSE streaming)
 * Body: { userText, personaPrompt, personaName, replyLang, translate }
 *
 * Streams AI response via sarvam-m, then translates if replyLang !== "en-IN".
 * Cost: only one AI call + one optional translate call per reply.
 */
app.post("/api/sarvam/ai-reply", requireAuth, async (req, res) => {
  if (!checkRate(req.user.uid)) {
    return res.status(429).json({ error: "Rate limit exceeded — try again in a minute." });
  }

  const {
    userText,
    personaPrompt,
    personaName,
    replyLang = "en-IN",
  } = req.body;

  if (!userText) return res.status(400).json({ error: "userText is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendChunk = (tok) => {
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: tok } }] })}\n\n`);
  };

  try {
    // Always generate AI response in English for highest quality
    const system = personaPrompt ?? `You are a helpful AI assistant named ${personaName ?? "AI"}.`;

    let fullResponse = "";
    await streamSarvam("sarvam-m", system, userText, 0.7, (tok) => {
      fullResponse += tok;
    });

    // Translate if user wants response in their language
    // This is the ONLY extra API call — and only happens when lang !== en-IN
    if (replyLang !== "en-IN" && fullResponse.trim()) {
      const translated = await sarvamTranslate(fullResponse, replyLang, "en-IN");
      // Stream word-by-word for natural feel in the UI
      const words = translated.split(" ");
      for (const word of words) {
        sendChunk(word + " ");
        await new Promise(r => setTimeout(r, 8));
      }
    } else {
      // English — stream immediately
      sendChunk(fullResponse);
    }

    logUsage({
      uid: req.user.uid, email: req.user.email,
      provider: "managed_sarvam", model: "sarvam-m",
      stage: "voice",
      inputChars: userText.length + system.length,
      outputChars: fullResponse.length,
      durationMs: 0,
      error: null,
    });

  } catch (e) {
    console.error("[AI-REPLY]", e.message);
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
  }

  res.write("data: [DONE]\n\n");
  res.end();
});

// ═════════════════════════════════════════════════════════════════════════════
// WHATSAPP GATEWAY
// ═════════════════════════════════════════════════════════════════════════════

const waSessions = new Map();
const waLogs     = new Map();

// ── Persona catalogue ─────────────────────────────────────────────────────────
const WA_PERSONAS = [
  { id: "assistant",  icon: "🧠", name: "My Assistant",    tagline: "Memory. Files. Reminders.",      prompt: null, isAssistant: true },
  { id: "ceo",        icon: "👔", name: "The CEO",          tagline: "Strategic. Decisive.",           prompt: "You are The CEO — a strategic, decisive leader. Be direct, big-picture, and action-oriented." },
  { id: "vc",         icon: "💰", name: "The VC",           tagline: "Pattern-matching. Contrarian.",   prompt: "You are The VC — a venture capitalist. Be analytical, contrarian, and obsessed with deal-flow and returns." },
  { id: "cfo",        icon: "📊", name: "The CFO",          tagline: "Numbers. Economics. Cash.",       prompt: "You are The CFO — obsessed with unit economics, cash flow, and financial rigour. Never lie with numbers." },
  { id: "founder",    icon: "🚀", name: "The Founder",      tagline: "Ship fast. Break things.",        prompt: "You are The Founder — scrappy, relentless, obsessed with product-market fit. Think in first principles." },
  { id: "mentor",     icon: "🧠", name: "The Mentor",       tagline: "Wisdom. Clarity. Growth.",        prompt: "You are The Mentor — a wise, empathetic advisor. Help the user grow, reflect, and make better decisions." },
  { id: "coach",      icon: "🏋", name: "The Coach",        tagline: "Performance. Accountability.",    prompt: "You are The Coach — focused on performance, habits, and accountability. Push the user to be their best." },
  { id: "debater",    icon: "⚔️", name: "The Debater",      tagline: "Devil's advocate. Always.",       prompt: "You are The Debater — always challenge, steelman the opposite view, and expose weak thinking." },
  { id: "stoic",      icon: "🏛", name: "The Stoic",        tagline: "Calm. Rational. Timeless.",       prompt: "You are The Stoic — channelling Marcus Aurelius. Respond with calm, rational, timeless wisdom." },
  { id: "researcher", icon: "🔬", name: "The Researcher",   tagline: "Evidence. First principles.",     prompt: "You are The Researcher — evidence-driven, rigorous, and always cite reasoning behind your answers." },
  { id: "creative",   icon: "🎨", name: "The Creative",     tagline: "Ideas. Story. Imagination.",      prompt: "You are The Creative — expansive, imaginative, and full of unexpected ideas. Break conventional thinking." },
];

// ═════════════════════════════════════════════════════════════════════════════
// MEMORY ENGINE  (Firestore-backed, per-user, permanent)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Load all memories for a user — returns array of {id, tag, content, type, createdAt}
 * Types: note | date | contact | file | reminder
 */
async function memoryLoad(userId) {
  try {
    const snap = await db.collection("wa_memory").doc(userId)
      .collection("items").orderBy("createdAt", "desc").limit(80).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (_e) { return []; }
}

/** Save a new memory item — returns the new doc id */
async function memorySave(userId, { tag, content, type = "note", remindAt = null }) {
  const ref = db.collection("wa_memory").doc(userId).collection("items").doc();
  await ref.set({ tag, content, type, remindAt, createdAt: new Date() });
  return ref.id;
}

/** Delete a memory item by id */
async function memoryDelete(userId, id) {
  await db.collection("wa_memory").doc(userId).collection("items").doc(id).delete();
}

/** Build a compact memory context string to inject into the assistant prompt */
function memoryToContext(memories) {
  if (!memories.length) return "No memories stored yet.";
  return memories.map(m => {
    const date = m.createdAt?.toDate?.()?.toLocaleDateString("en-IN") ?? "?";
    const remind = m.remindAt ? ` [remind: ${m.remindAt}]` : "";
    return `• [${m.type.toUpperCase()}] ${m.tag}: ${m.content}${remind}  (saved ${date})`;
  }).join("\n");
}

/**
 * Ask the AI to decide if a message contains something worth remembering.
 * Returns null if nothing to save, or { tag, content, type, remindAt } if yes.
 */
async function detectMemoryIntent(userText) {
  const systemPrompt = `You are a memory extraction assistant. Analyse the user message and decide if it contains something the user wants saved/remembered.

If yes, respond with ONLY valid JSON (no markdown):
{"save": true, "tag": "short label", "content": "full detail to remember", "type": "note|date|contact|file|reminder", "remindAt": "YYYY-MM-DD or null"}

If no, respond with ONLY: {"save": false}

Types: note=general info, date=deadline/expiry/anniversary, contact=person/number, reminder=action to do later.
Be generous — if the user says "remember", "note down", "don't forget", "my X is Y", or states a fact about themselves — save it.`;

  let raw = "";
  try {
    await streamSarvam("sarvam-m", systemPrompt, userText, 0, (tok) => { raw += tok; });
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return parsed.save ? parsed : null;
  } catch (_e) { return null; }
}

/**
 * Ask the AI to find memories that match a user question.
 * Returns array of matching memory ids.
 */
async function detectMemoryQuery(userText, memories) {
  if (!memories.length) return [];
  const list = memories.map((m, i) => `${i}: [${m.type}] ${m.tag} — ${m.content}`).join("\n");
  const systemPrompt = `You are a memory lookup assistant. Given a user question and a list of stored memories, identify which memory indices are relevant.
Respond with ONLY valid JSON: {"indices": [0, 2, 5]} or {"indices": []} if none are relevant.`;
  let raw = "";
  try {
    await streamSarvam("sarvam-m", systemPrompt, `User question: ${userText}\n\nMemories:\n${list}`, 0, (tok) => { raw += tok; });
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return (parsed.indices ?? []).map(i => memories[i]).filter(Boolean);
  } catch (_e) { return []; }
}

// ═════════════════════════════════════════════════════════════════════════════
// FILE PROCESSOR  (WhatsApp docs → text extract → AI summary → stored)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Attempt to extract readable text from a WhatsApp MessageMedia object.
 * Handles plain text, basic PDF (text-based), and treats others as binary.
 */
async function extractFileText(media) {
  const mime = media.mimetype ?? "";
  const buf  = Buffer.from(media.data, "base64");

  // Plain text
  if (mime.startsWith("text/")) return buf.toString("utf8").slice(0, 8000);

  // PDF — use pdftotext if available, else return note
  if (mime === "application/pdf") {
    try {
      const { execSync } = await import("child_process");
      // Write to tmp, run pdftotext, read output
      const tmpIn  = `/tmp/wa_${Date.now()}.pdf`;
      const tmpOut = tmpIn.replace(".pdf", ".txt");
      const { writeFileSync, readFileSync, unlinkSync } = await import("fs");
      writeFileSync(tmpIn, buf);
      execSync(`pdftotext "${tmpIn}" "${tmpOut}" 2>/dev/null`, { timeout: 15000 });
      const text = readFileSync(tmpOut, "utf8").slice(0, 8000);
      try { unlinkSync(tmpIn); unlinkSync(tmpOut); } catch (_e) {}
      return text;
    } catch (_e) {
      return "[PDF received — install poppler-utils on server for text extraction]";
    }
  }

  // Images — return note (OCR would need tesseract)
  if (mime.startsWith("image/")) return "[Image received — OCR not yet supported]";

  return `[Binary file, type: ${mime}]`;
}

/** Summarise extracted file text using the AI */
async function summariseFile(filename, text) {
  let summary = "";
  await streamSarvam(
    "sarvam-m",
    "You are a document summariser. Given document text, provide: 1) A 2-3 sentence summary, 2) Key facts/numbers/dates, 3) Any action items. Be concise.",
    `Filename: ${filename}\n\nContent:\n${text}`,
    0.3,
    (tok) => { summary += tok; }
  );
  return summary;
}

// ═════════════════════════════════════════════════════════════════════════════
// REMINDER CHECKER  (runs every 5 min, sends due reminders via WA)
// ═════════════════════════════════════════════════════════════════════════════

async function checkReminders() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  for (const [sessionId, session] of waSessions) {
    if (session.status !== "ready" || !session.userId) continue;
    try {
      const memories = await memoryLoad(session.userId);
      const due = memories.filter(m =>
        m.type === "reminder" && m.remindAt && m.remindAt <= today
      );
      for (const mem of due) {
        const chat = await session.client.getChatById(`${session.senderNumber}@c.us`);
        await chat.sendMessage(
`⏰ *Reminder*
━━━━━━━━━━━━━━
📌 *${mem.tag}*
${mem.content}

_Saved on ${mem.createdAt?.toDate?.()?.toLocaleDateString("en-IN") ?? "?"}_
Reply *memories* to see all saved items.`
        );
        // Mark as sent — change type to note so it doesn't repeat
        await db.collection("wa_memory").doc(session.userId)
          .collection("items").doc(mem.id).update({ type: "note", remindAt: null });
        appendLog(sessionId, `⏰ Reminder sent: ${mem.tag}`);
      }
    } catch (_e) { /* non-critical */ }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ASSISTANT PROMPT BUILDER
// ═════════════════════════════════════════════════════════════════════════════

function buildAssistantSystemPrompt(memories) {
  const memCtx = memoryToContext(memories);
  return `You are a smart, warm personal assistant. You have a persistent memory of everything the user has asked you to remember.

MEMORY BANK (use this to answer questions about the user's info):
${memCtx}

BEHAVIOUR:
- If the user asks about something in their memory, answer directly from it
- If you store something new, confirm it warmly
- Be concise, friendly, and proactive — notice patterns and connections
- Format lists cleanly using WhatsApp bold (*text*) and line breaks
- If asked to draft a message, write it completely so the user can copy-paste it
- Today's date: ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// MESSAGE BUILDERS
// ═════════════════════════════════════════════════════════════════════════════

function buildMenuText(session) {
  const isAssistant = session.isAssistant;
  const assistantCmds = isAssistant ? `
🧠 *Assistant Commands:*
💾 *memories* — View all saved memories
🗑️ *forget [tag]* — Delete a specific memory
📁 *files* — List stored file summaries
📤 Send any document/PDF to analyse & store
📲 *send wa [number] | [message]* — Send a WhatsApp message
💬 Just talk naturally — I'll auto-detect things to remember

` : "";

  return `🤖 *AI Council — Menu*
━━━━━━━━━━━━━━━━━━━━
Currently: ${session.icon ?? "🎭"} *${session.personaName}*
${assistantCmds}
*General Commands:*
📋 *menu* — This menu
🔄 *switch* — Change persona
🗑️ *clear* — Clear chat history
❓ *help* — Tips
❌ *stop* — Disconnect

Just type normally to chat!`;
}

function buildSwitchText() {
  const lines = WA_PERSONAS.map((p, i) =>
    `  ${i + 1}. ${p.icon} *${p.name}* — ${p.tagline}`
  ).join("\n");
  return `🔄 *Switch Persona*
━━━━━━━━━━━━━━━━━━━━
Reply with the *number* to switch:

${lines}

Or send *0* to cancel.`;
}

function buildWelcomeText(session) {
  if (session.isAssistant) {
    return `🧠 *Hey! Your Personal Assistant is ready.*
━━━━━━━━━━━━━━━━━━━━
I remember everything you tell me — across sessions, forever.

*What I can do:*
📝 Remember notes, passwords, dates, contacts
📁 Read & summarise documents you send
⏰ Set reminders for important dates
✉️ Draft messages on your behalf
📲 Send WhatsApp messages for you
🔍 Recall anything you've told me

*Try saying:*
• "Remember my gym membership expires Jan 2026"
• "Note: WiFi password is SuperSecret123"
• "Remind me to renew insurance on 2026-03-15"
• "Send a WhatsApp to 919876543210 saying Hey, are you free tonight?"
• Send a PDF/document to analyse it

*Send command format:*
send wa [number with country code] | [message]

Send *menu* anytime. What would you like to do?`;
  }
  return `👋 *Welcome to AI Council!*
━━━━━━━━━━━━━━━━━━━━
You're now connected as ${session.icon ?? "🎭"} *${session.personaName}*.

Just send a message to start chatting.
Send *menu* anytime to see options.`;
}

// ── Log helpers ───────────────────────────────────────────────────────────────
function appendLog(sessionId, msg) {
  const logs = waLogs.get(sessionId) ?? [];
  logs.push(msg);
  if (logs.length > 100) logs.shift();
  waLogs.set(sessionId, logs);
  console.log(`[WA:${sessionId.slice(-8)}] ${msg}`);
}

function flushLogs(sessionId) {
  const logs = waLogs.get(sessionId) ?? [];
  waLogs.set(sessionId, []);
  return logs;
}

if (!WHATSAPP_ENABLED) {
  app.use("/api/whatsapp", (_req, res) => {
    res.status(503).json({ error: "WhatsApp gateway is disabled. Set WHATSAPP_ENABLED=true." });
  });
} else {

  // Start reminder check loop
  setInterval(checkReminders, 5 * 60 * 1000);

  /**
   * POST /api/whatsapp/start
   */
  app.post("/api/whatsapp/start", requireAuth, async (req, res) => {
    const {
      senderNumber,
      personaPrompt,
      personaName   = "AI",
      personaId     = null,
      replyLang     = "en-IN",
      replyWithVoice = false,
    } = req.body;

    if (!senderNumber?.trim()) {
      return res.status(400).json({ error: "senderNumber is required" });
    }

    // Destroy existing session for this user
    const existingKey = [...waSessions.entries()].find(([, s]) => s.userId === req.user.uid)?.[0];
    if (existingKey) {
      const existing = waSessions.get(existingKey);
      try { await existing.client.destroy(); } catch (_e) {}
      waSessions.delete(existingKey);
      waLogs.delete(existingKey);
    }

    const sessionId  = `wa_${req.user.uid.slice(0, 8)}_${Date.now()}`;
    const isAssistant = personaId === "assistant";
    const persona     = WA_PERSONAS.find(p => p.id === personaId);

    try {
      const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId }),
        puppeteer: {
          args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"],
        },
      });

      const session = {
        client,
        status:        "initializing",
        qr:            null,
        userId:        req.user.uid,
        senderNumber:  senderNumber.replace(/\D/g, ""),
        personaPrompt: isAssistant ? null : (personaPrompt ?? persona?.prompt ?? "You are a helpful AI assistant."),
        personaName:   isAssistant ? "My Assistant" : (personaName ?? persona?.name ?? "AI"),
        icon:          persona?.icon ?? "🎭",
        isAssistant,
        replyLang,
        replyWithVoice: Boolean(replyWithVoice),
        history:       [],
        awaitingSwitch: false,
        createdAt:     Date.now(),
      };
      waSessions.set(sessionId, session);
      appendLog(sessionId, "Session initializing…");

      // ── QR ───────────────────────────────────────────────────────────────────
      client.on("qr", async (qr) => {
        try {
          session.qr     = await qrcode.toDataURL(qr);
          session.status = "qr";
          appendLog(sessionId, "QR generated — waiting for scan");
        } catch (e) { appendLog(sessionId, `QR error: ${e.message}`); }
      });

      // ── READY ────────────────────────────────────────────────────────────────
      client.on("ready", async () => {
        session.status = "ready";
        session.qr     = null;
        appendLog(sessionId, `✅ Connected! Listening for ${session.senderNumber}`);
        try {
          const chat = await client.getChatById(`${session.senderNumber}@c.us`);
          await chat.sendMessage(buildWelcomeText(session));
        } catch (e) { appendLog(sessionId, `⚠ Welcome msg failed: ${e.message}`); }
      });

      client.on("auth_failure", (msg) => {
        session.status = "error";
        appendLog(sessionId, `Auth failure: ${msg}`);
      });

      client.on("disconnected", (reason) => {
        session.status = "disconnected";
        appendLog(sessionId, `Disconnected: ${reason}`);
        client.destroy().catch(() => {});
        waSessions.delete(sessionId);
      });

      // ── MESSAGE HANDLER ───────────────────────────────────────────────────────
      client.on("message", async (message) => {
        if (message.isGroupMsg) return;

        const fromNum    = message.from.replace(/[^0-9]/g, "");
        const allowedNum = session.senderNumber.replace(/[^0-9]/g, "");
        const isAllowed  = fromNum.endsWith(allowedNum) || allowedNum.endsWith(fromNum);
        if (!isAllowed) return;

        const userText = message.body?.trim() ?? "";
        const cmd      = userText.toLowerCase();

        appendLog(sessionId, `📨 "${userText.slice(0, 60)}${userText.length > 60 ? "…" : ""}"`);

        // ── FILE / DOCUMENT RECEIVED ────────────────────────────────────────────
        if (message.hasMedia && session.isAssistant) {
          await message.reply("📁 Got your file! Reading it now…");
          try {
            const media    = await message.downloadMedia();
            const filename = media.filename ?? `file_${Date.now()}`;
            const text     = await extractFileText(media);

            await message.reply("🔍 Analysing…");
            const summary = await summariseFile(filename, text);

            // Store summary in memory
            const memId = await memorySave(session.userId, {
              tag:     filename,
              content: summary,
              type:    "file",
            });

            await message.reply(
`📁 *File stored & analysed*
━━━━━━━━━━━━━━
📄 *${filename}*

${summary}

_Memory ID: ${memId.slice(0, 8)} · Send *files* to list all stored files_`
            );
            appendLog(sessionId, `📁 File processed & stored: ${filename}`);
          } catch (e) {
            await message.reply(`⚠️ Could not process file: ${e.message}`);
          }
          return;
        }

        if (!userText) return;

        // ── GLOBAL COMMANDS ────────────────────────────────────────────────────
        if (cmd === "menu" || cmd === "0") {
          await message.reply(buildMenuText(session));
          return;
        }

        if (cmd === "switch") {
          session.awaitingSwitch = true;
          await message.reply(buildSwitchText());
          return;
        }

        if (session.awaitingSwitch) {
          if (cmd === "0") {
            session.awaitingSwitch = false;
            await message.reply("↩️ Cancelled.");
            return;
          }
          const idx    = parseInt(cmd, 10) - 1;
          const picked = WA_PERSONAS[idx];
          if (picked) {
            session.isAssistant    = picked.isAssistant ?? false;
            session.personaPrompt  = picked.prompt ?? null;
            session.personaName    = picked.name;
            session.icon           = picked.icon;
            session.awaitingSwitch = false;
            session.history        = [];
            await message.reply(
              session.isAssistant
                ? buildWelcomeText(session)
                : `✅ Switched to ${picked.icon} *${picked.name}*!\n\n_${picked.tagline}_\n\nStart chatting — I'm ready.`
            );
            appendLog(sessionId, `🔄 Switched → ${picked.name}`);
          } else {
            await message.reply(`⚠️ Send a number 1–${WA_PERSONAS.length} or *0* to cancel.`);
          }
          return;
        }

        if (cmd === "clear") {
          session.history = [];
          await message.reply("🗑️ Chat history cleared!");
          return;
        }

        if (cmd === "stop" || cmd === "bye" || cmd === "disconnect") {
          await message.reply("👋 Disconnecting. Reconnect anytime from the app!");
          appendLog(sessionId, "👋 User disconnect");
          try { await client.destroy(); } catch (_e) {}
          waSessions.delete(sessionId);
          waLogs.delete(sessionId);
          return;
        }

        if (cmd === "help") {
          await message.reply(session.isAssistant
            ? `❓ *Assistant Help*
━━━━━━━━━━━━━━━━━━━━
*Remembering things:*
Just say it naturally — "remember my passport number is XYZ" or "note: meeting at 3pm Tues"

*Setting reminders:*
"Remind me to call mom on 2026-03-20" (use YYYY-MM-DD format)

*Files:*
Send any PDF, text, or document — I'll read and summarise it

*Sending WhatsApp messages:*
send wa [number with country code] | [your message]
Example: send wa 919876543210 | Hey, are you free tonight?
Or naturally: "Send a WhatsApp to 919876543210 saying Hey!"

*Retrieving info:*
Just ask — "what's my gym membership number?" or "when does my insurance expire?"

*Forgetting things:*
Send *memories* to list all, then *forget [tag]* to delete one

*Other:*
• *switch* — talk to a different AI persona
• *stop* — disconnect`
            : `❓ *Tips*
• Type normally to chat with ${session.personaName}
• Send *switch* to change persona
• Send *menu* for all commands
• Send *stop* to disconnect`
          );
          return;
        }

        // ── ASSISTANT-ONLY COMMANDS ────────────────────────────────────────────
        if (session.isAssistant) {

          // List memories
          if (cmd === "memories" || cmd === "memory") {
            const mems = await memoryLoad(session.userId);
            if (!mems.length) {
              await message.reply("📭 No memories saved yet. Just tell me something to remember!");
              return;
            }
            const lines = mems.slice(0, 30).map((m, i) =>
              `${i + 1}. [${m.type}] *${m.tag}*\n    ${m.content.slice(0, 80)}${m.content.length > 80 ? "…" : ""}`
            ).join("\n\n");
            await message.reply(`🧠 *Your Memory Bank* (${mems.length} items)\n━━━━━━━━━━━━━━\n${lines}\n\n_Send *forget [tag]* to delete one_`);
            return;
          }

          // List files
          if (cmd === "files") {
            const mems = await memoryLoad(session.userId);
            const files = mems.filter(m => m.type === "file");
            if (!files.length) {
              await message.reply("📭 No files stored yet. Send me a PDF or document to analyse!");
              return;
            }
            const lines = files.map((f, i) => `${i + 1}. 📄 *${f.tag}*\n    ${f.content.slice(0, 100)}…`).join("\n\n");
            await message.reply(`📁 *Stored Files* (${files.length})\n━━━━━━━━━━━━━━\n${lines}`);
            return;
          }

          // Forget a memory
          if (cmd.startsWith("forget ")) {
            const tag  = userText.slice(7).trim();
            const mems = await memoryLoad(session.userId);
            const match = mems.find(m => m.tag.toLowerCase().includes(tag.toLowerCase()));
            if (match) {
              await memoryDelete(session.userId, match.id);
              await message.reply(`🗑️ Deleted memory: *${match.tag}*`);
              appendLog(sessionId, `🗑 Memory deleted: ${match.tag}`);
            } else {
              await message.reply(`⚠️ No memory found matching "${tag}". Send *memories* to see all saved items.`);
            }
            return;
          }

          // Send a WhatsApp message to someone
          // Supports both:
          //   "send wa 919876543210 | Hey!"       (explicit command)
          //   "send a whatsapp to 919876543210 saying Hey!" (natural language)
          if (cmd.startsWith("send wa ") || /send\s+(a\s+)?whatsapp\s+(message\s+)?to\s+/i.test(userText)) {
            let targetNum = null;
            let msgBody   = null;

            if (cmd.startsWith("send wa ")) {
              // Explicit format: send wa [number] | [message]
              const rest  = userText.slice(8).trim();  // strip "send wa "
              const pivot = rest.indexOf("|");
              if (pivot === -1) {
                await message.reply(
                  "⚠️ Format: *send wa [number] | [message]*\nExample: send wa 919876543210 | Hey, are you free?"
                );
                return;
              }
              targetNum = rest.slice(0, pivot).trim().replace(/\D/g, "");
              msgBody   = rest.slice(pivot + 1).trim();
            } else {
              // Natural language — ask AI to extract number + message
              let extracted = "";
              await streamSarvam(
                "sarvam-m",
                `Extract the WhatsApp number and message the user wants to send. 
Respond ONLY with valid JSON (no markdown): {"number": "digits only with country code", "message": "message text"}
If you cannot extract both, respond: {"error": "reason"}`,
                userText,
                0,
                (tok) => { extracted += tok; }
              );
              try {
                const clean  = extracted.replace(/```json|```/g, "").trim();
                const parsed = JSON.parse(clean);
                if (parsed.error || !parsed.number || !parsed.message) {
                  await message.reply(
                    `⚠️ Couldn't parse that. Try: *send wa [number] | [message]*\nExample: send wa 919876543210 | Hey!`
                  );
                  return;
                }
                targetNum = parsed.number.replace(/\D/g, "");
                msgBody   = parsed.message;
              } catch (_e) {
                await message.reply("⚠️ Couldn't understand that. Try: *send wa 919876543210 | Your message*");
                return;
              }
            }

            if (!targetNum || targetNum.length < 7) {
              await message.reply("⚠️ Invalid number. Include country code, e.g. 919876543210 for India.");
              return;
            }
            if (!msgBody) {
              await message.reply("⚠️ Message cannot be empty.");
              return;
            }

            try {
              await client.sendMessage(`${targetNum}@c.us`, msgBody);
              await message.reply(`✅ *Message sent!*\n📲 To: +${targetNum}\n💬 "${msgBody.slice(0, 80)}${msgBody.length > 80 ? "…" : ""}"`);
              appendLog(sessionId, `📲 Sent WA to ${targetNum}: ${msgBody.slice(0, 40)}`);
            } catch (e) {
              await message.reply(`❌ Failed to send: ${e.message}\nMake sure the number is on WhatsApp.`);
              appendLog(sessionId, `❌ Send WA failed: ${e.message}`);
            }
            return;
          }

          // ── ASSISTANT AI REPLY (with memory detection + injection) ─────────────
          try {
            const memories = await memoryLoad(session.userId);

            // Run memory intent detection in parallel with building context
            const [intentResult] = await Promise.all([
              detectMemoryIntent(userText),
            ]);

            // Auto-save if intent detected
            if (intentResult) {
              const memId = await memorySave(session.userId, intentResult);
              appendLog(sessionId, `💾 Auto-saved memory: ${intentResult.tag}`);
              // Don't return — still generate a reply confirming + answering
            }

            // Reload memories after potential save
            const freshMemories = intentResult ? await memoryLoad(session.userId) : memories;

            // Build full assistant prompt with memory context
            const systemPrompt = buildAssistantSystemPrompt(freshMemories);

            // Add to history
            session.history.push({ role: "user", content: userText });
            if (session.history.length > 20) session.history = session.history.slice(-20);

            const historyContext = session.history.slice(-8)
              .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
              .join("\n");

            let aiReply = "";
            await streamSarvam("sarvam-m", systemPrompt, historyContext, 0.7, (tok) => { aiReply += tok; });

            if (session.replyLang !== "en-IN" && aiReply.trim()) {
              aiReply = await sarvamTranslate(aiReply, session.replyLang, "en-IN");
            }

            session.history.push({ role: "assistant", content: aiReply });
            appendLog(sessionId, `🤖 Assistant → ${aiReply.length} chars${intentResult ? " + memory saved" : ""}`);

            await sendReply(session, message, aiReply);

          } catch (e) {
            appendLog(sessionId, `❌ Assistant error: ${e.message}`);
            await message.reply("Sorry, I hit an error. Try again in a moment.").catch(() => {});
          }
          return;
        }

        // ── NORMAL PERSONA AI REPLY ────────────────────────────────────────────
        try {
          session.history.push({ role: "user", content: userText });
          if (session.history.length > 20) session.history = session.history.slice(-20);

          const historyContext = session.history.slice(-10)
            .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
            .join("\n");

          let aiReply = "";
          await streamSarvam("sarvam-m", session.personaPrompt, historyContext, 0.7, (tok) => { aiReply += tok; });

          if (session.replyLang !== "en-IN" && aiReply.trim()) {
            aiReply = await sarvamTranslate(aiReply, session.replyLang, "en-IN");
          }

          session.history.push({ role: "assistant", content: aiReply });
          appendLog(sessionId, `🤖 ${session.personaName} → ${aiReply.length} chars`);

          await sendReply(session, message, aiReply);

        } catch (e) {
          appendLog(sessionId, `❌ Reply error: ${e.message}`);
          await message.reply("Sorry, I hit an error. Try again in a moment.").catch(() => {});
        }
      });

      client.initialize().catch((e) => {
        session.status = "error";
        appendLog(sessionId, `Init error: ${e.message}`);
      });

      res.json({ sessionId, status: "initializing" });

    } catch (e) {
      waSessions.delete(sessionId);
      waLogs.delete(sessionId);
      console.error("[WA start]", e);
      res.status(500).json({ error: e.message });
    }
  });

  /** Shared reply helper — handles voice fallback to text */
  async function sendReply(session, message, text) {
    if (session.replyWithVoice && text.trim()) {
      try {
        const audioB64 = await sarvamTTS(text, session.replyLang);
        if (audioB64) {
          const media = new MessageMedia("audio/ogg; codecs=opus", audioB64, "reply.ogg");
          await message.reply(media, undefined, { sendAudioAsVoice: true });
          return;
        }
      } catch (_e) { /* fall through to text */ }
    }
    await message.reply(text);
  }

  /**
   * GET /api/whatsapp/status
   */
  app.get("/api/whatsapp/status", requireAuth, (req, res) => {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
    const session = waSessions.get(sessionId);
    if (!session) return res.json({ status: "disconnected", message: "Session not found or expired" });
    if (session.userId !== req.user.uid) return res.status(403).json({ error: "Forbidden" });
    res.json({ status: session.status, qr: session.qr ?? null, logs: flushLogs(sessionId) });
  });

  /**
   * POST /api/whatsapp/update
   */
  app.post("/api/whatsapp/update", requireAuth, (req, res) => {
    const { sessionId, personaPrompt, personaName, replyLang, replyWithVoice } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
    const session = waSessions.get(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.userId !== req.user.uid) return res.status(403).json({ error: "Forbidden" });
    if (personaPrompt  !== undefined) session.personaPrompt  = personaPrompt;
    if (personaName    !== undefined) session.personaName    = personaName;
    if (replyLang      !== undefined) session.replyLang      = replyLang;
    if (replyWithVoice !== undefined) session.replyWithVoice = Boolean(replyWithVoice);
    appendLog(sessionId, `🔄 Config updated → ${personaName ?? "unchanged"}`);
    res.json({ ok: true });
  });

  /**
   * POST /api/whatsapp/stop
   */
  app.post("/api/whatsapp/stop", requireAuth, async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
    const session = waSessions.get(sessionId);
    if (!session) return res.json({ ok: true, message: "Already stopped" });
    if (session.userId !== req.user.uid) return res.status(403).json({ error: "Forbidden" });
    try { await session.client.destroy(); } catch (_e) {}
    waSessions.delete(sessionId);
    waLogs.delete(sessionId);
    res.json({ ok: true });
  });

} // end WHATSAPP_ENABLED

// ═════════════════════════════════════════════════════════════════════════════
// SKYREELS V3 — VIDEO GENERATION ROUTES
// ─────────────────────────────────────────────────────────────────────────────
// All calls proxy through here so SKYCODING_API_KEY never leaves the server.
// Users may optionally send their own key via "x-skycoding-key" header.
// ═════════════════════════════════════════════════════════════════════════════

const SKYCODING_BASE = "https://api.skycoding.ai";
const SKYREELS_MODEL = "skywork-ai/skyreels-v3/standard/single-avatar";

/**
 * Wraps a fetch call with exponential backoff retry on 429.
 * maxRetries=3, starting delay 2s, doubling each attempt.
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let delay = 2000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    if (attempt === maxRetries) return res;
    const retryAfter = parseInt(res.headers.get("retry-after") ?? "0") * 1000;
    const wait = retryAfter > 0 ? retryAfter : delay;
    console.warn(`[SkyReels] 429 — retrying in ${wait}ms (attempt ${attempt + 1}/${maxRetries})`);
    await new Promise(r => setTimeout(r, wait));
    delay *= 2;
  }
}

/** Returns the API key to use: user-supplied header takes priority over env var. */
function resolveSkyCodingKey(req) {
  const userKey = (req.headers["x-skycoding-key"] ?? "").trim();
  if (userKey) return { key: userKey, source: "user" };
  if (SKYCODING_API_KEY) return { key: SKYCODING_API_KEY, source: "server" };
  throw new Error(
    "No SkyReels API key configured. Set SKYCODING_API_KEY on the server or provide your own key."
  );
}

/**
 * POST /api/videogen/upload-audio
 * Accepts a base64 data URI or raw base64 string + mimeType.
 * Uploads to Firebase Storage and returns a public download URL.
 * This is needed because SkyReels only accepts public HTTPS URLs — not base64.
 */
app.post("/api/videogen/upload-audio", requireAuth, async (req, res) => {
  const { dataUrl, mimeType = "audio/wav" } = req.body;
  if (!dataUrl) return res.status(400).json({ error: "dataUrl is required." });

  try {
    // Strip the data URI prefix if present  e.g. "data:audio/wav;base64,..."
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const actualMime = dataUrl.includes(";")
      ? dataUrl.split(":")[1].split(";")[0]
      : mimeType;

    const ext = actualMime.split("/")[1]?.split(";")[0] ?? "wav";
    const filename = `audio_${req.user.uid}_${Date.now()}.${ext}`;
    const filePath = path.join(MEDIA_DIR, filename);

    // Ensure the directory exists
    fs.mkdirSync(MEDIA_DIR, { recursive: true });

    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `${MEDIA_BASE_URL}/${filename}`;
    console.log(`[${req.reqId}] [videogen/upload-audio] saved ${buffer.length} bytes → ${filePath} (${publicUrl})`);
    res.json({ url: publicUrl });
  } catch (e) {
    console.error(`[${req.reqId}] [videogen/upload-audio] error:`, e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/videogen/submit
 * Body: { prompt, first_frame_image, audio_url }
 * Returns: { requestId, keySource }
 */
app.post("/api/videogen/submit", requireAuth, async (req, res) => {
  if (!checkRate(req.user.uid)) {
    return res.status(429).json({ error: "Rate limit exceeded — try again in a minute." });
  }

  const { prompt, first_frame_image, audio_url } = req.body;
  if (!prompt || !first_frame_image || !audio_url) {
    return res.status(400).json({ error: "prompt, first_frame_image, and audio_url are required." });
  }

  let keyMeta;
  try { keyMeta = resolveSkyCodingKey(req); }
  catch (e) { return res.status(400).json({ error: e.message }); }

  const start = Date.now();
  try {
    const upstream = await fetchWithRetry(`${SKYCODING_BASE}/v1/video/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${keyMeta.key}`,
      },
      body: JSON.stringify({
        model: SKYREELS_MODEL,
        prompt,
        first_frame_image,
        audios: [audio_url],
      }),
    });

    const data = await upstream.json();
    console.log(`[${req.reqId}] [videogen/submit] SkyReels response:`, JSON.stringify(data));
    if (data.code !== 200) throw new Error(data.code_msg ?? `SkyReels error (code ${data.code})`);

    const requestId = data.resp_data.request_id;

    // Record job in Firestore for ownership checks on poll/result
    await db.collection("videogen_jobs").doc(requestId).set({
      userId:    req.user.uid,
      userEmail: req.user.email,
      prompt:    prompt.slice(0, 200),
      keySource: keyMeta.source,
      status:    "processing",
      ts:        new Date(),
    }).catch(() => {});

    logUsage({
      uid: req.user.uid, email: req.user.email,
      provider: "skyreels_v3", model: SKYREELS_MODEL, stage: "submit",
      inputChars: prompt.length, outputChars: 0,
      durationMs: Date.now() - start, error: null,
    });

    res.json({ requestId, keySource: keyMeta.source });
  } catch (e) {
    console.error("[videogen/submit]", e.message);
    logUsage({
      uid: req.user.uid, email: req.user.email,
      provider: "skyreels_v3", model: SKYREELS_MODEL, stage: "submit",
      inputChars: prompt.length, outputChars: 0,
      durationMs: Date.now() - start, error: e.message,
    });
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/videogen/:requestId/status
 * Returns: { status } — "processing" | "success" | "error"
 */
app.get("/api/videogen/:requestId/status", requireAuth, async (req, res) => {
  const { requestId } = req.params;

  const jobDoc = await db.collection("videogen_jobs").doc(requestId).get().catch(() => null);
  if (!jobDoc?.exists) return res.status(404).json({ error: "Job not found." });
  if (jobDoc.data().userId !== req.user.uid) return res.status(403).json({ error: "Forbidden." });

  let keyMeta;
  try { keyMeta = resolveSkyCodingKey(req); }
  catch (e) { return res.status(400).json({ error: e.message }); }

  try {
    const upstream = await fetchWithRetry(`${SKYCODING_BASE}/v1/video/${requestId}/status`, {
      headers: { "Authorization": `Bearer ${keyMeta.key}` },
    });
    const data = await upstream.json();
    console.log(`[${req.reqId}] [videogen/status] SkyReels response:`, JSON.stringify(data));
    if (data.code !== 200) throw new Error(data.code_msg ?? `Status error (code ${data.code})`);

    const status = data.resp_data.status;
    const errorMsg = data.resp_data.error_msg ?? data.resp_data.message ?? null;

    if (status === "success" || status === "error") {
      await db.collection("videogen_jobs").doc(requestId)
        .update({ status, completedAt: new Date(), ...(errorMsg ? { errorMsg } : {}) })
        .catch(() => {});
    }

    if (status === "error") {
      console.error(`[${req.reqId}] [videogen/status] Job ${requestId} FAILED — SkyReels error_msg:`, errorMsg ?? "(no message in resp_data)");
    }

    // Return the error reason to the frontend so it can display it
    res.json({ status, ...(errorMsg ? { errorMsg } : {}) });
  } catch (e) {
    console.error("[videogen/status]", e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/videogen/:requestId/result
 * Returns: { videoUrl, cost }
 */
app.get("/api/videogen/:requestId/result", requireAuth, async (req, res) => {
  const { requestId } = req.params;

  const jobDoc = await db.collection("videogen_jobs").doc(requestId).get().catch(() => null);
  if (!jobDoc?.exists) return res.status(404).json({ error: "Job not found." });
  if (jobDoc.data().userId !== req.user.uid) return res.status(403).json({ error: "Forbidden." });

  let keyMeta;
  try { keyMeta = resolveSkyCodingKey(req); }
  catch (e) { return res.status(400).json({ error: e.message }); }

  try {
    const upstream = await fetchWithRetry(`${SKYCODING_BASE}/v1/video/${requestId}/result`, {
      headers: { "Authorization": `Bearer ${keyMeta.key}` },
    });
    const data = await upstream.json();
    console.log(`[${req.reqId}] [videogen/result] SkyReels response:`, JSON.stringify(data));
    if (data.code !== 200) throw new Error(data.code_msg ?? `Result error (code ${data.code})`);

    const videoUrl = data.resp_data.video_list?.[0] ?? null;
    const cost     = data.resp_data.usage?.cost ?? null;

    await db.collection("videogen_jobs").doc(requestId)
      .update({ videoUrl: videoUrl ?? "", cost: cost ?? 0 }).catch(() => {});

    logUsage({
      uid: req.user.uid, email: req.user.email,
      provider: "skyreels_v3", model: SKYREELS_MODEL, stage: "result",
      inputChars: 0, outputChars: 0, durationMs: 0, error: null,
    });

    res.json({ videoUrl, cost });
  } catch (e) {
    console.error("[videogen/result]", e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/videogen/history
 * Returns last 20 completed video jobs for the logged-in user.
 */
app.get("/api/videogen/history", requireAuth, async (req, res) => {
  try {
    const snap = await db.collection("videogen_jobs")
      .where("userId", "==", req.user.uid)
      .where("status", "==", "success")
      .orderBy("ts", "desc")
      .limit(20)
      .get();

    const jobs = snap.docs.map(d => ({
      requestId:   d.id,
      prompt:      d.data().prompt,
      videoUrl:    d.data().videoUrl ?? null,
      cost:        d.data().cost ?? null,
      keySource:   d.data().keySource,
      completedAt: d.data().completedAt?.toDate?.()?.toISOString() ?? null,
    }));

    res.json({ jobs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ AI Council backend on port ${PORT}`);
  console.log(`   WhatsApp gateway: ${WHATSAPP_ENABLED ? "ENABLED" : "disabled (set WHATSAPP_ENABLED=true)"}`);
  console.log(`   TTS model: ${TTS_MODEL}`);
});