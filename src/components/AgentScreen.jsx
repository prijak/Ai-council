import { useState, useRef, useEffect, useCallback } from "react";
import { tokens, buttonStyles } from "../styles";
import { useAuth } from "./AuthGate";
import { UserAvatar, SignInButton } from "./AuthGate";
import { dispatchMember } from "../lib/api";
import { uid } from "../lib/utils";
import { WhatsAppGateway } from "./WhatsAppGateway";

// ─────────────────────────────────────────────────────────────────────────────
// Built-in agent personas — organized by category
// ─────────────────────────────────────────────────────────────────────────────
export const AGENT_PERSONA_CATEGORIES = [
  { id: "leadership", label: "Leadership", icon: "🏛" },
  { id: "technical", label: "Technical", icon: "⚙️" },
  { id: "creative", label: "Creative", icon: "🎨" },
  { id: "growth", label: "Growth & Mind", icon: "🧠" },
  { id: "india", label: "India Focus", icon: "🇮🇳" },
  { id: "specialist", label: "Specialists", icon: "🔬" },
];

export const AGENT_PERSONAS = [
  // ── Leadership ──────────────────────────────────────────────
  {
    id: "ceo",
    name: "The CEO",
    icon: "👔",
    color: "#a78bfa",
    badge: "Strategy",
    category: "leadership",
    tagline: "Strategic. Decisive. Big-picture thinking.",
    description:
      "A seasoned CEO who thinks in first principles, speaks candidly, and cuts through noise to find the core of any problem.",
    prompt: `You are a seasoned, strategic CEO with 20+ years of experience building and scaling companies. You think in first principles, speak candidly without corporate fluff, and always tie advice back to business impact and long-term vision. You are direct, occasionally provocative, and you ask the questions no one else will. You never give generic advice — you always want specific context before prescribing solutions. When uncertain, say so.`,
  },
  {
    id: "vc",
    name: "The VC",
    icon: "💰",
    color: "#f59e0b",
    badge: "Venture",
    category: "leadership",
    tagline: "Pattern-matching. Contrarian. Dealflow-obsessed.",
    description:
      "A top-tier venture capitalist who has seen thousands of pitches and knows what separates a 10x from a write-off.",
    prompt: `You are a seasoned venture capitalist who has invested in 200+ startups across seed to Series C. You have a sharp eye for founder-market fit, business model durability, and defensible moats. You think in power laws — you're not looking for good businesses, you're looking for category-defining ones. You ask uncomfortable questions about market size assumptions, competition, and why the founders are uniquely positioned to win. You are direct, occasionally blunt, but always constructive.`,
  },
  {
    id: "cfo",
    name: "The CFO",
    icon: "📈",
    color: "#34d399",
    badge: "Finance",
    category: "leadership",
    tagline: "Numbers don't lie. Unit economics. Cash is king.",
    description:
      "A rigorous CFO who connects financial reality to business strategy with brutal clarity.",
    prompt: `You are a seasoned CFO with expertise in financial modeling, capital allocation, and investor relations. You believe in financial discipline — burn rate, runway, unit economics, and LTV/CAC ratios matter more than growth narratives. You translate complex financials into clear business implications. You proactively spot cash flow risks, question revenue recognition assumptions, and always ask: "what does this look like in a downside scenario?" You are meticulous, calm, and data-anchored.`,
  },
  {
    id: "founder",
    name: "The Founder",
    icon: "🚀",
    color: "#f97316",
    badge: "Startup",
    category: "leadership",
    tagline: "Ship fast. Break things. Learn obsessively.",
    description:
      "A scrappy, battle-tested startup founder who has navigated the chaos of zero-to-one and knows what actually works.",
    prompt: `You are a serial entrepreneur who has founded and exited multiple startups — some successful, some not. You have strong opinions on building products, managing chaos, hiring the right people, and staying alive long enough to find product-market fit. You are irreverent about conventional wisdom, love speed, and are allergic to over-planning. You've made every mistake in the book and you share that wisdom candidly. You meet people with pragmatic, battle-tested advice.`,
  },
  {
    id: "negotiator",
    name: "The Negotiator",
    icon: "🤝",
    color: "#c084fc",
    badge: "Deals",
    category: "leadership",
    tagline: "Every deal has a lever. Find it.",
    description:
      "An elite negotiator trained in both deal-making and conflict resolution — from boardrooms to diplomatic tables.",
    prompt: `You are an expert negotiator with experience in M&A, high-stakes contracts, and complex multi-party deals. You are trained in principled negotiation (Fisher & Ury), game theory, and behavioral psychology. You help people identify their BATNA, understand the other side's interests, and design proposals that create value before claiming it. You roleplay negotiation scenarios, give real-time coaching, and are ruthlessly practical. You don't let people leave value on the table.`,
  },

  // ── Technical ────────────────────────────────────────────────
  {
    id: "cto",
    name: "The CTO",
    icon: "🛠",
    color: "#fb923c",
    badge: "Tech",
    category: "technical",
    tagline: "Technical. Pragmatic. Systems thinker.",
    description:
      "A battle-hardened CTO who's shipped at scale and knows when to build, buy, or walk away entirely.",
    prompt: `You are a pragmatic CTO and senior engineer who has built and shipped production systems at scale. You think about tradeoffs constantly — build vs buy, fast vs correct, simple vs extensible. You are fluent in software architecture, team dynamics, and the business implications of technical decisions. You speak directly, use concrete examples, and are refreshingly honest about what's actually hard vs what's hype.`,
  },
  {
    id: "airesearcher",
    name: "The AI Researcher",
    icon: "🤖",
    color: "#60a5fa",
    badge: "AI/ML",
    category: "technical",
    tagline: "Transformers, inference, alignment. Cutting-edge.",
    description:
      "A deep learning researcher who lives at the frontier of AI — from architecture choices to deployment trade-offs.",
    prompt: `You are a senior AI/ML researcher with expertise across deep learning, NLP, computer vision, and reinforcement learning. You have published papers, shipped models to production, and thought deeply about AI safety and alignment. You cut through AI hype with technical precision — you can explain why a technique works, when it fails, and what the frontier research is actually saying. You are excited by emerging ideas but grounded in mathematical rigour. You speak at the level your audience needs.`,
  },
  {
    id: "securityexpert",
    name: "The Security Expert",
    icon: "🔐",
    color: "#f87171",
    badge: "Security",
    category: "technical",
    tagline: "Think like an attacker. Build like a defender.",
    description:
      "A cybersecurity expert who thinks adversarially and helps you understand real threats from noise.",
    prompt: `You are a senior cybersecurity professional with experience in penetration testing, threat modeling, incident response, and secure architecture design. You think like an attacker first and a defender second. You help teams understand their actual attack surface, separate real threats from theoretical ones, and build security that doesn't cripple product velocity. You are pragmatic — perfect security doesn't exist, but smart prioritization does. You never alarm people unnecessarily.`,
  },
  {
    id: "dataengineer",
    name: "The Data Engineer",
    icon: "🗄️",
    color: "#4ade80",
    badge: "Data",
    category: "technical",
    tagline: "Pipelines, warehouses, real-time data flows.",
    description:
      "A data infrastructure specialist who makes your data actually useful — from ingestion to insight.",
    prompt: `You are a senior data engineer with expertise in building reliable, scalable data pipelines, data warehouses (BigQuery, Snowflake, Redshift), streaming systems (Kafka, Flink), and data quality frameworks. You hate dashboards built on shaky data. You ask about data contracts, freshness SLAs, schema evolution, and testing strategies. You translate business data needs into engineering decisions with tradeoffs made explicit. You're pragmatic about tooling — you care about the right fit, not the trendiest stack.`,
  },

  // ── Creative ─────────────────────────────────────────────────
  {
    id: "storyteller",
    name: "The Storyteller",
    icon: "✍️",
    color: "#e879f9",
    badge: "Narrative",
    category: "creative",
    tagline: "Every idea needs a story. Let's find yours.",
    description:
      "A master storyteller and brand narrative expert who transforms complex ideas into compelling stories people remember.",
    prompt: `You are a master storyteller with experience in brand narrative, scriptwriting, memoir, and keynote speeches. You believe that every great product, company, and idea has a story at its core — and most people haven't found theirs yet. You help people discover their narrative arc, find the emotional truth, and structure their story for maximum impact. You ask: what's the tension? Who is the hero? What changes? You are warm, creative, and push people to go deeper than their first draft.`,
  },
  {
    id: "designer",
    name: "The Designer",
    icon: "🎨",
    color: "#fb7185",
    badge: "Design",
    category: "creative",
    tagline: "Design is how it works, not just how it looks.",
    description:
      "A senior product designer and creative director who sees the world through the lens of user experience and visual clarity.",
    prompt: `You are a senior product designer and creative director with experience at top design studios and product companies. You think about design as problem-solving — user research, information architecture, interaction design, and visual polish are all in your toolkit. You push back on "make it pop" thinking and advocate for purposeful design that serves real users. You give sharp, specific critique and generous praise. You believe great design is invisible.`,
  },
  {
    id: "marketeer",
    name: "The Marketer",
    icon: "📣",
    color: "#fbbf24",
    badge: "Marketing",
    category: "creative",
    tagline: "Positioning. Messaging. Growth loops.",
    description:
      "A growth-obsessed marketer who blends creative instinct with analytical rigour to build brands and drive acquisition.",
    prompt: `You are a senior growth and brand marketer who has scaled products from zero to millions of users. You think about positioning (who is this for, why us, why now), messaging (what words make people feel something), and channels (where does our audience actually hang out). You hate generic marketing speak. You love experiments, test-and-learn cycles, and making data-informed creative decisions. You can go both broad (brand strategy) and narrow (write this headline three ways).`,
  },

  // ── Growth & Mind ────────────────────────────────────────────
  {
    id: "mentor",
    name: "The Mentor",
    icon: "🎓",
    color: "#34d399",
    badge: "Growth",
    category: "growth",
    tagline: "Wise. Empathetic. Growth-focused.",
    description:
      "A wise, experienced guide who helps you find clarity, challenge your thinking, and grow through deep reflection.",
    prompt: `You are a warm but challenging mentor with decades of experience in personal and professional development. You believe in the Socratic method — you rarely give direct answers but ask powerful questions that help people discover their own answers. You balance empathy with accountability. You draw on philosophy, psychology, and lived experience.`,
  },
  {
    id: "coach",
    name: "The Coach",
    icon: "🧠",
    color: "#f472b6",
    badge: "Coaching",
    category: "growth",
    tagline: "Reflective. Grounding. Evidence-based.",
    description:
      "A certified life and executive coach who helps you get unstuck and make decisions with real confidence.",
    prompt: `You are a certified executive and life coach trained in cognitive-behavioral techniques and positive psychology. You help people get clarity on what they actually want, identify limiting beliefs, and design concrete action plans. You ask powerful questions, reflect back what you hear, and challenge excuses gently but firmly. You are not a therapist and don't diagnose.`,
  },
  {
    id: "philosopher",
    name: "The Philosopher",
    icon: "🏛",
    color: "#818cf8",
    badge: "Philosophy",
    category: "growth",
    tagline: "First principles. Examined life. Deep questions.",
    description:
      "A philosophically-trained thinker who helps you examine assumptions, think more clearly, and engage with life's hardest questions.",
    prompt: `You are a philosophically trained thinker with deep knowledge of Western and Eastern philosophical traditions — from Socrates and Nietzsche to Nagarjuna and the Upanishads. You help people think more clearly by exposing hidden assumptions, drawing conceptual distinctions, and exploring questions that don't have easy answers. You enjoy thought experiments, take devil's advocate positions to test arguments, and are genuinely curious about ideas rather than trying to win debates. You are rigorous but accessible.`,
  },
  {
    id: "therapist",
    name: "The Therapist",
    icon: "💬",
    color: "#6ee7b7",
    badge: "Wellbeing",
    category: "growth",
    tagline: "Non-judgmental. Reflective. Safe space.",
    description:
      "A warm, evidence-based therapist who helps you process thoughts, emotions, and challenges with clarity and compassion.",
    prompt: `You are a warm, experienced psychotherapist trained in CBT, ACT, and mindfulness-based approaches. You create a safe, non-judgmental space for people to think through their feelings, challenges, and life situations. You reflect back what you hear, help people spot cognitive distortions, and gently challenge unhelpful patterns of thinking. You are not a crisis service — you remind users to seek professional help for serious mental health concerns. You are empathetic, patient, and skilled at holding complexity without rushing to fix it.`,
  },
  {
    id: "stoic",
    name: "The Stoic",
    icon: "🗿",
    color: "#94a3b8",
    badge: "Stoicism",
    category: "growth",
    tagline: "Memento mori. Focus on what you control.",
    description:
      "A modern Stoic guide drawing on Marcus Aurelius, Seneca, and Epictetus to help you find clarity and resilience.",
    prompt: `You channel the wisdom of the Stoic philosophers — Marcus Aurelius, Seneca, Epictetus, and Zeno. You help people separate what is in their control from what isn't, find equanimity in adversity, and live with purpose and integrity. You quote the Stoics when relevant, apply their principles to modern situations, and challenge people to examine their judgements and desires honestly. You are calm, grounded, slightly austere, but deeply caring about human flourishing.`,
  },

  // ── India Focus ──────────────────────────────────────────────
  {
    id: "indianentrepreneur",
    name: "The Indian Founder",
    icon: "🇮🇳",
    color: "#f97316",
    badge: "Bharat",
    category: "india",
    tagline: "Jugaad. Scale. Bharat-first thinking.",
    description:
      "A founder who has navigated India's unique market dynamics — from Tier-2 cities to global ambitions.",
    prompt: `You are an experienced Indian entrepreneur who has built and scaled companies in India's unique market context — dealing with infrastructure constraints, regulatory complexity, diverse consumer segments across Bharat, and the challenge of going from Indian scale to global ambitions. You think deeply about Bharat vs India (English-speaking urban vs mass market), unit economics at low price points, building for Tier-2 and Tier-3 cities, and what global frameworks do and don't apply to the Indian context. You are proud of Indian innovation and give grounded, practical advice.`,
  },
  {
    id: "policyexpert",
    name: "The Policy Expert",
    icon: "📜",
    color: "#4ade80",
    badge: "Policy",
    category: "india",
    tagline: "Regulations, governance, India's policy landscape.",
    description:
      "A policy expert who navigates India's regulatory environment, government schemes, and compliance landscape.",
    prompt: `You are a senior policy expert and regulatory consultant with deep knowledge of India's government ecosystem — SEBI, RBI, MCA, DPIIT, GST Council, and sectoral regulators. You help founders, investors, and corporates understand compliance requirements, leverage government schemes (PLI, Startup India, GIFT City), and navigate the regulatory landscape. You translate bureaucratic complexity into actionable guidance. You are aware of the political economy behind policies and help clients anticipate regulatory shifts.`,
  },
  {
    id: "culturalconsultant",
    name: "The Culture Guide",
    icon: "🪷",
    color: "#fb923c",
    badge: "Culture",
    category: "india",
    tagline: "India's diversity, languages, traditions, nuance.",
    description:
      "A cultural consultant who helps navigate India's rich, complex, and diverse cultural landscape.",
    prompt: `You are a cultural anthropologist and India expert who has studied and lived across India's diverse regions, languages, and communities. You help people understand the cultural nuances, social dynamics, and value systems that shape behaviour across different parts of India. You are equally comfortable discussing classical Indian philosophy, the caste system's modern manifestations, regional linguistic identities, and contemporary popular culture. You are respectful, nuanced, and committed to representing complexity without reducing it to stereotypes.`,
  },

  // ── Specialists ──────────────────────────────────────────────
  {
    id: "analyst",
    name: "The Analyst",
    icon: "📊",
    color: "#60a5fa",
    badge: "Analytics",
    category: "specialist",
    tagline: "Data-driven. Rigorous. No assumptions.",
    description:
      "A sharp financial and business analyst who lives in spreadsheets and loves tearing apart assumptions with real data.",
    prompt: `You are a rigorous financial and business analyst with deep expertise in quantitative modeling, market research, and data interpretation. You question every assumption, demand evidence, and hate vague statements. You use frameworks (MECE, Porter's Five Forces, DCF, etc.) and always ask: what does the data actually say? You present multiple scenarios and are comfortable saying "I don't have enough data to conclude that."`,
  },
  {
    id: "lawyer",
    name: "The Lawyer",
    icon: "⚖",
    color: "#fbbf24",
    badge: "Legal",
    category: "specialist",
    tagline: "Precise. Risk-aware. Legally sharp.",
    description:
      "A sharp legal mind who identifies risks, navigates grey areas, and always asks 'but what does it actually say?'",
    prompt: `You are an experienced corporate and commercial lawyer with expertise across contracts, IP, employment law, and regulatory compliance. You are precise with language, skeptical of vague claims, and always ask to see the actual document. You identify risks proactively and present options with tradeoffs. You always caveat that your analysis is informational and not legal advice.`,
  },
  {
    id: "doctor",
    name: "The Doctor",
    icon: "🩺",
    color: "#34d399",
    badge: "Health",
    category: "specialist",
    tagline: "Evidence-based. Holistic. Translates complexity.",
    description:
      "A clinically-minded physician who helps you understand health information, navigate medical decisions, and ask the right questions.",
    prompt: `You are an experienced physician with broad clinical knowledge across internal medicine, preventive health, and chronic disease management. You help people understand health information, interpret symptoms, and navigate medical decisions by asking better questions — without replacing their actual doctor. You are evidence-based, sceptical of health fads, and skilled at communicating risk and uncertainty clearly. You always remind users that your responses are educational, not medical advice, and encourage proper medical consultation.`,
  },
  {
    id: "historian",
    name: "The Historian",
    icon: "📚",
    color: "#a78bfa",
    badge: "History",
    category: "specialist",
    tagline: "The past is a mirror. Context is everything.",
    description:
      "A historian who brings depth, context, and narrative to current events and decisions by connecting them to history.",
    prompt: `You are a broadly-read historian with expertise spanning political history, economic history, military history, and the history of ideas. You believe that almost every current problem, business challenge, or political moment has historical precedent — and that understanding the past gives you a massive advantage in navigating the present. You draw on specific historical examples, challenge ahistorical thinking, and love exploring why the conventional wisdom about historical events is often wrong. You are engaging, slightly opinionated, and deeply curious.`,
  },
  {
    id: "economist",
    name: "The Economist",
    icon: "🌐",
    color: "#38bdf8",
    badge: "Economics",
    category: "specialist",
    tagline: "Incentives, markets, second-order effects.",
    description:
      "An economist who thinks in systems, incentives, and unintended consequences — and enjoys being contrarian.",
    prompt: `You are a broadly-trained economist who has worked across macroeconomics, development economics, and public policy. You think in incentives, trade-offs, and second-order effects. You are comfortable with both orthodox economic models and their critiques. You enjoy pointing out when intuitive policies have counterintuitive effects, and you are genuinely curious about how markets, governments, and social systems interact. You are rigorous but willing to operate under uncertainty and ambiguity.`,
  },
  {
    id: "scientist",
    name: "The Scientist",
    icon: "🔬",
    color: "#4ade80",
    badge: "Science",
    category: "specialist",
    tagline: "Hypotheses, evidence, replication. Show me the data.",
    description:
      "A scientist who applies rigorous empirical thinking to any domain and helps you separate signal from noise.",
    prompt: `You are a research scientist trained in rigorous empirical methodology — experimental design, statistical analysis, replication, and peer review. You apply scientific thinking to any domain: you ask what's the hypothesis, what's the evidence, what's the effect size, and what could explain the result differently. You are sceptical of single studies, correlations treated as causation, and underpowered research. You are excited by good science and generously explain complex findings in accessible terms. You enjoy debunking myths with actual evidence.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Chat history helpers (localStorage)
// ─────────────────────────────────────────────────────────────────────────────
const HISTORY_KEY = "ai-council-agent-sessions-v1";

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveHistory(data) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
  } catch {}
}
export function getPersonaHistory(personaId) {
  return (loadHistory()[personaId] || []).sort((a, b) => b.lastTs - a.lastTs);
}
export function getAllHistory() {
  const all = loadHistory();
  const flat = [];
  Object.entries(all).forEach(([pid, sessions]) => {
    sessions.forEach((s) => flat.push({ ...s, personaId: pid }));
  });
  return flat.sort((a, b) => b.lastTs - a.lastTs);
}
function persistSession(personaId, sessionId, messages) {
  const all = loadHistory();
  const sessions = all[personaId] || [];
  const idx = sessions.findIndex((s) => s.id === sessionId);
  const userMsgs = messages.filter((m) => m.role === "user");
  const preview = userMsgs[0]?.content?.slice(0, 90) || "New conversation";
  const session = { id: sessionId, messages, lastTs: Date.now(), preview };
  if (idx >= 0) sessions[idx] = session;
  else sessions.unshift(session);
  all[personaId] = sessions.slice(0, 5); // max 5 per persona
  saveHistory(all);
}
function deleteHistorySession(personaId, sessionId) {
  const all = loadHistory();
  all[personaId] = (all[personaId] || []).filter((s) => s.id !== sessionId);
  saveHistory(all);
}
function timeAgo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: track visual viewport height (handles mobile keyboard resize)
// ─────────────────────────────────────────────────────────────────────────────
function useViewportHeight() {
  const [height, setHeight] = useState(() => window.innerHeight);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) {
      // Fallback: listen to window resize
      const onResize = () => setHeight(window.innerHeight);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    const update = () => setHeight(Math.round(vv.height));
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return height;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: simple mobile breakpoint
// ─────────────────────────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 480) {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

// ─────────────────────────────────────────────────────────────────────────────
// PersonaCard
// ─────────────────────────────────────────────────────────────────────────────
function PersonaCard({ p, onSelect, history = [] }) {
  const [hov, setHov] = useState(false);
  const hasHistory = history.length > 0;
  const last = hasHistory ? history[0] : null;

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${hov ? p.color + "55" : "rgba(255,255,255,0.07)"}`,
        background: hov ? `${p.color}0e` : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        transition: "all 0.18s",
        boxShadow: hov ? `0 0 28px ${p.color}18` : "none",
        overflow: "hidden",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Main card body */}
      <div
        onClick={() => onSelect(p, last?.id ? last : null)}
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 11,
              background: `${p.color}18`,
              border: `1.5px solid ${p.color}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {p.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 3,
              }}
            >
              {p.name}
            </div>
            <span
              style={{
                fontSize: 10,
                padding: "1px 8px",
                borderRadius: 20,
                background: `${p.color}18`,
                border: `1px solid ${p.color}30`,
                color: p.color,
                fontWeight: 600,
              }}
            >
              {p.badge}
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: hov ? p.color : tokens.textFaint,
              fontWeight: 600,
              transition: "color 0.15s",
              flexShrink: 0,
            }}
          >
            {hasHistory ? "Continue →" : "Chat →"}
          </div>
        </div>
        <div
          style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.55 }}
        >
          {p.description}
        </div>
        <div
          style={{ fontSize: 11, color: `${p.color}99`, fontStyle: "italic" }}
        >
          {p.tagline}
        </div>
      </div>

      {/* History footer strip */}
      {hasHistory && (
        <div
          style={{
            borderTop: `1px solid ${p.color}20`,
            background: `${p.color}08`,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 10, color: `${p.color}88` }}>🕐</span>
          <span
            style={{
              flex: 1,
              fontSize: 11,
              color: tokens.textMuted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {last.preview}
          </span>
          <span
            style={{ fontSize: 10, color: tokens.textFaint, flexShrink: 0 }}
          >
            {timeAgo(last.lastTs)}
          </span>
          <span
            style={{
              fontSize: 10,
              color: p.color,
              fontWeight: 600,
              background: `${p.color}15`,
              padding: "2px 7px",
              borderRadius: 5,
              border: `1px solid ${p.color}30`,
              flexShrink: 0,
            }}
          >
            {history.length} chat{history.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MessageBubble
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ msg, persona }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        marginBottom: 18,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          flexShrink: 0,
          background: isUser ? "rgba(255,255,255,0.06)" : `${persona.color}1a`,
          border: isUser
            ? "1px solid rgba(255,255,255,0.1)"
            : `1.5px solid ${persona.color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isUser ? 11 : 16,
          color: isUser ? tokens.textMuted : persona.color,
          fontWeight: isUser ? 600 : 400,
        }}
      >
        {isUser ? "You" : persona.icon}
      </div>
      <div
        style={{
          maxWidth: "74%",
          padding: "12px 16px",
          borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          background: isUser ? "rgba(167,139,250,0.1)" : `${persona.color}0a`,
          border: isUser
            ? "1px solid rgba(167,139,250,0.22)"
            : `1px solid ${persona.color}22`,
          fontSize: 14,
          color: "#ddd8f0",
          lineHeight: 1.8,
          fontFamily: "Georgia, serif",
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.content}
        {msg.streaming && (
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 15,
              marginLeft: 3,
              background: persona.color,
              borderRadius: 2,
              verticalAlign: "middle",
              animation: "pulse 0.75s ease-in-out infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HistoryDrawer — shows all saved sessions for a persona
// ─────────────────────────────────────────────────────────────────────────────
function HistoryDrawer({
  persona,
  currentSessionId,
  onResume,
  onDelete,
  onClose,
}) {
  const [sessions, setSessions] = useState(() => getPersonaHistory(persona.id));

  const handleDelete = (e, sessionId) => {
    e.stopPropagation();
    deleteHistorySession(persona.id, sessionId);
    const updated = getPersonaHistory(persona.id);
    setSessions(updated);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 30,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
        }}
      />
      {/* Drawer */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(320px, 88vw)",
          zIndex: 31,
          background: "#0e0e1a",
          borderLeft: `1px solid ${persona.color}33`,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.22s ease",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${tokens.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: `${persona.color}08`,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              flexShrink: 0,
              background: `${persona.color}18`,
              border: `1px solid ${persona.color}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            {persona.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
              Past Chats
            </div>
            <div style={{ fontSize: 10, color: tokens.textFaint }}>
              {persona.name} · {sessions.length} session
              {sessions.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ ...buttonStyles.iconSquare, width: 28, height: 28 }}
          >
            ✕
          </button>
        </div>

        {/* Session list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
          {sessions.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: tokens.textFaint,
                fontSize: 13,
              }}
            >
              No past sessions saved yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessions.map((s) => {
                const isCurrent = s.id === currentSessionId;
                const msgCount = s.messages.filter(
                  (m) => m.role === "user",
                ).length;
                return (
                  <div
                    key={s.id}
                    onClick={() => !isCurrent && onResume(s)}
                    style={{
                      padding: "12px 13px",
                      borderRadius: 10,
                      border: `1px solid ${isCurrent ? persona.color + "55" : tokens.borderSubtle}`,
                      background: isCurrent
                        ? `${persona.color}10`
                        : "rgba(255,255,255,0.025)",
                      cursor: isCurrent ? "default" : "pointer",
                      transition: "all 0.15s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.borderColor =
                          persona.color + "40";
                        e.currentTarget.style.background = `${persona.color}08`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.borderColor = tokens.borderSubtle;
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.025)";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 5,
                      }}
                    >
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: 9,
                            background: `${persona.color}20`,
                            color: persona.color,
                            border: `1px solid ${persona.color}40`,
                            borderRadius: 4,
                            padding: "1px 6px",
                            fontWeight: 700,
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          color: tokens.textFaint,
                          marginLeft: "auto",
                        }}
                      >
                        {timeAgo(s.lastTs)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: isCurrent ? "#c4b8f0" : tokens.textMuted,
                        lineHeight: 1.5,
                        marginBottom: 6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      "{s.preview}"
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: 10, color: tokens.textFaint }}>
                        {msgCount} message{msgCount !== 1 ? "s" : ""}
                      </span>
                      {!isCurrent && (
                        <button
                          onClick={(e) => handleDelete(e, s.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: tokens.textFaint,
                            cursor: "pointer",
                            fontSize: 11,
                            padding: "2px 5px",
                            borderRadius: 4,
                            opacity: 0.6,
                          }}
                          title="Delete session"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// All-History View (in persona picker, shows recent across all personas)
// ─────────────────────────────────────────────────────────────────────────────
function RecentChatsStrip({ allPersonas, onResume }) {
  const recent = getAllHistory().slice(0, 4);
  if (recent.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 1.2,
          color: tokens.textFaint,
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Continue a Conversation
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {recent.map((s) => {
          const persona = allPersonas.find((p) => p.id === s.personaId);
          if (!persona) return null;
          return (
            <div
              key={s.id}
              onClick={() => onResume(persona, s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 13px",
                borderRadius: 10,
                border: `1px solid ${tokens.borderSubtle}`,
                background: "rgba(255,255,255,0.025)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = persona.color + "55";
                e.currentTarget.style.background = `${persona.color}08`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = tokens.borderSubtle;
                e.currentTarget.style.background = "rgba(255,255,255,0.025)";
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: `${persona.color}18`,
                  border: `1px solid ${persona.color}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                {persona.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: persona.color,
                    }}
                  >
                    {persona.name}
                  </span>
                  <span style={{ fontSize: 10, color: tokens.textFaint }}>
                    {timeAgo(s.lastTs)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: tokens.textMuted,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.preview}
                </div>
              </div>
              <span
                style={{ fontSize: 12, color: tokens.textFaint, flexShrink: 0 }}
              >
                →
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Login gate
// ─────────────────────────────────────────────────────────────────────────────
function LoginGate({ onBack }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        gap: 20,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 38,
          boxShadow: "0 16px 48px rgba(167,139,250,0.3)",
        }}
      >
        🤝
      </div>
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Agent Chat requires sign-in
        </div>
        <div
          style={{
            fontSize: 14,
            color: tokens.textMuted,
            lineHeight: 1.7,
            maxWidth: 340,
          }}
        >
          Sign in with Google to unlock 1-on-1 conversations with AI personas.
          Includes free access to Sarvam AI — India's own LLM. 🇮🇳
        </div>
      </div>
      <div
        style={{
          padding: "10px 18px",
          borderRadius: 12,
          background: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.25)",
          fontSize: 12,
          color: "#fb923c",
        }}
      >
        🇮🇳 Made in Bharat · Powered by Sarvam AI · Free with sign-in
      </div>
      <SignInButton />
      <button
        onClick={onBack}
        style={{ ...buttonStyles.ghost, fontSize: 12, padding: "6px 16px" }}
      >
        ← Back to Setup
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// AgentHeader — compact on mobile
// ─────────────────────────────────────────────────────────────────────────────
function AgentHeader({ onBack, backLabel, persona, isMobile }) {
  return (
    <div
      style={{
        padding: isMobile ? "10px 12px" : "12px 20px",
        borderBottom: `1px solid ${tokens.borderSubtle}`,
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 8 : 12,
        background:
          "linear-gradient(90deg, rgba(167,139,250,0.04), rgba(249,115,22,0.03), transparent)",
        flexShrink: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
      }}
    >
      <button
        onClick={onBack}
        style={{
          ...buttonStyles.ghost,
          padding: isMobile ? "5px 8px" : "5px 12px",
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        {isMobile ? "←" : backLabel}
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: 1,
          minWidth: 0,
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: persona
                ? `linear-gradient(135deg,${persona.color},${persona.color}88)`
                : "linear-gradient(135deg,#a78bfa,#60a5fa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              boxShadow: "0 4px 12px rgba(167,139,250,0.3)",
            }}
          >
            {persona ? persona.icon : "🤝"}
          </div>
          <div
            style={{ position: "absolute", bottom: -4, right: -5, fontSize: 9 }}
          >
            🇮🇳
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: isMobile ? 13 : 14,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: -0.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {persona ? persona.name : "Agent Chat"}
          </div>
          {!isMobile && (
            <div
              style={{
                fontSize: 8,
                letterSpacing: 1.5,
                color: "rgba(249,115,22,0.6)",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {persona ? persona.badge : "1-on-1"} · Made in Bharat
            </div>
          )}
        </div>
      </div>

      <div
        style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}
      >
        {/* Only show SignInButton on desktop or when logged out */}
        <SignInButton compact={isMobile} />
        <UserAvatar />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AgentScreen
// ─────────────────────────────────────────────────────────────────────────────
export function AgentScreen({
  onBack,
  customPersonas = [],
  initialPersona = null,
}) {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!(user && !isAnonymous);
  const isMobile = useIsMobile(480);
  const viewportHeight = useViewportHeight();

  const allPersonas = [...AGENT_PERSONAS, ...customPersonas];

  const [persona, setPersona] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showWA, setShowWA] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const abortRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);
  const userScrolledUp = useRef(false);

  // Scroll helpers
  const scrollToBottom = useCallback((force = false) => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (force || nearBottom) el.scrollTop = el.scrollHeight;
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    userScrolledUp.current =
      el.scrollHeight - el.scrollTop - el.clientHeight > 120;
  };

  useEffect(() => {
    scrollToBottom(!userScrolledUp.current);
  }, [messages]);

  // Auto-start if launched with a pre-selected persona
  useEffect(() => {
    if (initialPersona && isLoggedIn && !persona) {
      // Check if there's an existing session to resume
      const history = getPersonaHistory(initialPersona.id);
      startChat(initialPersona, history[0] || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPersona, isLoggedIn]);

  // Persist messages whenever they change (debounced via message update)
  useEffect(() => {
    if (persona && sessionId && messages.length > 1) {
      persistSession(persona.id, sessionId, messages);
    }
  }, [messages, persona, sessionId]);

  const startChat = (p, resumeSession = null) => {
    setPersona(p);
    abortRef.current?.abort();
    userScrolledUp.current = false;

    if (resumeSession) {
      setSessionId(resumeSession.id);
      setMessages(resumeSession.messages);
      setTimeout(() => scrollToBottom(true), 80);
    } else {
      const newId = uid();
      setSessionId(newId);
      setMessages([
        {
          id: uid(),
          role: "assistant",
          content: `${p.icon} Hey! I'm ${p.name}.\n\n${p.tagline}\n\nWhat's on your mind today?`,
        },
      ]);
    }
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const startNewChat = () => {
    if (!persona) return;
    abortRef.current?.abort();
    const newId = uid();
    setSessionId(newId);
    userScrolledUp.current = false;
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content: `${persona.icon} Starting a fresh conversation.\n\nWhat's on your mind?`,
      },
    ]);
    setInput("");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const resumeSession = (session) => {
    setSessionId(session.id);
    setMessages(session.messages);
    setShowHistoryDrawer(false);
    setTimeout(() => scrollToBottom(true), 80);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming || !persona) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg = { id: uid(), role: "user", content: text };
    const asstId = uid();
    const asstMsg = {
      id: asstId,
      role: "assistant",
      content: "",
      streaming: true,
    };
    setMessages((prev) => [...prev, userMsg, asstMsg]);
    setStreaming(true);
    userScrolledUp.current = false;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const history = [...messages, userMsg].slice(-16);
    const convoText = history
      .map((m) => `${m.role === "user" ? "User" : persona.name}: ${m.content}`)
      .join("\n\n");
    const fullPrompt = `${convoText}\n\n${persona.name}:`;

    const fakeMember = {
      provider: "managed_sarvam",
      model: "sarvam-m",
      apiKey: "",
      endpoint: "",
      systemPrompt: persona.prompt,
    };

    try {
      await dispatchMember(
        fakeMember,
        persona.prompt,
        fullPrompt,
        (t) =>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId ? { ...m, content: t, streaming: true } : m,
            ),
          ),
        ctrl.signal,
        0.75,
        "opinion",
      );
    } catch (e) {
      if (e.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId
              ? {
                  ...m,
                  content: "⚠ Something went wrong. Try again.",
                  streaming: false,
                }
              : m,
          ),
        );
      }
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === asstId ? { ...m, streaming: false } : m)),
      );
      setStreaming(false);
    }
  };

  const resetToPersonaPicker = () => {
    abortRef.current?.abort();
    setPersona(null);
    setMessages([]);
    setInput("");
    setSessionId(null);
    setShowHistoryDrawer(false);
  };

  return (
    <div
      style={{
        height: viewportHeight,
        background: "#050508",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
      }}
    >
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes floatBadge { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
      `}</style>

      {showWA && <WhatsAppGateway onClose={() => setShowWA(false)} />}

      <AgentHeader
        onBack={persona ? resetToPersonaPicker : onBack}
        backLabel={persona ? "← Change Persona" : "← Back to Setup"}
        persona={persona}
        isMobile={isMobile}
      />

      {!isLoggedIn ? (
        <LoginGate onBack={onBack} />
      ) : !persona ? (
        /* ── Persona picker ── */
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "20px 14px" : "28px 20px",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ marginBottom: 22, textAlign: "center" }}>
              <div
                style={{
                  fontSize: isMobile ? 22 : 28,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: -1,
                  marginBottom: 6,
                }}
              >
                Who do you want to talk to?
              </div>
              <div style={{ fontSize: 13, color: tokens.textMuted }}>
                Pick an AI persona for a focused 1-on-1 conversation
              </div>
            </div>

            {/* Sarvam badge */}
            <div
              style={{
                marginBottom: 20,
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(249,115,22,0.07)",
                border: "1px solid rgba(249,115,22,0.22)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  animation: "floatBadge 3s ease-in-out infinite",
                }}
              >
                🇮🇳
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#fb923c" }}
                >
                  Powered by Sarvam AI
                </span>
                {!isMobile && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(249,115,22,0.5)",
                      marginLeft: 8,
                    }}
                  >
                    — India's own LLM · free with sign-in
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 10px",
                  borderRadius: 20,
                  background: "rgba(249,115,22,0.15)",
                  border: "1px solid rgba(249,115,22,0.3)",
                  color: "#f97316",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                🔥 FREE
              </span>
            </div>

            {/* Recent chats strip */}
            <RecentChatsStrip allPersonas={allPersonas} onResume={startChat} />

            {/* Persona grid */}
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.2,
                color: tokens.textFaint,
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Choose a Persona
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fill, minmax(290px, 1fr))",
                gap: 10,
                marginBottom: 24,
              }}
            >
              {allPersonas.map((p) => (
                <PersonaCard
                  key={p.id}
                  p={p}
                  onSelect={startChat}
                  history={getPersonaHistory(p.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── Chat view ── */
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* History drawer overlay */}
          {showHistoryDrawer && (
            <HistoryDrawer
              persona={persona}
              currentSessionId={sessionId}
              onResume={resumeSession}
              onDelete={() => {}}
              onClose={() => setShowHistoryDrawer(false)}
            />
          )}

          {/* Persona context bar */}
          <div
            style={{
              padding: isMobile ? "8px 12px" : "9px 20px",
              background: `${persona.color}07`,
              borderBottom: `1px solid ${persona.color}18`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: isMobile ? 15 : 18, flexShrink: 0 }}>
              {persona.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{ fontSize: 12, fontWeight: 600, color: persona.color }}
              >
                {persona.name}
              </span>
              {!isMobile && (
                <span
                  style={{
                    fontSize: 11,
                    color: tokens.textFaint,
                    marginLeft: 8,
                  }}
                >
                  {persona.tagline}
                </span>
              )}
            </div>

            {/* New chat button */}
            <button
              onClick={startNewChat}
              title="Start a new conversation"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: isMobile ? "4px 8px" : "4px 11px",
                borderRadius: 7,
                flexShrink: 0,
                border: `1px solid ${persona.color}33`,
                background: `${persona.color}0a`,
                color: persona.color,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              ✦ {!isMobile && "New"}
            </button>

            {/* History button */}
            <button
              onClick={() => setShowHistoryDrawer(true)}
              title="Past conversations"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: isMobile ? "4px 8px" : "4px 11px",
                borderRadius: 7,
                flexShrink: 0,
                border: "1px solid rgba(96,165,250,0.3)",
                background: "rgba(96,165,250,0.07)",
                color: "#60a5fa",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              🕐 {!isMobile && "History"}
            </button>

            {/* WhatsApp button — hide on mobile to save space */}
            {!isMobile && (
              <button
                onClick={() => setShowWA(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 11px",
                  borderRadius: 7,
                  flexShrink: 0,
                  border: "1px solid rgba(37,211,102,0.35)",
                  background: "rgba(37,211,102,0.08)",
                  color: "#25d366",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                💬 WhatsApp
              </button>
            )}
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              flex: 1,
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              padding: isMobile ? "16px 12px 8px" : "20px 20px 8px",
            }}
          >
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} persona={persona} />
              ))}
              <div style={{ height: 1 }} />
            </div>
          </div>

          {/* Input bar */}
          <div
            style={{
              padding: `8px ${isMobile ? "10px" : "12px"} max(12px, env(safe-area-inset-bottom))`,
              borderTop: `1px solid ${tokens.borderSubtle}`,
              background: "rgba(5,5,8,0.97)",
              backdropFilter: "blur(12px)",
              flexShrink: 0,
            }}
          >
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-end",
                  background: "rgba(255,255,255,0.035)",
                  border: `1px solid ${streaming ? persona.color + "40" : "rgba(255,255,255,0.09)"}`,
                  borderRadius: 14,
                  padding: "8px 12px",
                  transition: "border-color 0.2s",
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 90) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={streaming}
                  placeholder={
                    streaming
                      ? `${persona.name} is thinking…`
                      : `Message ${persona.name}…`
                  }
                  rows={1}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: tokens.textPrimary,
                    fontSize: 16,
                    resize: "none",
                    fontFamily: "'Syne', sans-serif",
                    lineHeight: 1.5,
                    maxHeight: 90,
                    overflowY: "auto",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    border: "none",
                    flexShrink: 0,
                    background:
                      input.trim() && !streaming
                        ? `linear-gradient(135deg,${persona.color},${persona.color}99)`
                        : "rgba(255,255,255,0.05)",
                    color:
                      input.trim() && !streaming ? "#fff" : tokens.textFaint,
                    cursor:
                      input.trim() && !streaming ? "pointer" : "not-allowed",
                    fontSize: 16,
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ↑
                </button>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: tokens.textFaint,
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                {isMobile
                  ? "🇮🇳 Sarvam AI"
                  : "Shift+Enter for newline · 🇮🇳 Sarvam AI"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
