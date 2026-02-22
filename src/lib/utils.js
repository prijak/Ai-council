let _seq = 0;
export const uid = () => `m${++_seq}_${Date.now()}`;
export const cid = () => `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
export const sid = () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function stripThinking(text) {
  if (!text) return text;
  let result = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const openIdx = result.search(/<think>/i);
  if (openIdx !== -1) result = result.slice(0, openIdx);
  return result.replace(/^\s+/, "").trim();
}

export function isThinking(rawText) {
  if (!rawText) return false;
  const lower = rawText.toLowerCase();
  const lastOpen = lower.lastIndexOf("<think>");
  if (lastOpen === -1) return false;
  return lower.lastIndexOf("</think>") < lastOpen;
}
