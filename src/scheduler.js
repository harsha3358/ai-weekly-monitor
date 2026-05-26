/**
 * scheduler.js — node-cron Monday 9AM IST scheduler
 */

require('dotenv').config();
const cron = require('node-cron');
const { runPipeline } = require('./pipeline');

const HOUR = process.env.MONITOR_HOUR || '9';
const MINUTE = process.env.MONITOR_MINUTE || '0';
const TZ = process.env.MONITOR_TZ || 'Asia/Kolkata';

// Monday at HOUR:MINUTE in specified timezone
const CRON_EXPR = `${MINUTE} ${HOUR} * * 1`;

function startScheduler() {
  console.log(`\n⏰ Scheduler active: Every Monday at ${HOUR}:${MINUTE.padStart(2, '0')} ${TZ}`);
  console.log(`   Cron expression: ${CRON_EXPR}`);

  cron.schedule(
    CRON_EXPR,
    async () => {
      console.log('\n🔔 Scheduled trigger fired — running pipeline...');
      await runPipeline();
    },
    { timezone: TZ }
  );
}

module.exports = { startScheduler };
