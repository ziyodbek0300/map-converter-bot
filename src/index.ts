// Composition root: load config, build the bot, launch it, wire shutdown.

import { loadConfig } from './config';
import { createBot } from './bot/bot';

const { botToken, adminIds } = loadConfig();
const bot = createBot(botToken, { adminIds });

void bot.launch(() => console.log('Bot started ✨'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
