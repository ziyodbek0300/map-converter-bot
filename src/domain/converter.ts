// Conversion pipeline: wires the provider registry into the public API.
// Pure domain logic — no Telegram or I/O beyond the short-link HTTP redirect.

import { PROVIDERS } from './providers';
import type { Conversion, Place, Provider } from './types';

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

/**
 * Follows redirects on a short link to get the canonical long URL.
 * Returns the resolved URL string, or the original on failure.
 */
export async function expandShortLink(input: string): Promise<string> {
  try {
    const res = await fetch(input, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (map-converter-bot)' },
    });
    return res.url || input;
  } catch {
    return input;
  }
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
