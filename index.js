/**
 * index.js — AI Weekly Monitor entry point
 * Starts the dashboard server and Monday scheduler.
 * Run: node index.js
 */

require('dotenv').config();
const { startDashboard } = require('./src/dashboard');
const { startScheduler } = require('./src/scheduler');

console.log(`
╔══════════════════════════════════════════════╗
║          🤖 AI WEEKLY MONITOR v2.0           ║
║  Free Stack: Gemini + Pollinations + GitHub  ║
╚══════════════════════════════════════════════╝
`);

const args = process.argv.slice(2);
if (args.includes('--run-once')) {
  console.log('☁️  Running in single-shot cloud mode...');
  const { runPipeline } = require('./src/pipeline');
  runPipeline().then((results) => {
    if (results.errors && results.errors.length > 0) {
      console.error('❌ Pipeline completed with errors.');
      process.exit(1);
    } else {
      console.log('✅ Pipeline completed successfully.');
      process.exit(0);
    }
  });
} else {
  // Start Express dashboard
  startDashboard();

  // Start Monday scheduler
  startScheduler();

  console.log('\n💡 Tips:');
  console.log('   • Visit http://localhost:3000 to view the dashboard');
  console.log('   • Click "Run Now" to trigger a manual scan');
  console.log('   • The scheduler fires automatically every Monday');
  console.log('   • Press Ctrl+C to stop\n');
}
