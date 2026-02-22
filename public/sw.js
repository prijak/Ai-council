// AI Council — Service Worker
// Caches the app shell for offline/fast loads.
// API calls to LLM providers are NEVER cached — always go to network.

const CACHE = "ai-council-v1";

// App shell files to precache on install
const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.json",
];

// These origins must always hit the network — never serve from cache
const NETWORK_ONLY_ORIGINS = [
  "localhost:11434",           // Ollama
  "api.openai.com",
  "api.groq.com",
  "api.anthropic.com",
  "generativelanguage.googleapis.com",
];

// ── Install: cache the app shell ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting();
});

// ── Activate: clean up old caches ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// ── Fetch: smart routing ──────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Always skip non-GET requests (POST to AI APIs etc.)
  if (request.method !== "GET") return;

  // 2. Always skip LLM provider API calls
  if (NETWORK_ONLY_ORIGINS.some((origin) => url.host.includes(origin))) return;

  // 3. Skip cross-origin requests (CDNs, third-party scripts)
  if (url.origin !== self.location.origin) {
    // Exception: cache Google Fonts for offline use
    if (url.origin === "https://fonts.googleapis.com" ||
        url.origin === "https://fonts.gstatic.com") {
      event.respondWith(cacheFirst(request));
    }
    return;
  }

  // 4. For navigation requests (HTML pages) — network first, fall back to cache
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // 5. For JS/CSS/images — cache first (they're hashed by Vite anyway)
  event.respondWith(cacheFirst(request));
});

// ── Strategies ────────────────────────────────────────────────────────────

// Cache first: return cached version immediately, update cache in background
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

// Network first: try network, fall back to cache if offline
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    // If no cached page, return cached index.html for SPA routing
    return cached || caches.match("/index.html");
  }
}
