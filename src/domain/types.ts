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
  source: Provider;
  place: Place;
  /** Generated links for every provider except the source. */
  targets: Array<{ provider: Provider; url: string }>;
}

// `Provider` is the set of registered provider keys; defined alongside the
// registry in ./providers and re-exported here for a single type surface.
export type { Provider };
