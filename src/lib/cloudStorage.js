/**
 * cloudStorage.js — Firebase-backed config storage with client-side encryption.
 *
 * When a user is signed in, configs are stored in Firestore under:
 *   users/{uid}/configs/{configId}
 *
 * API keys are encrypted client-side with AES-GCM (WebCrypto) before leaving
 * the browser. The encryption key is derived from the user's UID + a fixed
 * app salt — meaning only this browser session (with that UID) can decrypt them.
 * The server stores ciphertext and can never read the raw key.
 *
 * Falls back to localStorage for anonymous / logged-out users.
 */

import { db } from "./firebase";
import {
  collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp,
} from "firebase/firestore";

// ── Encryption helpers ────────────────────────────────────────────────────────
const APP_SALT = "ai-council-v2-configs";

async function deriveKey(uid) {
  const raw = new TextEncoder().encode(uid + APP_SALT);
  const base = await crypto.subtle.importKey("raw", raw, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode(APP_SALT), iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encrypt(plaintext, uid) {
  const key = await deriveKey(uid);
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  // Pack iv + ciphertext as base64
  const combined = new Uint8Array(iv.byteLength + enc.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(enc), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(b64, uid) {
  try {
    const key    = await deriveKey(uid);
    const bytes  = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const iv     = bytes.slice(0, 12);
    const data   = bytes.slice(12);
    const plain  = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(plain);
  } catch {
    return null; // key changed / corrupted — treat as no key
  }
}

// ── Cloud CRUD ────────────────────────────────────────────────────────────────
export async function cloudLoadConfigs(uid) {
  try {
    const snap = await getDocs(collection(db, "users", uid, "configs"));
    const results = await Promise.all(snap.docs.map(async (d) => {
      const data = d.data();
      let apiKey = "";
      if (data.encryptedApiKey) {
        apiKey = (await decrypt(data.encryptedApiKey, uid)) ?? "";
      }
      return { ...data, id: d.id, apiKey };
    }));
    return results.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  } catch {
    return [];
  }
}

export async function cloudSaveConfig(uid, cfg) {
  const { apiKey, ...rest } = cfg;
  const payload = {
    ...rest,
    encryptedApiKey: apiKey ? await encrypt(apiKey, uid) : "",
    updatedAt: serverTimestamp(),
    createdAt: rest.createdAt ?? Date.now(),
  };
  await setDoc(doc(db, "users", uid, "configs", cfg.id), payload);
}

export async function cloudDeleteConfig(uid, id) {
  await deleteDoc(doc(db, "users", uid, "configs", id));
}