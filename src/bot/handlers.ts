// Telegram update handlers. Registers all bot behavior on a Telegraf instance.

import type { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { convert, type Conversion } from '../domain';
import { MESSAGES } from './messages';
import {
  renderCaption,
  buildKeyboard,
  buildAppKeyboard,
} from './presenter';

export function registerHandlers(bot: Telegraf): void {
  bot.start((ctx) => ctx.reply(MESSAGES.help));
  bot.help((ctx) => ctx.reply(MESSAGES.help));

  // Direct message: convert and reply with caption + buttons (incl. share).
  bot.on(message('text'), async (ctx) => {
    let result: Conversion | null;
    try {
      result = await convert(ctx.message.text);
    } catch (err) {
      console.error('convert failed:', err);
      return ctx.reply(MESSAGES.error);
    }

    if (!result) {
      return ctx.reply(MESSAGES.notFound);
    }

    await ctx.replyWithMarkdownV2(renderCaption(result), {
      link_preview_options: { is_disabled: true },
      ...buildKeyboard(result),
    });
  });

  // Inline mode: powers the Share button. The query is a map URL (pre-filled by
  // switch_inline_query); we re-convert it and return a result that, when
  // tapped in the chosen chat, posts the same caption + app buttons.
  bot.on('inline_query', async (ctx) => {
    let result: Conversion | null = null;
    try {
      result = await convert(ctx.inlineQuery.query);
    } catch (err) {
      console.error('inline convert failed:', err);
    }

    if (!result) {
      return ctx.answerInlineQuery([], {
        cache_time: 0,
        button: { text: MESSAGES.inlineNoResult, start_parameter: 'start' },
      });
    }

    const { place } = result;
    await ctx.answerInlineQuery(
      [
        {
          type: 'article',
          id: inlineResultId(result),
          title: place.label ?? `${place.lat}, ${place.lon}`,
          description: MESSAGES.inlineDescription,
          input_message_content: {
            message_text: renderCaption(result),
            parse_mode: 'MarkdownV2',
            link_preview_options: { is_disabled: true },
          },
          ...buildAppKeyboard(result.targets),
        },
      ],
      { cache_time: 0 }
    );
  });
}

/** Stable, unique-per-place id for an inline result (≤64 bytes). */
function inlineResultId({ source, place }: Conversion): string {
  return `${source}:${place.lat},${place.lon}`.slice(0, 64);
}
