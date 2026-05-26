# 🤖 AI Weekly Monitor

> **100% Free** weekly AI tool release tracker → auto-posts to LinkedIn with AI-generated image every Monday.

## 💰 Cost: $0

| Service | What it does | Cost |
|---|---|---|
| Google Gemini 2.0 Flash | Categorization + "Why it matters" summaries | Free (1500 req/day) |
| **Nano Banana** (Gemini Image via Puter.js) | Cover image generation — no API key needed | **Free** (User-Pays model) |
| GitHub Pages | Hosts the public report URL | Free |
| Puppeteer | LinkedIn automation | Free (open source) |
| RSS feeds | News source (25+ feeds) | Free |

---

## 🚀 Setup (5 minutes)

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/ai-weekly-monitor
cd ai-weekly-monitor
npm install
```

### 2. Configure `.env`
```bash
cp .env.example .env
```
Edit `.env` and fill in:
- `GEMINI_API_KEY` — Get free at [aistudio.google.com](https://aistudio.google.com)
- `LINKEDIN_EMAIL` + `LINKEDIN_PASSWORD` — Your LinkedIn login
- `GITHUB_USERNAME` — Your GitHub username

### 3. Enable GitHub Pages
1. Go to your repo → **Settings → Pages**
2. Set source: **GitHub Actions**
3. Done — your report URL will be: `https://YOUR_USERNAME.github.io/ai-weekly-monitor/`

### 4. Start the service
```bash
node index.js
```

Open **http://localhost:3000** and click **⚡ Run Now** to test immediately.

---

## 📅 How it works

Every **Monday at 9:00 AM IST**, the service automatically:

1. **📡 Fetches** 25+ RSS feeds from OpenAI, Anthropic, DeepMind, Hugging Face, GitHub, arXiv, and more
2. **🧠 Categorizes** articles into 4 domains using Gemini AI:
   - 🎬 **Video/Media** — Sora, Runway, ElevenLabs, etc.
   - 🤖 **Coding/Agents** — GitHub Copilot, Cursor, LangChain, etc.
   - 📊 **Research/Analytics** — arXiv papers, benchmarks, MLOps
   - 🔐 **Enterprise/Security** — AWS, Azure, AI governance
3. **🎨 Generates** a cover image via Pollinations.ai (free AI image generation)
4. **📝 Writes** a Gen Z-style LinkedIn post (short, punchy, multi-line)
5. **🌐 Publishes** the full HTML report to GitHub Pages
6. **📤 Posts** to LinkedIn with the image + text

---

## 🖥️ Dashboard

| URL | What |
|---|---|
| `http://localhost:3000` | Latest report |
| `http://localhost:3000/history` | All past reports |
| `http://localhost:3000/status` | JSON status & next run time |
| `http://localhost:3000/post/:date` | LinkedIn post text for any date |

---

## 📬 LinkedIn Post Style

```
AI dropped different this week. No cap.

🤖 CODING/AGENTS
→ GitHub Copilot got memory
→ Claude Code now runs in terminal

🎬 VIDEO/MEDIA
→ Sora 2 is actually insane
→ ElevenLabs clones voice in 3s

📊 RESEARCH
→ New benchmark breaks all LLMs

Full breakdown 👇
https://your-username.github.io/ai-weekly-monitor/

#AI #ArtificialIntelligence #MachineLearning #AITools #TechNews
```

---

## 📁 Project Structure

```
ai-weekly-monitor/
├── src/
│   ├── sources.js        # 25+ curated RSS feeds
│   ├── fetcher.js        # Feed fetcher with retry
│   ├── categorizer.js    # Gemini domain classifier
│   ├── reporter.js       # HTML report generator
│   ├── image-generator.js # Pollinations.ai cover image
│   ├── post-generator.js  # LinkedIn post writer (Gen Z style)
│   ├── linkedin.js       # Puppeteer LinkedIn automation
│   ├── github-pages.js   # Git push + Pages deploy
│   ├── dashboard.js      # Express web dashboard
│   ├── pipeline.js       # Full pipeline orchestrator
│   └── scheduler.js      # Monday 9AM cron job
├── docs/                 # GitHub Pages output
├── reports/              # Saved HTML reports + images + post text
├── logs/                 # Run logs
├── .github/workflows/    # GitHub Actions Pages deploy
├── .env.example
└── index.js              # Entry point
```

---

## 🔧 Customization

**Add a source:** Edit `src/sources.js` and add an entry to `SOURCES`.

**Change schedule:** Update `MONITOR_HOUR` and `MONITOR_MINUTE` in `.env`.

**Change domains:** Edit the `DOMAIN_CONFIG` in `src/sources.js`.

---

## 🛡️ Privacy

- Your `.env` file (with credentials) is in `.gitignore` and will **never** be committed
- LinkedIn session cookies are stored locally in `puppeteer-data/` (also gitignored)

---

Made with ❤️ using Node.js, Gemini, Pollinations.ai, and Puppeteer.
