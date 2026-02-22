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

### 🇮🇳 Built with ❤️ in Bharat · Powered by Sarvam AI

[![Made in India](https://img.shields.io/badge/Made%20in-Bharat%20🇮🇳-f97316.svg)](#)
[![Powered by Sarvam AI](https://img.shields.io/badge/Powered%20by-Sarvam%20AI-f97316.svg)](https://sarvam.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-a78bfa.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-60a5fa.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Build-Vite-34d399.svg)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-f59e0b.svg)](https://firebase.google.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-a78bfa.svg)](#-pwa--install-to-home-screen)

---

> **🔥 Free hosted AI — no API key needed.**
> Sign in with Google and instantly access **Sarvam AI** (India's own LLM) and **Hosted Ollama** — free for all users. No credit card, no setup.

---

</div>

## 🇮🇳 Sarvam AI — India's Own LLM, Built into AI Council

[Sarvam AI](https://sarvam.ai) is an Indian large language model built for Bharat — designed to understand Indian context, culture, and languages. It is fully integrated into AI Council as a **first-class hosted provider**, available free to all signed-in users.

**Why Sarvam AI?**

- Built in India, by Indians, for Indian use cases
- Understands Indian cultural and business context natively
- Supports Indic language inputs and multilingual reasoning
- No API key required — sign in with Google and use it instantly
- Available in both Council mode and Agent Chat mode

**How to use it:**

1. Click **Sign in with Google** (top right)
2. Add a council member → select **Sarvam AI 🇮🇳** as the provider
3. Model is pre-set to `sarvam-m` — no configuration needed
4. Run your query — Sarvam AI deliberates alongside any other models you choose

> Pair Sarvam AI with Hosted Ollama for a **100% free, zero-setup council** — no API keys anywhere.

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

- **Multi-provider** — Ollama, OpenAI, Groq, Anthropic, Google, **Sarvam AI 🇮🇳**, or any OpenAI-compatible endpoint
- **Mix local + cloud** — run DeepSeek-R1 locally alongside Claude, GPT-4o, or Sarvam AI
- **36 built-in personas** across Think Tank, Corporate, Startup, Consulting, Editorial, Medical, Legal, and Unfiltered roles
- **Raw Model persona** — no role-play, no framing: the model responds from its own knowledge and judgment
- **Streaming responses** — watch all models think in real time, switch tabs mid-generation without losing data
- **Think-block stripping** — `<think>` blocks from reasoning models (DeepSeek-R1, QwQ) are hidden; only the final answer is shown, with a live "🧠 Thinking…" indicator
- **Tabbed results UI** — Stage I / II / III tabs, switch freely while generation is in progress
- **Session history** — all past queries stored locally, reviewable in a full modal with per-stage tabs
- **Saved configs** — save provider + model + API key combos for quick reuse
- **Mobile friendly** — responsive layout, no white flash, safe area insets, iOS zoom prevention

---

## ✦ New Features

### 🔐 Google Sign-In & Firebase Authentication

Sign in with your Google account to unlock cloud features and free hosted models. Uses Firebase Auth with popup → redirect fallback — works on all browsers including iOS Safari.

- Managed providers (Sarvam AI, Hosted Ollama) require sign-in
- Session persists across tabs and page reloads
- Anonymous users continue to work with local storage and self-hosted providers

### ☁ Cloud Config Sync with End-to-End Encryption

When signed in, your saved council configs sync to Firestore. API keys are encrypted with **AES-GCM 256-bit** (WebCrypto) before leaving your browser — the server only ever stores ciphertext.

- Configs sync across devices automatically
- Each saved config card shows a `☁ cloud · 🔒 encrypted` badge when active
- Falls back to localStorage for anonymous sessions

### 🇮🇳 Managed / Hosted Providers (No API Key Required)

Two providers are hosted by the AI Council backend — sign in and use them free:

| Provider          | Icon | Notes                                                                   |
| ----------------- | ---- | ----------------------------------------------------------------------- |
| **Sarvam AI**     | 🇮🇳   | India's own LLM (`sarvam-m`) — built for Bharat                         |
| **Hosted Ollama** | 🦙   | Free open-source models — mistral-nemo, deepseek-r1, llama3.1, and more |

No endpoint, no API key, no credit card. Just sign in.

### 🖥 Express Backend & Usage Analytics

Node.js/Express backend (`server.js`) powers managed providers with Firebase Admin auth verification, per-UID rate limiting (30 req/min default), streaming proxy, Firestore usage analytics, session logging, and an admin stats endpoint.

### 🤖 Agent Mode

Single-model 1-on-1 chat with any persona — CEO, Analyst, Coach, Lawyer, and more. Accessible from the setup screen. Supports all providers including Sarvam AI 🇮🇳 and Hosted Ollama for zero-setup conversations.

### ✏ Custom Persona Creator

Build council members beyond the 36 built-ins — define a name, icon, color, and full system prompt. Useful for domain-specific Indian roles: GST Compliance Officer, SEBI Regulatory Advisor, IIT Research Analyst, and so on.

### 📱 PWA — Install to Home Screen

AI Council is a fully installable Progressive Web App. Chrome/Edge/Android shows a native install banner. iOS Safari: tap **Share → Add to Home Screen**. Runs standalone once installed.

---

## ✦ Previously Shipped Features

### 🌡 Temperature / Creativity Slider

| Range   | Label       | Effect                               |
| ------- | ----------- | ------------------------------------ |
| 0–35%   | 🎯 Precise  | Deterministic, factual, low variance |
| 35–65%  | Balanced    | Default — good for most questions    |
| 65–100% | 🎨 Creative | More varied, exploratory, unexpected |

### 🔗 Follow-up Questions

After a verdict, ask a follow-up — the council carries the full prior verdict as context. Each round is saved in `followUpChain` and shown in History.

### ⬛ Abort / Cancel Mid-Run

Cancel at any point — partial results are preserved, a red banner is shown, and follow-up is still available.

### 📤 Export as Markdown / 🖨 PDF

`downloadMarkdown()` builds a structured `.md` report. `exportPDF()` opens a print-ready styled browser window.

### ✨ Council Templates

13 pre-built persona structures across Think Tank, Corporate, Professional, and Unfiltered categories — one click to load.

### 📥 / 📤 Import / Export Council JSON

Save and reload full council setups. API keys are always stripped from exports.

### 🔗 Webhook Output

Configure a webhook URL in Settings. After every completed session, AI Council POSTs the full session JSON. Works with Zapier, Make, n8n, Slack, Notion, and Pipedream.

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

| Layer         | Choice                                                 |
| ------------- | ------------------------------------------------------ |
| Framework     | React 19                                               |
| Styling       | Inline styles + CSS (no Tailwind, no CSS-in-JS lib)    |
| Fonts         | Syne + DM Sans (Google Fonts)                          |
| Auth          | Firebase Authentication (Google Sign-In)               |
| Database      | Firestore (cloud config sync, usage analytics)         |
| Encryption    | WebCrypto AES-GCM 256 (client-side, before upload)     |
| Local Storage | `localStorage` (sessions, configs for anonymous users) |
| Backend       | Node.js + Express (managed providers, analytics)       |
| Indic AI      | Sarvam AI 🇮🇳 (`sarvam-m`)                              |
| Build         | Vite 6                                                 |
| PWA           | vite-plugin-pwa + custom Service Worker                |

---

## ✦ Getting Started

### Prerequisites

- Node.js 18+
- One of: Ollama locally, a cloud provider API key, **or just a Google account** to use free managed providers (Sarvam AI + Hosted Ollama)

### Install & Run

```bash
git clone https://github.com/prijak/Ai-council.git
cd ai-council
npm install
npm run dev
```

Open `http://localhost:5173`.

### Firebase Setup (optional — for auth + cloud sync + managed providers)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication → Google** sign-in provider
3. Enable **Firestore** database
4. Copy your config into `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_API_URL=https://your-backend-url.com
```

Without these, the app runs in local-only mode (no sign-in, no cloud sync, no managed providers).

### Backend Setup (optional — for Sarvam AI + Hosted Ollama)

```bash
PORT=8103 \
OLLAMA_BASE_URL=https://your-ollama.com \
SARVAM_API_KEY=sk-... \
MANAGED_OLLAMA_MODELS=mistral-nemo:latest,deepseek-r1:latest,llama3.1:8b \
ADMIN_UIDS=uid1,uid2 \
node server.js
```

Requires Firebase Admin credentials (`GOOGLE_APPLICATION_CREDENTIALS` or GCP ADC).

**Backend environment variables:**

| Variable                | Default                     | Description                     |
| ----------------------- | --------------------------- | ------------------------------- |
| `PORT`                  | `8103`                      | Server port                     |
| `OLLAMA_BASE_URL`       | `https://ai.gameinghub.com` | Your Ollama instance            |
| `SARVAM_API_KEY`        | —                           | Sarvam AI API key               |
| `MANAGED_OLLAMA_MODELS` | —                           | Comma-separated model list      |
| `ADMIN_UIDS`            | —                           | Firebase UIDs with admin access |
| `ALLOWED_ORIGINS`       | `*`                         | CORS origins                    |
| `RATE_LIMIT_PER_MIN`    | `30`                        | Max requests per UID/minute     |

---

## ✦ Docker

```bash
docker build -f ui_dockerfile -t ai-council .
docker run -p 8080:80 ai-council
```

Open `http://localhost:8080`. The Docker image builds the React app and serves via nginx.

---

## ✦ Project Structure

```
ai-council/
├── public/
│   ├── logo.png
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service worker
├── src/
│   ├── components/
│   │   ├── atoms/index.jsx        # Spin, Badge, Toggle, TemperatureSlider
│   │   ├── AgentScreen.jsx        # Single-model agent chat mode
│   │   ├── AuthGate.jsx           # Firebase auth wrapper + Google sign-in UI
│   │   ├── DeliberationScreen.jsx # Main 3-stage pipeline orchestrator
│   │   ├── HistoryModal.jsx       # Past sessions browser
│   │   ├── InstallPrompt.jsx      # PWA install banner
│   │   ├── ManagePanel.jsx        # Add / edit / remove council members
│   │   ├── MemberCard.jsx         # Member row + chairman toggle
│   │   ├── MemberForm.jsx         # Add/edit member form
│   │   ├── ModelPicker.jsx        # Searchable model picker
│   │   ├── PersonaCreator.jsx     # Custom persona builder
│   │   ├── ResultsView.jsx        # Stage I / II / III tabs
│   │   ├── SavedConfig.jsx        # Local + cloud config management
│   │   ├── SettingsModal.jsx      # Webhook config
│   │   ├── SetupScreen.jsx        # Council builder + template picker
│   │   ├── SystemPromptEditor.jsx # Inline prompt preview + editing
│   │   └── TemplateCard.jsx       # Template grid card
│   ├── constants/
│   │   ├── personas.js            # 36 personas across 8 groups
│   │   ├── providers.js           # All provider configs incl. managed_sarvam
│   │   └── templates.js           # 13 council templates
│   ├── lib/
│   │   ├── api.js                 # dispatchMember() — all provider fetch logic
│   │   ├── auth.js                # Firebase auth, getIdToken, apiFetch, streaming proxy
│   │   ├── cloudStorage.js        # Firestore CRUD + AES-GCM encryption
│   │   ├── export.js              # downloadMarkdown(), exportPDF()
│   │   ├── importExportConfig.js  # parseCouncilJSON()
│   │   ├── storage.js             # localStorage helpers
│   │   └── utils.js               # stripThinking(), uid(), sid()
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── styles.js
├── server.js                      # Express backend (managed providers + analytics)
├── firestore.rules
├── firebase.json
├── nginx.conf
├── ui_dockerfile
└── package.json
```

---

## ✦ Ollama Setup

```bash
OLLAMA_ORIGINS="*" ollama serve
```

Recommended models:

```bash
ollama pull deepseek-r1        # Reasoning — great for The Analyst
ollama pull llama3.1           # General purpose
ollama pull mistral-nemo       # Efficient — good Chairman
ollama pull llama2-uncensored  # Uncensored — good Contrarian
ollama pull deepseek-v2        # Good Philosopher
```

> **RTX 2070 / 8GB VRAM tip:** Stick to 7B–12B models with 4-bit quantization. Ollama queues requests sequentially — expect 5–15 min per full deliberation.

---

## ✦ Recommended Council Configurations

### 🇮🇳 Zero-Setup Indian Council (sign-in only — completely free)

| Member         | Provider      | Model                 | Persona       |
| -------------- | ------------- | --------------------- | ------------- |
| The Analyst    | Hosted Ollama | `deepseek-r1:latest`  | Analyst       |
| The Contrarian | Hosted Ollama | `mistral-nemo:latest` | Contrarian    |
| The Visionary  | Hosted Ollama | `llama3.1:8b`         | Visionary     |
| Indic Voice    | Sarvam AI 🇮🇳  | `sarvam-m`            | Philosopher   |
| The Pragmatist | Hosted Ollama | `mistral-nemo:latest` | Pragmatist 👑 |

> No API keys. No credit card. Just sign in with Google and deliberate.

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

### Raw Model Panel (compare models unfiltered)

| Member  | Provider     | Model                     | Persona      |
| ------- | ------------ | ------------------------- | ------------ |
| Model A | Anthropic    | `claude-sonnet-4-6`       | Raw Model    |
| Model B | Groq         | `llama-3.3-70b-versatile` | Raw Model    |
| Model C | OpenAI       | `gpt-4o`                  | Raw Model    |
| Model D | Sarvam AI 🇮🇳 | `sarvam-m`                | Raw Model 👑 |

---

## ✦ Council Templates

Templates load a pre-built persona structure in one click. Set provider, model, and API key per member after loading.

### 🧠 Think Tank

| Template                 | Members                                              | Best for                                  |
| ------------------------ | ---------------------------------------------------- | ----------------------------------------- |
| **📊 Business Strategy** | Analyst + Contrarian + Pragmatist 👑                 | Product, GTM, and operational decisions   |
| **🧠 Deep Thinking**     | Philosopher + Visionary + Analyst + Pragmatist 👑    | Complex, nuanced, philosophical questions |
| **⚖ Full Council**       | All 5 think-tank personas                            | Maximum deliberation depth                |
| **✨ Creative Council**  | Visionary + Philosopher + Contrarian + Pragmatist 👑 | Ideation, creative strategy, design       |

### 🏢 Corporate

| Template               | Members                                              | Best for                  |
| ---------------------- | ---------------------------------------------------- | ------------------------- |
| **🚀 Product Launch**  | CFO + CTO + CMO + Legal + CEO 👑                     | Go/no-go launch decisions |
| **🌱 Startup Team**    | Founder + Engineer + Designer + Growth + Investor 👑 | Early-stage strategy      |
| **💼 Consulting Firm** | Strategist + Ops + Finance + Risk + Partner 👑       | Client recommendations    |

### 🎯 Professional

| Template              | Members                                                     | Best for              |
| --------------------- | ----------------------------------------------------------- | --------------------- |
| **📰 Editorial Team** | Reporter + Editor + Legal + SEO + Editor-in-Chief 👑        | Publishing decisions  |
| **🏥 Hospital Team**  | GP + Specialist + Pharmacist + Ethicist + Chief 👑          | Medical case analysis |
| **⚖️ Law Firm**       | Litigator + Corporate + Compliance + Associate + Partner 👑 | Legal risk assessment |

### 🔬 Unfiltered

| Template               | Members                                    | Best for                            |
| ---------------------- | ------------------------------------------ | ----------------------------------- |
| **🔬 Raw Model Panel** | 4× Raw Model                               | Model comparison, zero persona bias |
| **⚗️ Raw vs Persona**  | Raw + Analyst + Contrarian + Pragmatist 👑 | Persona framing vs raw reasoning    |

---

## ✦ Personas

### Think Tank (Original 5)

| Persona             | Role                                      | Best for                         |
| ------------------- | ----------------------------------------- | -------------------------------- |
| **The Analyst**     | Structured, rigorous reasoning            | Step-by-step logic               |
| **The Contrarian**  | Challenges assumptions, finds blind spots | Stress-testing ideas             |
| **The Visionary**   | Reframes from unexpected angles           | Creative and strategic questions |
| **The Pragmatist**  | Focuses on execution and next steps       | Action plans — best as Chairman  |
| **The Philosopher** | First principles, ethics, meaning         | Deep or value-laden questions    |

### Corporate / C-Suite

| Persona                | Role                                                        |
| ---------------------- | ----------------------------------------------------------- |
| **The CFO**            | Financial lens — ROI, unit economics, burn rate             |
| **The CTO**            | Technical feasibility, architecture risk                    |
| **The CMO**            | Market opportunity, positioning, go-to-market               |
| **The Legal Counsel**  | Regulatory risk, IP, liability                              |
| **The CEO (Chairman)** | Final go/no-go — resolves tensions with executive authority |

### Startup Team

| Persona                     | Role                                                |
| --------------------------- | --------------------------------------------------- |
| **The Founder**             | Vision, product-market fit, mission integrity       |
| **The Engineer**            | Production reality — what works at scale            |
| **The Designer**            | User voice — UX, simplicity, human-centered design  |
| **The Growth Lead**         | Acquisition, retention, viral loops, unit economics |
| **The Investor (Chairman)** | Investment thesis — team, market, defensibility     |

### Consulting Firm

| Persona                    | Role                                                          |
| -------------------------- | ------------------------------------------------------------- |
| **The Strategist**         | Structured frameworks — Porter's, BCG, jobs-to-be-done        |
| **The Operations Expert**  | Execution feasibility, critical path, implementation risk     |
| **The Finance Expert**     | Financial modeling, unit economics, stress-testing            |
| **The Risk Advisor**       | Risk matrix — strategic, operational, regulatory, black swans |
| **The Partner (Chairman)** | Single client-ready recommendation across workstreams         |

### Editorial Team

| Persona                            | Role                                                 |
| ---------------------------------- | ---------------------------------------------------- |
| **The Reporter**                   | Facts, evidence, what's missing, who benefits        |
| **The Editor**                     | Clarity, narrative structure, reader impact          |
| **The Legal Reviewer**             | Defamation, privacy, copyright, contempt risk        |
| **The SEO Strategist**             | Discoverability, search intent, digital reach        |
| **The Editor-in-Chief (Chairman)** | Publish, hold, or spike — the final editorial ruling |

### Hospital Team

| Persona                          | Role                                                |
| -------------------------------- | --------------------------------------------------- |
| **The GP**                       | Holistic assessment, first-line response, red flags |
| **The Specialist**               | Domain expertise, differential diagnosis            |
| **The Pharmacist**               | Drug interactions, dosing, monitoring               |
| **The Medical Ethicist**         | Autonomy, consent, beneficence, equity              |
| **Chief of Medicine (Chairman)** | Final clinical management plan                      |

### Law Firm

| Persona                           | Role                                                      |
| --------------------------------- | --------------------------------------------------------- |
| **The Litigator**                 | Claims, defenses, litigation risk, settlement             |
| **The Corporate Lawyer**          | Entity structure, contracts, governance, M&A              |
| **The Compliance Officer**        | GDPR, FCPA, employment law, sanctions                     |
| **The Junior Associate**          | Detail-level review — ambiguous clauses, missed deadlines |
| **The Senior Partner (Chairman)** | The firm's definitive legal position                      |

### Unfiltered

| Persona       | Role                                          |
| ------------- | --------------------------------------------- |
| **Raw Model** | No persona, no framing — pure model output    |
| **Custom ✎**  | Your own system prompt — any domain, any role |

---

## ✦ The Chairman

Receives the full transcript (all responses + reviews) and delivers one authoritative verdict. Mandate:

- Extract the **strongest** insights from each member
- **Resolve** disagreements — not average them
- Eliminate redundancy and weak reasoning
- Deliver a direct, unambiguous final answer

---

## ✦ Import / Export Council JSON

**Export:** Click **📤 Export Config**. Downloads `ai-council-config.json`. API keys are never included.

**Import:** Click **📥 Import JSON** → select a file. Council loads immediately.

```json
{
  "members": [
    {
      "name": "The Analyst",
      "provider": "managed_sarvam",
      "model": "sarvam-m",
      "personaLabel": "The Analyst",
      "systemPrompt": "...",
      "isChairman": false
    }
  ]
}
```

---

## ✦ Webhook Output

Configure a URL in **⚙ Settings**. After every session, AI Council POSTs:

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

Works with Zapier, Make, n8n, Slack, Notion, Pipedream. Use **🧪 Send Test Ping** to verify first.

---

## ✦ Think Block Stripping

Reasoning models (`deepseek-r1`, `qwq`) emit `<think>...</think>` blocks. AI Council strips these automatically and shows a `🧠 Thinking deeply…` indicator mid-stream. Peer review and Chairman prompts only receive the cleaned output — no thinking noise leaks between stages.

---

## ✦ Keyboard Shortcuts

| Shortcut    | Action                   |
| ----------- | ------------------------ |
| `⌘ + Enter` | Submit query / follow-up |

---

## ✦ Privacy & Data

- **Managed providers (Sarvam AI, Hosted Ollama):** Requests are proxied through the AI Council backend. Provider, model, stage, and character counts are logged for usage analytics. Raw prompt text is not stored server-side.
- **Self-hosted providers:** All API calls go directly from your browser to the provider. Nothing passes through our backend.
- **Cloud configs:** API keys are AES-GCM encrypted in your browser before upload. The server only stores ciphertext.
- **Local storage:** Session history and configs for anonymous users stay in your browser only.
- **API keys** are never included in JSON exports.
- **Webhook** is opt-in — nothing is sent without you setting a URL.

---

## ✦ Limitations

- Ollama models run **sequentially** (one at a time per endpoint) — cloud models run in parallel
- No markdown rendering in responses — plain text only (`pre-wrap`)
- Session history is capped at the last 30 sessions
- PDF export uses browser print — use Markdown export for richer formatting
- Managed providers require a signed-in Google account

---

## ✦ Roadmap

- [ ] Markdown rendering in response panels
- [ ] Web search injection for grounding answers in current data
- [ ] Token usage / cost tracking per session
- [ ] Named council presets — save full council with provider + model assignments
- [ ] WhatsApp Integration — chat with your AI persona on WhatsApp directly
- [ ] Voice Mode — speak to your persona, hear responses back
- [ ] Document Council — upload a PDF and let the council analyse it
- [ ] Public Persona Gallery — publish and browse community-created personas

---

## ✦ License

MIT — do whatever you want with it.

---

<div align="center">

🇮🇳 **Built with pride in Bharat · Powered by [Sarvam AI](https://sarvam.ai)**

_The council is always in session._

</div>
