// Conversion pipeline: wires the provider registry into the public API.
// Pure domain logic — no Telegram or I/O beyond the short-link HTTP redirect.

import { PROVIDERS } from './providers';
import type { Conversion, Place, Provider } from './types';
import { TtlCache } from './cache';
import { log } from '../log';
import { metrics } from '../metrics';

// --- Provider metadata accessors -------------------------------------------

export function providerName(p: Provider): string {
  return PROVIDERS[p].name;
}

export function providerIcon(p: Provider): string {
  return PROVIDERS[p].icon;
}

/** Icon + name, e.g. "🟢 Google Maps". */
export function providerLabel(p: Provider): string {
  return `${PROVIDERS[p].icon} ${PROVIDERS[p].name}`;
}

const ALL_PROVIDERS = Object.keys(PROVIDERS) as Provider[];

// --- Hostname → provider detection -----------------------------------------

export function detectProvider(host: string): Provider | null {
  for (const provider of ALL_PROVIDERS) {
    if (PROVIDERS[provider].hostPatterns.some((re) => re.test(host))) {
      return provider;
    }
  }
  return null;
}

// --- URL building -----------------------------------------------------------

export function buildUrl(provider: Provider, place: Place): string {
  return PROVIDERS[provider].build(place);
}

// --- Short-link expansion ----------------------------------------------------

/** Hosts/paths whose links are redirect codes that carry no coordinates. */
const SHORT_LINK_PATTERNS: Array<(url: URL) => boolean> = [
  (u) => /goo\.gl$/i.test(u.hostname),
  (u) => /maps\.app\.goo\.gl$/i.test(u.hostname),
  (u) => /clck\.ru$/i.test(u.hostname),
  (u) => /^\/maps\/-\//i.test(u.pathname), // Yandex: yandex.<tld>/maps/-/<code>
  (u) => /(^|\.)go\.2gis\.com$/i.test(u.hostname), // 2GIS: go.2gis.com/<code>
];

export function isShortLink(url: URL): boolean {
  return SHORT_LINK_PATTERNS.some((test) => test(url));
}

// Browser-like UA. Yandex's edge will serve a bot-challenge HTML page (200 OK,
// no redirect) to obvious bot UAs, which leaves the short link unresolved and
// makes coordinate parsing fail. A realistic UA gets the normal 301.
const BROWSER_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// A short link that comes back without redirecting means Yandex's edge served a
// bot-challenge page instead of the 301 — a transient, IP/rate-based block that
// usually clears on a retry (which is why re-sending the same link works). Retry
// a few times before giving up rather than surfacing a spurious "no link found".
// Defaults preserve the original behavior; env vars allow tuning per deployment.
const EXPAND_MAX_ATTEMPTS = intEnv('EXPAND_MAX_ATTEMPTS', 3);
const EXPAND_RETRY_DELAY_MS = intEnv('EXPAND_RETRY_DELAY_MS', 400);

// Successful expansions are stable (a short code maps to one long URL), so a
// generous TTL is safe and saves repeated network round-trips for forwarded links.
const CACHE_TTL_MS = intEnv('EXPAND_CACHE_TTL_MS', 24 * 60 * 60 * 1000); // 24h
const CACHE_MAX_SIZE = intEnv('EXPAND_CACHE_MAX_SIZE', 1000);

const expandCache = new TtlCache<string>({
  ttlMs: CACHE_TTL_MS,
  maxSize: CACHE_MAX_SIZE,
  onHit: () => metrics.inc('cacheHit'),
  onMiss: () => metrics.inc('cacheMiss'),
});

function intEnv(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchExpanded(input: string): Promise<string> {
  const res = await fetch(input, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'User-Agent': BROWSER_UA,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  return res.url || input;
}

/**
 * Follows redirects on a short link to get the canonical long URL, retrying when
 * the host serves a non-redirecting bot-challenge. Returns the resolved URL
 * string, or the original on failure.
 */
export async function expandShortLink(input: string): Promise<string> {
  const cached = expandCache.get(input);
  if (cached !== undefined) {
    log.debug('expand.hit', { input });
    return cached;
  }
  log.debug('expand.miss', { input });

  for (let attempt = 1; attempt <= EXPAND_MAX_ATTEMPTS; attempt++) {
    try {
      const final = await fetchExpanded(input);
      if (final !== input) {
        expandCache.set(input, final); // only cache successful expansions
        return final;
      }
      log.warn('expand.retry', {
        reason: 'no-redirect',
        attempt,
        max: EXPAND_MAX_ATTEMPTS,
        input,
      });
    } catch (err) {
      log.warn('expand.retry', {
        reason: 'fetch-error',
        attempt,
        max: EXPAND_MAX_ATTEMPTS,
        input,
        error: String(err),
      });
    }
    if (attempt < EXPAND_MAX_ATTEMPTS) await delay(EXPAND_RETRY_DELAY_MS);
  }
  log.warn('expand.failed', { input, attempts: EXPAND_MAX_ATTEMPTS });
  return input;
}

// --- Top-level conversion ----------------------------------------------------

/**
 * Extracts the first map URL from arbitrary text, expands it if it's a short
 * link, parses coordinates, and builds links for every other provider.
 */
export async function convert(text: string): Promise<Conversion | null> {
  const rawUrl = extractFirstUrl(text);
  if (!rawUrl) return null;

  let url = tryParseUrl(rawUrl);
  if (!url) return null;

  // Short links don't carry coords — expand them first.
  if (isShortLink(url)) {
    const expanded = await expandShortLink(url.toString());
    url = tryParseUrl(expanded) ?? url;
  }

  const source = detectProvider(url.hostname);
  if (!source) return null;

  const place = PROVIDERS[source].parse(url);
  if (!place) return null;

  const targets = ALL_PROVIDERS.filter((p) => p !== source).map((p) => ({
    provider: p,
    url: buildUrl(p, place),
  }));

  return { source, place, targets };
}

/**
 * Builds a conversion from raw coordinates (e.g. a Telegram location/venue the
 * user shared rather than a link). With no source app, every provider is a
 * target.
 */
export function convertCoords(lat: number, lon: number, label?: string): Conversion {
  const place: Place = label ? { lat, lon, label } : { lat, lon };
  const targets = ALL_PROVIDERS.map((p) => ({ provider: p, url: buildUrl(p, place) }));
  return { source: null, place, targets };
}

function tryParseUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

const URL_RE = /https?:\/\/\S+/i;

export function extractFirstUrl(text: string): string | null {
  const m = text.match(URL_RE);
  return m ? m[0].replace(/[)\].,]+$/, '') : null;
}
