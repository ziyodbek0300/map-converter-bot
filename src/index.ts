// Composition root: load config, build the bot, launch it, wire shutdown.

import { loadConfig } from './config';
import { createBot } from './bot/bot';
import { log } from './log';

const { botToken, adminIds } = loadConfig();
const bot = createBot(botToken, { adminIds });

void bot.launch(() => {
  console.log('Bot started ✨');
  log.info('bot.started', { adminCount: adminIds.length, logLevel: process.env.LOG_LEVEL ?? 'info' });
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
