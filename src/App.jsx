import { useState, useCallback, useEffect, useRef } from "react";
import {
  tokens,
  formStyles,
  layoutStyles,
  cardStyles,
  textStyles,
  buttonStyles,
  skeletonLine,
  skeletonLinePurple,
} from "./styles";

/* ═══════════════════════════════════════════════════════════════
   PROVIDER REGISTRY
═══════════════════════════════════════════════════════════════ */
const PROVIDERS = {
  ollama: {
    name: "Ollama",
    icon: "🦙",
    color: "#34d399",
    needsKey: false,
    needsEndpoint: true,
    defaultEndpoint: "http://localhost:11434",
    canFetchModels: true,
    suggestedModels: [],
    hint: 'Start Ollama with: OLLAMA_ORIGINS="*" ollama serve',
    compat: "ollama",
  },
  openai: {
    name: "OpenAI",
    icon: "◆",
    color: "#74aa9c",
    needsKey: true,
    needsEndpoint: false,
    defaultEndpoint: "https://api.openai.com/v1",
    canFetchModels: true,
    suggestedModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    hint: "OpenAI may block direct browser requests — use a local CORS proxy if needed.",
    compat: "openai",
    modelFilter: (id) =>
      id.startsWith("gpt-") || id.startsWith("o1") || id.startsWith("o3"),
  },
  groq: {
    name: "Groq",
    icon: "⚡",
    color: "#f59e0b",
    needsKey: true,
    needsEndpoint: false,
    defaultEndpoint: "https://api.groq.com/openai/v1",
    canFetchModels: true,
    suggestedModels: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
    hint: null,
    compat: "openai",
    modelFilter: () => true,
  },
  anthropic: {
    name: "Anthropic",
    icon: "◈",
    color: "#a78bfa",
    needsKey: true,
    needsEndpoint: false,
    defaultEndpoint: "https://api.anthropic.com",
    canFetchModels: true,
    suggestedModels: [
      "claude-opus-4-6",
      "claude-sonnet-4-6",
      "claude-haiku-4-5-20251001",
    ],
    hint: null,
    compat: "anthropic",
    modelFilter: () => true,
  },
  google: {
    name: "Google",
    icon: "◎",
    color: "#4285f4",
    needsKey: true,
    needsEndpoint: false,
    defaultEndpoint: "https://generativelanguage.googleapis.com",
    canFetchModels: true,
    suggestedModels: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    hint: null,
    compat: "google",
    modelFilter: (n) => n.includes("gemini"),
  },
  custom: {
    name: "Custom",
    icon: "⚙",
    color: "#94a3b8",
    needsKey: true,
    needsEndpoint: true,
    defaultEndpoint: "http://localhost:8000/v1",
    canFetchModels: false,
    suggestedModels: [],
    hint: "Any OpenAI-compatible endpoint — LiteLLM, LocalAI, vLLM, etc.",
    compat: "openai",
    modelFilter: () => true,
  },
};

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const ACCENT_COLORS = [
  "#a78bfa",
  "#fb923c",
  "#34d399",
  "#60a5fa",
  "#f59e0b",
  "#f472b6",
  "#22d3ee",
  "#a3e635",
];
const ACCENT_ICONS = ["⚖", "✦", "⚡", "◈", "⚙", "◎", "❋", "◆"];

const PERSONAS = [
  {
    id: "analyst",
    label: "The Analyst",
    chairSuggest: false,
    prompt:
      "Think like a senior strategist and systems engineer. Break the problem into structured components (inputs, constraints, incentives, risks, outcomes). Make assumptions explicit. Separate facts from inference. Quantify trade-offs when possible. Evaluate options comparatively, not in isolation. Highlight causal relationships, not just correlations. End with a precise, logically defensible conclusion. No vague summaries — produce a reasoned position.Avoid generic advice. Avoid repeating the question. Provide insight that would not be obvious to an average thinker.",
  },
  {
    id: "contrarian",
    label: "The Contrarian",
    chairSuggest: false,
    prompt:
      "Act as the council’s stress tester. Challenge dominant assumptions, surface blind spots, and expose hidden fragilities. Identify second-order and unintended consequences. Ask: 'If this fails, why will it fail?' Examine incentives, edge cases, and adversarial scenarios. Do not argue for the sake of it — target weaknesses that materially affect outcomes. Your goal is to strengthen the final decision through disciplined skepticism.Avoid generic advice. Avoid repeating the question. Provide insight that would not be obvious to an average thinker.",
  },
  {
    id: "visionary",
    label: "The Visionary",
    chairSuggest: false,
    prompt:
      "Operate at the level of paradigm shifts. Reframe the problem in larger systems context. Draw analogies from other industries, technologies, history, biology, or strategy. Identify asymmetric advantages, non-obvious leverage points, and opportunities for 10x impact. Explore unconventional but plausible paths. Avoid fantasy — anchor bold ideas in structural logic. Your role is to expand the solution space intelligently.Avoid generic advice. Avoid repeating the question. Provide insight that would not be obvious to an average thinker.",
  },
  {
    id: "pragmatist",
    label: "The Pragmatist",
    chairSuggest: true,
    prompt:
      "Convert ideas into execution. Focus on feasibility, sequencing, constraints, cost, risk, and measurable outcomes. Prioritize by impact vs effort. Eliminate unnecessary complexity. Define specific next steps, required resources, timelines, and decision checkpoints. If something cannot realistically be implemented, say so. Produce an actionable plan, not commentary.Avoid generic advice. Avoid repeating the question. Provide insight that would not be obvious to an average thinker.",
  },
  {
    id: "philosopher",
    label: "The Philosopher",
    chairSuggest: false,
    prompt:
      "Examine the question from first principles. Clarify definitions and assumptions. Identify underlying values, ethical implications, long-term societal effects, and systemic consequences. Question whether the problem is framed correctly. Distinguish between what is technically possible and what is desirable. Elevate the discussion beyond tactics into meaning, responsibility, and long-term coherence.Avoid generic advice. Avoid repeating the question. Provide insight that would not be obvious to an average thinker.",
  },
  { id: "custom", label: "Custom ✎", chairSuggest: false, prompt: "" },
];

const CHAIRMAN_SYNTHESIS = `
You are the Chairman of the AI Council — final arbiter and decision authority.

You have read all council member responses and critiques.

Your responsibility is not to summarize. It is to decide.

Your mandate:
1. Extract the strongest, highest-signal insights from each member.
2. Identify disagreements and explicitly determine which reasoning is superior — explain briefly why.
3. Reject weak, redundant, or speculative arguments.
4. Integrate only what materially improves the outcome.
5. Deliver one unified, coherent, and decisive final answer.

You must:
- Issue a clear conclusion.
- Specify what should be done (if action is required).
- Define priority and direction.
- Avoid hedging, ambiguity, or vague abstraction.
- Speak with authority.

Do not present multiple options unless strategically necessary. If multiple paths exist, rank them and select the primary course of action.

This is the council’s final ruling.

Begin your response with:

**Council's Verdict:**
`;

let _seq = 0;
const uid = () => `m${++_seq}_${Date.now()}`;
const cid = () => `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const sid = () =>
  `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/* ═══════════════════════════════════════════════════════════════
   THINK-BLOCK STRIPPER
   Removes <think>...</think> from DeepSeek-R1, QwQ, etc.
   Also handles the streaming case where the block is still open
   (no closing tag yet) — we hide everything after an unclosed
   <think> so the UI stays clean while the model is reasoning.
═══════════════════════════════════════════════════════════════ */
function stripThinking(text) {
  if (!text) return text;
  // Remove fully closed think blocks
  let result = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // If there's still an unclosed <think>, hide everything from it onward
  const openIdx = result.search(/<think>/i);
  if (openIdx !== -1) result = result.slice(0, openIdx);
  return result.replace(/^\s+/, "").trim();
}

// Returns true if the raw stream is currently inside an unclosed <think> block
function isThinking(rawText) {
  if (!rawText) return false;
  const lower = rawText.toLowerCase();
  const lastOpen = lower.lastIndexOf("<think>");
  if (lastOpen === -1) return false;
  const lastClose = lower.lastIndexOf("</think>");
  return lastClose < lastOpen;
}

/* ═══════════════════════════════════════════════════════════════
   PERSISTENT STORAGE
═══════════════════════════════════════════════════════════════ */
const CONFIGS_KEY = "ai-council-configs-v2";
const SESSIONS_KEY = "ai-council-sessions";

async function loadConfigs() {
  try {
    const r = await window.storage.get(CONFIGS_KEY);
    return r ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}
async function persistConfigs(configs) {
  try {
    await window.storage.set(CONFIGS_KEY, JSON.stringify(configs));
  } catch {}
}
async function saveConfig(cfg) {
  const all = await loadConfigs();
  const next = [...all.filter((c) => c.id !== cfg.id), cfg];
  await persistConfigs(next);
  return next;
}
async function deleteConfig(id) {
  const all = await loadConfigs();
  const next = all.filter((c) => c.id !== id);
  await persistConfigs(next);
  return next;
}

async function loadSessions() {
  try {
    const r = await window.storage.get(SESSIONS_KEY);
    return r ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}
async function persistSessions(sessions) {
  try {
    await window.storage.set(SESSIONS_KEY, JSON.stringify(sessions.slice(-30)));
  } catch {}
}

/* ═══════════════════════════════════════════════════════════════
   OLLAMA QUEUE
═══════════════════════════════════════════════════════════════ */
const ollamaQueues = {};
function enqueueOllama(endpoint, fn) {
  const key = endpoint.replace(/\/$/, "").toLowerCase();
  if (!ollamaQueues[key]) ollamaQueues[key] = Promise.resolve();
  const next = ollamaQueues[key].then(() => fn());
  ollamaQueues[key] = next.catch(() => {});
  return next;
}

/* ═══════════════════════════════════════════════════════════════
   MODEL FETCHING
═══════════════════════════════════════════════════════════════ */
async function fetchModels(provider, endpoint, apiKey) {
  const pInfo = PROVIDERS[provider];
  if (provider === "ollama") {
    const res = await fetch(`${endpoint.replace(/\/$/, "")}/api/tags`);
    if (!res.ok) throw new Error(`Cannot reach Ollama at ${endpoint}`);
    return (await res.json()).models?.map((m) => m.name) || [];
  }
  if (["openai", "groq", "custom"].includes(provider)) {
    const base = (endpoint || pInfo.defaultEndpoint).replace(/\/$/, "");
    const res = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const filter = pInfo.modelFilter || (() => true);
    return ((await res.json()).data || [])
      .map((m) => m.id)
      .filter(filter)
      .sort();
  }
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-allow-browser": "true",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()).data || []).map((m) => m.id).sort();
  }
  if (provider === "google") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()).models || [])
      .map((m) => m.name.replace("models/", ""))
      .filter((n) => n.includes("gemini"))
      .sort();
  }
  throw new Error("Model fetching not supported");
}

