/**
 * dashboard.js — Express local dashboard (http://localhost:3000)
 * Serves the latest report, history, status, and manual trigger.
 */

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { REPORTS_DIR } = require('./reporter');

const app = express();
app.use(express.json());

let isRunning = false;
let lastRunResult = null;

// ── Routes ────────────────────────────────────────────────────────────────────

// Latest report (redirect to most recent)
app.get('/', (req, res) => {
  const latest = getLatestReport();
  if (!latest) {
    return res.send(getEmptyDashboard());
  }
  const html = fs.readFileSync(latest.path, 'utf8');
  // Inject dashboard controls into the page
  const injected = injectDashboardControls(html);
  res.send(injected);
});

// Report history page
app.get('/history', (req, res) => {
  const reports = getAllReports();
  res.send(renderHistoryPage(reports));
});

// View a specific report
app.get('/report/:date', (req, res) => {
  const reportPath = path.join(REPORTS_DIR, `${req.params.date}.html`);
  if (!fs.existsSync(reportPath)) {
    return res.status(404).send('<h1>Report not found</h1>');
  }
  res.sendFile(reportPath);
});

// View generated LinkedIn post text
app.get('/post/:date', (req, res) => {
  const postPath = path.join(REPORTS_DIR, `${req.params.date}-linkedin-post.txt`);
  if (!fs.existsSync(postPath)) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.type('text/plain').send(fs.readFileSync(postPath, 'utf8'));
});

// Status API
app.get('/status', (req, res) => {
  const reports = getAllReports();
  res.json({
    status: isRunning ? 'running' : 'idle',
    lastRun: lastRunResult,
    reportCount: reports.length,
    latestReport: reports[0]?.date || null,
    nextMonday: getNextMonday(),
    uptime: process.uptime(),
  });
});

// Manual trigger
app.post('/run-now', async (req, res) => {
  if (isRunning) {
    return res.status(409).json({ error: 'Pipeline already running' });
  }

  isRunning = true;
  res.json({ message: 'Pipeline started', status: 'running' });

  // Run asynchronously
  try {
    const { runPipeline } = require('./pipeline');
    lastRunResult = await runPipeline({ skipLinkedIn: req.body?.skipLinkedIn || false });
  } catch (err) {
    lastRunResult = { error: err.message };
  } finally {
    isRunning = false;
  }
});

// Serve report images
app.use('/images', express.static(path.join(REPORTS_DIR, 'images')));

// ── Helper functions ──────────────────────────────────────────────────────────

function getAllReports() {
  if (!fs.existsSync(REPORTS_DIR)) return [];
  return fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .reverse()
    .map((f) => ({
      date: f.replace('.html', ''),
      path: path.join(REPORTS_DIR, f),
      size: fs.statSync(path.join(REPORTS_DIR, f)).size,
    }));
}

function getLatestReport() {
  const all = getAllReports();
  return all[0] || null;
}

function getNextMonday() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(parseInt(process.env.MONITOR_HOUR || '9'), 0, 0, 0);
  return next.toISOString();
}

function injectDashboardControls(html) {
  const controls = `
  <div style="position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:12px;align-items:flex-end">
    <a href="/history" style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:rgba(30,30,42,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:100px;color:#a5b4fc;text-decoration:none;font-family:Inter,sans-serif;font-size:0.8rem;font-weight:600;backdrop-filter:blur(12px)">
      📚 History
    </a>
    <button onclick="triggerRun()" id="dashRunBtn" style="display:inline-flex;align-items:center;gap:8px;padding:12px 20px;background:linear-gradient(135deg,#6366f1,#a855f7);border:none;border-radius:100px;color:white;font-family:Inter,sans-serif;font-size:0.85rem;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(99,102,241,0.5)">
      ⚡ Run Now
    </button>
  </div>
  <script>
    async function triggerRun() {
      const btn = document.getElementById('dashRunBtn');
      btn.textContent = '⏳ Running...';
      btn.disabled = true;
      try {
        const r = await fetch('/run-now', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({skipLinkedIn: false}) });
        if (r.ok) {
          btn.textContent = '✅ Done! Reloading...';
          setTimeout(() => location.reload(), 2000);
        }
      } catch(e) {
        btn.textContent = '❌ Error';
        setTimeout(() => { btn.disabled=false; btn.textContent='⚡ Run Now'; }, 3000);
      }
    }
  </script>`;
  return html.replace('</body>', controls + '</body>');
}

function renderHistoryPage(reports) {
  const rows = reports
    .map(
      (r) => `
    <tr>
      <td><a href="/report/${r.date}" style="color:#a5b4fc;text-decoration:none;font-weight:600">${r.date}</a></td>
      <td><a href="/post/${r.date}" style="color:#6b7280;font-size:0.8rem">View post →</a></td>
      <td style="color:#6b7280;font-size:0.8rem">${(r.size / 1024).toFixed(0)} KB</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Report History — AI Weekly Monitor</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { background:#0a0a0f; color:#f0f0f8; font-family:Inter,sans-serif; padding:48px 24px; }
    h1 { font-size:2rem; font-weight:800; margin-bottom:32px; background:linear-gradient(135deg,#f0f0f8,#a5b4fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    table { width:100%; max-width:600px; border-collapse:collapse; }
    th { text-align:left; padding:12px 16px; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.08em; color:#6b7280; border-bottom:1px solid rgba(255,255,255,0.08); }
    td { padding:14px 16px; border-bottom:1px solid rgba(255,255,255,0.05); }
    a.back { display:inline-flex; align-items:center; gap:6px; color:#a5b4fc; text-decoration:none; font-size:0.875rem; margin-bottom:32px; }
  </style>
</head>
<body>
  <a class="back" href="/">← Back to latest report</a>
  <h1>📚 Report History</h1>
  ${reports.length === 0 ? '<p style="color:#6b7280">No reports yet. Run a scan first.</p>' : `
  <table>
    <tr><th>Date</th><th>LinkedIn Post</th><th>Size</th></tr>
    ${rows}
  </table>`}
</body>
</html>`;
}

function getEmptyDashboard() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AI Weekly Monitor</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body { background:#0a0a0f; color:#f0f0f8; font-family:Inter,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; flex-direction:column; gap:24px; }
    h1 { font-size:2.5rem; font-weight:800; background:linear-gradient(135deg,#f0f0f8,#a5b4fc,#c084fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    p { color:#6b7280; }
    button { padding:14px 32px; background:linear-gradient(135deg,#6366f1,#a855f7); border:none; border-radius:100px; color:white; font-family:Inter,sans-serif; font-size:1rem; font-weight:700; cursor:pointer; }
  </style>
</head>
<body>
  <div style="font-size:4rem">🤖</div>
  <h1>AI Weekly Monitor</h1>
  <p>No reports yet. Run your first scan to get started.</p>
  <button onclick="fetch('/run-now',{method:'POST'}).then(()=>location.reload())">⚡ Run First Scan</button>
</body>
</html>`;
}

/**
 * Start the dashboard server
 */
function startDashboard() {
  const PORT = parseInt(process.env.PORT || '3000');
  app.listen(PORT, () => {
    console.log(`\n🖥️  Dashboard running at http://localhost:${PORT}`);
    console.log(`   Latest report: http://localhost:${PORT}/`);
    console.log(`   History:       http://localhost:${PORT}/history`);
    console.log(`   Status API:    http://localhost:${PORT}/status`);
  });
  return app;
}

module.exports = { startDashboard, app };
