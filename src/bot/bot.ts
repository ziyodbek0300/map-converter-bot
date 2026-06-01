// Bot factory: constructs a Telegraf instance with all handlers registered.

import { Telegraf } from 'telegraf';
import { registerHandlers, type HandlerOptions } from './handlers';

export function createBot(token: string, opts?: HandlerOptions): Telegraf {
  const bot = new Telegraf(token);
  registerHandlers(bot, opts);
  return bot;
}
