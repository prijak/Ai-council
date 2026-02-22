export const PROVIDERS = {
   managed_sarvam: { name: "Sarvam AI",    icon: "🇮🇳", color: "#f97316", needsKey: false, needsEndpoint: false, defaultEndpoint: "", canFetchModels: false, suggestedModels: ["sarvam-m"], hint: null, compat: "managed", managed: true, requiresAuth: true, badge: "Hosted · Indic" },
  managed_ollama: { name: "Hosted Ollama", icon: "🦙", color: "#34d399", needsKey: false, needsEndpoint: false, defaultEndpoint: "", canFetchModels: false, suggestedModels: ["mistral-nemo:latest", "wizard-vicuna-uncensored:13b", "Flux_AI/Flux_AI:latest", "qwen2.5:3b", "codellama:13b", "llava:13b", "llava:7b", "llama2-uncensored:7b", "everythinglm:13b", "dolphin-mistral:7b",   "mistral:latest", "deepseek-r1:latest", "deepseek-v2:latest", "llama3.1:8b-instruct-q8_0", "deepseek-coder-v2:latest"], hint: null, compat: "managed", managed: true, requiresAuth: true, badge: "Hosted · Free" },
 
  ollama:        { name: "Ollama",       icon: "🦙", color: "#34d399", needsKey: false, needsEndpoint: true,  defaultEndpoint: "http://localhost:11434", canFetchModels: true,  suggestedModels: [], hint: 'Start with: OLLAMA_ORIGINS="*" ollama serve', compat: "ollama",    managed: false, modelFilter: () => true },
  openai:        { name: "OpenAI",       icon: "◆",  color: "#74aa9c", needsKey: true,  needsEndpoint: false, defaultEndpoint: "https://api.openai.com/v1", canFetchModels: true, suggestedModels: ["gpt-4o","gpt-4o-mini","gpt-4-turbo"], hint: null, compat: "openai", managed: false, modelFilter: id => id.startsWith("gpt-") || id.startsWith("o1") || id.startsWith("o3") },
  groq:          { name: "Groq",         icon: "⚡", color: "#f59e0b", needsKey: true,  needsEndpoint: false, defaultEndpoint: "https://api.groq.com/openai/v1", canFetchModels: true, suggestedModels: ["llama-3.3-70b-versatile","llama-3.1-8b-instant"], hint: null, compat: "openai", managed: false, modelFilter: () => true },
  anthropic:     { name: "Anthropic",    icon: "◈",  color: "#a78bfa", needsKey: true,  needsEndpoint: false, defaultEndpoint: "https://api.anthropic.com", canFetchModels: true, suggestedModels: ["claude-opus-4-6","claude-sonnet-4-6","claude-haiku-4-5-20251001"], hint: null, compat: "anthropic", managed: false, modelFilter: () => true },
  google:        { name: "Google",       icon: "◎",  color: "#4285f4", needsKey: true,  needsEndpoint: false, defaultEndpoint: "https://generativelanguage.googleapis.com", canFetchModels: true, suggestedModels: ["gemini-2.0-flash","gemini-1.5-pro"], hint: null, compat: "google", managed: false, modelFilter: n => n.includes("gemini") },
  custom:        { name: "Custom",       icon: "⚙",  color: "#94a3b8", needsKey: true,  needsEndpoint: true,  defaultEndpoint: "http://localhost:8000/v1", canFetchModels: true, suggestedModels: [], hint: "Any OpenAI-compatible endpoint", compat: "openai", managed: false, modelFilter: () => true },

  // ── Hosted by you — proxy through backend, login required ──────────────────
  
};

export const ACCENT_COLORS = ["#a78bfa","#fb923c","#34d399","#60a5fa","#f59e0b","#f472b6","#22d3ee","#a3e635"];
export const ACCENT_ICONS  = ["⚖","✦","⚡","◈","⚙","◎","❋","◆"];