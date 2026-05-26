/**
 * post-generator.js
 * Generates Gen Z / Gen Alpha style LinkedIn post text.
 * Uses Gemini 2.0 Flash (free tier) for smart summarization.
 * Falls back to template-based generation if Gemini unavailable.
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { DOMAINS, DOMAIN_CONFIG } = require('./sources');

// ─── Gemini setup (free tier) ─────────────────────────────────────────────────

function getGeminiModel() {
  if (!process.env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // free tier
}

// ─── Post generation ──────────────────────────────────────────────────────────

/**
 * Pick top N articles per domain (highest priority + newest)
 */
function pickTopArticles(grouped, perDomain = 2) {
  const picked = {};
  const domainOrder = [
    DOMAINS.CODING_AGENTS,
    DOMAINS.VIDEO_MEDIA,
    DOMAINS.RESEARCH_ANALYTICS,
    DOMAINS.ENTERPRISE_SECURITY,
  ];

  for (const domain of domainOrder) {
    const articles = (grouped[domain] || [])
      .sort((a, b) => {
        const priorityScore = { HIGH: 2, MEDIUM: 1, LOW: 0 };
        return (priorityScore[b.sourcePriority] || 0) - (priorityScore[a.sourcePriority] || 0) ||
               b.publishedAt - a.publishedAt;
      })
      .slice(0, perDomain);

    if (articles.length > 0) picked[domain] = articles;
  }
  return picked;
}

/**
 * Generate post using Gemini (free tier)
 */
async function generateWithGemini(topArticles, pagesUrl, weekLabel) {
  const model = getGeminiModel();
  if (!model) return null;

  const articleDump = Object.entries(topArticles)
    .map(([domain, articles]) => {
      const config = DOMAIN_CONFIG[domain];
      const lines = articles.map((a) => `  • ${a.title} — ${a.whyItMatters || a.description?.slice(0, 100)}`).join('\n');
      return `${config.emoji} ${domain}:\n${lines}`;
    })
    .join('\n\n');

  const prompt = `You are a Gen Z tech content creator writing a LinkedIn post about this week's AI tool releases.

RULES (CRITICAL):
- Max 150 words TOTAL
- Start with a punchy hook line (1 line, no emojis on first line)
- Then a blank line
- Then each domain as a SEPARATE LINE with emoji prefix
- Under each domain: 1-2 bullet points, each MAX 10 words, use → not •
- Keep it conversational, slightly informal, no corporate speak
- DO NOT write one long paragraph — EVERY tool gets its own line
- Use emojis sparingly (1 per section max)
- End with: "Full breakdown 👇" and then the URL on next line
- Then 4-5 hashtags on the last line

ARTICLES THIS WEEK:
${articleDump}

Week: ${weekLabel}
Report URL: ${pagesUrl || 'https://your-report-url-here'}

Write the post now:`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error(`⚠️  Gemini post generation failed: ${err.message}`);
    return null;
  }
}

/**
 * Template-based fallback post generation (offline, zero cost)
 */
function generateWithTemplate(topArticles, pagesUrl, weekLabel) {
  const hooks = [
    'AI dropped different this week. Here\'s what you missed 🧵',
    'The AI space moved fast this week. No cap.',
    'This week\'s AI releases? Actually fire. Here\'s the breakdown ⚡',
    'Ngl, AI is moving too fast. Weekly digest incoming 👇',
    'AI tools that actually slap this week 🔥',
  ];

  const hook = hooks[new Date().getDate() % hooks.length];

  const lines = [hook, ''];

  for (const [domain, articles] of Object.entries(topArticles)) {
    const config = DOMAIN_CONFIG[domain];
    lines.push(`${config.emoji} ${domain.toUpperCase()}`);
    for (const article of articles) {
      // Truncate title to ~8 words
      const shortTitle = article.title.split(/[-–:|,]/)[0].trim().split(' ').slice(0, 7).join(' ');
      lines.push(`→ ${shortTitle}`);
    }
    lines.push('');
  }

  lines.push(`Full breakdown 👇`);
  lines.push(pagesUrl || 'https://your-report-link-here');
  lines.push('');
  lines.push('#AI #ArtificialIntelligence #MachineLearning #AITools #TechNews');

  return lines.join('\n');
}

/**
 * Main post generation function
 * @param {Object} grouped - Articles grouped by domain
 * @param {string} pagesUrl - GitHub Pages URL for the report
 * @returns {Promise<string>} LinkedIn post text
 */
async function generateLinkedInPost(grouped, pagesUrl = '') {
  const weekLabel = `Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  const topArticles = pickTopArticles(grouped, 2);

  console.log('\n✍️  Generating LinkedIn post...');

  // Try Gemini first (free tier)
  let postText = await generateWithGemini(topArticles, pagesUrl, weekLabel);

  // Fallback to template
  if (!postText) {
    console.log('   📝 Using template-based post generation (offline mode)');
    postText = generateWithTemplate(topArticles, pagesUrl, weekLabel);
  }

  console.log('\n📋 Generated post:\n');
  console.log('─'.repeat(50));
  console.log(postText);
  console.log('─'.repeat(50));

  return postText;
}

module.exports = { generateLinkedInPost, pickTopArticles };
