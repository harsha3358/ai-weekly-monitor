/**
 * categorizer.js — Gemini-powered domain classifier + summary generator
 * Falls back to keyword-based classification if Gemini API is unavailable.
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { DOMAINS, DOMAIN_CONFIG } = require('./sources');

let genAI = null;
let model = null;

function initGemini() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set — using keyword-based classification (offline mode)');
    return false;
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  return true;
}

// ─── Time-to-try estimation ─────────────────────────────────────────────────

const TIME_TO_TRY_RULES = [
  { keywords: ['open source', 'github', 'self-host', 'clone', 'local'], label: '15–30 min', badge: '🟢 Quick Try' },
  { keywords: ['api', 'sdk', 'pip install', 'npm install', 'python', 'integration'], label: '30–60 min', badge: '🟡 API Setup' },
  { keywords: ['paper', 'arxiv', 'research', 'study', 'benchmark', 'survey'], label: 'Read-only (30 min)', badge: '📖 Read' },
  { keywords: ['enterprise', 'pricing', 'contact sales', 'demo', 'waitlist'], label: 'Eval needed (1–2 hrs)', badge: '🔵 Eval' },
  { keywords: ['beta', 'early access', 'limited preview'], label: 'Join waitlist first', badge: '⏳ Waitlist' },
];

function estimateTimeToTry(text) {
  const lower = text.toLowerCase();
  for (const rule of TIME_TO_TRY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { label: rule.label, badge: rule.badge };
    }
  }
  return { label: '20–40 min', badge: '🟡 Try It' };
}

// ─── Keyword-based classification (offline fallback) ─────────────────────────

function classifyByKeywords(text) {
  const lower = text.toLowerCase();
  const scores = {};

  for (const [domain, config] of Object.entries(DOMAIN_CONFIG)) {
    if (domain === DOMAINS.GENERAL) continue;
    scores[domain] = config.keywords.filter((kw) => lower.includes(kw)).length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : DOMAINS.GENERAL;
}

function generateOfflineSummary(title, description, domain) {
  const domainName = domain.replace('/', ' and ');
  const templates = [
    `This release advances ${domainName} capabilities, offering new tools that could meaningfully improve your workflow.`,
    `A notable development in ${domainName} — worth evaluating for practical use in your projects.`,
    `This announcement signals continued momentum in the ${domainName} space and may offer immediate practical value.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

// ─── Gemini-powered batch categorization ─────────────────────────────────────

const GEMINI_BATCH_SIZE = 10;
const GEMINI_RATE_LIMIT_DELAY = 1000; // ms between batches

async function categorizeWithGemini(articles) {
  const results = [];

  for (let i = 0; i < articles.length; i += GEMINI_BATCH_SIZE) {
    const batch = articles.slice(i, i + GEMINI_BATCH_SIZE);

    const prompt = `You are an AI tool analyst. Categorize each of the following tech articles and generate concise metadata.

For each article, respond ONLY with a JSON array. Each element must have:
- "index": the article's index (0-based)
- "domain": one of exactly these values: "Video/Media", "Coding/Agents", "Research/Analytics", "Enterprise/Security", "General"
- "why_it_matters": 1-2 sentences explaining why this matters to an AI-focused developer/practitioner
- "confidence": a number 0-100 indicating classification confidence

Domains guide:
- "Video/Media": image/video/audio generation, creative AI, text-to-video, voice synthesis
- "Coding/Agents": code generation, AI agents, developer tools, frameworks, LLM tooling
- "Research/Analytics": papers, benchmarks, datasets, ML ops, model training, analytics
- "Enterprise/Security": cloud AI platforms, AI governance, compliance, safety, B2B AI
- "General": news that spans multiple categories or doesn't fit neatly

Articles:
${batch.map((a, idx) => `[${idx}] Title: ${a.title}\nSource: ${a.source}\nDescription: ${a.description?.slice(0, 200) || 'N/A'}`).join('\n\n')}

Respond ONLY with the JSON array, no other text.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in Gemini response');

      const parsed = JSON.parse(jsonMatch[0]);
      results.push(...parsed);

      console.log(`  🤖 Gemini processed batch ${Math.floor(i / GEMINI_BATCH_SIZE) + 1}: ${batch.length} articles`);
    } catch (err) {
      console.error(`  ⚠️  Gemini batch failed: ${err.message} — using keyword fallback for this batch`);
      batch.forEach((a, idx) => {
        results.push({
          index: idx,
          domain: classifyByKeywords(`${a.title} ${a.description}`),
          why_it_matters: generateOfflineSummary(a.title, a.description, 'this domain'),
          confidence: 50,
        });
      });
    }

    if (i + GEMINI_BATCH_SIZE < articles.length) {
      await new Promise((r) => setTimeout(r, GEMINI_RATE_LIMIT_DELAY));
    }
  }

  return results;
}

// ─── Main categorization function ────────────────────────────────────────────

async function categorizeArticles(articles) {
  console.log(`\n🧠 Categorizing ${articles.length} articles...`);
  const useGemini = initGemini();

  let categoryData = [];

  if (useGemini) {
    categoryData = await categorizeWithGemini(articles);
  }

  // Apply category data to articles
  const categorized = articles.map((article, globalIdx) => {
    const data = categoryData.find((d) => {
      // Match by offset within the batch
      return d.index === (globalIdx % GEMINI_BATCH_SIZE);
    });

    const textForClassification = `${article.title} ${article.description} ${article.source}`;

    const domain = data?.domain ||
      (useGemini ? DOMAINS.GENERAL : classifyByKeywords(textForClassification));

    const whyItMatters = data?.why_it_matters ||
      generateOfflineSummary(article.title, article.description, domain);

    const timeToTry = estimateTimeToTry(textForClassification);

    return {
      ...article,
      domain,
      whyItMatters,
      timeToTry,
      confidence: data?.confidence || 70,
    };
  });

  // Group by domain
  const grouped = {};
  for (const domain of Object.values(DOMAINS)) {
    grouped[domain] = categorized.filter((a) => a.domain === domain);
  }

  // Stats
  console.log('\n📊 Categorization results:');
  for (const [domain, items] of Object.entries(grouped)) {
    if (items.length > 0) {
      const config = DOMAIN_CONFIG[domain];
      console.log(`  ${config?.emoji || '•'} ${domain}: ${items.length} articles`);
    }
  }

  return { articles: categorized, grouped };
}

module.exports = { categorizeArticles, classifyByKeywords, estimateTimeToTry };
