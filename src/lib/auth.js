import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, provider } from "./firebase";

export const API_BASE = import.meta.env.VITE_API_URL ?? "backendurl";

// ── Sign in ───────────────────────────────────────────────────────────────────
// Strategy: always try popup first (opens new tab, works everywhere).
// If popup is blocked or fails due to COOP headers (Vite dev server),
// automatically fall back to redirect flow.
//
// This replaces the fragile `hostname === "localhost"` check that broke
// as soon as the app was accessed via IP, ngrok, or any non-localhost URL.

export async function signInWithGoogle() {
  try {
    // Try popup first — this is what was working before ("opened in new tab")
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (err) {
    // Popup was blocked, killed by COOP header, or not supported
    const fallbackCodes = [
      "auth/popup-blocked",
      "auth/popup-closed-by-user",
      "auth/cancelled-popup-request",
      "auth/internal-error",          // Vite COOP header kills the popup
      "auth/web-storage-unsupported",
    ];

    if (fallbackCodes.includes(err?.code) || err?.message?.includes("Cross-Origin")) {
      // Fall back to redirect
      console.log("[auth] Popup failed, falling back to redirect:", err.code);
      sessionStorage.setItem("auth_redirect_pending", "1");
      return signInWithRedirect(auth, provider);
    }

    // Real error (wrong API key, network, etc.) — surface it
    throw err;
  }
}

// ── Redirect result handler ───────────────────────────────────────────────────
// MUST be called on every page load. Exchanges the Google OAuth code for a
// Firebase session. Resolves instantly with null when no redirect happened.
export const handleRedirectResult = () =>
  getRedirectResult(auth)
    .then((result) => {
      sessionStorage.removeItem("auth_redirect_pending");
      if (result?.user) {
        console.log("[auth] Redirect sign-in OK:", result.user.email);
      }
      return result;
    })
    .catch((err) => {
      sessionStorage.removeItem("auth_redirect_pending");
      console.error("[auth] getRedirectResult failed:", err?.code, err?.message);
      return null;
    });

export const isRedirectPending = () =>
  sessionStorage.getItem("auth_redirect_pending") === "1";

export const signOut      = () => fbSignOut(auth);
export const onUserChange = (cb) => onAuthStateChanged(auth, cb);
export const getIdToken   = () => auth.currentUser?.getIdToken() ?? Promise.resolve(null);

// ── Authenticated fetch helper ────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const token = await getIdToken();
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
}

// ── Managed models list ───────────────────────────────────────────────────────
let _modelCache = null;
export async function fetchManagedModels() {
  if (_modelCache) return _modelCache;
  try {
    const res = await apiFetch("/api/models");
    if (!res.ok) return null;
    _modelCache = await res.json();
    return _modelCache;
  } catch { return null; }
}

// ── Session logging (fire and forget) ────────────────────────────────────────
export async function logSessionToBackend({ sessionId, query, memberCount, hadFollowup, temperature, verdictChars }) {
  try {
    await apiFetch("/api/session", {
      method: "POST",
      body: JSON.stringify({ sessionId, query, memberCount, hadFollowup, temperature, verdictChars }),
    });
  } catch { /* non-critical */ }
}

// ── Streaming proxy ───────────────────────────────────────────────────────────
export async function streamManagedProvider({ provider, model, system, prompt, temperature, stage = "opinion" }) {
  const token = await getIdToken();
  const res   = await fetch(`${API_BASE}/api/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ provider, model, system, prompt, temperature, stage }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Proxy error ${res.status}`);
  }

  const reader = res.body.getReader();
  const dec    = new TextDecoder();

  return async function readAll(onChunk, signal) {
    let full = "";
    try {
      while (true) {
        if (signal?.aborted) { reader.cancel(); break; }
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          const t = line.trim();
          if (!t.startsWith("data: ")) continue;
          const raw = t.slice(6);
          if (raw === "[DONE]") break;
          try {
            const tok = JSON.parse(raw)?.choices?.[0]?.delta?.content ?? null;
            if (tok) { full += tok; onChunk(full); }
          } catch { /* skip malformed chunk */ }
        }
      }
    } catch (e) { if (e.name !== "AbortError") throw e; }
    return full;
  };
}