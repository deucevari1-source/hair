import { Bot } from 'grammy';
import { handleStart, handleMenu } from './handlers/start';
import { handleCallback } from './handlers/callbacks';
import { handleTextInput } from './handlers/text';

export function createBot(): Bot {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error('BOT_TOKEN is not set in environment variables');

  const bot = new Bot(token);

  // Commands
  bot.command('start', handleStart);
  bot.command('menu', handleMenu);

  // All inline button callbacks
  bot.on('callback_query:data', handleCallback);

  // Free-text input (for admin secret code entry)
  bot.on('message:text', handleTextInput);

  // Error handler
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  return bot;
}
