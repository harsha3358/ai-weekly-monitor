/**
 * reporter.js — Generates beautiful dark-mode HTML briefing reports
 */

const fs = require('fs');
const path = require('path');
const { DOMAINS, DOMAIN_CONFIG } = require('./sources');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const DOCS_DIR = path.join(__dirname, '..', 'docs');

// Ensure dirs exist
[REPORTS_DIR, DOCS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(date) {
  return date.toISOString().split('T')[0];
}

function formatRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60));
  if (diff < 1) return 'Just now';
  if (diff < 24) return `${diff}h ago`;
  const days = Math.floor(diff / 24);
  return `${days}d ago`;
}

/**
 * Generate HTML for a single article card
 */
function renderArticleCard(article, index) {
  const config = DOMAIN_CONFIG[article.domain] || DOMAIN_CONFIG[DOMAINS.GENERAL];
  const publishedStr = formatRelativeTime(article.publishedAt);

  return `
    <div class="article-card" data-index="${index}" style="--domain-color: ${config.color}; --domain-gradient: ${config.gradient}">
      <div class="card-header">
        <div class="card-meta">
          <span class="source-badge">${article.sourceIcon || '📰'} ${article.source}</span>
          <span class="time-ago">${publishedStr}</span>
        </div>
        <span class="time-to-try-badge">${article.timeToTry.badge} ${article.timeToTry.label}</span>
      </div>
      
      <h3 class="article-title">
        <a href="${article.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.title)}</a>
      </h3>
      
      ${article.description ? `<p class="article-description">${escapeHtml(article.description.slice(0, 200))}${article.description.length > 200 ? '...' : ''}</p>` : ''}
      
      <div class="why-it-matters">
        <span class="why-label">💡 Why it matters</span>
        <p>${escapeHtml(article.whyItMatters)}</p>
      </div>
      
      <div class="card-footer">
        <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-more-btn">
          Read announcement →
        </a>
        <div class="confidence-indicator" title="Classification confidence: ${article.confidence}%">
          <div class="confidence-bar" style="width: ${article.confidence}%"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate HTML for a domain section
 */
function renderDomainSection(domain, articles) {
  const config = DOMAIN_CONFIG[domain];
  if (!articles || articles.length === 0) return '';

  return `
    <section class="domain-section" id="domain-${domain.replace(/[^a-z0-9]/gi, '-').toLowerCase()}">
      <div class="domain-header" style="--domain-gradient: ${config.gradient}">
        <div class="domain-title-row">
          <span class="domain-emoji">${config.emoji}</span>
          <h2 class="domain-title">${domain}</h2>
          <span class="domain-count">${articles.length} tool${articles.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="articles-grid">
        ${articles.map((a, i) => renderArticleCard(a, i)).join('')}
      </div>
    </section>
  `;
}

/**
 * Generate the full HTML report
 */
function generateHTML(grouped, metadata = {}) {
  const now = new Date();
  const weekLabel = `Week of ${formatDate(now)}`;
  const totalArticles = Object.values(grouped).flat().length;

  const domainOrder = [
    DOMAINS.CODING_AGENTS,
    DOMAINS.VIDEO_MEDIA,
    DOMAINS.RESEARCH_ANALYTICS,
    DOMAINS.ENTERPRISE_SECURITY,
    DOMAINS.GENERAL,
  ];

  const statsHtml = domainOrder
    .filter((d) => grouped[d]?.length > 0)
    .map((d) => {
      const config = DOMAIN_CONFIG[d];
      return `<div class="stat-card" style="--domain-gradient: ${config.gradient}">
        <span class="stat-emoji">${config.emoji}</span>
        <span class="stat-count">${grouped[d].length}</span>
        <span class="stat-label">${d}</span>
      </div>`;
    })
    .join('');

  const navLinks = domainOrder
    .filter((d) => grouped[d]?.length > 0)
    .map((d) => {
      const config = DOMAIN_CONFIG[d];
      return `<a href="#domain-${d.replace(/[^a-z0-9]/gi, '-').toLowerCase()}" class="nav-link" style="--domain-color: ${config.color}">
        ${config.emoji} ${d} <span class="nav-count">${grouped[d].length}</span>
      </a>`;
    })
    .join('');

  const sectionsHtml = domainOrder
    .map((d) => renderDomainSection(d, grouped[d]))
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Weekly Monitor — ${weekLabel}</title>
  <meta name="description" content="Weekly AI tool releases briefing for ${weekLabel}. ${totalArticles} tools categorized across Video/Media, Coding/Agents, Research/Analytics, and Enterprise/Security.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #0a0a0f;
      --bg-secondary: #111118;
      --bg-card: #16161f;
      --bg-card-hover: #1e1e2a;
      --border: rgba(255,255,255,0.08);
      --border-hover: rgba(255,255,255,0.16);
      --text-primary: #f0f0f8;
      --text-secondary: #9898b0;
      --text-muted: #5a5a72;
      --accent: #6366f1;
      --accent-glow: rgba(99,102,241,0.3);
      --radius: 16px;
      --radius-sm: 8px;
      --shadow: 0 4px 24px rgba(0,0,0,0.4);
      --shadow-hover: 0 8px 40px rgba(0,0,0,0.6);
      --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }

    /* ── Background effects ── */
    body::before {
      content: '';
      position: fixed;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.05) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }

    /* ── Layout ── */
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }

    /* ── Header ── */
    .site-header {
      padding: 48px 0 32px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 40px;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(99,102,241,0.15);
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 100px;
      padding: 6px 16px;
      font-size: 12px;
      font-weight: 600;
      color: #a5b4fc;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .site-title {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800;
      line-height: 1.1;
      background: linear-gradient(135deg, #f0f0f8 0%, #a5b4fc 50%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 12px;
    }

    .site-subtitle {
      font-size: 1.1rem;
      color: var(--text-secondary);
      font-weight: 400;
    }

    /* ── Stats grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin: 32px 0;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      text-align: center;
      position: relative;
      overflow: hidden;
      transition: var(--transition);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--domain-gradient);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      border-color: var(--border-hover);
      box-shadow: var(--shadow);
    }

    .stat-emoji { font-size: 1.5rem; display: block; margin-bottom: 8px; }
    .stat-count { font-size: 2rem; font-weight: 800; display: block; }
    .stat-label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

    /* ── Navigation ── */
    .nav-bar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 40px;
      padding: 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      border-radius: 100px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: var(--transition);
    }

    .nav-link:hover {
      background: rgba(255,255,255,0.08);
      border-color: var(--domain-color);
      color: var(--text-primary);
      box-shadow: 0 0 16px rgba(0,0,0,0.3);
    }

    .nav-count {
      background: rgba(255,255,255,0.1);
      border-radius: 100px;
      padding: 2px 8px;
      font-size: 0.75rem;
    }

    /* ── Domain sections ── */
    .domain-section { margin-bottom: 64px; }

    .domain-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }

    .domain-title-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .domain-emoji { font-size: 2rem; }

    .domain-title {
      font-size: 1.75rem;
      font-weight: 700;
      background: var(--domain-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .domain-count {
      background: rgba(255,255,255,0.08);
      border: 1px solid var(--border);
      border-radius: 100px;
      padding: 4px 12px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    /* ── Articles grid ── */
    .articles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 20px;
    }

    /* ── Article cards ── */
    .article-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: var(--transition);
      position: relative;
      overflow: hidden;
    }

    .article-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: var(--domain-gradient);
      opacity: 0;
      transition: var(--transition);
    }

    .article-card:hover {
      background: var(--bg-card-hover);
      border-color: rgba(255,255,255,0.12);
      transform: translateY(-3px);
      box-shadow: var(--shadow-hover);
    }

    .article-card:hover::before { opacity: 1; }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }

    .card-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .source-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      background: rgba(255,255,255,0.06);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
    }

    .time-ago {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    .time-to-try-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 100px;
      background: rgba(99,102,241,0.15);
      border: 1px solid rgba(99,102,241,0.3);
      color: #a5b4fc;
      white-space: nowrap;
    }

    .article-title {
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.4;
    }

    .article-title a {
      color: var(--text-primary);
      text-decoration: none;
      transition: color 0.2s;
    }

    .article-title a:hover { color: #a5b4fc; }

    .article-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .why-it-matters {
      background: rgba(99,102,241,0.08);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: var(--radius-sm);
      padding: 14px;
    }

    .why-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      color: #a5b4fc;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }

    .why-it-matters p {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }

    .read-more-btn {
      font-size: 0.8rem;
      font-weight: 600;
      color: #a5b4fc;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: var(--transition);
    }

    .read-more-btn:hover { gap: 8px; color: #c084fc; }

    .confidence-indicator {
      width: 60px;
      height: 3px;
      background: rgba(255,255,255,0.08);
      border-radius: 100px;
      overflow: hidden;
    }

    .confidence-bar {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #6366f1);
      border-radius: 100px;
    }

    /* ── Run Now button (dashboard only) ── */
    .run-now-section {
      display: flex;
      justify-content: center;
      margin: 32px 0;
    }

    .run-now-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 14px 32px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border: none;
      border-radius: 100px;
      color: white;
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      box-shadow: 0 4px 20px rgba(99,102,241,0.4);
    }

    .run-now-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(99,102,241,0.6);
    }

    .run-now-btn:active { transform: translateY(0); }

    .run-now-btn.loading { opacity: 0.7; cursor: not-allowed; }

    /* ── Footer ── */
    .site-footer {
      margin-top: 80px;
      padding: 32px 0;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    /* ── Empty state ── */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-secondary);
    }

    .empty-state .empty-icon { font-size: 3rem; margin-bottom: 16px; }

    /* ── Animations ── */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .article-card {
      animation: fadeInUp 0.4s ease both;
    }

    .article-card:nth-child(1) { animation-delay: 0.05s; }
    .article-card:nth-child(2) { animation-delay: 0.1s; }
    .article-card:nth-child(3) { animation-delay: 0.15s; }
    .article-card:nth-child(4) { animation-delay: 0.2s; }
    .article-card:nth-child(5) { animation-delay: 0.25s; }
    .article-card:nth-child(n+6) { animation-delay: 0.3s; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .articles-grid { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .site-title { font-size: 1.8rem; }
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg-primary); }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  </style>
</head>
<body>
  <div class="container">
    <header class="site-header">
      <div class="header-badge">
        <span>🤖</span>
        <span>AI Weekly Monitor</span>
      </div>
      <h1 class="site-title">AI Tools Briefing</h1>
      <p class="site-subtitle">${weekLabel} · ${totalArticles} tools tracked across 4 domains</p>

      <div class="stats-grid">
        ${statsHtml}
      </div>

      ${metadata.isDashboard ? `
      <div class="run-now-section">
        <button class="run-now-btn" id="runNowBtn" onclick="runNow()">
          <span>⚡</span> Run Now (Manual Scan)
        </button>
      </div>
      ` : ''}
    </header>

    <nav class="nav-bar" aria-label="Domain navigation">
      ${navLinks}
    </nav>

    <main>
      ${sectionsHtml || `<div class="empty-state"><div class="empty-icon">📭</div><p>No articles found this week. Try running a manual scan.</p></div>`}
    </main>

    <footer class="site-footer">
      <p>Generated by <strong>AI Weekly Monitor</strong> · ${new Date().toLocaleString('en-US', { timeZone: process.env.MONITOR_TZ || 'Asia/Kolkata' })} IST</p>
      <p style="margin-top:8px">Sources: ${Object.values(DOMAIN_CONFIG).flatMap(() => []).length + 25}+ curated RSS feeds · Powered by Gemini AI</p>
    </footer>
  </div>

  ${metadata.isDashboard ? `
  <script>
    async function runNow() {
      const btn = document.getElementById('runNowBtn');
      btn.classList.add('loading');
      btn.innerHTML = '<span>⏳</span> Scanning... (this may take 1–2 min)';
      btn.disabled = true;
      try {
        const res = await fetch('/run-now', { method: 'POST' });
        if (res.ok) {
          btn.innerHTML = '<span>✅</span> Done! Reloading...';
          setTimeout(() => window.location.reload(), 1500);
        } else {
          throw new Error('Server error');
        }
      } catch (e) {
        btn.innerHTML = '<span>❌</span> Error — check console';
        btn.classList.remove('loading');
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡</span> Run Now (Manual Scan)';
        }, 3000);
      }
    }
  </script>
  ` : ''}
</body>
</html>`;
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Save a report to disk and update docs/index.html for GitHub Pages
 * @returns {string} Path to saved report
 */
function saveReport(html, date = new Date()) {
  const dateStr = formatDateShort(date);
  const reportPath = path.join(REPORTS_DIR, `${dateStr}.html`);
  const indexPath = path.join(DOCS_DIR, 'index.html');

  fs.writeFileSync(reportPath, html, 'utf8');
  fs.writeFileSync(indexPath, html, 'utf8');

  console.log(`\n💾 Report saved: ${reportPath}`);
  console.log(`📄 GitHub Pages updated: ${indexPath}`);

  return reportPath;
}

/**
 * Generate and save the full HTML report
 */
async function generateReport(grouped) {
  console.log('\n📝 Generating HTML report...');
  const html = generateHTML(grouped);
  const dashboardHtml = generateHTML(grouped, { isDashboard: true });
  const reportPath = saveReport(html);
  return { html, dashboardHtml, reportPath };
}

module.exports = { generateReport, generateHTML, saveReport, REPORTS_DIR, DOCS_DIR };