/* ═══════════════════════════════════════════════════════════════
   API LAYER
═══════════════════════════════════════════════════════════════ */
async function sseStream(res, onChunk, extractFn) {
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 160)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split("\n")) {
      const token = extractFn(line.trim());
      if (token) {
        full += token;
        onChunk(full);
      }
    }
  }
  return full;
}

async function callOllamaDirect(member, system, prompt, onChunk) {
  const msgs = [];
  if (system) msgs.push({ role: "system", content: system });
  msgs.push({ role: "user", content: prompt });
  const res = await fetch(`${member.endpoint.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: member.model, messages: msgs, stream: true }),
  });
  if (!res.ok) {
    const b = await res.text().catch(() => "");
    throw new Error(`Ollama ${res.status}${b ? ": " + b.slice(0, 80) : ""}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split("\n").filter(Boolean)) {
      try {
        const d = JSON.parse(line);
        if (d.message?.content) {
          full += d.message.content;
          onChunk(full);
        }
      } catch {}
    }
  }
  return full;
}
const callOllama = (m, sys, p, cb) =>
  enqueueOllama(m.endpoint, () => callOllamaDirect(m, sys, p, cb));

async function callOpenAICompat(member, system, prompt, onChunk) {
  const msgs = [];
  if (system) msgs.push({ role: "system", content: system });
  msgs.push({ role: "user", content: prompt });
  const base = (
    member.endpoint || PROVIDERS[member.provider].defaultEndpoint
  ).replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${member.apiKey}`,
    },
    body: JSON.stringify({
      model: member.model,
      messages: msgs,
      stream: true,
      max_tokens: 1500,
    }),
  });
  return sseStream(res, onChunk, (line) => {
    if (!line.startsWith("data: ")) return null;
    const raw = line.slice(6).trim();
    if (raw === "[DONE]") return null;
    try {
      return JSON.parse(raw).choices?.[0]?.delta?.content ?? null;
    } catch {
      return null;
    }
  });
}

async function callAnthropic(member, system, prompt, onChunk) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": member.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-allow-browser": "true",
    },
    body: JSON.stringify({
      model: member.model,
      max_tokens: 1500,
      stream: true,
      ...(system ? { system } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
  });
  return sseStream(res, onChunk, (line) => {
    if (!line.startsWith("data: ")) return null;
    try {
      const d = JSON.parse(line.slice(6));
      return d.type === "content_block_delta" ? (d.delta?.text ?? null) : null;
    } catch {
      return null;
    }
  });
}

async function callGoogle(member, system, prompt, onChunk) {
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    generationConfig: { maxOutputTokens: 1500 },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${member.model}:streamGenerateContent?key=${member.apiKey}&alt=sse`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return sseStream(res, onChunk, (line) => {
    if (!line.startsWith("data: ")) return null;
    try {
      return (
        JSON.parse(line.slice(6)).candidates?.[0]?.content?.parts?.[0]?.text ??
        null
      );
    } catch {
      return null;
    }
  });
}

function dispatchMember(member, system, prompt, onChunk) {
  const compat = PROVIDERS[member.provider].compat;
  if (compat === "ollama") return callOllama(member, system, prompt, onChunk);
  if (compat === "openai")
    return callOpenAICompat(member, system, prompt, onChunk);
  if (compat === "anthropic")
    return callAnthropic(member, system, prompt, onChunk);
  if (compat === "google") return callGoogle(member, system, prompt, onChunk);
  throw new Error(`Unknown provider: ${member.provider}`);
}

/* ═══════════════════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════════════════ */
function Spin({ size = 14, color = tokens.primary }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        border: `2px solid ${color}28`,
        borderTop: `2px solid ${color}`,
        borderRight: `2px solid ${color}`,
        borderRadius: "50%",
        animation: "spin 0.65s linear infinite",
      }}
    />
  );
}

