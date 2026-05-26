/**
 * pipeline.js
 * Central orchestrator — runs the full weekly pipeline:
 *   1. Fetch all RSS feeds
 *   2. Categorize with Gemini (free tier)
 *   3. Generate HTML report
 *   4. Generate cover image (Pollinations.ai — free)
 *   5. Generate Gen Z LinkedIn post text
 *   6. Deploy to GitHub Pages
 *   7. Post to LinkedIn (text + image)
 */

require('dotenv').config();
const { fetchAllSources } = require('./fetcher');
const { categorizeArticles } = require('./categorizer');
const { generateReport } = require('./reporter');
const { generateWeeklyImage } = require('./image-generator');
const { generateLinkedInPost } = require('./post-generator');
const { deployWebsite, getPagesUrl } = require('./github-pages');
const { postToLinkedIn } = require('./linkedin');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'monitor.log');
const LOGS_DIR = path.dirname(LOG_FILE);
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
}

/**
 * Run the full pipeline
 * @param {Object} options
 * @param {boolean} options.skipLinkedIn - Skip LinkedIn posting (for test runs)
 * @param {boolean} options.skipGitHub - Skip Website push
 * @returns {Promise<Object>} Pipeline results
 */
async function runPipeline(options = {}) {
  const startTime = Date.now();
  const results = {
    startedAt: new Date().toISOString(),
    articlesFound: 0,
    reportPath: null,
    imagePath: null,
    pagesUrl: null,
    linkedInPosted: false,
    errors: [],
  };

  log('═══════════════════════════════════════════');
  log('🤖 AI Weekly Monitor — Pipeline Started');
  log('═══════════════════════════════════════════');

  try {
    // ── Step 1: Fetch ─────────────────────────────────────────────────────────
    log('📡 Step 1/6: Fetching RSS feeds...');
    const articles = await fetchAllSources();
    results.articlesFound = articles.length;
    log(`✅ Fetched ${articles.length} articles`);

    if (articles.length === 0) {
      log('⚠️  No articles found — pipeline halted');
      return results;
    }

    // ── Step 2: Categorize ────────────────────────────────────────────────────
    log('🧠 Step 2/6: Categorizing with Gemini...');
    const { grouped } = await categorizeArticles(articles);
    log('✅ Categorization complete');

    // ── Step 3: Generate HTML report ──────────────────────────────────────────
    log('📝 Step 3/6: Generating HTML report...');
    const { reportPath } = await generateReport(grouped);
    results.reportPath = reportPath;
    log(`✅ Report saved: ${reportPath}`);

    // ── Step 4: Generate cover image ──────────────────────────────────────────
    log('🎨 Step 4/6: Generating cover image (Pollinations.ai)...');
    const imagePath = await generateWeeklyImage(grouped);
    results.imagePath = imagePath;
    if (imagePath) {
      log(`✅ Image generated: ${imagePath}`);
    } else {
      log('⚠️  Image generation failed — will post without image');
    }

    // ── Step 5: Trigger Website Deploy ────────────────────────────────────────
    let pagesUrl = getPagesUrl();
    if (!options.skipGitHub) {
      log('🚀 Step 5/6: Triggering Website Deploy (Vercel)...');
      const ghResult = await deployWebsite();
      if (ghResult.success) {
        pagesUrl = ghResult.url;
        results.pagesUrl = pagesUrl;
        log(`✅ Website update pushed: ${pagesUrl}`);
      } else {
        log(`⚠️  Website deploy failed: ${ghResult.error}`);
        results.errors.push(`Website: ${ghResult.error}`);
      }
    } else {
      log('⏭️  Step 5/6: Website deploy skipped (test mode)');
    }

    // ── Step 6: Generate post + post to LinkedIn ──────────────────────────────
    log('✍️  Step 6/6: Generating LinkedIn post...');
    const postText = await generateLinkedInPost(grouped, pagesUrl);

    // Save post text for reference
    const postPath = path.join(path.dirname(reportPath), `${path.basename(reportPath, '.html')}-linkedin-post.txt`);
    fs.writeFileSync(postPath, postText, 'utf8');
    log(`✅ Post text saved: ${postPath}`);

    if (!options.skipLinkedIn) {
      log('📤 Posting to LinkedIn...');
      const liResult = await postToLinkedIn(postText, results.imagePath);
      results.linkedInPosted = liResult.success;
      if (liResult.success) {
        log('✅ LinkedIn post published!');
      } else {
        log(`❌ LinkedIn post failed: ${liResult.error}`);
        results.errors.push(`LinkedIn: ${liResult.error}`);
      }
    } else {
      log('⏭️  LinkedIn posting skipped (test mode)');
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    results.completedAt = new Date().toISOString();
    results.elapsedSeconds = elapsed;

    log('');
    log('═══════════════════════════════════════════');
    log(`✅ Pipeline complete in ${elapsed}s`);
    log(`   Articles: ${results.articlesFound}`);
    log(`   Report: ${results.reportPath}`);
    log(`   Image: ${results.imagePath || 'none'}`);
    log(`   Website: ${results.pagesUrl || 'skipped'}`);
    log(`   LinkedIn: ${results.linkedInPosted ? 'posted' : 'skipped'}`);
    if (results.errors.length > 0) {
      log(`   Errors: ${results.errors.join('; ')}`);
    }
    log('═══════════════════════════════════════════');

    return results;
  } catch (err) {
    log(`❌ Pipeline crashed: ${err.message}`);
    log(err.stack);
    results.errors.push(err.message);
    return results;
  }
}

module.exports = { runPipeline };
