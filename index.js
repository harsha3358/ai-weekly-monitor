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

// Start Express dashboard
startDashboard();

// Start Monday scheduler
startScheduler();

console.log('\n💡 Tips:');
console.log('   • Visit http://localhost:3000 to view the dashboard');
console.log('   • Click "Run Now" to trigger a manual scan');
console.log('   • The scheduler fires automatically every Monday');
console.log('   • Press Ctrl+C to stop\n');
