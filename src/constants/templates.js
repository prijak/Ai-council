export const COUNCIL_TEMPLATES = [
  /* ── Original Templates ── */
  {
    id: "strategy",
    name: "Business Strategy",
    icon: "📊",
    color: "#60a5fa",
    category: "think-tank",
    description: "Rigorous analysis + contrarian stress-test + actionable output.",
    members: [
      { personaId: "analyst", name: "The Analyst", isChairman: false },
      { personaId: "contrarian", name: "The Contrarian", isChairman: false },
      { personaId: "pragmatist", name: "The Pragmatist", isChairman: true },
    ],
  },
  {
    id: "deep",
    name: "Deep Thinking",
    icon: "🧠",
    color: "#a78bfa",
    category: "think-tank",
    description: "Philosophy + vision + analysis for complex nuanced questions.",
    members: [
      { personaId: "philosopher", name: "The Philosopher", isChairman: false },
      { personaId: "visionary", name: "The Visionary", isChairman: false },
      { personaId: "analyst", name: "The Analyst", isChairman: false },
      { personaId: "pragmatist", name: "The Pragmatist", isChairman: true },
    ],
  },
  {
    id: "full",
    name: "Full Council",
    icon: "⚖",
    color: "#34d399",
    category: "think-tank",
    description: "All five perspectives for maximum deliberation depth.",
    members: [
      { personaId: "analyst", name: "The Analyst", isChairman: false },
      { personaId: "contrarian", name: "The Contrarian", isChairman: false },
      { personaId: "visionary", name: "The Visionary", isChairman: false },
      { personaId: "philosopher", name: "The Philosopher", isChairman: false },
      { personaId: "pragmatist", name: "The Pragmatist", isChairman: true },
    ],
  },
  {
    id: "creative",
    name: "Creative Council",
    icon: "✨",
    color: "#f472b6",
    category: "think-tank",
    description: "Visionary-led ideation with philosophical grounding.",
    members: [
      { personaId: "visionary", name: "The Visionary", isChairman: false },
      { personaId: "philosopher", name: "The Philosopher", isChairman: false },
      { personaId: "contrarian", name: "The Contrarian", isChairman: false },
      { personaId: "pragmatist", name: "The Pragmatist", isChairman: true },
    ],
  },

  /* ── Professional Templates ── */
  {
    id: "product_launch",
    name: "Product Launch",
    icon: "🚀",
    color: "#fb923c",
    category: "corporate",
    description: "CFO + CTO + CMO + Legal debate the launch. CEO makes the final call.",
    members: [
      { personaId: "cfo", name: "The CFO", isChairman: false },
      { personaId: "cto", name: "The CTO", isChairman: false },
      { personaId: "cmo", name: "The CMO", isChairman: false },
      { personaId: "legal", name: "Legal Counsel", isChairman: false },
      { personaId: "ceo_chair", name: "The CEO", isChairman: true },
    ],
  },
  {
    id: "startup",
    name: "Startup Team",
    icon: "🌱",
    color: "#34d399",
    category: "corporate",
    description: "Founder + Engineer + Designer + Growth build. Investor decides.",
    members: [
      { personaId: "founder", name: "The Founder", isChairman: false },
      { personaId: "engineer", name: "The Engineer", isChairman: false },
      { personaId: "designer", name: "The Designer", isChairman: false },
      { personaId: "growth", name: "Growth Lead", isChairman: false },
      { personaId: "investor", name: "The Investor", isChairman: true },
    ],
  },
  {
    id: "consulting",
    name: "Consulting Firm",
    icon: "💼",
    color: "#60a5fa",
    category: "corporate",
    description: "Strategy + Operations + Finance + Risk deliver a client recommendation.",
    members: [
      { personaId: "strategy_consultant", name: "Strategy", isChairman: false },
      { personaId: "operations_consultant", name: "Operations", isChairman: false },
      { personaId: "finance_consultant", name: "Finance", isChairman: false },
      { personaId: "risk_consultant", name: "Risk", isChairman: false },
      { personaId: "partner", name: "Senior Partner", isChairman: true },
    ],
  },
  {
    id: "editorial",
    name: "Editorial Team",
    icon: "📰",
    color: "#f59e0b",
    category: "professional",
    description: "Reporter + Editor + Legal + SEO deliberate. Editor-in-Chief publishes or spikes.",
    members: [
      { personaId: "reporter", name: "The Reporter", isChairman: false },
      { personaId: "editor", name: "The Editor", isChairman: false },
      { personaId: "legal_editorial", name: "Legal Review", isChairman: false },
      { personaId: "seo", name: "SEO Strategist", isChairman: false },
      { personaId: "editor_in_chief", name: "Editor-in-Chief", isChairman: true },
    ],
  },
  {
    id: "hospital",
    name: "Hospital Team",
    icon: "🏥",
    color: "#22d3ee",
    category: "professional",
    description: "GP + Specialist + Pharmacist + Ethicist deliberate. Chief of Medicine decides.",
    members: [
      { personaId: "gp", name: "The GP", isChairman: false },
      { personaId: "specialist", name: "The Specialist", isChairman: false },
      { personaId: "pharmacist", name: "The Pharmacist", isChairman: false },
      { personaId: "ethicist", name: "Medical Ethicist", isChairman: false },
      { personaId: "chief_of_medicine", name: "Chief of Medicine", isChairman: true },
    ],
  },
  {
    id: "law_firm",
    name: "Law Firm",
    icon: "⚖️",
    color: "#a78bfa",
    category: "professional",
    description: "Litigation + Corporate + Compliance + Associate advise. Partner rules.",
    members: [
      { personaId: "litigation", name: "Litigator", isChairman: false },
      { personaId: "corporate", name: "Corporate Counsel", isChairman: false },
      { personaId: "compliance", name: "Compliance Officer", isChairman: false },
      { personaId: "junior_associate", name: "Junior Associate", isChairman: false },
      { personaId: "senior_partner", name: "Senior Partner", isChairman: true },
    ],
  },

  /* ── Raw Model Templates ── */
  {
    id: "raw_panel",
    name: "Raw Model Panel",
    icon: "🔬",
    color: "#94a3b8",
    category: "unfiltered",
    description: "Multiple models answer without any persona — pure knowledge, pure reasoning. Best for factual, technical, or comparative questions.",
    members: [
      { personaId: "raw", name: "Model A", isChairman: false },
      { personaId: "raw", name: "Model B", isChairman: false },
      { personaId: "raw", name: "Model C", isChairman: false },
      { personaId: "raw", name: "Model D", isChairman: true },
    ],
  },
  {
    id: "raw_vs_persona",
    name: "Raw vs Persona",
    icon: "⚗️",
    color: "#a3e635",
    category: "unfiltered",
    description: "One raw model alongside analyst, contrarian, and pragmatist — see how a persona-free voice changes the deliberation.",
    members: [
      { personaId: "raw", name: "The Model", isChairman: false },
      { personaId: "analyst", name: "The Analyst", isChairman: false },
      { personaId: "contrarian", name: "The Contrarian", isChairman: false },
      { personaId: "pragmatist", name: "The Pragmatist", isChairman: true },
    ],
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: "think-tank", label: "Think Tank", icon: "🧠" },
  { id: "corporate", label: "Corporate", icon: "🏢" },
  { id: "professional", label: "Professional", icon: "🎯" },
  { id: "unfiltered", label: "Unfiltered", icon: "🔬" },
];

export const CHAIRMAN_SYNTHESIS = `You are the Chairman of the AI Council — final arbiter and decision authority.
You have read all council member responses and critiques.
Your responsibility is not to summarize. It is to decide.

Your mandate:
1. Extract the strongest, highest-signal insights from each member.
2. Identify disagreements and explicitly determine which reasoning is superior — explain briefly why.
3. Reject weak, redundant, or speculative arguments.
4. Integrate only what materially improves the outcome.
5. Deliver one unified, coherent, and decisive final answer.

Issue a clear conclusion. Specify what should be done. Define priority and direction.
Avoid hedging, ambiguity, or vague abstraction. Speak with authority.
This is the council's final ruling.

Begin your response with: **Council's Verdict:**`;