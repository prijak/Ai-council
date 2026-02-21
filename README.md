<div align="center">

```
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║    ⚖  A I   C O U N C I L  ⚖             ║
  ║                                           ║
  ║   Ask any question. Get answers from      ║
  ║   multiple AI models. Let a Chairman      ║
  ║   synthesize the verdict.                 ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
```

[![License: MIT](https://img.shields.io/badge/License-MIT-a78bfa.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-60a5fa.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Build-Vite-34d399.svg)](https://vitejs.dev)
[![Zero Backend](https://img.shields.io/badge/Backend-None-f472b6.svg)](#)

</div>

---

## ✦ How It Works

```
Your Question
     │
     ▼
┌─────────────────────────────────────────┐
│  Stage I — First Opinions               │
│  All council members respond in         │
│  parallel (cloud) or queued (Ollama)    │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Stage II — Peer Review                 │
│  Each member reads anonymized           │
│  responses and critiques them           │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Stage III — Final Verdict              │
│  The Chairman synthesizes everything    │
│  into one authoritative answer          │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Follow-up (optional)                   │
│  Ask another question — council keeps   │
│  the full prior verdict as context      │
└─────────────────────────────────────────┘
```

---

## ✦ Features

### Core

- **Multi-provider** — Ollama, OpenAI, Groq, Anthropic, Google, or any OpenAI-compatible endpoint
- **Mix local + cloud** — run DeepSeek-R1 locally alongside Claude or GPT-4o
- **35 built-in personas** across Think Tank, Corporate, Startup, Consulting, Editorial, Medical, and Legal roles
- **Streaming responses** — watch all models think in real time, switch tabs mid-generation without losing data
- **Think-block stripping** — `<think>` blocks from reasoning models (DeepSeek-R1, QwQ) are hidden; only the final answer is shown, with a live "🧠 Thinking…" indicator
- **Tabbed results UI** — Stage I / II / III tabs, switch freely while generation is in progress
- **Session history** — all past queries stored locally, reviewable in a full modal with per-stage tabs
- **Saved configs** — save provider + model + API key combos for quick reuse
- **Mobile friendly** — responsive layout, no white flash, safe area insets, iOS zoom prevention
- **Fully local-first** — no backend, no telemetry, runs entirely in the browser

### New Features

#### 🌡 Temperature / Creativity Slider

Set precision vs. creativity per query before convening. Implemented via `TemperatureSlider` component — sits inside the query input box. Applied uniformly to all members including the Chairman across every provider (Ollama via `options.temperature`, OpenAI/Groq/Custom in body, Anthropic + Google in their respective fields).

| Range   | Label       | Effect                               |
| ------- | ----------- | ------------------------------------ |
| 0–35%   | 🎯 Precise  | Deterministic, factual, low variance |
| 35–65%  | Balanced    | Default — good for most questions    |
| 65–100% | 🎨 Creative | More varied, exploratory, unexpected |

#### 🔗 Follow-up Questions

After a verdict is delivered, a follow-up bar appears at the bottom. Follow-up queries prepend all prior rounds as context (`contextPrefix`) so the council builds on its own conclusions. Each round is saved in `followUpChain` and shown in History. The council carries the full prior verdict forward into every subsequent round, building a multi-round deliberation chain.

#### ⬛ Abort / Cancel Mid-Run

A fresh `AbortController` is created per run; the signal is passed through all fetch calls. Cancel button appears in the header only while running. On cancel: partial results are preserved, a red banner is displayed, and follow-up is still available.

#### 📤 Export as Markdown

`downloadMarkdown()` builds a structured `.md` report with date, temperature, all responses, peer reviews, and verdict. Downloads directly from the query bar or History modal once a verdict exists.

#### 🖨 Export as PDF

`exportPDF()` opens a print-ready styled browser window. Use browser Print → Save as PDF. Buttons appear in the results toolbar and History modal.

#### ✨ Council Templates

Pre-built persona structures in one click — no manual setup needed. Templates load persona and name structure only; you still set provider, model, and API key per member. 11 templates across four categories.

#### 📥 / 📤 Import / Export Council JSON

Save and reload your full council setup. Export downloads `ai-council-config.json` with API keys stripped. Import via file picker — parses `{ members: [...] }` or a bare array. Both show inline success/error feedback.

#### 🔗 Webhook Output

Configure a webhook URL in Settings. After every completed session, AI Council POSTs the full session JSON. Includes a test ping button with live response status. Works with Zapier, Make, n8n, Slack, Notion, Pipedream, or any HTTP endpoint.

---

## ✦ Screenshots

Home Screen:
![Home Screen](screenshots/home.jpeg)

Configure Member:
![Configure Member](screenshots/configureMember.jpeg)
![Configure Member](screenshots/configureMember2.jpeg)

Results View:
![Results View](screenshots/FirstOpenion.jpeg)

Manage Members:
![Manage Members](screenshots/Manage.jpeg)

Final Verdict:
![Final Verdict](screenshots/Virdict.jpeg)

---

## ✦ Tech Stack

| Layer     | Choice                                              |
| --------- | --------------------------------------------------- |
| Framework | React 18                                            |
| Styling   | Inline styles + CSS (no Tailwind, no CSS-in-JS lib) |
| Fonts     | Syne + DM Sans (Google Fonts)                       |
| Storage   | `window.storage` (persistent browser storage)       |
| Build     | Vite                                                |
| Runtime   | 100% client-side, zero backend                      |

---

## ✦ Getting Started

### Prerequisites

- Node.js 18+
- At least one of: Ollama running locally, or an API key for a cloud provider

### Install & Run

```bash
git clone https://github.com/prijak/Ai-council.git
cd ai-council
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ✦ Docker

Everything is included — just build and run:

```bash
docker build -f ui_dockerfile -t ai-council .
docker run -p 8080:80 ai-council
```

Open `http://localhost:8080`.

No config needed. The repo includes both `Dockerfile` and `nginx.conf`. The build compiles the React app and serves it via nginx. API calls go from the user's browser directly to providers — nothing routes through Docker.

```
ai-council/
├── ui_dockerfile    # Multi-stage: node:20-alpine build → nginx:alpine serve
└── nginx.conf       # SPA routing + static asset caching
```

---

## ✦ Ollama Setup

Ollama needs CORS enabled to accept browser requests:

```bash
OLLAMA_ORIGINS="*" ollama serve
```

Then pull any models you want:

```bash
ollama pull deepseek-r1        # Reasoning model — great for The Analyst
ollama pull llama3.1           # Good general purpose
ollama pull mistral-nemo       # Efficient, good for Chairman synthesis
ollama pull llama2-uncensored  # Uncensored — good for The Contrarian
ollama pull deepseek-v2        # Good for The Philosopher
```

> **RTX 2070 / 8GB VRAM tip:** Stick to 7B–12B models with 4-bit quantization (Ollama's default). Ollama queues requests per endpoint, so all members run sequentially — expect 5–15 minutes per full deliberation.

---

## ✦ Recommended Council Configurations

### All-Local (Ollama only)

| Member          | Model                  | Persona       |
| --------------- | ---------------------- | ------------- |
| The Analyst     | `deepseek-r1:latest`   | Analyst       |
| The Contrarian  | `llama2-uncensored:7b` | Contrarian    |
| The Visionary   | `llama3.1:8b`          | Visionary     |
| The Pragmatist  | `mistral-nemo:latest`  | Pragmatist 👑 |
| The Philosopher | `deepseek-v2:latest`   | Philosopher   |

### Hybrid (Ollama + Cloud)

| Member           | Provider  | Model                     | Persona       |
| ---------------- | --------- | ------------------------- | ------------- |
| Fast Thinker     | Groq      | `llama-3.3-70b-versatile` | Analyst       |
| Devil's Advocate | Groq      | `mixtral-8x7b-32768`      | Contrarian    |
| Local Expert     | Ollama    | `deepseek-r1:latest`      | Philosopher   |
| The Synthesizer  | Anthropic | `claude-sonnet-4-6`       | Pragmatist 👑 |

---

## ✦ Council Templates

Templates load a pre-built persona structure in one click. You still set provider, model, and API key per member after loading. Templates are organized into three categories.

### 🧠 Think Tank

| Template                 | Members                                              | Best for                                      |
| ------------------------ | ---------------------------------------------------- | --------------------------------------------- |
| **📊 Business Strategy** | Analyst + Contrarian + Pragmatist 👑                 | Product, GTM, and operational decisions       |
| **🧠 Deep Thinking**     | Philosopher + Visionary + Analyst + Pragmatist 👑    | Complex, nuanced, or philosophical questions  |
| **⚖ Full Council**       | All 5 think-tank personas                            | Maximum deliberation depth                    |
| **✨ Creative Council**  | Visionary + Philosopher + Contrarian + Pragmatist 👑 | Ideation, creative strategy, design decisions |

### 🏢 Corporate

| Template               | Members                                                      | Best for                                          |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| **🚀 Product Launch**  | CFO + CTO + CMO + Legal Counsel + CEO 👑                     | Go/no-go launch decisions with departmental input |
| **🌱 Startup Team**    | Founder + Engineer + Designer + Growth Lead + Investor 👑    | Early-stage product and strategy decisions        |
| **💼 Consulting Firm** | Strategist + Operations + Finance + Risk + Senior Partner 👑 | Client-ready recommendations across workstreams   |

### 🎯 Professional

| Template              | Members                                                                           | Best for                                                |
| --------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **📰 Editorial Team** | Reporter + Editor + Legal Review + SEO + Editor-in-Chief 👑                       | Publishing decisions, story clearance, content strategy |
| **🏥 Hospital Team**  | GP + Specialist + Pharmacist + Medical Ethicist + Chief of Medicine 👑            | Clinical questions, medical case analysis               |
| **⚖️ Law Firm**       | Litigator + Corporate Counsel + Compliance + Junior Associate + Senior Partner 👑 | Legal risk assessment, deal review, compliance mapping  |

---

## ✦ Personas

### Think Tank (Original 5)

| Persona             | Role                                      | Best for                                          |
| ------------------- | ----------------------------------------- | ------------------------------------------------- |
| **The Analyst**     | Structured, rigorous reasoning            | Questions needing step-by-step logic              |
| **The Contrarian**  | Challenges assumptions, finds blind spots | Stress-testing ideas                              |
| **The Visionary**   | Reframes from unexpected angles           | Creative and strategic questions                  |
| **The Pragmatist**  | Focuses on execution and next steps       | Decisions needing action plans — best as Chairman |
| **The Philosopher** | First principles, ethics, meaning         | Deep or value-laden questions                     |

### Corporate / C-Suite

| Persona                | Role                                                                     |
| ---------------------- | ------------------------------------------------------------------------ |
| **The CFO**            | Financial lens — ROI, unit economics, burn rate, margin analysis         |
| **The CTO**            | Technical feasibility, architecture risk, engineering timelines          |
| **The CMO**            | Market opportunity, positioning, go-to-market, demand generation         |
| **The Legal Counsel**  | Regulatory risk, IP, liability, compliance frameworks                    |
| **The CEO (Chairman)** | Final go/no-go — resolves departmental tensions with executive authority |

### Startup Team

| Persona                     | Role                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| **The Founder**             | Vision, product-market fit, mission integrity                       |
| **The Engineer**            | Production reality — what actually works at scale                   |
| **The Designer**            | User voice — UX, simplicity, human-centered design                  |
| **The Growth Lead**         | Acquisition, retention, viral loops, unit economics                 |
| **The Investor (Chairman)** | Investment thesis — team, market, defensibility, capital efficiency |

### Consulting Firm

| Persona                    | Role                                                              |
| -------------------------- | ----------------------------------------------------------------- |
| **The Strategist**         | Structured frameworks — Porter's, BCG, jobs-to-be-done            |
| **The Operations Expert**  | Execution feasibility, critical path, implementation risk         |
| **The Finance Expert**     | Financial modeling, unit economics, stress-testing                |
| **The Risk Advisor**       | Risk matrix — strategic, operational, regulatory, black swans     |
| **The Partner (Chairman)** | Synthesizes workstreams into a single client-ready recommendation |

### Editorial Team

| Persona                            | Role                                                 |
| ---------------------------------- | ---------------------------------------------------- |
| **The Reporter**                   | Facts, evidence, what's missing, who benefits        |
| **The Editor**                     | Clarity, narrative structure, reader impact          |
| **The Legal Reviewer**             | Defamation, privacy, copyright, contempt risk        |
| **The SEO Strategist**             | Discoverability, search intent, digital reach        |
| **The Editor-in-Chief (Chairman)** | Publish, hold, or spike — the final editorial ruling |

### Hospital Team

| Persona                          | Role                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| **The GP**                       | Holistic assessment, first-line response, red flags                |
| **The Specialist**               | Domain expertise, differential diagnosis, evidence-based treatment |
| **The Pharmacist**               | Drug interactions, dosing, monitoring requirements                 |
| **The Medical Ethicist**         | Autonomy, consent, beneficence, equity                             |
| **Chief of Medicine (Chairman)** | Final clinical management plan, diagnosis, safety net              |

### Law Firm

| Persona                           | Role                                                                       |
| --------------------------------- | -------------------------------------------------------------------------- |
| **The Litigator**                 | Claims, defenses, litigation risk, settlement dynamics                     |
| **The Corporate Lawyer**          | Entity structure, contracts, governance, M&A                               |
| **The Compliance Officer**        | Regulatory mapping — GDPR, FCPA, employment law, sanctions                 |
| **The Junior Associate**          | Detail-level review — ambiguous clauses, missed deadlines                  |
| **The Senior Partner (Chairman)** | The firm's definitive legal position — frank, precise, strategically sound |

### Custom

Define your own system prompt — any domain, any role.

---

## ✦ The Chairman

The Chairman receives the full deliberation transcript (all responses + all peer reviews) and produces a single authoritative verdict. Mandate:

- Extract the **strongest** insights from each member
- **Resolve** disagreements — do not average them
- Eliminate redundancy and weak reasoning
- Deliver a direct, unambiguous final answer

The Pragmatist / CEO / Senior Partner personas are auto-suggested for Chairman because synthesis is fundamentally about decision-making, not description.

---

## ✦ Import / Export Council JSON

Save your council setup and reload it later — useful for switching between different council configurations without reconfiguring from scratch.

**Export:** Click **📤 Export Config** on the setup screen. Downloads `ai-council-config.json`. API keys are never included.

**Import:** Click **📥 Import JSON** and select a previously exported file. The council loads immediately — set provider/model/keys for each member.

Example JSON format:

```json
{
  "members": [
    {
      "name": "The Analyst",
      "provider": "ollama",
      "model": "deepseek-r1:latest",
      "endpoint": "http://localhost:11434",
      "personaLabel": "The Analyst",
      "systemPrompt": "...",
      "isChairman": false
    }
  ]
}
```

---

## ✦ Webhook Output

Go to **⚙ Settings** in the deliberation header to configure a webhook URL.

After every completed session, AI Council POSTs:

```json
{
  "type": "session_complete",
  "ts": 1234567890,
  "query": "your question",
  "temperature": 0.7,
  "memberNames": ["The Analyst", "The Contrarian", "..."],
  "responses": { "memberId": "response text" },
  "reviews": { "memberId": "review text" },
  "verdict": "Council's Verdict: ..."
}
```

Works with Zapier, Make, n8n, Slack, Notion, Pipedream, or any HTTP endpoint. Use **🧪 Send Test Ping** to verify your URL before running a session.

---

## ✦ Think Block Stripping

Reasoning models like `deepseek-r1` and `qwq` emit `<think>...</think>` blocks before the actual answer. AI Council strips these automatically:

- Fully closed `<think>...</think>` blocks are removed entirely
- An unclosed `<think>` (model still reasoning mid-stream) shows a `🧠 Thinking deeply…` indicator
- Stored text contains only the actual answer
- Peer review and Chairman synthesis prompts only receive cleaned answers — no thinking noise leaks between stages

---

## ✦ Project Structure

```
ai-council/
├── src/
│   ├── App.jsx          # All components and logic
│   ├── styles.js        # Design tokens and shared style objects
│   └── index.css        # Global reset, fonts, keyframes
├── screenshots/         # README screenshots
├── index.html
├── nginx.conf           # For Docker deployment
└── package.json
```

---

## ✦ Keyboard Shortcuts

| Shortcut    | Action                   |
| ----------- | ------------------------ |
| `⌘ + Enter` | Submit query / follow-up |

---

## ✦ Privacy & Data

- **No backend.** All API calls go directly from your browser to the provider.
- **No telemetry.** Nothing is tracked or sent anywhere.
- **Local storage only.** Saved configs and session history live in your browser's persistent storage.
- **API keys** are stored locally in the browser if you choose to save them. They are never included in JSON exports and never sent anywhere except the provider you configure.
- **Webhook** is opt-in and user-configured — nothing is sent without you setting a URL.

---

## ✦ Limitations

- Ollama models run **sequentially** (one at a time per endpoint) — cloud models run in parallel
- No markdown rendering in responses — plain text only (`pre-wrap`)
- Session history is capped at the last 30 sessions
- PDF export uses browser print — for rich formatting, use Markdown export and render separately

---

## ✦ Roadmap

- [ ] Markdown rendering in response panels
- [ ] Web search injection (Brave Search API) for grounding answers in current data
- [ ] Token usage / cost tracking per session for cloud providers
- [ ] Named council presets — save full council with provider + model assignments, not just personas

---

## ✦ License

MIT — do whatever you want with it.

---

<div align="center">

_Built with React. Runs entirely in your browser. No servers harmed._

</div>