function Badge({ label, color }) {
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 4,
        fontSize: tokens.fontSm,
        fontWeight: 600,
        background: `${color}1a`,
        color,
        border: `1px solid ${color}44`,
        letterSpacing: 0.4,
      }}
    >
      {label}
    </span>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
      }}
      onClick={onChange}
    >
      <div
        style={{
          width: 38,
          height: 21,
          borderRadius: 11,
          position: "relative",
          background: on ? tokens.primary : "rgba(255,255,255,0.1)",
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            width: 15,
            height: 15,
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: 3,
            left: on ? 19 : 3,
            transition: "left 0.2s",
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: on ? "#c4b5fd" : tokens.textMuted }}>
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SAVED CONFIG CARD
═══════════════════════════════════════════════════════════════ */
function SavedConfigCard({ cfg, onLoad, onDelete }) {
  const pInfo = PROVIDERS[cfg.provider] || PROVIDERS.custom;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${tokens.borderSubtle}`,
        borderRadius: 9,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = pInfo.color + "66")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = tokens.borderSubtle)
      }
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: `${pInfo.color}15`,
          border: `1px solid ${pInfo.color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: pInfo.color,
          flexShrink: 0,
        }}
      >
        {pInfo.icon}
      </div>
      <div
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
        onClick={() => onLoad(cfg)}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#ddd",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cfg.label}
        </div>
        <div
          style={{
            fontSize: 11,
            color: tokens.textMuted,
            display: "flex",
            gap: 6,
            marginTop: 1,
          }}
        >
          <span style={{ color: pInfo.color }}>{pInfo.name}</span>
          <span>·</span>
          <span style={textStyles.mono}>
            {(cfg.model || "").split(":")[0].slice(0, 20)}
          </span>
          {cfg.apiKey && (
            <>
              <span>·</span>
              <span style={{ color: tokens.success }}>🔑 key saved</span>
            </>
          )}
        </div>
      </div>
      <button
        onClick={() => onLoad(cfg)}
        style={{
          padding: "4px 10px",
          borderRadius: 6,
          border: `1px solid rgba(167,139,250,0.3)`,
          background: "rgba(167,139,250,0.08)",
          color: "#c4b5fd",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        Load
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(cfg.id);
        }}
        style={{ ...buttonStyles.iconSquare, fontSize: 13, flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SAVE CONFIG ROW
═══════════════════════════════════════════════════════════════ */
function SaveConfigRow({ prov, endpoint, apiKey, model, onSaved }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveKey, setSaveKey] = useState(true);

  const doSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    const cfg = {
      id: cid(),
      label: label.trim(),
      provider: prov,
      endpoint,
      apiKey: saveKey ? apiKey : "",
      model,
    };
    const next = await saveConfig(cfg);
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      setLabel("");
    }, 1200);
    onSaved(next);
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: 9,
          borderRadius: tokens.radiusMd,
          border: `1px dashed rgba(52,211,153,0.25)`,
          background: "rgba(52,211,153,0.04)",
          color: "#6ee7b7",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.3,
        }}
      >
        💾 Save this config for reuse
      </button>
    );

  return (
    <div
      style={{
        padding: 14,
        background: "rgba(52,211,153,0.05)",
        border: `1px solid rgba(52,211,153,0.2)`,
        borderRadius: 10,
        animation: "slideDown 0.15s ease",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#6ee7b7",
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        Save Config (provider · endpoint · model
        {PROVIDERS[prov]?.needsKey && apiKey ? " · key" : ""})
      </div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={`e.g. "Google Gemini Flash", "Groq Llama 70B"…`}
        style={{ ...formStyles.input, marginBottom: 10 }}
        onKeyDown={(e) => {
          if (e.key === "Enter") doSave();
        }}
      />
      {PROVIDERS[prov]?.needsKey && apiKey && (
        <div style={{ marginBottom: 10 }}>
          <Toggle
            on={saveKey}
            onChange={() => setSaveKey((s) => !s)}
            label={
              saveKey
                ? "API key will be saved (stored locally in browser)"
                : "Don't save API key (re-enter each time)"
            }
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => {
            setOpen(false);
            setLabel("");
          }}
          style={{ ...buttonStyles.ghost, flex: 1, padding: 8 }}
        >
          Cancel
        </button>
        <button
          onClick={doSave}
          disabled={!label.trim() || saving}
          style={{
            flex: 2,
            padding: 8,
            borderRadius: 7,
            border: "none",
            background: saved
              ? tokens.success
              : label.trim()
                ? `linear-gradient(135deg,${tokens.success},${tokens.secondary})`
                : "rgba(255,255,255,0.05)",
            color: label.trim() ? "#fff" : tokens.textFaint,
            cursor: label.trim() ? "pointer" : "not-allowed",
            fontSize: 13,
            fontWeight: 600,
            transition: "background 0.2s",
          }}
        >
          {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Config"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SYSTEM PROMPT EDITOR
═══════════════════════════════════════════════════════════════ */
function SystemPromptEditor({ prompt, override, accentColor, onChange }) {
  const [open, setOpen] = useState(!!override);
  const hasOverride = override.trim().length > 0;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 7,
        }}
      >
        <label style={{ ...formStyles.label, marginBottom: 0 }}>
          System Prompt
          {hasOverride && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: tokens.warning,
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.3)",
                padding: "1px 7px",
                borderRadius: 4,
              }}
            >
              ✎ customized
            </span>
          )}
        </label>
        <div style={{ display: "flex", gap: 6 }}>
          {hasOverride && (
            <button
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              style={{
                fontSize: 11,
                color: tokens.textMuted,
                background: "none",
                border: `1px solid ${tokens.borderSubtle}`,
                borderRadius: 5,
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              ↺ Reset to default
            </button>
          )}
          {!open && (
            <button
              onClick={() => setOpen(true)}
              style={{
                fontSize: 11,
                color: accentColor,
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}44`,
                borderRadius: 5,
                padding: "2px 9px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ✎ Customize
            </button>
          )}
          {open && (
            <button
              onClick={() => setOpen(false)}
              style={{
                fontSize: 11,
                color: tokens.textMuted,
                background: "none",
                border: `1px solid ${tokens.borderSubtle}`,
                borderRadius: 5,
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              ▲ Collapse
            </button>
          )}
        </div>
      </div>
      {!open && (
        <div
          onClick={() => setOpen(true)}
          style={{
            padding: "9px 12px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 7,
            fontSize: 11,
            color: hasOverride ? "#d4c97a" : tokens.textMuted,
            lineHeight: 1.6,
            borderLeft: `2px solid ${hasOverride ? tokens.warning : accentColor}44`,
            fontStyle: "italic",
            cursor: "pointer",
          }}
        >
          {(hasOverride ? override : prompt).slice(0, 140)}
          {(hasOverride ? override : prompt).length > 140 ? "…" : ""}
        </div>
      )}
      {open && (
        <div style={{ animation: "slideDown 0.15s ease" }}>
          {!hasOverride && (
            <div
              style={{
                marginBottom: 8,
                padding: "7px 11px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 6,
                borderLeft: `2px solid ${accentColor}33`,
                fontSize: 11,
                color: tokens.textFaint,
                fontStyle: "italic",
                lineHeight: 1.55,
              }}
            >
              Default: {prompt}
            </div>
          )}
          <textarea
            value={override}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            placeholder={`Override the default prompt…`}
            style={{
              ...formStyles.input,
              resize: "vertical",
              lineHeight: 1.6,
              borderColor: hasOverride ? `rgba(245,158,11,0.4)` : undefined,
              fontSize: 13,
            }}
          />
          <div style={{ fontSize: 11, color: tokens.textFaint, marginTop: 5 }}>
            Leave empty to use the default persona prompt.
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MEMBER FORM
═══════════════════════════════════════════════════════════════ */
function MemberForm({
  onAdd,
  onCancel,
  slotIndex,
  currentChairmanId,
  editMember = null,
}) {
  const isEdit = !!editMember;
  const [prov, setProv] = useState(editMember?.provider || "ollama");
  const [endpoint, setEndpoint] = useState(
    editMember?.endpoint || "http://localhost:11434",
  );
  const [apiKey, setApiKey] = useState(editMember?.apiKey || "");
  const [model, setModel] = useState(editMember?.model || "");
  const [name, setName] = useState(editMember?.name || "");
  const [personaId, setPersonaId] = useState(
    editMember
      ? PERSONAS.find((p) => p.prompt === editMember.systemPrompt)?.id ||
          "custom"
      : "analyst",
  );
  const [customSys, setCustomSys] = useState(() => {
    if (!editMember) return "";
    const matchedPersona = PERSONAS.find(
      (p) => p.id !== "custom" && p.prompt === editMember.systemPrompt,
    );
    return matchedPersona ? "" : editMember.systemPrompt || "";
  });
  const [isChairman, setIsChairman] = useState(false);
  const [fetched, setFetched] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [chairMsg, setChairMsg] = useState("");
  const [configs, setConfigs] = useState([]);
  const [loadingCfg, setLoadingCfg] = useState(true);

  useEffect(() => {
    loadConfigs().then((c) => {
      setConfigs(c);
      setLoadingCfg(false);
    });
  }, []);

  const pInfo = PROVIDERS[prov];
  const color = ACCENT_COLORS[slotIndex % ACCENT_COLORS.length];
  const icon = ACCENT_ICONS[slotIndex % ACCENT_ICONS.length];
  const suggestions = fetched.length ? fetched : pInfo.suggestedModels;
  const personaObj = PERSONAS.find((p) => p.id === personaId);
  const canAdd =
    name.trim() && model.trim() && (pInfo.needsKey ? apiKey.trim() : true);

  const handleProvChange = (p) => {
    setProv(p);
    setEndpoint(PROVIDERS[p].defaultEndpoint || "");
    setModel("");
    setFetched([]);
    setFetchErr("");
  };
  const handlePersonaChange = (pid) => {
    setPersonaId(pid);
    const p = PERSONAS.find((x) => x.id === pid);
    if (p?.chairSuggest && !currentChairmanId) {
      setIsChairman(true);
      setChairMsg("👑 Auto-selected — Pragmatist is the natural synthesizer.");
    } else setChairMsg("");
  };

  const handleLoadConfig = (cfg) => {
    handleProvChange(cfg.provider);
    setEndpoint(cfg.endpoint || PROVIDERS[cfg.provider]?.defaultEndpoint || "");
    setApiKey(cfg.apiKey || "");
    setModel(cfg.model || "");
    setFetched([]);
  };
  const handleDeleteConfig = async (id) => {
    const next = await deleteConfig(id);
    setConfigs(next);
  };

  const doFetch = async () => {
    if (pInfo.needsKey && !apiKey.trim()) {
      setFetchErr("Enter your API key first.");
      return;
    }
    setFetching(true);
    setFetchErr("");
    try {
      const models = await fetchModels(prov, endpoint, apiKey);
      setFetched(models);
      if (models.length && !model) setModel(models[0]);
    } catch (e) {
      setFetchErr(e.message);
    } finally {
      setFetching(false);
    }
  };

  const doAdd = () => {
    if (!canAdd) return;
    onAdd({
      ...(editMember || {}),
      id: editMember?.id || uid(),
      name: name.trim(),
      provider: prov,
      model: model.trim(),
      endpoint: endpoint.trim(),
      apiKey: apiKey.trim(),
      personaLabel: personaObj.label,
      systemPrompt:
        personaId === "custom"
          ? customSys
          : customSys.trim()
            ? customSys
            : personaObj.prompt,
      color: editMember?.color || color,
      icon: editMember?.icon || icon,
      isChairman,
    });
  };

  return (
    <div
      style={{
        ...cardStyles.formPanel,
        border: `1px solid ${editMember?.color || color}44`,
      }}
    >
      {!loadingCfg && configs.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <label style={formStyles.label}>
              Saved Configs ({configs.length})
            </label>
            <span style={{ fontSize: 11, color: tokens.textMuted }}>
              Loads provider · model · key only
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 7,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {configs.map((cfg) => (
              <SavedConfigCard
                key={cfg.id}
                cfg={cfg}
                onLoad={handleLoadConfig}
                onDelete={handleDeleteConfig}
              />
            ))}
          </div>
          <div style={formStyles.divider} />
        </div>
      )}
      {loadingCfg && (
        <div
          style={{ fontSize: 12, color: tokens.textFaint, marginBottom: 14 }}
        >
          Loading saved configs…
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: `${editMember?.color || color}20`,
            border: `1px solid ${editMember?.color || color}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            color: editMember?.color || color,
          }}
        >
          {editMember?.icon || icon}
        </div>
        <span
          style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}
        >
          {isEdit ? "Edit Member" : "Configure Member"}
        </span>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={formStyles.label}>Provider</label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {Object.entries(PROVIDERS).map(([k, p]) => (
            <button
              key={k}
              onClick={() => handleProvChange(k)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 5,
                border: `1px solid ${prov === k ? p.color + "99" : tokens.borderSubtle}`,
                background: prov === k ? `${p.color}18` : "transparent",
                color: prov === k ? p.color : tokens.textMuted,
              }}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
        {pInfo.hint && (
          <div
            style={{
              ...cardStyles.warnBox,
              marginTop: 9,
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            ⚠ {pInfo.hint}
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            pInfo.needsEndpoint && pInfo.needsKey ? "1fr 1fr" : "1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {pInfo.needsEndpoint && (
          <div>
            <label style={formStyles.label}>Endpoint URL</label>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder={pInfo.defaultEndpoint}
              style={formStyles.input}
            />
          </div>
        )}
        {pInfo.needsKey && (
          <div>
            <label style={formStyles.label}>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-…"
              style={formStyles.input}
            />
          </div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 7,
          }}
        >
          <label style={{ ...formStyles.label, marginBottom: 0 }}>Model</label>
          {pInfo.canFetchModels && (
            <button
              onClick={doFetch}
              disabled={fetching}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${tokens.borderStrong}`,
                background: tokens.bgInput,
                color: tokens.textSecondary,
                cursor: fetching ? "wait" : "pointer",
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {fetching ? (
                <>
                  <Spin size={10} color={tokens.textSecondary} /> Fetching…
                </>
              ) : (
                "↻ Fetch live models"
              )}
            </button>
          )}
        </div>
        <input
          list={`sg-${prov}-${slotIndex}`}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={suggestions[0] || "model-name"}
          style={formStyles.input}
        />
        {suggestions.length > 0 && (
          <datalist id={`sg-${prov}-${slotIndex}`}>
            {suggestions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        )}
        {fetchErr && (
          <div style={{ fontSize: 11, color: tokens.danger, marginTop: 4 }}>
            ⚠ {fetchErr}
          </div>
        )}
        {fetched.length > 0 && !fetchErr && (
          <div style={{ fontSize: 11, color: tokens.success, marginTop: 4 }}>
            ✓ {fetched.length} models — type or pick from dropdown
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <label style={formStyles.label}>Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gemini Flash"
            style={formStyles.input}
          />
        </div>
        <div>
          <label style={formStyles.label}>Persona</label>
          <select
            value={personaId}
            onChange={(e) => handlePersonaChange(e.target.value)}
            style={{ ...formStyles.input, cursor: "pointer" }}
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {chairMsg && (
        <div
          style={{
            ...cardStyles.infoBox,
            marginBottom: 10,
            background: "rgba(167,139,250,0.08)",
            border: `1px solid rgba(167,139,250,0.25)`,
            color: "#c4b5fd",
          }}
        >
          {chairMsg}
        </div>
      )}

      {personaId === "custom" ? (
        <div style={{ marginBottom: 14 }}>
          <label style={formStyles.label}>System Prompt</label>
          <textarea
            value={customSys}
            onChange={(e) => setCustomSys(e.target.value)}
            rows={4}
            style={{ ...formStyles.input, resize: "vertical", lineHeight: 1.6 }}
            placeholder="Describe how this member should think and respond…"
          />
        </div>
      ) : (
        <SystemPromptEditor
          prompt={personaObj?.prompt || ""}
          override={customSys}
          accentColor={editMember?.color || color}
          onChange={(val) => setCustomSys(val)}
        />
      )}

      {!isEdit && (
        <div style={{ marginBottom: 18 }}>
          <Toggle
            on={isChairman}
            onChange={() => setIsChairman((c) => !c)}
            label={
              isChairman
                ? "👑 Chairman — will synthesize the final verdict"
                : "Designate as Chairman"
            }
          />
          {currentChairmanId && isChairman && (
            <div
              style={{
                fontSize: 11,
                color: tokens.warning,
                marginTop: 5,
                marginLeft: 48,
              }}
            >
              ⚠ This will replace the current Chairman
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <SaveConfigRow
          prov={prov}
          endpoint={endpoint}
          apiKey={apiKey}
          model={model}
          onSaved={setConfigs}
        />
      </div>

      <div style={{ display: "flex", gap: 9 }}>
        <button
          onClick={onCancel}
          style={{
            ...buttonStyles.ghost,
            flex: 1,
            padding: 11,
            borderRadius: tokens.radiusMd,
          }}
        >
          Cancel
        </button>
        <button
          onClick={doAdd}
          disabled={!canAdd}
          style={{
            flex: 2,
            padding: 11,
            borderRadius: tokens.radiusMd,
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            background: canAdd
              ? `linear-gradient(135deg,${editMember?.color || color},${ACCENT_COLORS[(slotIndex + 2) % ACCENT_COLORS.length]})`
              : "rgba(255,255,255,0.05)",
            color: canAdd ? "#fff" : tokens.textFaint,
            cursor: canAdd ? "pointer" : "not-allowed",
          }}
        >
          {isEdit ? "Save Changes ✓" : "Add to Council →"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MEMBER CARD
═══════════════════════════════════════════════════════════════ */
function MemberCard({
  member,
  isChairman,
  onRemove,
  onToggleChairman,
  onEdit,
}) {
  const pInfo = PROVIDERS[member.provider];
  return (
    <div
      style={{
        ...cardStyles.base,
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "13px 16px",
        border: `1px solid ${isChairman ? member.color + "66" : tokens.borderSubtle}`,
      }}
    >
      {isChairman && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg,transparent,${member.color},transparent)`,
          }}
        />
      )}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${member.color}1a`,
          border: `1px solid ${member.color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          color: member.color,
          flexShrink: 0,
        }}
      >
        {member.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 3,
          }}
        >
          <span
            style={{ fontWeight: 600, color: tokens.textPrimary, fontSize: 13 }}
          >
            {member.name}
          </span>
          {isChairman && <Badge label="👑 Chairman" color={member.color} />}
        </div>
        <div
          style={{
            fontSize: 11,
            color: tokens.textMuted,
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: pInfo.color }}>
            {pInfo.icon} {pInfo.name}
          </span>
          <span>·</span>
          <span style={textStyles.mono}>{member.model.split(":")[0]}</span>
          <span>·</span>
          <span>{member.personaLabel}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        <button
          onClick={onToggleChairman}
          style={{
            ...buttonStyles.iconSquare,
            border: `1px solid ${isChairman ? member.color + "55" : tokens.borderSubtle}`,
            background: isChairman ? `${member.color}18` : "transparent",
            color: isChairman ? member.color : tokens.textMuted,
          }}
          title="Toggle Chairman"
        >
          👑
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{ ...buttonStyles.iconSquare, color: tokens.textMuted }}
            title="Edit member"
          >
            ✎
          </button>
        )}
        <button
          onClick={onRemove}
          style={buttonStyles.iconSquare}
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MANAGE PANEL
═══════════════════════════════════════════════════════════════ */
function ManagePanel({
  members,
  chairmanId,
  onClose,
  onUpdateMembers,
  onUpdateChairman,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editMember = editingId ? members.find((m) => m.id === editingId) : null;

  const addMember = (m) => {
    onUpdateMembers([...members, m]);
    if (m.isChairman) onUpdateChairman(m.id);
    setShowForm(false);
  };
  const saveMember = (updated) => {
    onUpdateMembers(members.map((m) => (m.id === updated.id ? updated : m)));
    setEditingId(null);
  };
  const removeMember = (id) => {
    onUpdateMembers(members.filter((m) => m.id !== id));
    if (chairmanId === id) onUpdateChairman(null);
  };
  const toggleChairman = (id) =>
    onUpdateChairman(chairmanId === id ? null : id);

  return (
    <>
      <div onClick={onClose} style={layoutStyles.backdrop} />
      <div style={layoutStyles.sidePanel}>
        <div
          style={{
            padding: "20px 22px",
            borderBottom: `1px solid ${tokens.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            background: tokens.bgPanel,
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
              Manage Council
            </div>
            <div
              style={{
                fontSize: 10,
                color: tokens.textFaint,
                letterSpacing: 1,
                marginTop: 1,
              }}
            >
              {members.length} MEMBERS
            </div>
          </div>
          <button onClick={onClose} style={buttonStyles.iconSquare}>
            ✕
          </button>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ ...cardStyles.infoBox, marginBottom: 18 }}>
            ✓ Changes apply to the <strong>next query</strong> — your current
            session and history are untouched.
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {members.map((m) => (
              <div key={m.id}>
                <MemberCard
                  member={m}
                  isChairman={chairmanId === m.id}
                  onRemove={() => removeMember(m.id)}
                  onToggleChairman={() => toggleChairman(m.id)}
                  onEdit={() => setEditingId(editingId === m.id ? null : m.id)}
                />
                {editingId === m.id && editMember && (
                  <MemberForm
                    slotIndex={members.indexOf(m)}
                    currentChairmanId={chairmanId}
                    onAdd={saveMember}
                    onCancel={() => setEditingId(null)}
                    editMember={editMember}
                  />
                )}
              </div>
            ))}
          </div>
          {!showForm && !editingId && (
            <button
              onClick={() => setShowForm(true)}
              style={buttonStyles.dashed}
            >
              + Add Another Member
            </button>
          )}
          {showForm && (
            <MemberForm
              slotIndex={members.length}
              currentChairmanId={chairmanId}
              onAdd={addMember}
              onCancel={() => setShowForm(false)}
            />
          )}
          {!chairmanId && members.length >= 3 && (
            <div style={{ ...cardStyles.warnBox, marginTop: 14 }}>
              ⚠ No Chairman — tap 👑 to designate one.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETUP SCREEN
═══════════════════════════════════════════════════════════════ */
function SetupScreen({ onLaunch }) {
  const [members, setMembers] = useState([]);
  const [chairmanId, setChairman] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editMember = editingId ? members.find((m) => m.id === editingId) : null;

  const addMember = (m) => {
    setMembers((p) => [...p, m]);
    if (m.isChairman) setChairman(m.id);
    setShowForm(false);
  };
  const saveMember = (updated) => {
    setMembers((p) => p.map((m) => (m.id === updated.id ? updated : m)));
    setEditingId(null);
  };
  const removeMember = (id) => {
    setMembers((p) => p.filter((m) => m.id !== id));
    if (chairmanId === id) setChairman(null);
  };
  const toggleChairman = (id) => setChairman((p) => (p === id ? null : id));
  const canLaunch = members.length >= 3 && chairmanId !== null;
  const need = Math.max(0, 3 - members.length);

  return (
    <div style={layoutStyles.page}>
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          ⚖
        </div>
        <div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: -0.3,
            }}
          >
            AI Council
          </div>
          <div style={textStyles.sectionLabel}>Council Builder</div>
        </div>
      </div>
      <div style={layoutStyles.contentWell}>
        <div style={{ marginBottom: 44 }}>
          <h1
            style={{
              fontSize: "clamp(26px, 6vw, 40px)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.15,
              marginBottom: 14,
              letterSpacing: -1,
            }}
          >
            Assemble your
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg,#a78bfa 0%,#60a5fa 60%,#34d399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              council of minds.
            </span>
          </h1>
          <p
            style={{
              color: tokens.textMuted,
              fontSize: 15,
              lineHeight: 1.65,
              maxWidth: 500,
            }}
          >
            Mix Ollama, OpenAI, Groq, Anthropic, Google — or any compatible
            endpoint. Minimum 3, no upper limit.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10,
            marginBottom: 40,
          }}
        >
          {[
            {
              n: "I",
              t: "First Opinions",
              d: "All members respond independently",
            },
            {
              n: "II",
              t: "Peer Review",
              d: "Members critique each other anonymously",
            },
            {
              n: "III",
              t: "Final Verdict",
              d: "Chairman synthesizes the best answer",
            },
          ].map((s) => (
            <div
              key={s.n}
              style={{
                padding: "13px 15px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${tokens.borderSubtle}`,
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  ...textStyles.sectionLabel,
                  color: tokens.primary,
                  letterSpacing: 3,
                  marginBottom: 5,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#ccc",
                  marginBottom: 3,
                }}
              >
                {s.t}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: tokens.textMuted,
                  lineHeight: 1.45,
                }}
              >
                {s.d}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={textStyles.sectionLabel}>
            Members ({members.length})
            {members.length >= 3 && !chairmanId && (
              <span
                style={{
                  marginLeft: 10,
                  color: tokens.warning,
                  fontSize: 11,
                  textTransform: "none",
                  fontWeight: 500,
                  letterSpacing: 0,
                }}
              >
                ← tap 👑 to set chairman
              </span>
            )}
          </div>
          {!showForm && !editingId && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: `1px solid rgba(167,139,250,0.35)`,
                background: "rgba(167,139,250,0.08)",
                color: "#c4b5fd",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              + Add Member
            </button>
          )}
        </div>
        {members.length === 0 && !showForm && (
          <div
            style={{
              padding: 36,
              textAlign: "center",
              border: `2px dashed ${tokens.borderSubtle}`,
              borderRadius: 12,
              color: tokens.textFaint,
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 8 }}>⚖</div>
            <div style={{ fontSize: 13 }}>
              No members yet — add at least 3 to begin
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <div key={m.id}>
              <MemberCard
                member={m}
                isChairman={chairmanId === m.id}
                onRemove={() => removeMember(m.id)}
                onToggleChairman={() => toggleChairman(m.id)}
                onEdit={() => setEditingId(editingId === m.id ? null : m.id)}
              />
              {editingId === m.id && editMember && (
                <MemberForm
                  slotIndex={members.indexOf(m)}
                  currentChairmanId={chairmanId}
                  onAdd={saveMember}
                  onCancel={() => setEditingId(null)}
                  editMember={editMember}
                />
              )}
            </div>
          ))}
        </div>
        {showForm && (
          <MemberForm
            slotIndex={members.length}
            currentChairmanId={chairmanId}
            onAdd={addMember}
            onCancel={() => setShowForm(false)}
          />
        )}
        <button
          onClick={() => canLaunch && onLaunch(members, chairmanId)}
          disabled={!canLaunch}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 10,
            border: "none",
            fontSize: 15,
            fontWeight: 700,
            marginTop: 24,
            background: canLaunch
              ? "linear-gradient(135deg,#a78bfa,#60a5fa)"
              : "rgba(255,255,255,0.04)",
            color: canLaunch ? "#fff" : tokens.textFaint,
            cursor: canLaunch ? "pointer" : "not-allowed",
          }}
        >
          {canLaunch
            ? `Convene ${members.length}-Member Council →`
            : need > 0
              ? `Add ${need} more member${need !== 1 ? "s" : ""} to continue`
              : "Designate a Chairman to continue"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HISTORY MODAL — Full popup with all session data
═══════════════════════════════════════════════════════════════ */
function HistoryModal({ sessions, onClose, onLoad }) {
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeTab, setActiveTab] = useState("list"); // "list" | "detail"

  const handleSelect = (sess) => {
    setSelectedSession(sess);
    setActiveTab("detail");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          width: "min(900px, 100vw)",
          height: "min(700px, 100dvh)",
          background: "linear-gradient(160deg, #0e0e1a, #080810)",
          border: `1px solid rgba(167,139,250,0.2)`,
          borderRadius: "clamp(0px, 2vw, 18px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
          animation: "slideDown 0.2s ease",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${tokens.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(167,139,250,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {selectedSession && (
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setActiveTab("list");
                }}
                style={{
                  ...buttonStyles.ghost,
                  padding: "4px 10px",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                ← Back
              </button>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {selectedSession ? "Session Detail" : "Session History"}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: tokens.textFaint,
                  letterSpacing: 1,
                  marginTop: 1,
                }}
              >
                {sessions.length} PAST{" "}
                {sessions.length === 1 ? "QUERY" : "QUERIES"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {selectedSession && (
              <button
                onClick={() => {
                  onLoad(selectedSession);
                  onClose();
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: `1px solid rgba(167,139,250,0.35)`,
                  background: "rgba(167,139,250,0.1)",
                  color: "#c4b5fd",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Restore Session →
              </button>
            )}
            <button
              onClick={onClose}
              style={{ ...buttonStyles.iconSquare, width: 32, height: 32 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* List view */}
        {!selectedSession && (
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {sessions.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: 12,
                  color: tokens.textFaint,
                }}
              >
                <div style={{ fontSize: 40, opacity: 0.3 }}>📋</div>
                <div style={{ fontSize: 14 }}>
                  No history yet — run a query to start.
                </div>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[...sessions].reverse().map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => handleSelect(sess)}
                    style={{
                      padding: "16px 18px",
                      background: "rgba(255,255,255,0.025)",
                      border: `1px solid ${tokens.borderSubtle}`,
                      borderRadius: 12,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(167,139,250,0.4)";
                      e.currentTarget.style.background =
                        "rgba(167,139,250,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = tokens.borderSubtle;
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.025)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: "#c4b8f0",
                        fontFamily: "Georgia,serif",
                        fontStyle: "italic",
                        marginBottom: 8,
                        lineHeight: 1.45,
                      }}
                    >
                      "{sess.query.slice(0, 140)}
                      {sess.query.length > 140 ? "…" : ""}"
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 11, color: tokens.textFaint }}>
                        {new Date(sess.ts).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: tokens.textMuted }}>
                        ·
                      </span>
                      <span style={{ fontSize: 11, color: tokens.textMuted }}>
                        {(sess.memberNames || []).join(", ") ||
                          "unknown members"}
                      </span>
                      {sess.verdict && (
                        <span
                          style={{
                            fontSize: 10,
                            color: tokens.success,
                            background: "rgba(52,211,153,0.08)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            border: "1px solid rgba(52,211,153,0.2)",
                          }}
                        >
                          ✓ verdict
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detail view */}
        {selectedSession && <HistoryDetailView session={selectedSession} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HISTORY DETAIL VIEW — tabbed view inside modal
═══════════════════════════════════════════════════════════════ */
function HistoryDetailView({ session }) {
  const [tab, setTab] = useState("opinions");
  const [activeMemberId, setActiveMemberId] = useState(
    session.memberIds?.[0] || Object.keys(session.responses || {})[0],
  );
  const memberIds = session.memberIds || Object.keys(session.responses || {});

  const tabs = [
    {
      id: "opinions",
      label: "I · First Opinions",
      hasData: Object.keys(session.responses || {}).length > 0,
    },
    {
      id: "reviews",
      label: "II · Peer Review",
      hasData: Object.keys(session.reviews || {}).length > 0,
    },
    { id: "verdict", label: "III · Final Verdict", hasData: !!session.verdict },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Query display */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          background: "rgba(167,139,250,0.03)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "#c4b8f0",
            fontFamily: "Georgia,serif",
            fontStyle: "italic",
          }}
        >
          "{session.query}"
        </div>
      </div>

      {/* Stage tabs */}
      <div
        style={{
          display: "flex",
          gap: 2,
          padding: "12px 20px 0",
          borderBottom: `1px solid ${tokens.borderSubtle}`,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px 8px 0 0",
              border: "none",
              background:
                tab === t.id ? "rgba(167,139,250,0.12)" : "transparent",
              color: tab === t.id ? "#c4b5fd" : tokens.textMuted,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: tab === t.id ? 700 : 400,
              borderBottom:
                tab === t.id ? `2px solid #a78bfa` : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {t.label}
            {!t.hasData && (
              <span style={{ marginLeft: 5, opacity: 0.4, fontSize: 10 }}>
                —
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {tab === "opinions" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Member list */}
            <div
              style={{
                width: "clamp(110px, 20vw, 180px)",
                borderRight: `1px solid ${tokens.borderSubtle}`,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                overflowY: "auto",
              }}
            >
              {memberIds.map((id) => {
                const name =
                  session.memberNames?.[session.memberIds?.indexOf(id)] || id;
                const hasResp = !!(session.responses || {})[id];
                return (
                  <button
                    key={id}
                    onClick={() => setActiveMemberId(id)}
                    style={{
                      padding: "9px 11px",
                      borderRadius: 8,
                      border: `1px solid ${activeMemberId === id ? "rgba(167,139,250,0.4)" : tokens.borderSubtle}`,
                      background:
                        activeMemberId === id
                          ? "rgba(167,139,250,0.1)"
                          : "rgba(255,255,255,0.02)",
                      color:
                        activeMemberId === id ? "#c4b5fd" : tokens.textMuted,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: activeMemberId === id ? 600 : 400,
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </span>
                    {hasResp && (
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: tokens.primary,
                          flexShrink: 0,
                          marginLeft: 6,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Response */}
            <div style={{ flex: 1, padding: "18px 20px", overflowY: "auto" }}>
              {activeMemberId && (session.responses || {})[activeMemberId] ? (
                <div style={textStyles.responseBody}>
                  {session.responses[activeMemberId]}
                </div>
              ) : (
                <div
                  style={{
                    color: tokens.textFaint,
                    fontSize: 13,
                    fontStyle: "italic",
                  }}
                >
                  No response recorded.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div
              style={{
                width: "clamp(110px, 20vw, 180px)",
                borderRight: `1px solid ${tokens.borderSubtle}`,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                overflowY: "auto",
              }}
            >
              {memberIds.map((id) => {
                const name =
                  session.memberNames?.[session.memberIds?.indexOf(id)] || id;
                const hasRev = !!(session.reviews || {})[id];
                return (
                  <button
                    key={id}
                    onClick={() => setActiveMemberId(id)}
                    style={{
                      padding: "9px 11px",
                      borderRadius: 8,
                      border: `1px solid ${activeMemberId === id ? "rgba(167,139,250,0.4)" : tokens.borderSubtle}`,
                      background:
                        activeMemberId === id
                          ? "rgba(167,139,250,0.1)"
                          : "rgba(255,255,255,0.02)",
                      color:
                        activeMemberId === id ? "#c4b5fd" : tokens.textMuted,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: activeMemberId === id ? 600 : 400,
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </span>
                    {hasRev && (
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: tokens.success,
                          flexShrink: 0,
                          marginLeft: 6,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1, padding: "18px 20px", overflowY: "auto" }}>
              {activeMemberId && (session.reviews || {})[activeMemberId] ? (
                <div style={{ ...textStyles.responseBody, color: "#9998aa" }}>
                  {session.reviews[activeMemberId]}
                </div>
              ) : (
                <div
                  style={{
                    color: tokens.textFaint,
                    fontSize: 13,
                    fontStyle: "italic",
                  }}
                >
                  No peer review recorded.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "verdict" && (
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
            {session.verdict ? (
              <div style={textStyles.verdictBody}>{session.verdict}</div>
            ) : (
              <div
                style={{
                  color: tokens.textFaint,
                  fontSize: 13,
                  fontStyle: "italic",
                }}
              >
                No verdict was recorded for this session.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESULTS — TABBED STAGE VIEW
   3 tabs: I (First Opinions), II (Peer Review), III (Final Verdict)
   Switching tabs never loses data; generation continues in background.
═══════════════════════════════════════════════════════════════ */
function ResultsView({
  sessionMembers,
  query,
  stage,
  responses,
  reviews,
  errors,
  loading,
  thinkingMap,
  verdict,
  chairLoad,
  onNewQuery,
}) {
  const [activeTab, setActiveTab] = useState("opinions");
  const [activeMemberId, setActiveMemberId] = useState(sessionMembers[0]?.id);
  const chairman = sessionMembers.find((m) => m.isChairman);

  // Auto-advance tab when stages complete, but don't force it if user is already reading
  const prevStageRef = useRef(stage);
  useEffect(() => {
    if (stage > prevStageRef.current) {
      // stage advanced — suggest the new tab but only if user hasn't manually picked
      prevStageRef.current = stage;
    }
  }, [stage]);

  // Count done for each stage
  const opinionsDone = sessionMembers.filter(
    (m) => responses[m.id] || errors[m.id],
  ).length;
  const reviewsDone = sessionMembers.filter((m) => reviews[m.id]).length;
  const opinionsLoading = sessionMembers.filter(
    (m) => loading[m.id] && stage === 1,
  ).length;
  const reviewsLoading = sessionMembers.filter(
    (m) => loading[m.id] && stage === 2,
  ).length;

  const tabDefs = [
    {
      id: "opinions",
      label: "First Opinions",
      roman: "I",
      done: opinionsDone,
      total: sessionMembers.length,
      loading: opinionsLoading > 0 && stage === 1,
      active: stage >= 1,
    },
    {
      id: "reviews",
      label: "Peer Review",
      roman: "II",
      done: reviewsDone,
      total: sessionMembers.length,
      loading: reviewsLoading > 0 && stage === 2,
      active: stage >= 2,
    },
    {
      id: "verdict",
      label: "Final Verdict",
      roman: "III",
      done: verdict ? 1 : 0,
      total: 1,
      loading: chairLoad,
      active: stage >= 3,
    },
  ];

  const activeMember = sessionMembers.find((m) => m.id === activeMemberId);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 62px)",
        overflow: "hidden",
      }}
    >
      {/* Query bar */}
      <div
        style={{
          padding: "10px 20px",
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "rgba(167,139,250,0.03)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "#c4b8f0",
            fontFamily: "Georgia,serif",
            fontStyle: "italic",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          "{query}"
        </div>
        <button
          onClick={onNewQuery}
          style={{
            ...buttonStyles.ghost,
            padding: "4px 10px",
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          ✕ New Query
        </button>
      </div>

      {/* Stage tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          flexShrink: 0,
          background: "rgba(0,0,0,0.2)",
        }}
      >
        {tabDefs.map((t) => {
          const isActive = activeTab === t.id;
          const pct = t.total > 0 ? (t.done / t.total) * 100 : 0;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.active || stage >= tabDefs.indexOf(t) + 1)
                  setActiveTab(t.id);
              }}
              style={{
                flex: 1,
                padding: "14px 10px",
                border: "none",
                background: isActive ? "rgba(167,139,250,0.08)" : "transparent",
                borderBottom: isActive
                  ? "2px solid #a78bfa"
                  : "2px solid transparent",
                cursor: t.active ? "pointer" : "default",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                opacity: !t.active ? 0.4 : 1,
                transition: "all 0.15s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Progress bar within tab */}
              {t.active && pct > 0 && pct < 100 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: 2,
                    width: `${pct}%`,
                    background: "#a78bfa",
                    transition: "width 0.3s",
                  }}
                />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    color: isActive ? "#a78bfa" : tokens.textFaint,
                    fontWeight: 700,
                    letterSpacing: 2,
                  }}
                >
                  {t.roman}
                </span>
                <span
                  style={{
                    fontSize: "clamp(10px, 2vw, 12px)",
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? "#fff" : tokens.textMuted,
                  }}
                >
                  {t.label}
                </span>
                {t.loading && <Spin size={9} color="#a78bfa" />}
                {!t.loading &&
                  t.done === t.total &&
                  t.total > 0 &&
                  t.active && (
                    <span style={{ fontSize: 10, color: tokens.success }}>
                      ✓
                    </span>
                  )}
              </div>
              {t.active && (
                <div style={{ fontSize: 10, color: tokens.textFaint }}>
                  {t.id === "verdict"
                    ? verdict
                      ? "Ready"
                      : chairLoad
                        ? "Synthesizing…"
                        : "Pending"
                    : `${t.done}/${t.total}`}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {/* ── Tab I: First Opinions ── */}
        {activeTab === "opinions" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Member sidebar */}
            <div
              style={{
                width: "clamp(120px, 22vw, 200px)",
                borderRight: `1px solid ${tokens.borderSubtle}`,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 5,
                overflowY: "auto",
                flexShrink: 0,
              }}
            >
              {sessionMembers.map((m) => {
                const pInfo = PROVIDERS[m.provider];
                const isLoading = !!loading[m.id];
                const hasResp = !!responses[m.id];
                const hasErr = !!errors[m.id];
                const isSelected = activeMemberId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveMemberId(m.id)}
                    style={{
                      padding: "10px 11px",
                      borderRadius: 9,
                      border: `1px solid ${isSelected ? m.color + "55" : tokens.borderSubtle}`,
                      background: isSelected
                        ? `${m.color}12`
                        : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 2,
                          background: `linear-gradient(90deg,transparent,${m.color},transparent)`,
                        }}
                      />
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ fontSize: 13, color: m.color }}>
                        {m.icon}
                      </span>
                      <span
                        style={{
                          fontSize: "clamp(10px, 1.8vw, 12px)",
                          fontWeight: 700,
                          color: isSelected ? "#fff" : "#bbb",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.name}
                      </span>
                      {isLoading && thinkingMap[m.id] && (
                        <span
                          style={{ fontSize: 10, color: "#60a5fa" }}
                          title="Thinking…"
                        >
                          🧠
                        </span>
                      )}
                      {isLoading && !thinkingMap[m.id] && (
                        <Spin size={9} color={m.color} />
                      )}
                      {hasErr && !isLoading && (
                        <span style={{ fontSize: 10, color: tokens.danger }}>
                          ⚠
                        </span>
                      )}
                      {hasResp && !isLoading && !hasErr && (
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: m.color,
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: pInfo.color,
                        paddingLeft: 20,
                        fontFamily: "monospace",
                      }}
                    >
                      {pInfo.icon} {m.model.split(":")[0].slice(0, 14)}
                    </div>
                    {m.isChairman && (
                      <div
                        style={{
                          fontSize: 10,
                          color: m.color,
                          paddingLeft: 20,
                          marginTop: 2,
                        }}
                      >
                        👑 Chairman
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Response content */}
            <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
              {activeMember && (
                <>
                  {/* Member header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      marginBottom: 20,
                      paddingBottom: 14,
                      borderBottom: `1px solid ${tokens.borderSubtle}`,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: `${activeMember.color}1a`,
                        border: `1px solid ${activeMember.color}44`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        color: activeMember.color,
                        flexShrink: 0,
                      }}
                    >
                      {activeMember.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {activeMember.name}
                        </span>
                        {activeMember.isChairman && (
                          <Badge
                            label="👑 Chairman"
                            color={activeMember.color}
                          />
                        )}
                        <Badge
                          label={activeMember.personaLabel}
                          color={activeMember.color}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: tokens.textMuted,
                          marginTop: 3,
                        }}
                      >
                        <span
                          style={{
                            color: PROVIDERS[activeMember.provider].color,
                          }}
                        >
                          {PROVIDERS[activeMember.provider].icon}{" "}
                          {PROVIDERS[activeMember.provider].name}
                        </span>
                        {" · "}
                        <span style={{ fontFamily: "monospace" }}>
                          {activeMember.model}
                        </span>
                      </div>
                    </div>
                    {loading[activeMemberId] && (
                      <Spin size={14} color={activeMember.color} />
                    )}
                  </div>

                  {errors[activeMemberId] && (
                    <div style={cardStyles.errorBox}>
                      ⚠ {errors[activeMemberId]}
                    </div>
                  )}

                  {!errors[activeMemberId] && responses[activeMemberId] && (
                    <div style={textStyles.responseBody}>
                      {responses[activeMemberId]}
                    </div>
                  )}

                  {!errors[activeMemberId] &&
                    !responses[activeMemberId] &&
                    loading[activeMemberId] && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          marginTop: 8,
                        }}
                      >
                        {thinkingMap[activeMemberId] ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 9,
                              padding: "10px 14px",
                              background: "rgba(96,165,250,0.06)",
                              border: "1px solid rgba(96,165,250,0.15)",
                              borderRadius: 8,
                              marginBottom: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: "#60a5fa",
                                animation: "pulse 1s ease-in-out infinite",
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 12,
                                color: "#93c5fd",
                                fontStyle: "italic",
                              }}
                            >
                              Thinking deeply — answer coming shortly…
                            </span>
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: 13,
                              color: tokens.textFaint,
                              fontStyle: "italic",
                              marginBottom: 8,
                            }}
                          >
                            Generating response…
                          </div>
                        )}
                        {[85, 70, 92, 60, 78].map((w, i) => (
                          <div
                            key={i}
                            style={{
                              ...skeletonLine(`${w}%`),
                              animation: "pulse 1.4s ease-in-out infinite",
                              animationDelay: `${i * 0.15}s`,
                            }}
                          />
                        ))}
                      </div>
                    )}

                  {!errors[activeMemberId] &&
                    !responses[activeMemberId] &&
                    !loading[activeMemberId] && (
                      <div
                        style={{
                          color: tokens.textFaint,
                          fontSize: 13,
                          fontStyle: "italic",
                        }}
                      >
                        Waiting to generate…
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Tab II: Peer Review ── */}
        {activeTab === "reviews" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div
              style={{
                width: "clamp(120px, 22vw, 200px)",
                borderRight: `1px solid ${tokens.borderSubtle}`,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 5,
                overflowY: "auto",
                flexShrink: 0,
              }}
            >
              {sessionMembers.map((m) => {
                const hasRev = !!reviews[m.id];
                const isLoading = !!loading[m.id] && stage === 2;
                const isSelected = activeMemberId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveMemberId(m.id)}
                    style={{
                      padding: "10px 11px",
                      borderRadius: 9,
                      border: `1px solid ${isSelected ? m.color + "55" : tokens.borderSubtle}`,
                      background: isSelected
                        ? `${m.color}12`
                        : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <span style={{ fontSize: 13, color: m.color }}>
                        {m.icon}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isSelected ? "#fff" : "#bbb",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.name}
                      </span>
                      {isLoading && <Spin size={9} color={tokens.success} />}
                      {hasRev && !isLoading && (
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: tokens.success,
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: tokens.textFaint,
                        paddingLeft: 20,
                        marginTop: 2,
                      }}
                    >
                      Evaluation by this member
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
              {activeMember && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: `1px solid ${tokens.borderSubtle}`,
                    }}
                  >
                    <div style={{ fontSize: 14, color: activeMember.color }}>
                      {activeMember.icon}
                    </div>
                    <div>
                      <span
                        style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}
                      >
                        {activeMember.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: tokens.textMuted,
                          marginLeft: 8,
                        }}
                      >
                        evaluating other responses
                      </span>
                    </div>
                    {loading[activeMemberId] && stage === 2 && (
                      <Spin size={12} color={tokens.success} />
                    )}
                  </div>

                  {reviews[activeMemberId] ? (
                    <div
                      style={{
                        ...textStyles.responseBody,
                        color: "#9998aa",
                        borderLeft: `3px solid ${activeMember.color}33`,
                        paddingLeft: 16,
                      }}
                    >
                      {reviews[activeMemberId]}
                    </div>
                  ) : loading[activeMemberId] && stage === 2 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: tokens.textFaint,
                          fontStyle: "italic",
                          marginBottom: 8,
                        }}
                      >
                        Evaluating other responses…
                      </div>
                      {[75, 88, 62, 80].map((w, i) => (
                        <div
                          key={i}
                          style={{
                            ...skeletonLine(`${w}%`),
                            background: "rgba(52,211,153,0.1)",
                            animation: "pulse 1.4s ease-in-out infinite",
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                  ) : stage < 2 ? (
                    <div
                      style={{
                        color: tokens.textFaint,
                        fontSize: 13,
                        fontStyle: "italic",
                      }}
                    >
                      Peer review begins after all first opinions are collected.
                    </div>
                  ) : (
                    <div
                      style={{
                        color: tokens.textFaint,
                        fontSize: 13,
                        fontStyle: "italic",
                      }}
                    >
                      No peer review recorded.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Tab III: Final Verdict ── */}
        {activeTab === "verdict" && (
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Chairman info bar */}
            {chairman && (
              <div
                style={{
                  padding: "14px 24px",
                  borderBottom: `1px solid ${tokens.borderSubtle}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "rgba(167,139,250,0.03)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${chairman.color}1a`,
                    border: `1px solid ${chairman.color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: chairman.color,
                  }}
                >
                  {chairman.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 7 }}
                  >
                    <span
                      style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}
                    >
                      {chairman.name}
                    </span>
                    <Badge label="👑 Chairman" color={chairman.color} />
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: tokens.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {PROVIDERS[chairman.provider].icon}{" "}
                    {PROVIDERS[chairman.provider].name} ·{" "}
                    <span style={{ fontFamily: "monospace" }}>
                      {chairman.model}
                    </span>
                  </div>
                </div>
                {chairLoad && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                      color: "#a78bfa",
                    }}
                  >
                    <Spin size={12} color="#a78bfa" /> Synthesizing…
                  </div>
                )}
                {verdict && !chairLoad && (
                  <div
                    style={{
                      fontSize: 11,
                      color: tokens.success,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: tokens.success,
                      }}
                    />{" "}
                    Verdict ready
                  </div>
                )}
                {!verdict && !chairLoad && stage < 3 && (
                  <div style={{ fontSize: 11, color: tokens.textFaint }}>
                    Awaiting deliberation…
                  </div>
                )}
              </div>
            )}

            {/* Verdict content */}
            <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
              {verdict ? (
                <div
                  style={{
                    ...textStyles.verdictBody,
                    lineHeight: 2,
                    animation: "fadeIn 0.4s ease",
                  }}
                >
                  {verdict}
                </div>
              ) : chairLoad ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "#a78bfa",
                      fontStyle: "italic",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#a78bfa",
                        animation: "pulse 1s ease-in-out infinite",
                      }}
                    />
                    Chairman is synthesizing all arguments…
                  </div>
                  {[90, 72, 84, 65, 78, 88].map((w, i) => (
                    <div
                      key={i}
                      style={{ ...skeletonLinePurple(`${w}%`, i * 0.18) }}
                    />
                  ))}
                </div>
              ) : stage < 3 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: tokens.textFaint,
                      fontStyle: "italic",
                      marginBottom: 8,
                    }}
                  >
                    Waiting for all opinions and reviews to complete…
                  </div>
                  {[85, 68, 76, 60, 72].map((w, i) => (
                    <div key={i} style={skeletonLine(`${w}%`, 0.15)} />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    color: tokens.textFaint,
                    fontSize: 13,
                    fontStyle: "italic",
                  }}
                >
                  Verdict not yet generated.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DELIBERATION SCREEN
═══════════════════════════════════════════════════════════════ */
function DeliberationScreen({ initialMembers, initialChairmanId, onReset }) {
  const [liveMembers, setLiveMembers] = useState(initialMembers);
  const [liveChairId, setLiveChairId] = useState(initialChairmanId);

  const [sessionMembers, setSessionMembers] = useState([]);
  const [query, setQ] = useState("");
  const [stage, setStage] = useState(0);
  const [responses, setResponses] = useState({});
  const [reviews, setReviews] = useState({});
  const [errors, setErrors] = useState({});
  const [verdict, setVerdict] = useState("");
  const [loading, setLoading] = useState({});
  const [chairLoad, setChairLoad] = useState(false);
  const [started, setStarted] = useState(false);

  const [showManage, setManage] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [thinkingMap, setThinkingMap] = useState({});

  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

  const displayChairman = liveMembers.find((m) => m.id === liveChairId);
  const setLoad = (id, v) => setLoading((p) => ({ ...p, [id]: v }));
  const setResp = useCallback(
    (id, t) => setResponses((p) => ({ ...p, [id]: t })),
    [],
  );
  const setRevw = useCallback(
    (id, t) => setReviews((p) => ({ ...p, [id]: t })),
    [],
  );
  const setErr = (id, t) => setErrors((p) => ({ ...p, [id]: t }));

  const run = async () => {
    if (!query.trim()) return;
    const chairId = liveChairId;
    const chairMember = liveMembers.find((m) => m.id === chairId);
    if (!chairMember) return;

    const snap = liveMembers.map((m) => ({
      ...m,
      isChairman: m.id === chairId,
    }));
    setSessionMembers(snap);
    setStarted(true);
    setResponses({});
    setReviews({});
    setErrors({});
    setVerdict("");
    setLoading({});
    setThinkingMap({});
    setChairLoad(false);
    setStage(1);

    const finalR = {};
    await Promise.all(
      snap.map(async (m) => {
        setLoad(m.id, true);
        try {
          const t = await dispatchMember(m, m.systemPrompt, query, (rawT) => {
            const cleaned = stripThinking(rawT);
            const thinking = isThinking(rawT);
            finalR[m.id] = cleaned;
            setResp(m.id, cleaned);
            setThinkingMap((p) => ({ ...p, [m.id]: thinking }));
          });
          finalR[m.id] = stripThinking(t);
          setThinkingMap((p) => ({ ...p, [m.id]: false }));
        } catch (e) {
          setErr(m.id, e.message);
        } finally {
          setLoad(m.id, false);
        }
      }),
    );

    setStage(2);
    const letters = ["A", "B", "C", "D", "E", "F", "G"];
    const finalRevw = {};
    await Promise.all(
      snap.map(async (reviewer) => {
        setLoad(reviewer.id, true);
        const others = snap.filter((m) => m.id !== reviewer.id);
        let rp = `The council is deliberating: "${query}"\n\nYour initial response was submitted. Now evaluate these anonymized responses:\n\n`;
        others.forEach((m, i) => {
          rp += `**Response ${letters[i]}:**\n${finalR[m.id] || "(no response)"}\n\n`;
        });
        rp += `As ${reviewer.name}, briefly evaluate these. What's most valuable? What's missing? Under 150 words.`;
        try {
          const t = await dispatchMember(
            reviewer,
            reviewer.systemPrompt,
            rp,
            (rawTxt) => setRevw(reviewer.id, stripThinking(rawTxt)),
          );
          finalRevw[reviewer.id] = stripThinking(t);
        } catch {
        } finally {
          setLoad(reviewer.id, false);
        }
      }),
    );

    setStage(3);
    setChairLoad(true);
    let sp = `The council has deliberated on: "${query}"\n\n=== MEMBER RESPONSES ===\n\n`;
    snap.forEach((m) => {
      sp += `**${m.name}** (${m.personaLabel} · ${PROVIDERS[m.provider].name}/${m.model}):\n${finalR[m.id] || "(failed)"}\n\n`;
    });
    sp += `=== PEER REVIEWS ===\n\n`;
    snap.forEach((m) => {
      sp += `**${m.name}:**\n${finalRevw[m.id] || "(unavailable)"}\n\n`;
    });

    let finalVerdict = "";
    try {
      finalVerdict = await dispatchMember(
        chairMember,
        CHAIRMAN_SYNTHESIS,
        sp,
        (rawT) => setVerdict(stripThinking(rawT)),
      );
      finalVerdict = stripThinking(finalVerdict);
    } catch (e) {
      finalVerdict = `Chairman synthesis failed: ${e.message}`;
      setVerdict(finalVerdict);
    } finally {
      setChairLoad(false);
    }

    const sess = {
      id: sid(),
      ts: Date.now(),
      query,
      memberIds: snap.map((m) => m.id),
      memberNames: snap.map((m) => m.name),
      responses: { ...finalR },
      reviews: { ...finalRevw },
      verdict: finalVerdict,
    };
    const next = [...sessions, sess];
    setSessions(next);
    persistSessions(next);
  };

  const resetQuery = () => {
    setStarted(false);
    setStage(0);
    setQ("");
    setResponses({});
    setReviews({});
    setErrors({});
    setVerdict("");
    setLoading({});
  };

  // Restore a history session for viewing (read-only into current state)
  const restoreSession = (sess) => {
    const syntheticMembers = (sess.memberIds || []).map((id, i) => ({
      id,
      name: (sess.memberNames || [])[i] || id,
      provider: "anthropic",
      model: "unknown",
      color: ACCENT_COLORS[i % ACCENT_COLORS.length],
      icon: ACCENT_ICONS[i % ACCENT_ICONS.length],
      personaLabel: "—",
      systemPrompt: "",
      isChairman: i === 0,
    }));
    setSessionMembers(syntheticMembers);
    setQ(sess.query);
    setResponses(sess.responses || {});
    setReviews(sess.reviews || {});
    setErrors({});
    setVerdict(sess.verdict || "");
    setLoading({});
    setChairLoad(false);
    setStage(4); // "done" state — all tabs available
    setStarted(true);
  };

  return (
    <div style={layoutStyles.page}>
      {showManage && (
        <ManagePanel
          members={liveMembers}
          chairmanId={liveChairId}
          onClose={() => setManage(false)}
          onUpdateMembers={setLiveMembers}
          onUpdateChairman={setLiveChairId}
        />
      )}
      {showHistory && (
        <HistoryModal
          sessions={sessions}
          onClose={() => setShowHistory(false)}
          onLoad={(sess) => {
            restoreSession(sess);
            setShowHistory(false);
          }}
        />
      )}

      {/* Header */}
      <div style={layoutStyles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            ⚖
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: -0.2,
              }}
            >
              AI Council
            </div>
            <div style={textStyles.sectionLabel}>Deliberation</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              display: "flex",
              gap: 3,
              maxWidth: "30vw",
              overflow: "hidden",
            }}
          >
            {liveMembers.map((m) => (
              <div
                key={m.id}
                title={`${m.name} · ${PROVIDERS[m.provider].name}/${m.model}${liveChairId === m.id ? " · Chairman" : ""}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: `${m.color}1a`,
                  border: `1px solid ${m.color}${liveChairId === m.id ? "99" : "44"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: m.color,
                }}
              >
                {m.icon}
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              padding: "5px 11px",
              borderRadius: 6,
              border: `1px solid rgba(52,211,153,0.3)`,
              background: "rgba(52,211,153,0.07)",
              color: "#6ee7b7",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            📋{" "}
            <span style={{ display: "inline" }}>
              History {sessions.length > 0 ? `(${sessions.length})` : ""}
            </span>
          </button>
          <button
            onClick={() => setManage(true)}
            style={{
              padding: "5px 11px",
              borderRadius: 6,
              border: `1px solid rgba(167,139,250,0.3)`,
              background: "rgba(167,139,250,0.07)",
              color: "#c4b5fd",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            ⚙ Manage
          </button>
          <button
            onClick={onReset}
            style={{ ...buttonStyles.ghost, padding: "5px 11px", fontSize: 12 }}
          >
            ← Rebuild
          </button>
        </div>
      </div>

      {/* Main content */}
      {!started && (
        <div
          style={{
            maxWidth: 660,
            margin: "0 auto",
            padding: "clamp(20px, 5vw, 48px) clamp(16px, 4vw, 24px)",
            animation: "fadeIn 0.4s ease",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1
              style={{
                fontSize: "clamp(24px, 5vw, 34px)",
                fontWeight: 800,
                letterSpacing: -1,
                color: "#fff",
                lineHeight: 1.15,
                marginBottom: 9,
              }}
            >
              Ask the council
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg,#a78bfa,#60a5fa,#34d399)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                anything.
              </span>
            </h1>
            {displayChairman ? (
              <p
                style={{
                  color: tokens.textMuted,
                  fontSize: 13,
                  wordBreak: "break-word",
                }}
              >
                {liveMembers.length} members · Chairman:{" "}
                <span style={{ color: displayChairman.color }}>
                  {displayChairman.icon} {displayChairman.name}
                </span>
              </p>
            ) : (
              <p style={{ color: tokens.warning, fontSize: 13 }}>
                ⚠ No Chairman — open Manage to designate one
              </p>
            )}
            {sessions.length > 0 && (
              <p
                style={{
                  color: tokens.textFaint,
                  fontSize: 12,
                  marginTop: 6,
                  cursor: "pointer",
                }}
                onClick={() => setShowHistory(true)}
              >
                📋 {sessions.length} past session
                {sessions.length !== 1 ? "s" : ""} in history →
              </p>
            )}
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${tokens.borderMedium}`,
              borderRadius: tokens.radiusLg,
              overflow: "hidden",
            }}
          >
            <textarea
              value={query}
              onChange={(e) => setQ(e.target.value)}
              rows={5}
              placeholder="A hard question, a decision, a topic that deserves multiple sharp perspectives…"
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: tokens.textPrimary,
                fontSize: 16,
                padding: 20,
                resize: "none",
                fontFamily: '"DM Sans",sans-serif',
                lineHeight: 1.65,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run();
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "11px 16px",
                borderTop: `1px solid ${tokens.borderSubtle}`,
              }}
            >
              <span style={{ fontSize: 12, color: tokens.textFaint }}>
                ⌘+Enter to submit
              </span>
              <button
                onClick={run}
                disabled={!query.trim() || !displayChairman}
                style={{
                  padding: "9px 22px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  background:
                    query.trim() && displayChairman
                      ? "linear-gradient(135deg,#a78bfa,#60a5fa)"
                      : "rgba(255,255,255,0.04)",
                  color:
                    query.trim() && displayChairman ? "#fff" : tokens.textFaint,
                  cursor:
                    query.trim() && displayChairman ? "pointer" : "not-allowed",
                }}
              >
                Convene →
              </button>
            </div>
          </div>
        </div>
      )}

      {started && (
        <ResultsView
          sessionMembers={sessionMembers}
          query={query}
          stage={stage}
          responses={responses}
          reviews={reviews}
          errors={errors}
          loading={loading}
          thinkingMap={thinkingMap}
          verdict={verdict}
          chairLoad={chairLoad}
          onNewQuery={resetQuery}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState("setup");
  const [members, setMembers] = useState([]);
  const [chairId, setChairId] = useState(null);
  const launch = (m, id) => {
    setMembers(m);
    setChairId(id);
    setScreen("council");
  };
  return screen === "setup" ? (
    <SetupScreen onLaunch={launch} />
  ) : (
    <DeliberationScreen
      initialMembers={members}
      initialChairmanId={chairId}
      onReset={() => setScreen("setup")}
    />
  );
}
