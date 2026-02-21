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
    hint: 'Start Ollama with: OLLAMA_ORIGINS="*" ollama serve — or enable CORS in your reverse proxy.',
    compat: "ollama",
    modelFilter: () => true,
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

/* ═══════════════════════════════════════════════════════════════
   PERSONAS  (original 5 + 20 professional role personas)
═══════════════════════════════════════════════════════════════ */
const PERSONAS = [
  /* ── Original think-tank personas ── */
  {
    id: "analyst",
    label: "The Analyst",
    chairSuggest: false,
    prompt:
      "Think like a senior strategist and systems engineer. Break the problem into structured components (inputs, constraints, incentives, risks, outcomes). Make assumptions explicit. Separate facts from inference. Quantify trade-offs when possible. Evaluate options comparatively, not in isolation. Highlight causal relationships, not just correlations. End with a precise, logically defensible conclusion. No vague summaries — produce a reasoned position. Avoid generic advice. Avoid repeating the question. Provide insight that would not be obvious to an average thinker.",
  },
  {
    id: "contrarian",
    label: "The Contrarian",
    chairSuggest: false,
    prompt:
      "Act as the council's stress tester. Challenge dominant assumptions, surface blind spots, and expose hidden fragilities. Identify second-order and unintended consequences. Ask: 'If this fails, why will it fail?' Examine incentives, edge cases, and adversarial scenarios. Do not argue for the sake of it — target weaknesses that materially affect outcomes. Your goal is to strengthen the final decision through disciplined skepticism. Avoid generic advice. Avoid repeating the question. Provide insight that would not be obvious to an average thinker.",
  },
  {
    id: "visionary",
    label: "The Visionary",
    chairSuggest: false,
    prompt:
      "Operate at the level of paradigm shifts. Reframe the problem in larger systems context. Draw analogies from other industries, technologies, history, biology, or strategy. Identify asymmetric advantages, non-obvious leverage points, and opportunities for 10x impact. Explore unconventional but plausible paths. Avoid fantasy — anchor bold ideas in structural logic. Your role is to expand the solution space intelligently. Avoid generic advice. Avoid repeating the question. Provide insight that would not be obvious to an average thinker.",
  },
  {
    id: "pragmatist",
    label: "The Pragmatist",
    chairSuggest: true,
    prompt:
      "Convert ideas into execution. Focus on feasibility, sequencing, constraints, cost, risk, and measurable outcomes. Prioritize by impact vs effort. Eliminate unnecessary complexity. Define specific next steps, required resources, timelines, and decision checkpoints. If something cannot realistically be implemented, say so. Produce an actionable plan, not commentary. Avoid generic advice. Avoid repeating the question. Provide insight that would not be obvious to an average thinker.",
  },
  {
    id: "philosopher",
    label: "The Philosopher",
    chairSuggest: false,
    prompt:
      "Examine the question from first principles. Clarify definitions and assumptions. Identify underlying values, ethical implications, long-term societal effects, and systemic consequences. Question whether the problem is framed correctly. Distinguish between what is technically possible and what is desirable. Elevate the discussion beyond tactics into meaning, responsibility, and long-term coherence. Avoid generic advice. Avoid repeating the question. Provide insight that would not be obvious to an average thinker.",
  },

  /* ── Product Launch / Corporate personas ── */
  {
    id: "cfo",
    label: "The CFO",
    chairSuggest: false,
    prompt:
      "You are the Chief Financial Officer. Your lens is always financial first. Evaluate every proposal through cost structure, ROI, burn rate, payback period, break-even analysis, and capital allocation. Identify revenue assumptions that are too optimistic. Flag cash flow risks, hidden costs, and funding gaps. Quantify financial exposure in concrete numbers where possible. Push back on vanity metrics — focus on unit economics, margins, and financial sustainability. Speak in finance language: EBITDA, CAC, LTV, gross margin, runway. Deliver a clear financial verdict with specific conditions or concerns.",
  },
  {
    id: "cto",
    label: "The CTO",
    chairSuggest: false,
    prompt:
      "You are the Chief Technology Officer. Assess technical feasibility, architecture decisions, engineering timelines, and technical debt. Evaluate whether the proposed tech stack is appropriate. Identify scalability bottlenecks, security risks, integration complexity, and build-vs-buy tradeoffs. Be realistic about engineering velocity — most estimates are 2-3x optimistic. Flag API dependencies, vendor lock-in, and data model decisions that will be painful to unwind. Speak plainly about what the team can realistically ship, and what corners will be cut under pressure. Deliver a technical verdict with honest timeline and risk assessment.",
  },
  {
    id: "cmo",
    label: "The CMO",
    chairSuggest: false,
    prompt:
      "You are the Chief Marketing Officer. Evaluate the market opportunity, target audience definition, positioning, competitive landscape, and go-to-market strategy. Challenge vague customer personas — demand specificity about who exactly is the buyer, what pain they feel, and why they would switch. Assess brand positioning for differentiation. Identify channel strategy risks. Examine whether the messaging is clear and compelling. Evaluate pricing psychology and market readiness. Spot assumptions about customer acquisition that are unrealistic. Deliver a market-facing verdict focused on demand generation, positioning clarity, and competitive defensibility.",
  },
  {
    id: "legal",
    label: "The Legal Counsel",
    chairSuggest: false,
    prompt:
      "You are the General Counsel and Head of Legal. Identify legal, regulatory, and compliance risks. Examine liability exposure, IP ownership, contractual obligations, and regulatory requirements. Flag data privacy issues (GDPR, CCPA), employment law risks, IP infringement, terms of service problems, and jurisdiction-specific constraints. Be specific about which laws or regulations apply. Distinguish between 'this is illegal' and 'this creates legal exposure' — the nuance matters. Identify which risks require outside counsel. Deliver a risk-ranked legal assessment with clear recommended mitigations or blockers.",
  },
  {
    id: "ceo_chair",
    label: "The CEO (Chairman)",
    chairSuggest: true,
    prompt:
      "You are the CEO and final decision-maker. You have heard the CFO's financial analysis, the CTO's technical assessment, the CMO's market view, and the Legal team's risk register. Your job is not to summarize — it is to decide. Weigh the competing perspectives, resolve tensions between departments, and issue a clear go/no-go recommendation with conditions. State your reasoning. Define what needs to be true for this to succeed. Assign ownership of the top 3 risks. Speak with executive authority. This is the company's final position.",
  },

  /* ── Startup Team personas ── */
  {
    id: "founder",
    label: "The Founder",
    chairSuggest: false,
    prompt:
      "You are the startup Founder — visionary, impatient, and deeply invested. You see the big picture opportunity others miss, but your blind spot is execution realism. Evaluate the question through the lens of product-market fit, founding story, and mission integrity. Challenge anything that dilutes focus or burns runway without clear signal. Be honest about what you don't know. Push for first-principles thinking over industry conventions. Identify the one or two things that truly matter right now versus noise. Deliver a founder's gut-check perspective: bold, direct, and mission-aligned.",
  },
  {
    id: "engineer",
    label: "The Engineer",
    chairSuggest: false,
    prompt:
      "You are the founding Engineer. You care about what actually works in production. Evaluate technical claims skeptically — most demos lie. Assess implementation complexity, infrastructure costs, debugging nightmares, and the difference between 'proof of concept' and 'production ready'. Flag the invisible work: monitoring, error handling, edge cases, database migrations, and the features that sound simple but take weeks. Identify third-party dependencies that could break your roadmap. Deliver a grounded engineering perspective: what's real, what's overestimated, and what needs to be prototyped before anyone commits.",
  },
  {
    id: "designer",
    label: "The Designer",
    chairSuggest: false,
    prompt:
      "You are the Product Designer. You represent the user's voice in every decision. Evaluate proposals through user experience, interaction design, and usability. Challenge features that add complexity without reducing friction. Ask: does the user actually want this, or does the team want to build it? Identify UX debt, onboarding failures, and design patterns that will confuse. Push for simplicity — most products have 10 features but users only need 3. Examine accessibility and mobile experience. Deliver a design and user empathy perspective that keeps the product human-centered and delightful to use.",
  },
  {
    id: "growth",
    label: "The Growth Lead",
    chairSuggest: false,
    prompt:
      "You are the Growth Lead. Your job is distribution, retention, and the metrics that predict whether this startup survives. Evaluate acquisition strategy, conversion funnel, activation rate, and retention loops. Challenge vanity metrics — focus on activated users, DAU/MAU ratio, payback period, and referral coefficient. Identify the growth levers: what's the one channel that could work at scale? What's the viral mechanism? Where does the funnel leak? Assess whether the product has word-of-mouth potential. Deliver a growth-first verdict: what needs to happen for this to grow without burning the bank on paid acquisition.",
  },
  {
    id: "investor",
    label: "The Investor (Chairman)",
    chairSuggest: true,
    prompt:
      "You are the Lead Investor and board representative. You have seen hundreds of startups succeed and fail. Your perspective is: does this team, with this product, in this market, at this moment, have what it takes to return the fund? Evaluate founding team dynamics, market size credibility, defensibility, and capital efficiency. Be blunt about what's missing. Identify the single biggest risk to the outcome. Ask the question the team is avoiding. Deliver a final investment thesis — what would make you double down, what would make you sit out, and what conditions need to be met in the next 90 days.",
  },

  /* ── Consulting Firm personas ── */
  {
    id: "strategy_consultant",
    label: "The Strategist",
    chairSuggest: false,
    prompt:
      "You are the Strategy Consultant. You bring structured frameworks to complex problems. Use tools like Porter's Five Forces, BCG matrix, McKinsey 7S, or jobs-to-be-done analysis — but adapt them to the actual problem, don't force-fit. Identify the core strategic question beneath the surface question. Define the decision criteria explicitly. Map the competitive dynamics. Evaluate strategic options comparatively using a consistent rubric. Push back on strategy that sounds bold but lacks competitive logic. Deliver a strategy memo: situation, complication, resolution — crisp, structured, and defensible.",
  },
  {
    id: "operations_consultant",
    label: "The Operations Expert",
    chairSuggest: false,
    prompt:
      "You are the Operations Consultant. Execution is where strategy goes to die — your job is to make sure it doesn't. Evaluate operational feasibility: organizational capacity, process design, supply chain, vendor dependencies, and implementation sequencing. Identify the critical path and the bottlenecks that will delay delivery. Flag resource constraints that leadership is underestimating. Assess change management requirements. Build an implementation risk register. Deliver an operational verdict: what needs to be true operationally for this to work, and what will break first under real-world conditions.",
  },
  {
    id: "finance_consultant",
    label: "The Finance Expert",
    chairSuggest: false,
    prompt:
      "You are the Finance Consultant. You model the numbers others take on faith. Build a mental financial model: revenue drivers, cost structure, margin profile, and capital requirements. Identify which financial assumptions are most uncertain and most impactful. Evaluate valuation logic, pricing strategy, and unit economics. Stress-test the downside scenario. Flag accounting treatment issues and cash conversion cycle risks. Identify financing options and their dilution or covenant implications. Deliver a financial analysis: the numbers that matter, the assumptions that could kill this, and the financial conditions required for success.",
  },
  {
    id: "risk_consultant",
    label: "The Risk Advisor",
    chairSuggest: false,
    prompt:
      "You are the Risk Management Consultant. You see the failure modes others ignore. Conduct a structured risk assessment: strategic risk, operational risk, financial risk, regulatory risk, reputational risk, and black swan scenarios. For each major risk: assess probability, impact, and detectability. Identify second and third-order consequences. Propose specific mitigations and residual risk after mitigation. Flag risks that are unmitigable — these are the real blockers. Deliver a risk matrix with a clear risk appetite recommendation: what level of risk is acceptable and what conditions would make you walk away.",
  },
  {
    id: "partner",
    label: "The Partner (Chairman)",
    chairSuggest: true,
    prompt:
      "You are the Senior Partner at the consulting firm. This engagement's final recommendation falls to you. You have heard strategy's analysis, operations' feasibility assessment, finance's model, and risk's concerns. Your job: synthesize these into a single, client-ready recommendation. Resolve conflicts between workstreams. State the central recommendation clearly. Define the conditions that must be true for success. Identify the top 3 risks the client must own. Assign accountability. Deliver the partner-level verdict: confident, nuanced, and ready to present in the boardroom.",
  },

  /* ── Editorial Team personas ── */
  {
    id: "reporter",
    label: "The Reporter",
    chairSuggest: false,
    prompt:
      "You are the Investigative Reporter. Your job is to find the facts, verify the claims, and identify what's missing. Evaluate the story or proposition through the lens of evidence: what can be confirmed, what is assertion, and what requires further investigation? Identify the sources that haven't been consulted. Ask: who benefits from this narrative, and who is harmed? Push for specificity — vague claims are not publishable. Flag factual inconsistencies. Deliver a reporter's assessment: what the story actually is, what's unverified, and what questions must be answered before publication.",
  },
  {
    id: "editor",
    label: "The Editor",
    chairSuggest: false,
    prompt:
      "You are the Senior Editor. You care about clarity, impact, and truth. Evaluate whether the story or proposal has a clear angle, a compelling narrative structure, and serves the reader. Push back on buried leads — the most important thing must come first. Identify logical gaps, unsupported leaps, and sections that will confuse the audience. Challenge assumptions about what the reader already knows. Assess whether the tone is appropriate for the platform and audience. Deliver an editorial verdict: what works, what needs to be cut, what needs to be rewritten, and what the single most important thing to communicate is.",
  },
  {
    id: "legal_editorial",
    label: "The Legal Reviewer",
    chairSuggest: false,
    prompt:
      "You are the Editorial Legal Reviewer. Your job is to protect the publication from defamation, privacy violations, copyright infringement, and contempt of court risks. Evaluate every factual claim for legal exposure: is it verifiable? Is it fair comment or potential defamation? Has the subject been given right of reply? Are there injunction risks or national security concerns? Identify anonymous source protection issues. Flag any content that could expose the publication to civil or criminal liability. Deliver a legal clearance assessment: what can run, what needs changes, and what must be cut.",
  },
  {
    id: "seo",
    label: "The SEO Strategist",
    chairSuggest: false,
    prompt:
      "You are the SEO and Digital Strategy Lead. You evaluate content through the lens of discoverability, audience reach, and digital performance. Assess keyword opportunity, search intent alignment, headline optimization, and meta strategy. Identify whether the content answers a real search need or is publishing into a void. Evaluate social shareability, backlink potential, and platform distribution strategy. Challenge content that is technically correct but digitally invisible. Recommend structural changes that improve both user experience and search visibility. Deliver an SEO verdict: how to maximize the digital reach of this content without compromising editorial integrity.",
  },
  {
    id: "editor_in_chief",
    label: "The Editor-in-Chief (Chairman)",
    chairSuggest: true,
    prompt:
      "You are the Editor-in-Chief. The final publication decision rests with you. You have heard the reporter's investigation, the editor's structural critique, legal's clearance assessment, and SEO's distribution strategy. Your mandate: decide what runs, what gets killed, and what needs more work. Resolve conflicts between editorial quality and commercial/legal constraints. State clearly: publish, hold, or spike — with reasons. Define the conditions for publication if currently not ready. Deliver the editor-in-chief's ruling: authoritative, editorially sound, and legally defensible.",
  },

  /* ── Hospital / Medical Team personas ── */
  {
    id: "gp",
    label: "The GP",
    chairSuggest: false,
    prompt:
      "You are the General Practitioner. You see the whole patient, not just the presenting complaint. Evaluate the situation holistically: what is the most likely explanation, what are the red flags, and what is the appropriate first-line response? Apply the principle of parsimony — the simplest explanation that fits the evidence. Identify what history, examination, or investigation is needed before deciding. Consider patient safety, comorbidities, medication interactions, and social determinants of health. Deliver a generalist's clinical assessment: what you're most worried about, what you'd do first, and when you'd escalate.",
  },
  {
    id: "specialist",
    label: "The Specialist",
    chairSuggest: false,
    prompt:
      "You are the Senior Medical Specialist in the relevant field. You bring deep domain expertise. Evaluate the clinical question through specialist-level evidence: guidelines, recent trials, pathophysiology, and diagnostic precision. Challenge premature diagnostic closure — what else could this be? Identify rare but serious diagnoses that must be excluded. Assess treatment options by efficacy, side effect profile, and patient-specific factors. Apply evidence-based medicine: cite the quality of evidence for your recommendations. Deliver a specialist opinion: your differential diagnosis, recommended investigation pathway, and treatment hierarchy.",
  },
  {
    id: "pharmacist",
    label: "The Pharmacist",
    chairSuggest: false,
    prompt:
      "You are the Clinical Pharmacist. Medications are your domain of expertise. Evaluate proposed treatments for appropriateness: correct drug, dose, route, duration, and monitoring requirements. Identify drug-drug interactions, drug-disease interactions, and contraindications. Assess renal or hepatic dose adjustments. Flag medications with narrow therapeutic indices requiring monitoring. Evaluate cost-effectiveness and generic substitution options. Review polypharmacy risk. Identify medications that require patient counseling or special storage. Deliver a pharmacological assessment: what is safe, what needs adjustment, and what monitoring is required.",
  },
  {
    id: "ethicist",
    label: "The Medical Ethicist",
    chairSuggest: false,
    prompt:
      "You are the Medical Ethicist and Patient Advocate. You ensure that clinical decisions respect patient autonomy, dignity, and rights. Evaluate the ethical dimensions: patient consent and capacity, beneficence vs non-maleficence, justice in resource allocation, and confidentiality. Identify cases where patient values may conflict with clinical recommendations. Assess end-of-life considerations, advance directives, and surrogate decision-making. Examine equity implications: are all patients receiving equal consideration? Raise the questions the team is avoiding. Deliver an ethical analysis: the values in tension, whose interests are at stake, and the ethically defensible path forward.",
  },
  {
    id: "chief_of_medicine",
    label: "Chief of Medicine (Chairman)",
    chairSuggest: true,
    prompt:
      "You are the Chief of Medicine. This case's final clinical and institutional decision rests with you. You have heard the GP's holistic assessment, the specialist's expert opinion, the pharmacist's medication review, and the ethicist's values analysis. Your mandate: synthesize this into a clear clinical management plan. Resolve diagnostic uncertainty with a ranked differential. Define the investigation and treatment pathway. Address the ethical dimensions. Allocate responsibility across the team. Deliver the attending physician's final ruling: the diagnosis you're most concerned about, the management plan, and the safety net for the patient.",
  },

  /* ── Law Firm personas ── */
  {
    id: "litigation",
    label: "The Litigator",
    chairSuggest: false,
    prompt:
      "You are the Litigation Partner. You think in terms of claims, defenses, evidence, and courtroom outcomes. Evaluate the legal situation through the lens of dispute resolution: what claims are viable, what defenses exist, what evidence supports each party's position, and what is the likely judicial outcome? Assess litigation risk and cost. Identify the strongest argument and the weakest point in your position. Consider settlement dynamics — at what point does litigation cost exceed expected recovery? Evaluate jurisdiction, limitation periods, and procedural considerations. Deliver a litigation assessment: strength of position, estimated costs, probable outcomes, and litigation vs settlement recommendation.",
  },
  {
    id: "corporate",
    label: "The Corporate Lawyer",
    chairSuggest: false,
    prompt:
      "You are the Corporate Counsel. Transactions, governance, and commercial structures are your domain. Evaluate the legal architecture of the proposal: entity structure, contractual obligations, shareholder rights, director duties, and corporate governance requirements. Identify contract drafting issues, representations and warranties that are too broad, and indemnification clauses with unlimited exposure. Assess M&A considerations, equity structure, vesting schedules, and cap table implications. Flag regulatory approvals required. Deliver a corporate legal assessment: the structural risks, the deal-critical issues that need negotiation, and the governance conditions for proceeding.",
  },
  {
    id: "compliance",
    label: "The Compliance Officer",
    chairSuggest: false,
    prompt:
      "You are the Chief Compliance Officer. You live in the intersection of law, regulation, and organizational behavior. Evaluate compliance risk across: data protection (GDPR/CCPA), financial regulations, anti-corruption laws (FCPA/UK Bribery Act), employment law, industry-specific regulations, and sanctions. Identify the regulators who have jurisdiction and their enforcement priorities. Assess the adequacy of existing compliance controls. Flag conduct that creates personal liability for directors and officers. Identify reporting obligations triggered by this situation. Deliver a compliance risk register: what rules apply, what exposure exists, what controls are needed, and what must be disclosed.",
  },
  {
    id: "junior_associate",
    label: "The Junior Associate",
    chairSuggest: false,
    prompt:
      "You are the Junior Associate — diligent, detail-obsessed, and occasionally naive in ways that are useful. Your job is to read everything closely and catch what the partners miss because they're thinking at altitude. Identify specific language in contracts, statutes, or precedents that creates ambiguity. Flag the clause that could be interpreted differently by opposing counsel. Raise the question that feels obvious but hasn't been asked. Check the citations. Note the deadline that's been overlooked. Deliver a detailed associate memo: the specific text-level issues, the open questions, and the things you'd want to verify before anyone signs anything.",
  },
  {
    id: "senior_partner",
    label: "The Senior Partner (Chairman)",
    chairSuggest: true,
    prompt:
      "You are the Senior Partner. This matter's final legal strategy and client advice rest with you. You have heard litigation's case assessment, corporate's structural analysis, compliance's regulatory mapping, and the associate's detailed review. Your mandate: deliver the firm's definitive legal position. Identify the most important legal risk. Define the recommended course of action with clear reasoning. Resolve conflicts between practice area recommendations. Specify what requires immediate action versus what can be monitored. Deliver senior partner-level counsel: the kind of advice you'd give a trusted client in a private meeting — frank, precise, and strategically sound.",
  },

  { id: "custom", label: "Custom ✎", chairSuggest: false, prompt: "" },
];

