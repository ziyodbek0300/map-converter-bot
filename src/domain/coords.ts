// Shared coordinate parsing utilities used by every provider parser.

import type { Place } from './types';

/**
 * Matches a `lat,lon` pair anywhere in a string. Allows whitespace or a literal
 * `+` between the values — Google's `/search/41.29,+69.21` encodes the space
 * after the comma as `+`, which survives decodeURIComponent.
 */
export const LATLON_RE = /(-?\d{1,3}(?:\.\d+)?)\s*,[\s+]*(-?\d{1,3}(?:\.\d+)?)/;

function isValid(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  );
}

/** Coordinate ordering as it appears in a provider's URLs. */
export type Order = 'latlon' | 'lonlat';

/**
 * Pulls the first lat,lon pair out of a raw string according to the given
 * ordering, or null if none is present / the values are out of range.
 */
export function parseCoord(
  raw: string | null | undefined,
  order: Order
): [number, number] | null {
  const m = raw?.match(LATLON_RE);
  if (!m) return null;
  const a = parseFloat(m[1]);
  const b = parseFloat(m[2]);
  const [lat, lon] = order === 'latlon' ? [a, b] : [b, a];
  return isValid(lat, lon) ? [lat, lon] : null;
}

/**
 * Returns the first valid coordinate from a list of candidate sources, tried in
 * order. Sources are lazily evaluated strings (query params, path fragments).
 * The first that yields a valid pair wins — letting callers express priority
 * (e.g. pin before map-center) simply by ordering the list.
 */
export function firstCoord(
  sources: Array<string | null | undefined>,
  order: Order,
  label?: string
): Place | null {
  for (const raw of sources) {
    const coord = parseCoord(raw, order);
    if (coord) return { lat: coord[0], lon: coord[1], label };
  }
  return null;
}
