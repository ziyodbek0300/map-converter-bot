// Core domain types, shared across the map conversion logic.

import type { Provider } from './providers';

export interface Place {
  lat: number;
  lon: number;
  /** Optional human-readable query/name preserved from the source link. */
  label?: string;
}

export interface ProviderDef {
  /** Display name, e.g. "Google Maps". */
  name: string;
  /** Leading icon shown next to the name (may be empty). */
  icon: string;
  /** Hostnames that identify this provider as the source of a link. */
  hostPatterns: RegExp[];
  /** Extracts the place a URL points at, or null if none can be found. */
  parse(url: URL): Place | null;
  /** Builds a link to this provider for the given place. */
  build(place: Place): string;
}

export interface Conversion {
  /** Source app the link came from, or null for a shared Telegram location. */
  source: Provider | null;
  place: Place;
  /** Generated links for every provider except the source. */
  targets: Array<{ provider: Provider; url: string }>;
}

/**
 * Why a piece of text could not be converted. Kept distinct so the bot can
 * tailor its reply — notably `no-coords` (a recognized map link that simply
 * carries no coordinates, e.g. a Google "share place" link that resolves to
 * `?q=<name>&ftid=…`) deserves a different hint than an unrecognized link.
 */
export type ConvertFailure =
  | 'no-url' // no http(s) link in the text at all
  | 'unsupported' // a link, but not from a provider we recognize
  | 'no-coords'; // a recognized provider link with no extractable coordinates

/** Outcome of {@link convert}: either a conversion or a typed failure reason. */
export type ConvertResult =
  | { ok: true; value: Conversion }
  | { ok: false; reason: ConvertFailure };

// `Provider` is the set of registered provider keys; defined alongside the
// registry in ./providers and re-exported here for a single type surface.
export type { Provider };