/* ─── Council Templates ─────────────────────────────────────── */
const COUNCIL_TEMPLATES = [
  /* ── Original Templates ── */
  {
    id: "strategy",
    name: "Business Strategy",
    icon: "📊",
    color: "#60a5fa",
    category: "think-tank",
    description:
      "Rigorous analysis + contrarian stress-test + actionable output.",
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
    description:
      "Philosophy + vision + analysis for complex nuanced questions.",
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
    description:
      "CFO + CTO + CMO + Legal debate the launch. CEO makes the final call.",
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
    description:
      "Founder + Engineer + Designer + Growth build. Investor decides.",
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
    description:
      "Strategy + Operations + Finance + Risk deliver a client recommendation.",
    members: [
      {
        personaId: "strategy_consultant",
        name: "Strategy",
        isChairman: false,
      },
      {
        personaId: "operations_consultant",
        name: "Operations",
        isChairman: false,
      },
      {
        personaId: "finance_consultant",
        name: "Finance",
        isChairman: false,
      },
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
    description:
      "Reporter + Editor + Legal + SEO deliberate. Editor-in-Chief publishes or spikes.",
    members: [
      { personaId: "reporter", name: "The Reporter", isChairman: false },
      { personaId: "editor", name: "The Editor", isChairman: false },
      {
        personaId: "legal_editorial",
        name: "Legal Review",
        isChairman: false,
      },
      { personaId: "seo", name: "SEO Strategist", isChairman: false },
      {
        personaId: "editor_in_chief",
        name: "Editor-in-Chief",
        isChairman: true,
      },
    ],
  },
  {
    id: "hospital",
    name: "Hospital Team",
    icon: "🏥",
    color: "#22d3ee",
    category: "professional",
    description:
      "GP + Specialist + Pharmacist + Ethicist deliberate. Chief of Medicine decides.",
    members: [
      { personaId: "gp", name: "The GP", isChairman: false },
      { personaId: "specialist", name: "The Specialist", isChairman: false },
      { personaId: "pharmacist", name: "The Pharmacist", isChairman: false },
      { personaId: "ethicist", name: "Medical Ethicist", isChairman: false },
      {
        personaId: "chief_of_medicine",
        name: "Chief of Medicine",
        isChairman: true,
      },
    ],
  },
  {
    id: "law_firm",
    name: "Law Firm",
    icon: "⚖️",
    color: "#a78bfa",
    category: "professional",
    description:
      "Litigation + Corporate + Compliance + Associate advise. Partner rules.",
    members: [
      { personaId: "litigation", name: "Litigator", isChairman: false },
      { personaId: "corporate", name: "Corporate Counsel", isChairman: false },
      {
        personaId: "compliance",
        name: "Compliance Officer",
        isChairman: false,
      },
      {
        personaId: "junior_associate",
        name: "Junior Associate",
        isChairman: false,
      },
      { personaId: "senior_partner", name: "Senior Partner", isChairman: true },
    ],
  },
];

/* Group templates by category for display */
const TEMPLATE_CATEGORIES = [
  { id: "think-tank", label: "Think Tank", icon: "🧠" },
  { id: "corporate", label: "Corporate", icon: "🏢" },
  { id: "professional", label: "Professional", icon: "🎯" },
];

const CHAIRMAN_SYNTHESIS = `You are the Chairman of the AI Council — final arbiter and decision authority.
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

let _seq = 0;
const uid = () => `m${++_seq}_${Date.now()}`;
const cid = () => `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const sid = () =>
  `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/* ═══════════════════════════════════════════════════════════════
   THINK-BLOCK STRIPPER
═══════════════════════════════════════════════════════════════ */
function stripThinking(text) {
  if (!text) return text;
  let result = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const openIdx = result.search(/<think>/i);
  if (openIdx !== -1) result = result.slice(0, openIdx);
  return result.replace(/^\s+/, "").trim();
}
function isThinking(rawText) {
  if (!rawText) return false;
  const lower = rawText.toLowerCase();
  const lastOpen = lower.lastIndexOf("<think>");
  if (lastOpen === -1) return false;
  return lower.lastIndexOf("</think>") < lastOpen;
}

/* ═══════════════════════════════════════════════════════════════
   PERSISTENT STORAGE
═══════════════════════════════════════════════════════════════ */
const CONFIGS_KEY = "ai-council-configs-v2";
const SESSIONS_KEY = "ai-council-sessions";
const WEBHOOK_KEY = "ai-council-webhook";

async function loadConfigs() {
  try {
    const r = await window.storage.get(CONFIGS_KEY);
    return r ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}
async function loadSessions() {
  try {
    const r = await window.storage.get(SESSIONS_KEY);
    return r ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}
async function loadWebhookUrl() {
  try {
    const r = await window.storage.get(WEBHOOK_KEY);
    return r ? r.value : "";
  } catch {
    return "";
  }
}
async function saveWebhookUrl(url) {
  try {
    await window.storage.set(WEBHOOK_KEY, url);
  } catch {}
}
async function persistConfigs(c) {
  try {
    await window.storage.set(CONFIGS_KEY, JSON.stringify(c));
  } catch {}
}
async function persistSessions(s) {
  try {
    await window.storage.set(SESSIONS_KEY, JSON.stringify(s.slice(-30)));
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

/* ═══════════════════════════════════════════════════════════════
   EXPORT — Markdown + PDF
═══════════════════════════════════════════════════════════════ */
function buildMarkdown(session) {
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
    names.forEach((n) => {
      md += `- ${n}\n`;
    });
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
function downloadMarkdown(session) {
  const blob = new Blob([buildMarkdown(session)], { type: "text/markdown" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `ai-council-${Date.now()}.md`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
function exportPDF(session) {
  const md = buildMarkdown(session);
  const html = md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^---$/gm, "<hr>")
    .replace(/\n/g, "<br>");
  const win = window.open("", "_blank");
  win.document
    .write(`<!DOCTYPE html><html><head><title>AI Council Report</title><style>
    body{font-family:Georgia,serif;max-width:820px;margin:40px auto;color:#1a1a1a;line-height:1.8;padding:0 24px}
    h1{color:#4c1d95;border-bottom:2px solid #a78bfa;padding-bottom:10px}
    h2{color:#3b0764;margin-top:36px;border-left:4px solid #a78bfa;padding-left:12px}
    h3{color:#374151;margin-top:20px}hr{border:none;border-top:1px solid #e5e7eb;margin:24px 0}
    @media print{body{margin:20px}}
  </style></head><body>${html}<script>window.print();<\/script></body></html>`);
  win.document.close();
}

/* ═══════════════════════════════════════════════════════════════
   WEBHOOK
═══════════════════════════════════════════════════════════════ */
async function fireWebhook(url, data) {
  if (!url?.trim()) return { ok: false, skipped: true };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════
   IMPORT COUNCIL JSON
═══════════════════════════════════════════════════════════════ */
function parseCouncilJSON(jsonStr) {
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
      endpoint:
        m.endpoint || PROVIDERS[m.provider || "ollama"]?.defaultEndpoint || "",
      apiKey: m.apiKey || "",
      personaLabel: m.personaLabel || p?.label || "Custom",
      systemPrompt: m.systemPrompt || p?.prompt || "",
      color: m.color || ACCENT_COLORS[i % ACCENT_COLORS.length],
      icon: m.icon || ACCENT_ICONS[i % ACCENT_ICONS.length],
      isChairman: !!m.isChairman,
    };
  });
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
   MODEL FETCHING  (with CORS-friendly Ollama fetch)
═══════════════════════════════════════════════════════════════ */
async function fetchModels(provider, endpoint, apiKey) {
  const pInfo = PROVIDERS[provider];
  if (provider === "ollama") {
    const base = endpoint.replace(/\/$/, "");
    const res = await fetch(`${base}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Some reverse proxies need explicit Accept
        Accept: "application/json",
      },
      // Credentials omitted — avoids preflight issues with cross-origin Ollama
      credentials: "omit",
    });
    if (!res.ok)
      throw new Error(
        `Cannot reach Ollama at ${endpoint} (HTTP ${res.status}). ` +
          `Add 'Access-Control-Allow-Origin: *' to your reverse proxy, ` +
          `or run Ollama with OLLAMA_ORIGINS="*" ollama serve`,
      );
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
  throw new Error("Not supported");
}

/* ═══════════════════════════════════════════════════════════════
   API LAYER  (temperature + AbortSignal throughout)
═══════════════════════════════════════════════════════════════ */
async function sseStream(res, onChunk, extractFn, signal) {
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 160)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value).split("\n")) {
        const t = extractFn(line.trim());
        if (t) {
          full += t;
          onChunk(full);
        }
      }
    }
  } catch (e) {
    if (e.name !== "AbortError") throw e;
  }
  return full;
}
async function callOllamaDirect(member, system, prompt, onChunk, signal, temp) {
  const msgs = [];
  if (system) msgs.push({ role: "system", content: system });
  msgs.push({ role: "user", content: prompt });
  const base = member.endpoint.replace(/\/$/, "");
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({
      model: member.model,
      messages: msgs,
      stream: true,
      options: { temperature: temp },
    }),
    signal,
  });
  if (!res.ok) {
    const b = await res.text().catch(() => "");
    throw new Error(
      `Ollama ${res.status}${b ? ": " + b.slice(0, 80) : ""}. ` +
        `Ensure CORS is enabled: OLLAMA_ORIGINS="*" or via your reverse proxy headers.`,
    );
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        break;
      }
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
  } catch (e) {
    if (e.name !== "AbortError") throw e;
  }
  return full;
}
const callOllama = (m, sys, p, cb, sig, temp) =>
  enqueueOllama(m.endpoint, () => callOllamaDirect(m, sys, p, cb, sig, temp));
