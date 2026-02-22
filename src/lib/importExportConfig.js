import { PERSONAS } from "../constants/personas";
import { PROVIDERS, ACCENT_COLORS, ACCENT_ICONS } from "../constants/providers";
import { uid } from "./utils";

export function parseCouncilJSON(jsonStr) {
  const data = JSON.parse(jsonStr);
  const raw = Array.isArray(data) ? data : data.members || [];
  if (!raw.length) throw new Error("No members found in JSON.");
  return raw.map((m, i) => {
    const p = PERSONAS.find((x) => x.id === m.personaId);
    return {
      id: uid(),
      name: m.name || `Member ${i + 1}`,
      provider: m.provider || "ollama",
      model: m.model || "",
      endpoint: m.endpoint || PROVIDERS[m.provider || "ollama"]?.defaultEndpoint || "",
      apiKey: m.apiKey || "",
      personaLabel: m.personaLabel || p?.label || "Custom",
      systemPrompt: m.systemPrompt || p?.prompt || "",
      color: m.color || ACCENT_COLORS[i % ACCENT_COLORS.length],
      icon: m.icon || ACCENT_ICONS[i % ACCENT_ICONS.length],
      isChairman: !!m.isChairman,
    };
  });
}
