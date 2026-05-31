// Provider registry. Each map provider is one self-contained entry: its
// display metadata, the hostnames that identify it, how to parse coordinates
// out of its URLs, and how to build a link to it.
//
// To support a new provider, add one entry to PROVIDERS — no other file needs
// to change (Open/Closed Principle).

import { firstCoord, LATLON_RE } from './coords';
import type { Place, ProviderDef } from './types';

/** Decoded pathname — providers read coordinates from it directly. */
function path(url: URL): string {
  return decodeURIComponent(url.pathname);
}

const google: ProviderDef = {
  name: 'Google Maps',
  icon: '🟢',
  hostPatterns: [
    /(^|\.)google\.[a-z.]+$/i,
    /(^|\.)goo\.gl$/i,
    /(^|\.)maps\.app\.goo\.gl$/i,
  ],
  parse(url) {
    const p = path(url);

    // /place/Name/ or /search/Name/ — keep the name as a label regardless of
    // which coordinate source we end up using.
    const nameMatch = p.match(/\/(?:place|search)\/([^/@]+)/);
    const rawName = nameMatch
      ? nameMatch[1].replace(/\+/g, ' ').replace(/,\s*$/, '').trim()
      : '';
    // Drop the "name" if it's really just the coordinates (e.g. /search/41.2,+69.2).
    const label = rawName && !LATLON_RE.test(rawName) ? rawName : undefined;

    // Coordinate sources in priority order. The pin (!3d!4d) and ?q=/?ll= point
    // at the actual place; @lat,lon is only the map CENTER (wherever the view
    // was scrolled) and must come last, or links land "near but not exact".
    // Google uses lat,lon ordering.

    // !3dlat and !4dlon — the pin Google attaches to the place. Highest
    // priority. The two can appear in either order in the data blob, so match
    // each independently rather than assuming !3d comes before !4d.
    const lat3d = p.match(/!3d(-?\d+\.?\d*)/);
    const lon4d = p.match(/!4d(-?\d+\.?\d*)/);
    const pin = lat3d && lon4d ? `${lat3d[1]},${lon4d[1]}` : null;

    // /@lat,lon,zoom — the map center. Last resort.
    const at = p.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);

    const sources = [
      pin,
      url.searchParams.get('q'),
      url.searchParams.get('query'),
      url.searchParams.get('destination'),
      url.searchParams.get('ll'),
      url.searchParams.get('center'),
      at ? at[0] : null, // "@lat,lon"
      p, // any lat,lon pair in the path
    ];
    return firstCoord(sources, 'latlon', label);
  },
  build(place) {
    return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`;
  },
};

const yandex: ProviderDef = {
  name: 'Yandex Maps',
  icon: '🟡',
  hostPatterns: [
    /(^|\.)yandex\.[a-z.]+$/i,
    /(^|\.)maps\.yandex\.[a-z.]+$/i,
    /(^|\.)yandex\.ru$/i,
  ],
  parse(url) {
    // Yandex stores coords as lon,lat. Sources in priority order: the actual
    // pin (whatshere[point], pt) beats ll, which is only the map CENTER — same
    // center-vs-pin trap as Google.
    return firstCoord(
      [
        url.searchParams.get('whatshere[point]'), // pinned place
        url.searchParams.get('pt'), // explicit marker
        url.searchParams.get('ll'), // map center — last resort
        path(url), // /maps/.../53.9,27.5/ in the path
      ],
      'lonlat'
    );
  },
  build(place) {
    const { lat, lon } = place;
    // Yandex wants ll=lon,lat and a marker via pt=lon,lat,pm2rdm
    return `https://yandex.com/maps/?ll=${lon},${lat}&z=16&pt=${lon},${lat},pm2rdm`;
  },
};

const apple: ProviderDef = {
  name: 'Apple Maps',
  icon: '🍎',
  hostPatterns: [/(^|\.)maps\.apple\.com$/i, /(^|\.)apple\.com$/i],
  parse(url) {
    // Apple uses lat,lon ordering.
    return firstCoord(
      [
        url.searchParams.get('ll'),
        url.searchParams.get('sll'),
        url.searchParams.get('coordinate'),
        url.searchParams.get('center'),
        url.searchParams.get('q'),
      ],
      'latlon'
    );
  },
  build(place) {
    const { lat, lon } = place;
    return `https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(
      place.label ?? `${lat},${lon}`
    )}`;
  },
};

const twogis: ProviderDef = {
  name: '2GIS',
  icon: '🟩',
  hostPatterns: [/(^|\.)2gis\.[a-z.]+$/i],
  parse(url) {
    // 2GIS uses lon,lat ordering.
    return firstCoord(
      [
        url.searchParams.get('m'), // ?m=lon,lat/zoom — map view / marker
        path(url), // /geo/<id>/lon,lat or /firm/<id>/lon,lat
      ],
      'lonlat'
    );
  },
  build(place) {
    const { lat, lon } = place;
    // 2GIS expects lon,lat and a zoom in the m= param, plus a pin via /geo/.
    return `https://2gis.ru/geo/${lon},${lat}?m=${lon},${lat}/16`;
  },
};

export const PROVIDERS = {
  google,
  yandex,
  apple,
  '2gis': twogis,
} satisfies Record<string, ProviderDef>;

export type Provider = keyof typeof PROVIDERS;