async function callOpenAICompat(member, system, prompt, onChunk, signal, temp) {
  const msgs = [];
  if (system) msgs.push({ role: "system", content: system });
  msgs.push({ role: "user", content: prompt });
  const base = (
    member.endpoint || PROVIDERS[member.provider].defaultEndpoint
  ).replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${member.apiKey}`,
    },
    body: JSON.stringify({
      model: member.model,
      messages: msgs,
      stream: true,
      max_tokens: 2000,
      temperature: temp,
    }),
  });
  return sseStream(
    res,
    onChunk,
    (line) => {
      if (!line.startsWith("data: ")) return null;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") return null;
      try {
        return JSON.parse(raw).choices?.[0]?.delta?.content ?? null;
      } catch {
        return null;
      }
    },
    signal,
  );
}
async function callAnthropic(member, system, prompt, onChunk, signal, temp) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": member.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-allow-browser": "true",
    },
    body: JSON.stringify({
      model: member.model,
      max_tokens: 2000,
      stream: true,
      temperature: temp,
      ...(system ? { system } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
  });
  return sseStream(
    res,
    onChunk,
    (line) => {
      if (!line.startsWith("data: ")) return null;
      try {
        const d = JSON.parse(line.slice(6));
        return d.type === "content_block_delta"
          ? (d.delta?.text ?? null)
          : null;
      } catch {
        return null;
      }
    },
    signal,
  );
}
async function callGoogle(member, system, prompt, onChunk, signal, temp) {
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    generationConfig: { maxOutputTokens: 2000, temperature: temp },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${member.model}:streamGenerateContent?key=${member.apiKey}&alt=sse`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    },
  );
  return sseStream(
    res,
    onChunk,
    (line) => {
      if (!line.startsWith("data: ")) return null;
      try {
        return (
          JSON.parse(line.slice(6)).candidates?.[0]?.content?.parts?.[0]
            ?.text ?? null
        );
      } catch {
        return null;
      }
    },
    signal,
  );
}
function dispatchMember(
  member,
  system,
  prompt,
  onChunk,
  signal,
  temperature = 0.7,
) {
  const compat = PROVIDERS[member.provider].compat;
  if (compat === "ollama")
    return callOllama(member, system, prompt, onChunk, signal, temperature);
  if (compat === "openai")
    return callOpenAICompat(
      member,
      system,
      prompt,
      onChunk,
      signal,
      temperature,
    );
  if (compat === "anthropic")
    return callAnthropic(member, system, prompt, onChunk, signal, temperature);
  if (compat === "google")
    return callGoogle(member, system, prompt, onChunk, signal, temperature);
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

/* ─── Temperature Slider ──────────────────────────────────────── */
function TemperatureSlider({ value, onChange }) {
  const color = value < 0.35 ? "#60a5fa" : value < 0.65 ? "#a78bfa" : "#f472b6";
  const label =
    value < 0.35 ? "Precise" : value < 0.65 ? "Balanced" : "Creative";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${tokens.borderSubtle}`,
        borderRadius: 9,
      }}
    >
      <span
        style={{ fontSize: 11, color: tokens.textFaint, whiteSpace: "nowrap" }}
      >
        🎯
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: color, cursor: "pointer", height: 4 }}
      />
      <span
        style={{ fontSize: 11, color: tokens.textFaint, whiteSpace: "nowrap" }}
      >
        🎨
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          background: `${color}18`,
          border: `1px solid ${color}44`,
          borderRadius: 5,
          padding: "2px 10px",
          minWidth: 80,
          textAlign: "center",
        }}
      >
        {label} {Math.round(value * 100)}%
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
        Save Config
      </div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder='e.g. "Google Gemini Flash"'
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
            label={saveKey ? "API key will be saved" : "Don't save API key"}
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
          System Prompt{" "}
          {hasOverride && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                fontWeight: 700,
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
              ↺ Reset
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
            placeholder="Override the default prompt…"
            style={{
              ...formStyles.input,
              resize: "vertical",
              lineHeight: 1.6,
              borderColor: hasOverride ? "rgba(245,158,11,0.4)" : undefined,
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
    const m = PERSONAS.find(
      (p) => p.id !== "custom" && p.prompt === editMember.systemPrompt,
    );
    return m ? "" : editMember.systemPrompt || "";
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

  const pInfo = PROVIDERS[prov],
    color = ACCENT_COLORS[slotIndex % ACCENT_COLORS.length],
    icon = ACCENT_ICONS[slotIndex % ACCENT_ICONS.length];
  const suggestions = fetched.length ? fetched : pInfo.suggestedModels,
    personaObj = PERSONAS.find((p) => p.id === personaId);
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
      setChairMsg(
        "👑 Auto-selected — this persona is the natural synthesizer.",
      );
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
      const ms = await fetchModels(prov, endpoint, apiKey);
      setFetched(ms);
      if (ms.length && !model) setModel(ms[0]);
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

  /* Group personas for select display */
  const personaGroups = [
    {
      label: "Think Tank",
      ids: ["analyst", "contrarian", "visionary", "pragmatist", "philosopher"],
    },
    {
      label: "Corporate / C-Suite",
      ids: ["cfo", "cto", "cmo", "legal", "ceo_chair"],
    },
    {
      label: "Startup Team",
      ids: ["founder", "engineer", "designer", "growth", "investor"],
    },
    {
      label: "Consulting",
      ids: [
        "strategy_consultant",
        "operations_consultant",
        "finance_consultant",
        "risk_consultant",
        "partner",
      ],
    },
    {
      label: "Editorial",
      ids: ["reporter", "editor", "legal_editorial", "seo", "editor_in_chief"],
    },
    {
      label: "Medical",
      ids: ["gp", "specialist", "pharmacist", "ethicist", "chief_of_medicine"],
    },
    {
      label: "Legal",
      ids: [
        "litigation",
        "corporate",
        "compliance",
        "junior_associate",
        "senior_partner",
      ],
    },
    { label: "Custom", ids: ["custom"] },
  ];

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
        {/* CORS help box for Ollama */}
        {prov === "ollama" && (
          <div
            style={{
              marginTop: 8,
              padding: "10px 12px",
              background: "rgba(52,211,153,0.05)",
              border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: 8,
              fontSize: 11,
              color: "#6ee7b7",
              lineHeight: 1.6,
            }}
          >
            <strong>🔧 CORS fix for reverse proxy (nginx):</strong>
            <br />
            Add to your location block:
            <br />
            <code
              style={{
                fontFamily: "monospace",
                color: "#a7f3d0",
                display: "block",
                marginTop: 4,
              }}
            >
              add_header 'Access-Control-Allow-Origin' '*';
              <br />
              add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
              <br />
              add_header 'Access-Control-Allow-Headers' 'Content-Type';
              <br />
              if ($request_method = 'OPTIONS') {"{ return 204; }"}
            </code>
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
            {personaGroups.map((grp) => (
              <optgroup key={grp.label} label={grp.label}>
                {grp.ids.map((pid) => {
                  const p = PERSONAS.find((x) => x.id === pid);
                  return p ? (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ) : null;
                })}
              </optgroup>
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
          title="Toggle Chairman"
          style={{
            ...buttonStyles.iconSquare,
            border: `1px solid ${isChairman ? member.color + "55" : tokens.borderSubtle}`,
            background: isChairman ? `${member.color}18` : "transparent",
            color: isChairman ? member.color : tokens.textMuted,
          }}
        >
          👑
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            title="Edit"
            style={{ ...buttonStyles.iconSquare, color: tokens.textMuted }}
          >
            ✎
          </button>
        )}
        <button
          onClick={onRemove}
          title="Remove"
          style={buttonStyles.iconSquare}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COUNCIL TEMPLATE CARD
═══════════════════════════════════════════════════════════════ */
function TemplateCard({ tmpl, onLoad }) {
  return (
    <div
      onClick={() => onLoad(tmpl)}
      style={{
        padding: "14px 16px",
        background: `${tmpl.color}08`,
        border: `1px solid ${tmpl.color}33`,
        borderRadius: 12,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${tmpl.color}14`;
        e.currentTarget.style.borderColor = `${tmpl.color}66`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${tmpl.color}08`;
        e.currentTarget.style.borderColor = `${tmpl.color}33`;
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          marginBottom: 7,
        }}
      >
        <span style={{ fontSize: 18 }}>{tmpl.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
          {tmpl.name}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: tmpl.color,
            background: `${tmpl.color}1a`,
            border: `1px solid ${tmpl.color}33`,
            borderRadius: 4,
            padding: "1px 7px",
          }}
        >
          {tmpl.members.length} members
        </span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: tokens.textMuted,
          lineHeight: 1.5,
          marginBottom: 8,
        }}
      >
        {tmpl.description}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {tmpl.members.map((m, i) => (
          <span
            key={i}
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 4,
              background: `${tmpl.color}15`,
              color: tmpl.color,
              border: `1px solid ${tmpl.color}30`,
            }}
          >
            {m.isChairman ? "👑 " : ""}
            {m.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS MODAL  (webhook)
═══════════════════════════════════════════════════════════════ */
function SettingsModal({ onClose }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  useEffect(() => {
    loadWebhookUrl().then(setWebhookUrl);
  }, []);
  const doSave = async () => {
    setSaving(true);
    await saveWebhookUrl(webhookUrl.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  const doTest = async () => {
    if (!webhookUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    const r = await fireWebhook(webhookUrl.trim(), {
      type: "test",
      ts: Date.now(),
      source: "ai-council",
    });
    setTesting(false);
    setTestResult(r);
  };
  return (
    <>
      <div onClick={onClose} style={layoutStyles.backdrop} />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "min(480px,95vw)",
          background: "#0e0e1a",
          border: `1px solid rgba(167,139,250,0.25)`,
          borderRadius: 16,
          zIndex: 60,
          boxShadow: "0 40px 120px rgba(0,0,0,0.8)",
          animation: "slideDown 0.2s ease",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: `1px solid ${tokens.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
            ⚙ Settings
          </div>
          <button onClick={onClose} style={buttonStyles.iconSquare}>
            ✕
          </button>
        </div>
        <div style={{ padding: 22 }}>
          <label style={formStyles.label}>🔗 Webhook URL</label>
          <div
            style={{
              fontSize: 12,
              color: tokens.textMuted,
              marginBottom: 10,
              lineHeight: 1.55,
            }}
          >
            After every completed session, AI Council POSTs the full session
            JSON to this URL. Works with Zapier, Make, n8n, Slack, Notion,
            Pipedream, etc.
          </div>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.zapier.com/…"
            style={{ ...formStyles.input, marginBottom: 10 }}
          />
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              onClick={doTest}
              disabled={!webhookUrl.trim() || testing}
              style={{
                ...buttonStyles.ghost,
                padding: "7px 14px",
                fontSize: 12,
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {testing ? (
                <>
                  <Spin size={11} /> Testing…
                </>
              ) : (
                "🧪 Send Test Ping"
              )}
            </button>
            <button
              onClick={doSave}
              disabled={saving}
              style={{
                flex: 2,
                padding: "7px 14px",
                borderRadius: 7,
                border: "none",
                background: saved
                  ? tokens.success
                  : "linear-gradient(135deg,#a78bfa,#60a5fa)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "background 0.2s",
              }}
            >
              {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Webhook"}
            </button>
          </div>
          {testResult && (
            <div
              style={{
                padding: "7px 11px",
                borderRadius: 7,
                fontSize: 12,
                background: testResult.ok
                  ? "rgba(52,211,153,0.08)"
                  : "rgba(248,113,113,0.08)",
                border: `1px solid ${testResult.ok ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                color: testResult.ok ? "#6ee7b7" : "#fca5a5",
              }}
            >
              {testResult.ok
                ? `✓ Webhook responded with HTTP ${testResult.status}`
                : testResult.skipped
                  ? "No URL configured."
                  : testResult.error
                    ? `✕ ${testResult.error}`
                    : `✕ HTTP ${testResult.status}`}
            </div>
          )}
          <div style={formStyles.divider} />
          <label style={formStyles.label}>📋 Payload shape</label>
          <pre
            style={{
              fontSize: 10,
              color: tokens.textMuted,
              background: "rgba(0,0,0,0.3)",
              borderRadius: 7,
              padding: "10px 12px",
              lineHeight: 1.6,
              overflow: "auto",
            }}
          >{`{ type: "session_complete",\n  ts: 1234567890,\n  query: "…",\n  temperature: 0.7,\n  memberNames: ["…"],\n  responses: { memberId: "…" },\n  reviews:   { memberId: "…" },\n  verdict: "…" }`}</pre>
        </div>
      </div>
    </>
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
  const saveMember = (u) => {
    onUpdateMembers(members.map((m) => (m.id === u.id ? u : m)));
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
            ✓ Changes apply to the <strong>next query</strong> — current session
            is untouched.
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
   SETUP SCREEN  (templates + import/export JSON)
═══════════════════════════════════════════════════════════════ */
function SetupScreen({ onLaunch }) {
  const [members, setMembers] = useState([]);
  const [chairmanId, setChairman] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showTpl, setShowTpl] = useState(false);
  const [activeCategory, setActiveCategory] = useState("think-tank");
  const [importErr, setImportErr] = useState("");
  const [importOk, setImportOk] = useState(false);
  const importRef = useRef();
  const editMember = editingId ? members.find((m) => m.id === editingId) : null;

  const addMember = (m) => {
    setMembers((p) => [...p, m]);
    if (m.isChairman) setChairman(m.id);
    setShowForm(false);
  };
  const saveMember = (u) => {
    setMembers((p) => p.map((m) => (m.id === u.id ? u : m)));
    setEditingId(null);
  };
  const removeMember = (id) => {
    setMembers((p) => p.filter((m) => m.id !== id));
    if (chairmanId === id) setChairman(null);
  };
  const toggleChairman = (id) => setChairman((p) => (p === id ? null : id));
  const canLaunch = members.length >= 3 && chairmanId !== null;
  const need = Math.max(0, 3 - members.length);

  const loadTemplate = (tmpl) => {
    setImportErr("");
    setImportOk(false);
    const built = tmpl.members.map((tm, i) => {
      const persona =
        PERSONAS.find((p) => p.id === tm.personaId) || PERSONAS[0];
      return {
        id: uid(),
        name: tm.name,
        provider: "ollama",
        model: "",
        endpoint: "http://localhost:11434",
        apiKey: "",
        personaLabel: persona.label,
        systemPrompt: persona.prompt,
        color: ACCENT_COLORS[i % ACCENT_COLORS.length],
        icon: ACCENT_ICONS[i % ACCENT_ICONS.length],
        isChairman: tm.isChairman,
      };
    });
    setMembers(built);
    setChairman(built.find((m) => m.isChairman)?.id || null);
    setShowTpl(false);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imp = parseCouncilJSON(ev.target.result);
        setMembers(imp);
        setChairman(imp.find((m) => m.isChairman)?.id || null);
        setImportOk(true);
        setImportErr("");
        setTimeout(() => setImportOk(false), 2500);
      } catch (err) {
        setImportErr(err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportConfig = () => {
    const data = {
      members: members.map((m) => ({
        name: m.name,
        provider: m.provider,
        model: m.model,
        endpoint: m.endpoint,
        apiKey: "",
        personaLabel: m.personaLabel,
        systemPrompt: m.systemPrompt,
        color: m.color,
        icon: m.icon,
        isChairman: m.isChairman,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "ai-council-config.json",
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filteredTemplates = COUNCIL_TEMPLATES.filter(
    (t) => t.category === activeCategory,
  );

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
        {members.length > 0 && (
          <button
            onClick={exportConfig}
            style={{
              ...buttonStyles.ghost,
              marginLeft: "auto",
              padding: "5px 12px",
              fontSize: 12,
            }}
          >
            📤 Export Config
          </button>
        )}
      </div>
      <div style={layoutStyles.contentWell}>
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontSize: "clamp(26px,6vw,40px)",
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
            endpoint. Start from a template or build manually.
          </p>
        </div>

        {/* Stage overview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 10,
            marginBottom: 32,
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

        {/* Templates */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setShowTpl((s) => !s)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: `1px solid rgba(167,139,250,0.3)`,
              background: "rgba(167,139,250,0.05)",
              color: "#c4b5fd",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>✨ Start from a template</span>
            <span style={{ fontSize: 11, opacity: 0.6 }}>
              {showTpl
                ? "▲ Collapse"
                : `▼ Show ${COUNCIL_TEMPLATES.length} templates`}
            </span>
          </button>
          {showTpl && (
            <div style={{ animation: "slideDown 0.2s ease" }}>
              {/* Category tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginTop: 12,
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                {TEMPLATE_CATEGORIES.map((cat) => {
                  const count = COUNCIL_TEMPLATES.filter(
                    (t) => t.category === cat.id,
                  ).length;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: `1px solid ${isActive ? "rgba(167,139,250,0.5)" : tokens.borderSubtle}`,
                        background: isActive
                          ? "rgba(167,139,250,0.12)"
                          : "transparent",
                        color: isActive ? "#c4b5fd" : tokens.textMuted,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 400,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span
                        style={{
                          fontSize: 10,
                          background: isActive
                            ? "rgba(167,139,250,0.2)"
                            : "rgba(255,255,255,0.06)",
                          padding: "1px 6px",
                          borderRadius: 4,
                          color: isActive ? "#c4b5fd" : tokens.textFaint,
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 10,
                }}
              >
                {filteredTemplates.map((t) => (
                  <TemplateCard key={t.id} tmpl={t} onLoad={loadTemplate} />
                ))}
              </div>
              <div
                style={{ marginTop: 10, fontSize: 12, color: tokens.textFaint }}
              >
                ⚠ Templates load persona structure only — you still need to set
                provider, model, and API key per member.
              </div>
            </div>
          )}
        </div>

        {/* Members header */}
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
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
          <div style={{ display: "flex", gap: 7 }}>
            <button
              onClick={() => importRef.current?.click()}
              style={{
                ...buttonStyles.ghost,
                padding: "5px 12px",
                fontSize: 12,
              }}
            >
              📥 Import JSON
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: "none" }}
            />
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
        </div>

        {importErr && (
          <div style={{ ...cardStyles.errorBox, marginBottom: 12 }}>
            ⚠ Import failed: {importErr}
          </div>
        )}
        {importOk && (
          <div style={{ ...cardStyles.infoBox, marginBottom: 12 }}>
            ✓ Council imported successfully — set provider/model/keys for each
            member.
          </div>
        )}

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
              No members yet — pick a template above or add members manually
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
   HISTORY MODAL + DETAIL VIEW
═══════════════════════════════════════════════════════════════ */
function HistoryModal({ sessions, onClose, onLoad }) {
  const [selected, setSelected] = useState(null);
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
          width: "min(900px,100vw)",
          height: "min(700px,100dvh)",
          background: "linear-gradient(160deg,#0e0e1a,#080810)",
          border: `1px solid rgba(167,139,250,0.2)`,
          borderRadius: "clamp(0px,2vw,18px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 120px rgba(0,0,0,0.8)",
          animation: "slideDown 0.2s ease",
        }}
      >
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
            {selected && (
              <button
                onClick={() => setSelected(null)}
                style={{
                  ...buttonStyles.ghost,
                  padding: "4px 10px",
                  fontSize: 12,
                }}
              >
                ← Back
              </button>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {selected ? "Session Detail" : "Session History"}
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
            {selected && (
              <>
                <button
                  onClick={() => downloadMarkdown(selected)}
                  style={{
                    ...buttonStyles.ghost,
                    padding: "5px 12px",
                    fontSize: 12,
                  }}
                >
                  ⬇ Markdown
                </button>
                <button
                  onClick={() => exportPDF(selected)}
                  style={{
                    ...buttonStyles.ghost,
                    padding: "5px 12px",
                    fontSize: 12,
                  }}
                >
                  🖨 PDF
                </button>
                <button
                  onClick={() => {
                    onLoad(selected);
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
              </>
            )}
            <button
              onClick={onClose}
              style={{ ...buttonStyles.iconSquare, width: 32, height: 32 }}
            >
              ✕
            </button>
          </div>
        </div>
        {!selected && (
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
                    onClick={() => setSelected(sess)}
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
                      {sess.temperature !== undefined && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#a78bfa",
                            background: "rgba(167,139,250,0.08)",
                            padding: "2px 7px",
                            borderRadius: 4,
                            border: "1px solid rgba(167,139,250,0.2)",
                          }}
                        >
                          🌡 {Math.round(sess.temperature * 100)}%
                        </span>
                      )}
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
                      {sess.followUpChain?.length > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#60a5fa",
                            background: "rgba(96,165,250,0.08)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            border: "1px solid rgba(96,165,250,0.2)",
                          }}
                        >
                          🔗 {sess.followUpChain.length} follow-up
                          {sess.followUpChain.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {selected && <HistoryDetailView session={selected} />}
      </div>
    </div>
  );
}

function HistoryDetailView({ session }) {
  const [tab, setTab] = useState("opinions");
  const ids = session.memberIds || Object.keys(session.responses || {});
  const names = session.memberNames || [];
  const [activeId, setActiveId] = useState(ids[0]);
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
  const pool =
    tab === "opinions" ? session.responses || {} : session.reviews || {};
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${tokens.borderSubtle}`,
          background: "rgba(167,139,250,0.03)",
        }}
      >
        <div style={textStyles.queryText}>"{session.query}"</div>
        {session.followUpChain?.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#60a5fa" }}>
            🔗 {session.followUpChain.length} follow-up round
            {session.followUpChain.length !== 1 ? "s" : ""} in this session
          </div>
        )}
      </div>
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
                tab === t.id ? "2px solid #a78bfa" : "2px solid transparent",
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
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {(tab === "opinions" || tab === "reviews") && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div
              style={{
                width: "clamp(110px,20vw,180px)",
                borderRight: `1px solid ${tokens.borderSubtle}`,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                overflowY: "auto",
              }}
            >
              {ids.map((id, i) => (
                <button
                  key={id}
                  onClick={() => setActiveId(id)}
                  style={{
                    padding: "9px 11px",
                    borderRadius: 8,
                    border: `1px solid ${activeId === id ? "rgba(167,139,250,0.4)" : tokens.borderSubtle}`,
                    background:
                      activeId === id
                        ? "rgba(167,139,250,0.1)"
                        : "rgba(255,255,255,0.02)",
                    color: activeId === id ? "#c4b5fd" : tokens.textMuted,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: activeId === id ? 600 : 400,
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
                    {names[i] || id}
                  </span>
                  {pool[id] && (
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background:
                          tab === "opinions" ? tokens.primary : tokens.success,
                        flexShrink: 0,
                        marginLeft: 6,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, padding: "18px 20px", overflowY: "auto" }}>
              {activeId && pool[activeId] ? (
                <div
                  style={{
                    ...textStyles.responseBody,
                    ...(tab === "reviews" ? { color: "#9998aa" } : {}),
                  }}
                >
                  {pool[activeId]}
                </div>
              ) : (
                <div
                  style={{
                    color: tokens.textFaint,
                    fontSize: 13,
                    fontStyle: "italic",
                  }}
                >
                  No {tab === "opinions" ? "response" : "peer review"} recorded.
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
   RESULTS VIEW  (tabbed, cancel, export, follow-up)
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
  cancelled,
  currentSession,
  onFollowUp,
  temperature,
}) {
  const [activeTab, setActiveTab] = useState("opinions");
  const [activeMemberId, setActiveMemberId] = useState(sessionMembers[0]?.id);
  const [followUpText, setFollowUpText] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const chairman = sessionMembers.find((m) => m.isChairman);
  const isDone = (stage >= 3 && !chairLoad) || cancelled;
  const opinionsDone = sessionMembers.filter(
    (m) => responses[m.id] || errors[m.id],
  ).length;
  const reviewsDone = sessionMembers.filter((m) => reviews[m.id]).length;
  const tabDefs = [
    {
      id: "opinions",
      label: "First Opinions",
      roman: "I",
      done: opinionsDone,
      total: sessionMembers.length,
      loading: sessionMembers.some((m) => loading[m.id]) && stage === 1,
      active: stage >= 1,
    },
    {
      id: "reviews",
      label: "Peer Review",
      roman: "II",
      done: reviewsDone,
      total: sessionMembers.length,
      loading: sessionMembers.some((m) => loading[m.id]) && stage === 2,
      active: stage >= 2,
    },
    {
      id: "verdict",
      label: "Final Verdict",
      roman: "III",
      done: verdict ? 1 : 0,
      total: 1,
      loading: chairLoad,
      active: stage >= 3 || cancelled,
    },
  ];
  const activeMember = sessionMembers.find((m) => m.id === activeMemberId);

  const submitFollowUp = () => {
    if (!followUpText.trim()) return;
    onFollowUp(followUpText.trim());
    setFollowUpText("");
    setShowFollowUp(false);
    setActiveTab("opinions");
  };

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
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div
            style={{
              ...textStyles.queryText,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            "{query}"
          </div>
          {temperature !== undefined && (
            <div
              style={{ fontSize: 10, color: tokens.textFaint, marginTop: 2 }}
            >
              🌡 Temperature: {Math.round(temperature * 100)}%
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {isDone && verdict && (
            <>
              <button
                onClick={() => downloadMarkdown(currentSession)}
                style={{
                  ...buttonStyles.ghost,
                  padding: "4px 10px",
                  fontSize: 11,
                }}
              >
                ⬇ MD
              </button>
              <button
                onClick={() => exportPDF(currentSession)}
                style={{
                  ...buttonStyles.ghost,
                  padding: "4px 10px",
                  fontSize: 11,
                }}
              >
                🖨 PDF
              </button>
            </>
          )}
          <button
            onClick={onNewQuery}
            style={{ ...buttonStyles.ghost, padding: "4px 10px", fontSize: 12 }}
          >
            ✕ New
          </button>
        </div>
      </div>

      {/* Cancelled banner */}
      {cancelled && (
        <div
          style={{
            padding: "8px 20px",
            background: "rgba(248,113,113,0.08)",
            borderBottom: `1px solid rgba(248,113,113,0.2)`,
            fontSize: 12,
            color: "#fca5a5",
            flexShrink: 0,
          }}
        >
          ⬛ Run was cancelled — partial results shown below.
        </div>
      )}

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
                if (t.active) setActiveTab(t.id);
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
                    fontSize: "clamp(10px,2vw,12px)",
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

      {/* Tab content area */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          {/* ── Tab I: First Opinions ── */}
          {activeTab === "opinions" && (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              <div
                style={{
                  width: "clamp(120px,22vw,200px)",
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
                  const isLd = !!loading[m.id];
                  const hasR = !!responses[m.id];
                  const hasE = !!errors[m.id];
                  const isSel = activeMemberId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveMemberId(m.id)}
                      style={{
                        padding: "10px 11px",
                        borderRadius: 9,
                        border: `1px solid ${isSel ? m.color + "55" : tokens.borderSubtle}`,
                        background: isSel
                          ? `${m.color}12`
                          : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {isSel && (
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
                            fontSize: "clamp(10px,1.8vw,12px)",
                            fontWeight: 700,
                            color: isSel ? "#fff" : "#bbb",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {m.name}
                        </span>
                        {isLd && thinkingMap[m.id] && (
                          <span
                            style={{ fontSize: 10, color: "#60a5fa" }}
                            title="Thinking…"
                          >
                            🧠
                          </span>
                        )}
                        {isLd && !thinkingMap[m.id] && (
                          <Spin size={9} color={m.color} />
                        )}
                        {hasE && !isLd && (
                          <span style={{ fontSize: 10, color: tokens.danger }}>
                            ⚠
                          </span>
                        )}
                        {hasR && !isLd && !hasE && (
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
              <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
                {activeMember && (
                  <>
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
                          </span>{" "}
                          ·{" "}
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
                  width: "clamp(120px,22vw,200px)",
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
                  const isLd = !!loading[m.id] && stage === 2;
                  const isSel = activeMemberId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveMemberId(m.id)}
                      style={{
                        padding: "10px 11px",
                        borderRadius: 9,
                        border: `1px solid ${isSel ? m.color + "55" : tokens.borderSubtle}`,
                        background: isSel
                          ? `${m.color}12`
                          : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <span style={{ fontSize: 13, color: m.color }}>
                          {m.icon}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: isSel ? "#fff" : "#bbb",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {m.name}
                        </span>
                        {isLd && <Spin size={9} color={tokens.success} />}
                        {hasRev && !isLd && (
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
              <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
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
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#fff",
                          }}
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
                        Peer review begins after all first opinions are
                        collected.
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
              <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
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
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
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
                        style={skeletonLinePurple(`${w}%`, i * 0.18)}
                      />
                    ))}
                  </div>
                ) : stage < 3 ? (
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

        {/* ── Follow-up bar (shown when done) ── */}
        {isDone && verdict && (
          <div
            style={{
              borderTop: `1px solid ${tokens.borderSubtle}`,
              flexShrink: 0,
              background: "rgba(96,165,250,0.03)",
            }}
          >
            {!showFollowUp ? (
              <div style={{ padding: "10px 16px" }}>
                <button
                  onClick={() => setShowFollowUp(true)}
                  style={{
                    ...buttonStyles.dashed,
                    border: `1px dashed rgba(96,165,250,0.3)`,
                    background: "rgba(96,165,250,0.04)",
                    color: "#93c5fd",
                    fontSize: 12,
                  }}
                >
                  🔗 Ask a follow-up question — council keeps full context
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: "12px 16px",
                  animation: "slideDown 0.15s ease",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#60a5fa",
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  🔗 Follow-up — council will see the full previous verdict as
                  context
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                        submitFollowUp();
                    }}
                    placeholder="Ask a follow-up…"
                    style={{ ...formStyles.input, flex: 1 }}
                  />
                  <button
                    onClick={() => {
                      setShowFollowUp(false);
                      setFollowUpText("");
                    }}
                    style={{
                      ...buttonStyles.ghost,
                      padding: "9px 14px",
                      fontSize: 13,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitFollowUp}
                    disabled={!followUpText.trim()}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: followUpText.trim()
                        ? "linear-gradient(135deg,#60a5fa,#a78bfa)"
                        : "rgba(255,255,255,0.05)",
                      color: followUpText.trim() ? "#fff" : tokens.textFaint,
                      cursor: followUpText.trim() ? "pointer" : "not-allowed",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Reconvene →
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: tokens.textFaint,
                    marginTop: 6,
                  }}
                >
                  ⌘+Enter to submit
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DELIBERATION SCREEN  (abort/cancel + temperature + follow-up + webhook)
═══════════════════════════════════════════════════════════════ */
function DeliberationScreen({ initialMembers, initialChairmanId, onReset }) {
  const [liveMembers, setLiveMembers] = useState(initialMembers);
  const [liveChairId, setLiveChairId] = useState(initialChairmanId);
  const [sessionMembers, setSessionMembers] = useState([]);
  const [query, setQ] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [stage, setStage] = useState(0);
  const [responses, setResponses] = useState({});
  const [reviews, setReviews] = useState({});
  const [errors, setErrors] = useState({});
  const [verdict, setVerdict] = useState("");
  const [loading, setLoading] = useState({});
  const [chairLoad, setChairLoad] = useState(false);
  const [started, setStarted] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [showManage, setManage] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [thinkingMap, setThinkingMap] = useState({});
  const [followUpChain, setFollowUpChain] = useState([]);
  const [webhookStatus, setWebhookStatus] = useState(null);

  /* AbortController ref — new one per run */
  const abortRef = useRef(null);

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

  const doCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setCancelled(true);
    setChairLoad(false);
  };

  const runQuery = async (q, chain = [], snap = null, temp = temperature) => {
    const chairId = liveChairId;
    const chairMember = liveMembers.find((m) => m.id === chairId);
    if (!chairMember || !q.trim()) return;

    /* create fresh abort controller */
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const members =
      snap || liveMembers.map((m) => ({ ...m, isChairman: m.id === chairId }));
    setSessionMembers(members);
    setStarted(true);
    setCancelled(false);
    setResponses({});
    setReviews({});
    setErrors({});
    setVerdict("");
    setLoading({});
    setThinkingMap({});
    setChairLoad(false);
    setWebhookStatus(null);
    setStage(1);

    /* Build follow-up context prefix */
    let contextPrefix = "";
    if (chain.length > 0) {
      contextPrefix = `IMPORTANT CONTEXT — previous council deliberation rounds:\n\n`;
      chain.forEach((item, i) => {
        contextPrefix += `Round ${i + 1} query: "${item.query}"\nRound ${i + 1} verdict: ${item.verdict}\n\n`;
      });
      contextPrefix += `Now address this new follow-up question in light of the above:\n\n`;
    }

    /* Stage 1 — First opinions */
    const finalR = {};
    await Promise.all(
      members.map(async (m) => {
        setLoad(m.id, true);
        try {
          const t = await dispatchMember(
            m,
            m.systemPrompt,
            contextPrefix + q,
            (rawT) => {
              const cleaned = stripThinking(rawT);
              finalR[m.id] = cleaned;
              setResp(m.id, cleaned);
              setThinkingMap((p) => ({ ...p, [m.id]: isThinking(rawT) }));
            },
            signal,
            temp,
          );
          finalR[m.id] = stripThinking(t);
          setThinkingMap((p) => ({ ...p, [m.id]: false }));
        } catch (e) {
          if (e.name !== "AbortError") setErr(m.id, e.message);
        } finally {
          setLoad(m.id, false);
        }
      }),
    );

    if (signal.aborted) {
      setCancelled(true);
      setStage(3);
      return;
    }
    setStage(2);

    /* Stage 2 — Peer review */
    const letters = ["A", "B", "C", "D", "E", "F", "G"];
    const finalRevw = {};
    await Promise.all(
      members.map(async (reviewer) => {
        setLoad(reviewer.id, true);
        const others = members.filter((m) => m.id !== reviewer.id);
        let rp = `The council is deliberating: "${q}"\n\nYour initial response was submitted. Now evaluate these anonymized responses:\n\n`;
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
            signal,
            temp,
          );
          finalRevw[reviewer.id] = stripThinking(t);
        } catch {
        } finally {
          setLoad(reviewer.id, false);
        }
      }),
    );

    if (signal.aborted) {
      setCancelled(true);
      setStage(3);
      return;
    }
    setStage(3);
    setChairLoad(true);

    /* Stage 3 — Chairman synthesis */
    let sp = `The council has deliberated on: "${q}"\n\n`;
    if (contextPrefix) sp += contextPrefix;
    sp += `=== MEMBER RESPONSES ===\n\n`;
    members.forEach((m) => {
      sp += `**${m.name}** (${m.personaLabel} · ${PROVIDERS[m.provider].name}/${m.model}):\n${finalR[m.id] || "(failed)"}\n\n`;
    });
    sp += `=== PEER REVIEWS ===\n\n`;
    members.forEach((m) => {
      sp += `**${m.name}:**\n${finalRevw[m.id] || "(unavailable)"}\n\n`;
    });

    let finalVerdict = "";
    try {
      finalVerdict = await dispatchMember(
        chairMember,
        CHAIRMAN_SYNTHESIS,
        sp,
        (rawT) => setVerdict(stripThinking(rawT)),
        signal,
        temp,
      );
      finalVerdict = stripThinking(finalVerdict);
    } catch (e) {
      if (e.name !== "AbortError") {
        finalVerdict = `Chairman synthesis failed: ${e.message}`;
        setVerdict(finalVerdict);
      }
    } finally {
      setChairLoad(false);
    }

    if (signal.aborted) {
      setCancelled(true);
      return;
    }

    /* Persist session */
    const newChain = [...chain, { query: q, verdict: finalVerdict }];
    setFollowUpChain(newChain);

    const sess = {
      id: sid(),
      ts: Date.now(),
      query: q,
      temperature: temp,
      memberIds: members.map((m) => m.id),
      memberNames: members.map((m) => m.name),
      responses: { ...finalR },
      reviews: { ...finalRevw },
      verdict: finalVerdict,
      followUpChain: chain /* prior rounds */,
    };
    const nextSessions = [...sessions, sess];
    setSessions(nextSessions);
    persistSessions(nextSessions);

    /* Fire webhook */
    const webhookUrl = await loadWebhookUrl();
    if (webhookUrl) {
      const r = await fireWebhook(webhookUrl, {
        type: "session_complete",
        ts: sess.ts,
        query: q,
        temperature: temp,
        memberNames: members.map((m) => m.name),
        responses: finalR,
        reviews: finalRevw,
        verdict: finalVerdict,
      });
      setWebhookStatus(r);
    }
  };

  const run = () => runQuery(query, [], null, temperature);

  const handleFollowUp = async (followUpQ) => {
    const prevVerdict = verdict;
    setQ(followUpQ);
    await runQuery(
      followUpQ,
      [...followUpChain, { query, verdict: prevVerdict }],
      sessionMembers,
      temperature,
    );
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
    setCancelled(false);
    setFollowUpChain([]);
    setWebhookStatus(null);
  };

  const restoreSession = (sess) => {
    const synthetic = (sess.memberIds || []).map((id, i) => ({
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
    setSessionMembers(synthetic);
    setQ(sess.query);
    setResponses(sess.responses || {});
    setReviews(sess.reviews || {});
    setErrors({});
    setVerdict(sess.verdict || "");
    setLoading({});
    setChairLoad(false);
    setStage(4);
    setStarted(true);
    setCancelled(false);
    if (sess.temperature !== undefined) setTemperature(sess.temperature);
  };

  const isRunning = Object.values(loading).some(Boolean) || chairLoad;
  const currentSession = {
    id: "live",
    ts: Date.now(),
    query,
    temperature,
    memberIds: sessionMembers.map((m) => m.id),
    memberNames: sessionMembers.map((m) => m.name),
    responses,
    reviews,
    verdict,
    followUpChain,
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
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

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
          {/* Cancel button — only when running */}
          {isRunning && !cancelled && (
            <button
              onClick={doCancel}
              style={{
                padding: "5px 11px",
                borderRadius: 6,
                border: `1px solid rgba(248,113,113,0.4)`,
                background: "rgba(248,113,113,0.1)",
                color: "#fca5a5",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Spin size={9} color="#fca5a5" /> ⬛ Cancel
            </button>
          )}
          {webhookStatus && !isRunning && (
            <span
              style={{
                fontSize: 11,
                color: webhookStatus.ok ? tokens.success : "#fca5a5",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {webhookStatus.ok ? "🔗 Webhook sent" : "🔗 Webhook failed"}
            </span>
          )}
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
            📋{sessions.length > 0 ? ` (${sessions.length})` : ""}
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
            onClick={() => setShowSettings(true)}
            style={{ ...buttonStyles.iconSquare, color: tokens.textMuted }}
            title="Settings"
          >
            ⚙︎
          </button>
          <button
            onClick={onReset}
            style={{ ...buttonStyles.ghost, padding: "5px 11px", fontSize: 12 }}
          >
            ← Rebuild
          </button>
        </div>
      </div>

      {/* Pre-run query input */}
      {!started && (
        <div
          style={{
            maxWidth: 660,
            margin: "0 auto",
            padding: "clamp(20px,5vw,48px) clamp(16px,4vw,24px)",
            animation: "fadeIn 0.4s ease",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1
              style={{
                fontSize: "clamp(24px,5vw,34px)",
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
              <p style={{ color: tokens.textMuted, fontSize: 13 }}>
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
              marginBottom: 10,
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
                padding: "11px 16px",
                borderTop: `1px solid ${tokens.borderSubtle}`,
              }}
            >
              <TemperatureSlider
                value={temperature}
                onChange={setTemperature}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 16px",
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
          cancelled={cancelled}
          currentSession={currentSession}
          onFollowUp={handleFollowUp}
          temperature={temperature}
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
