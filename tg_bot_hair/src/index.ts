import 'dotenv/config';
import { createBot } from './bot';
import { startPoller } from './poller';

async function main() {
  const bot = createBot();
  startPoller(bot);

  await bot.start({
    onStart: (info) => {
      console.log(`✅ Bot @${info.username} is running`);
      console.log('   Polling for new appointments every 30 seconds...');
    },
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
