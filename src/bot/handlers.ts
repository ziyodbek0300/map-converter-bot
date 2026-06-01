// Telegram update handlers. Registers all bot behavior on a Telegraf instance.

import type { Context, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { convert, convertCoords, type Conversion } from '../domain';
import { metrics } from '../metrics';
import { log } from '../log';
import { MESSAGES } from './messages';
import {
  renderCaption,
  buildKeyboard,
  buildAppKeyboard,
} from './presenter';

export interface HandlerOptions {
  /** Telegram user IDs permitted to run admin commands (e.g. /stats). */
  adminIds: number[];
}

/** Pulls non-sensitive identifying context off an update for log correlation. */
function logContext(ctx: Context): Record<string, unknown> {
  return {
    userId: ctx.from?.id,
    username: ctx.from?.username,
    chatType: ctx.chat?.type,
  };
}

/** Truncates user input so log lines stay bounded but still show what was sent. */
function snippet(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/** Compact, log-friendly summary of where a conversion landed. */
function placeFields({ source, place }: Conversion): Record<string, unknown> {
  return {
    source: source ?? 'location',
    lat: place.lat,
    lon: place.lon,
    label: place.label,
  };
}

export function registerHandlers(bot: Telegraf, opts: HandlerOptions = { adminIds: [] }): void {
  const adminIds = new Set(opts.adminIds);

  bot.start((ctx) => ctx.reply(MESSAGES.help));
  bot.help((ctx) => ctx.reply(MESSAGES.help));

  // Admin-only usage snapshot. Registered before the text handler so the
  // command is intercepted; non-admins get no reply (and no info leak).
  bot.command('stats', async (ctx) => {
    if (!adminIds.has(ctx.from.id)) return;
    await ctx.reply(formatStats(), { parse_mode: 'HTML' });
  });

  // Shared venue (a pinned place with a name) — carries coords + a title we
  // keep as the label. Registered before the location handler because a venue
  // update also includes a `location` field and would otherwise match it.
  bot.on(message('venue'), async (ctx) => {
    metrics.inc('updates');
    const { location, title } = ctx.message.venue;
    const result = convertCoords(location.latitude, location.longitude, title);
    metrics.recordConversion(result.source);
    log.info('convert.ok', { ...logContext(ctx), input: 'venue', ...placeFields(result) });
    await replyConversion(ctx, result);
  });

  // Shared live/static location — build links straight from the coordinates,
  // no link parsing needed.
  bot.on(message('location'), async (ctx) => {
    metrics.inc('updates');
    const { latitude, longitude } = ctx.message.location;
    const result = convertCoords(latitude, longitude);
    metrics.recordConversion(result.source);
    log.info('convert.ok', { ...logContext(ctx), input: 'location', ...placeFields(result) });
    await replyConversion(ctx, result);
  });

  // Direct message: convert and reply with caption + buttons (incl. share).
  bot.on(message('text'), async (ctx) => {
    metrics.inc('updates');
    const text = ctx.message.text;
    const input = snippet(text);
    const start = Date.now();
    let result: Conversion | null;
    try {
      result = await convert(text);
    } catch (err) {
      metrics.inc('errors');
      log.error('convert.fail', { ...logContext(ctx), input, error: String(err) });
      return ctx.reply(MESSAGES.error);
    }

    const ms = Date.now() - start;

    if (!result) {
      metrics.inc('notFound');
      // Distinguish "they didn't send a link at all" from "link found but
      // unparseable" — the two need different product responses.
      const reason = /https?:\/\//i.test(text) ? 'unsupported-or-no-coords' : 'no-url';
      log.info('convert.notfound', { ...logContext(ctx), input, reason, ms });
      return ctx.reply(MESSAGES.notFound);
    }

    metrics.recordConversion(result.source);
    log.info('convert.ok', { ...logContext(ctx), input, ...placeFields(result), ms });
    await replyConversion(ctx, result);
  });

  // Inline mode: powers the Share button. The query is a map URL (pre-filled by
  // switch_inline_query); we re-convert it and return a result that, when
  // tapped in the chosen chat, posts the same caption + app buttons.
  bot.on('inline_query', async (ctx) => {
    metrics.inc('inlineQueries');
    const input = snippet(ctx.inlineQuery.query);
    let result: Conversion | null = null;
    try {
      result = await convert(ctx.inlineQuery.query);
    } catch (err) {
      metrics.inc('errors');
      log.error('convert.fail', { ...logContext(ctx), mode: 'inline', input, error: String(err) });
    }

    if (!result) {
      log.info('convert.notfound', { ...logContext(ctx), mode: 'inline', input });
      return ctx.answerInlineQuery([], {
        cache_time: 0,
        button: { text: MESSAGES.inlineNoResult, start_parameter: 'start' },
      });
    }

    log.info('convert.ok', { ...logContext(ctx), mode: 'inline', input, ...placeFields(result) });

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

/** Replies with the conversion caption + app buttons (incl. share). */
function replyConversion(ctx: Context, result: Conversion) {
  return ctx.replyWithMarkdownV2(renderCaption(result), {
    link_preview_options: { is_disabled: true },
    ...buildKeyboard(result),
  });
}

/** Stable, unique-per-place id for an inline result (≤64 bytes). */
function inlineResultId({ source, place }: Conversion): string {
  return `${source ?? 'loc'}:${place.lat},${place.lon}`.slice(0, 64);
}

/**
 * Renders the metrics snapshot as an HTML summary for the /stats reply.
 * Admin-facing and English-only by design — the bilingual user strings in
 * messages.ts are deliberately not touched here.
 */
function formatStats(): string {
  const s = metrics.snapshot();
  const uptimeH = ((Date.now() - s.startedAt) / 3_600_000).toFixed(1);
  const total = s.cacheHit + s.cacheMiss;
  const hitRate = total ? `${Math.round((s.cacheHit / total) * 100)}%` : 'n/a';
  const sources =
    Object.entries(s.bySource)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n') || '  (none)';

  return [
    '<b>📊 Bot stats</b>',
    `Uptime: ${uptimeH}h`,
    `Updates: ${s.updates}`,
    `Conversions: ${s.conversions}`,
    `Not found: ${s.notFound}`,
    `Errors: ${s.errors}`,
    `Inline queries: ${s.inlineQueries}`,
    `Cache: ${s.cacheHit} hit / ${s.cacheMiss} miss (${hitRate})`,
    '<b>By source:</b>',
    sources,
  ].join('\n');
}
