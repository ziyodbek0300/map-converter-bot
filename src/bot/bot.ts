// Bot factory: constructs a Telegraf instance with all handlers registered.

import { Telegraf } from 'telegraf';
import { registerHandlers } from './handlers';

export function createBot(token: string): Telegraf {
  const bot = new Telegraf(token);
  registerHandlers(bot);
  return bot;
}
