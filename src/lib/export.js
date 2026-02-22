export function buildMarkdown(session) {
  const date = new Date(session.ts || Date.now()).toLocaleString();
  const ids = session.memberIds || [];
  const names = session.memberNames || [];
  let md = `# AI Council — Session Report\n\n**Date:** ${date}  \n**Query:** ${session.query}\n\n`;
  if (session.temperature !== undefined)
    md += `**Temperature:** ${Math.round(session.temperature * 100)}%\n\n`;
  if (session.followUpChain?.length) {
    md += `## Deliberation Chain\n\n`;
    session.followUpChain.forEach((item, i) => {
      md += `**Round ${i + 1}:** ${item.query}  \n**Verdict:** ${(item.verdict || "").slice(0, 200)}…\n\n`;
    });
    md += `---\n\n`;
  }
  if (names.length) {
    md += `## Council Members\n\n`;
    names.forEach((n) => { md += `- ${n}\n`; });
    md += "\n";
  }
  md += `## Stage I — First Opinions\n\n`;
  ids.forEach((id, i) => {
    const r = (session.responses || {})[id];
    if (r) md += `### ${names[i] || id}\n\n${r}\n\n---\n\n`;
  });
  md += `## Stage II — Peer Reviews\n\n`;
  ids.forEach((id, i) => {
    const r = (session.reviews || {})[id];
    if (r) md += `### ${names[i] || id}\n\n${r}\n\n---\n\n`;
  });
  md += `## Stage III — Final Verdict\n\n${session.verdict || "_No verdict recorded._"}`;
  return md;
}

export function downloadMarkdown(session) {
  const blob = new Blob([buildMarkdown(session)], { type: "text/markdown" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `ai-council-${Date.now()}.md`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportPDF(session) {
  const md = buildMarkdown(session);
  const html = md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^---$/gm, "<hr>")
    .replace(/\n/g, "<br>");
  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>AI Council Report</title><style>
    body{font-family:Georgia,serif;max-width:820px;margin:40px auto;color:#1a1a1a;line-height:1.8;padding:0 24px}
    h1{color:#4c1d95;border-bottom:2px solid #a78bfa;padding-bottom:10px}
    h2{color:#3b0764;margin-top:36px;border-left:4px solid #a78bfa;padding-left:12px}
    h3{color:#374151;margin-top:20px}hr{border:none;border-top:1px solid #e5e7eb;margin:24px 0}
    @media print{body{margin:20px}}
  </style></head><body>${html}<script>window.print();<\/script></body></html>`);
  win.document.close();
}
