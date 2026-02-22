/**
 * AI Council — Firebase Cloud Functions (Gen 2)
 * ──────────────────────────────────────────────────────────────
 * Exposes a single `api` HTTPS function that routes:
 *   GET  /api/models          → list available managed models
 *   POST /api/stream          → streaming LLM proxy (Ollama / Sarvam AI)
 *   POST /api/session         → log a completed session to Firestore
 *   GET  /api/admin/stats     → admin-only analytics dashboard
 * ──────────────────────────────────────────────────────────────
 * Secrets stored in Firebase Secret Manager (no .env needed):
 *   OLLAMA_BASE_URL, SARVAM_API_KEY, ADMIN_UIDS, MANAGED_OLLAMA_MODELS
 * Set with: firebase functions:secrets:set OLLAMA_BASE_URL
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// ── Secrets (set via: firebase functions:secrets:set SECRET_NAME) ────────────
const OLLAMA_BASE_URL        = defineSecret("OLLAMA_BASE_URL");
const SARVAM_API_KEY         = defineSecret("SARVAM_API_KEY");
const MANAGED_OLLAMA_MODELS  = defineSecret("MANAGED_OLLAMA_MODELS");
const ADMIN_UIDS             = defineSecret("ADMIN_UIDS");

// ── Rate limiting (simple per-UID in-memory, resets on cold start) ───────────
const rateLimitMap = new Map();
const RATE_LIMIT = 30; // requests per minute per user
function checkRateLimit(uid) {
  const now = Date.now();
  const window = 60_000;
  const entry = rateLimitMap.get(uid) ?? { count: 0, resetAt: now + window };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + window; }
  entry.count++;
  rateLimitMap.set(uid, entry);
  return entry.count <= RATE_LIMIT;
}

// ── Auth middleware ───────────────────────────────────────────────────────────
async function verifyAuth(req, res) {
  const header = req.headers.authorization ?? "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) { res.status(401).json({ error: "Not authenticated" }); return null; }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;          // { uid, email, name, picture, ... }
  } catch (_e) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

// ── CORS helper ───────────────────────────────────────────────────────────────
function cors(req, res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).send(""); return true; }
  return false;
}

// ── Analytics helpers ─────────────────────────────────────────────────────────
async function logUsage({ uid, email, provider, model, stage, inputChars, outputChars, durationMs, error }) {
  const batch = db.batch();

  // Usage event
  const usageRef = db.collection("usage").doc();
  batch.set(usageRef, {
    userId: uid, userEmail: email,
    provider, model, stage,
    inputChars, outputChars, durationMs,
    error: error ?? null,
    ts: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Increment user counters
  const userRef = db.collection("users").doc(uid);
  batch.set(userRef, {
    email, lastRequest: admin.firestore.FieldValue.serverTimestamp(),
    totalRequests: admin.firestore.FieldValue.increment(1),
    totalChars:    admin.firestore.FieldValue.increment(inputChars + outputChars),
  }, { merge: true });

  await batch.commit().catch(() => {});
}

// ══════════════════════════════════════════════════════════════
// MAIN API FUNCTION
// ══════════════════════════════════════════════════════════════
exports.api = onRequest(
  {
    secrets: [OLLAMA_BASE_URL, SARVAM_API_KEY, MANAGED_OLLAMA_MODELS, ADMIN_UIDS],
    timeoutSeconds: 540,    // 9 minutes — long enough for any LLM response
    memory: "256MiB",
    region: "us-central1",  // change to "asia-south1" for lower India latency
    minInstances: 0,        // 0 = cost-free when not in use
  },
  async (req, res) => {
    if (cors(req, res)) return;

    const path = req.path;

    // ── GET /api/models ───────────────────────────────────────
    if (req.method === "GET" && path === "/api/models") {
      const user = await verifyAuth(req, res);
      if (!user) return;
      const ollamaModels = (MANAGED_OLLAMA_MODELS.value() ?? "mistral-nemo:latest", "wizard-vicuna-uncensored:13b", "Flux_AI/Flux_AI:latest", "qwen2.5:3b", "codellama:13b", "llava:13b", "llava:7b", "llama2-uncensored:7b", "everythinglm:13b", "dolphin-mistral:7b",   "mistral:latest", "deepseek-r1:latest", "deepseek-v2:latest", "llama3.1:8b-instruct-q8_0", "deepseek-coder-v2:latest")
        .split(",").map(s => s.trim()).filter(Boolean);
      return res.json({
        managed_ollama: ollamaModels,
        managed_sarvam: ["sarvam-m"],
      });
    }

    // ── POST /api/stream ──────────────────────────────────────
    if (req.method === "POST" && path === "/api/stream") {
      const user = await verifyAuth(req, res);
      if (!user) return;

      if (!checkRateLimit(user.uid)) {
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

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const sendToken = (text) => {
        outputChars += text.length;
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
      };

      try {
        if (provider === "managed_ollama") {
          await proxyOllama(OLLAMA_BASE_URL.value(), model, system, prompt, temperature, sendToken);
        } else if (provider === "managed_sarvam") {
          await proxySarvam(SARVAM_API_KEY.value(), model, system, prompt, temperature, sendToken);
        } else {
          throw new Error(`Unknown managed provider: ${provider}`);
        }
      } catch (e) {
        errorMsg = e.message;
        res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      }

      res.write("data: [DONE]\n\n");
      res.end();

      // Log usage asynchronously (don't await — don't block the response)
      logUsage({
        uid:        user.uid,
        email:      user.email,
        provider, model, stage,
        inputChars, outputChars,
        durationMs: Date.now() - start,
        error:      errorMsg,
      });

      return;
    }

    // ── POST /api/session ─────────────────────────────────────
    if (req.method === "POST" && path === "/api/session") {
      const user = await verifyAuth(req, res);
      if (!user) return;
      const { sessionId, query, memberCount, hadFollowup, temperature, verdictChars } = req.body;
      await db.collection("sessions").doc(sessionId).set({
        userId: user.uid, userEmail: user.email,
        query: (query ?? "").slice(0, 100),
        memberCount, hadFollowup: !!hadFollowup, temperature,
        verdictChars: verdictChars ?? 0,
        ts: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {});
      return res.json({ ok: true });
    }

    // ── GET /api/admin/stats ──────────────────────────────────
    if (req.method === "GET" && path === "/api/admin/stats") {
      const user = await verifyAuth(req, res);
      if (!user) return;
      const adminUids = (ADMIN_UIDS.value() ?? "").split(",").map(s => s.trim());
      if (!adminUids.includes(user.uid)) {
        return res.status(403).json({ error: "Admin only" });
      }

      const [usersSnap, usageSnap, sessionsSnap] = await Promise.all([
        db.collection("users").orderBy("totalRequests", "desc").limit(20).get(),
        db.collection("usage").orderBy("ts", "desc").limit(500).get(),
        db.collection("sessions").orderBy("ts", "desc").limit(200).get(),
      ]);

      const users  = usersSnap.docs.map(d => d.data());
      const usages = usageSnap.docs.map(d => d.data());
      void sessionsSnap; // fetched for future use

      // Aggregate
      const totalUsers  = users.length;
      const totalReqs   = usages.length;
      const yesterday   = Date.now() - 86_400_000;
      const reqs24h     = usages.filter(u => u.ts?.toMillis?.() > yesterday).length;
      const modelCounts = {};
      usages.forEach(u => { const k = `${u.provider}/${u.model}`; modelCounts[k] = (modelCounts[k] ?? 0) + 1; });
      const topModels   = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, c]) => ({ key: k, count: c }));

      return res.json({ totalUsers, totalReqs, reqs24h, topModels, topUsers: users.slice(0, 10) });
    }

    res.status(404).json({ error: "Not found" });
  }
);

// ══════════════════════════════════════════════════════════════
// PROVIDER PROXY HELPERS
// ══════════════════════════════════════════════════════════════

async function proxyOllama(baseUrl, model, system, prompt, temperature, onToken) {
  const fetch  = (await import("node-fetch")).default;
  const msgs   = [];
  if (system) msgs.push({ role: "system", content: system });
  msgs.push({ role: "user", content: prompt });

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: msgs, stream: true, options: { temperature } }),
  });
  if (!res.ok) {
    const b = await res.text().catch(() => "");
    throw new Error(`Ollama ${res.status}: ${b.slice(0, 120)}`);
  }

  for await (const chunk of res.body) {
    for (const line of chunk.toString().split("\n").filter(Boolean)) {
      try {
        const data = JSON.parse(line);
        const tok  = data?.message?.content;
        if (tok) onToken(tok);
      } catch (_e) { /* skip */ }
    }
  }
}

async function proxySarvam(apiKey, model, system, prompt, temperature, onToken) {
  const fetch  = (await import("node-fetch")).default;
  const msgs   = [];
  if (system) msgs.push({ role: "system", content: system });
  msgs.push({ role: "user", content: prompt });

  const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: msgs, stream: true, max_tokens: 2000, temperature }),
  });
  if (!res.ok) {
    const b = await res.text().catch(() => "");
    throw new Error(`Sarvam ${res.status}: ${b.slice(0, 120)}`);
  }

  for await (const chunk of res.body) {
    for (const line of chunk.toString().split("\n")) {
      const t = line.trim();
      if (!t.startsWith("data: ")) continue;
      const raw = t.slice(6);
      if (raw === "[DONE]") break;
      try {
        const tok = JSON.parse(raw)?.choices?.[0]?.delta?.content;
        if (tok) onToken(tok);
      } catch (_e) { /* skip */ }
    }
  }
}