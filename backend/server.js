import express from "express";
import cors from "cors";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fetch from "node-fetch";

if (!getApps().length) initializeApp();
const auth = getAuth();
const db   = getFirestore();

const PORT                  = process.env.PORT ?? 8103;
const OLLAMA_BASE_URL       = process.env.OLLAMA_BASE_URL;
const SARVAM_API_KEY        = process.env.SARVAM_API_KEY ?? "";
const MANAGED_OLLAMA_MODELS = (process.env.MANAGED_OLLAMA_MODELS ?? "").split(",").map(s => s.trim()).filter(Boolean);
const ADMIN_UIDS            = (process.env.ADMIN_UIDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
const ALLOWED_ORIGINS       = (process.env.ALLOWED_ORIGINS ?? "*").split(",").map(s => s.trim());
const RATE_LIMIT_PER_MIN    = parseInt(process.env.RATE_LIMIT_PER_MIN ?? "30");

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS.includes("*") ? "*" : ALLOWED_ORIGINS }));
app.use(express.json());

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

// ── Routes ────────────────────────────────────────────────────────────────────
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

app.listen(PORT, () => console.log(`✅ AI Council backend on port ${PORT}`));
