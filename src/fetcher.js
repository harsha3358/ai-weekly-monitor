/**
 * fetcher.js — RSS feed fetcher with retry, deduplication, and 7-day filter
 */

require('dotenv').config();
const axios = require('axios');
const RSSParser = require('rss-parser');
const { SOURCES } = require('./sources');

const parser = new RSSParser({
  timeout: 15000,
  headers: {
    'User-Agent': 'AI-Weekly-Monitor/2.0 (https://github.com/ai-weekly-monitor; RSS Reader)',
  },
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure', 'category'],
  },
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const DAYS_LOOKBACK = 7;

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch a single RSS feed with retry logic
 */
async function fetchFeed(source, attempt = 1) {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.map((item) => ({
      title: item.title?.trim() || 'Untitled',
      url: item.link || item.guid || '',
      description: stripHtml(item.contentSnippet || item.content || item.summary || '').slice(0, 500),
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      source: source.name,
      sourceIcon: source.icon,
      sourceDomain: source.domain,
      sourcePriority: source.priority,
      rawContent: item.content || item.contentSnippet || '',
    }));
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      console.warn(`  ⚠️  Retry ${attempt}/${MAX_RETRIES} for ${source.name}: ${err.message}`);
      await sleep(RETRY_DELAY_MS * attempt);
      return fetchFeed(source, attempt + 1);
    }
    console.error(`  ❌ Failed to fetch ${source.name} after ${MAX_RETRIES} attempts: ${err.message}`);
    return [];
  }
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Filter articles published in the last N days
 */
function filterRecent(articles, days = DAYS_LOOKBACK) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return articles.filter((a) => a.publishedAt >= cutoff);
}

/**
 * Deduplicate articles by URL
 */
function deduplicate(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

/**
 * Main fetch function — fetches all sources concurrently
 * @returns {Promise<Article[]>} Filtered, deduplicated articles from the past 7 days
 */
async function fetchAllSources() {
  console.log(`\n🔍 Fetching ${SOURCES.length} sources...`);
  const startTime = Date.now();

  // Fetch all sources concurrently (with a small concurrency limit to be polite)
  const CONCURRENCY = 5;
  const results = [];
  for (let i = 0; i < SOURCES.length; i += CONCURRENCY) {
    const batch = SOURCES.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(batch.map((s) => fetchFeed(s)));
    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const source = batch[idx];
        console.log(`  ✅ ${source.name}: ${result.value.length} items`);
        results.push(...result.value);
      }
    });
  }

  const recent = filterRecent(results);
  const unique = deduplicate(recent);

  // Sort by date (newest first)
  unique.sort((a, b) => b.publishedAt - a.publishedAt);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n📦 Fetched ${results.length} total → ${recent.length} recent → ${unique.length} unique articles (${elapsed}s)`);

  return unique;
}

module.exports = { fetchAllSources, stripHtml };

// Allow running directly for testing
if (require.main === module) {
  fetchAllSources().then((articles) => {
    console.log('\nSample articles:');
    articles.slice(0, 5).forEach((a) => {
      console.log(`  [${a.source}] ${a.title}`);
      console.log(`    URL: ${a.url}`);
      console.log(`    Date: ${a.publishedAt.toLocaleDateString()}`);
      console.log();
    });
  });
}
