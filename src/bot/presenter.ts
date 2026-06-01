// Presentation layer: turns a Conversion into the text and inline keyboards the
// bot replies with. Kept separate from the bot wiring so message formatting can
// change without touching transport logic.

import { Markup } from 'telegraf';
import {
  type Conversion,
  providerName,
  providerIcon,
  providerLabel,
} from '../domain';

/** How many provider buttons to place per keyboard row. */
const BUTTONS_PER_ROW = 2;

/** Builds the MarkdownV2 caption shown above the conversion buttons. */
export function renderCaption({ source, place }: Conversion): string {
  // No source app → the coords came from a shared Telegram location/venue.
  const header = source
    ? `${providerIcon(source)} *${escapeMarkdownV2(providerName(source))}*`
    : '📍 *Location \\/ Joylashuv*';
  return [
    header,
    place.label ? `📌 ${escapeMarkdownV2(place.label)}` : null,
    `📍 \`${place.lat}, ${place.lon}\``,
    '',
    'Open in / Ochish:',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

/**
 * Inline keyboard for a direct reply: one URL button per target app
 * (BUTTONS_PER_ROW per row), plus a full-width "Share" button.
 *
 * The share button uses switch_inline_query: tapping it opens Telegram's chat
 * picker pre-filled with "@bot <query>". Picking the inline result there sends
 * the full message — caption AND these same app buttons — into that chat
 * (see the inline_query handler). It carries the place as a map URL so the
 * inline handler can re-derive the conversion.
 */
export function buildKeyboard(conversion: Conversion) {
  const shareButton = Markup.button.switchToChat(
    '📤 Share / Ulashish',
    shareQuery(conversion)
  );
  return Markup.inlineKeyboard([
    ...chunk(buildAppButtons(conversion.targets), BUTTONS_PER_ROW),
    [shareButton],
  ]);
}

/**
 * Inline keyboard for an inline-mode result: the app buttons only (no share
 * button, to avoid a share-within-a-share loop).
 */
export function buildAppKeyboard(targets: Conversion['targets']) {
  return Markup.inlineKeyboard(chunk(buildAppButtons(targets), BUTTONS_PER_ROW));
}

function buildAppButtons(targets: Conversion['targets']) {
  return targets.map((t) => Markup.button.url(providerLabel(t.provider), t.url));
}

/** The query pre-filled into the chat picker — a map URL that round-trips. */
export function shareQuery(conversion: Conversion): string {
  return conversion.targets[0]?.url ?? '';
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/** Escapes the characters Telegram's MarkdownV2 parser treats as special. */
function escapeMarkdownV2(s: string): string {
  return s.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}
