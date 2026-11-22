# Destination map coordinates

Every destination page can carry an interactive map. The editor supplies a latitude and longitude in
the admin; the page renders a pinned OpenStreetMap embed, and the same numbers fill the page's
`GeoCoordinates` structured data.

One pin, one pair of numbers, one place to enter them.

## For editors

Open a destination in the admin and find the **Map coordinates** panel (below **Best time to
visit**).

| Field         | Range                    | What to paste                                                         |
| ------------- | ------------------------ | --------------------------------------------------------------------- |
| **Latitude**  | −90 (south) … 90 (north) | The **first** number of the pair — `27.7172` from `27.7172, 85.3240`. |
| **Longitude** | −180 (west) … 180 (east) | The **second** number — `85.3240`.                                    |

- **Getting a pair:** in Google Maps, right-click the exact spot (a trailhead, a teahouse, the
  village centre) and choose the coordinates at the top of the menu — that copies `27.7172, 85.3240`.
  Any other source works too: OpenStreetMap's share dialog, a GPS track, a guidebook.
- **Both or neither.** Saving one half without the other is rejected, because half a pin cannot be
  mapped. Leave both empty to publish the page without a map — nothing else breaks.
- **`0, 0` is rejected.** That pair is in the Gulf of Guinea and is what a cleared number input
  leaves behind. A real zero is fine: `0, 30` (the equator) and `51.48, 0` (Greenwich) both map.
- Coordinates are not localized — a place has one position in every language.
- Changing a coordinate revalidates the destination page, exactly like editing the copy.

Make it a _point of interest_, not a region outline: zoom level 5 on the page shows roughly a
province or small country, so the pin should sit on the place a traveller would search for.

## On the live page

`DestinationMap` (`src/components/sections/destination-map.tsx`) renders under the destination copy,
above the trips rail:

- a keyless `openstreetmap.org/export/embed.html` iframe with a single marker,
- a small tag over the tile with the coordinates to four decimals (copy/paste friendly),
- a caption (`Getting there — Khumbu, Nepal`), a **View larger map** link to openstreetmap.org, and
  the required ODbL credit.

The whole thing is a **server component with no JavaScript bundle**: the embed is a URL, so React
never hydrates anything and Leaflet/MapLibre/Google Maps SDKs are not needed. This matches the
project's preference for a tiny payload (the homepage globe is hand-written canvas for the same
reason — see `globe-renderer.ts`). The trade-offs are OSM's tile styling, one marker only, and no
route lines. When a map needs several pins (a day-by-day itinerary), a polyline, or branded tiles,
replace `DestinationMap` with a `react-leaflet` client component behind the same props — no caller
changes, but budget ~40 KB of JS, a `'use client'` boundary and a tile-provider key.

## Code map

| File                                          | Role                                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/collections/Destinations.ts`             | The `coordinates` group: ±90 / ±180 bounds, the pair validator, editor hints, `0,0` rejection. |
| `src/lib/coordinates.ts`                      | `parseCoordinates()` guard and the URL builders: embed, public map page, viewport, caption.    |
| `src/components/sections/destination-map.tsx` | The embed itself — iframe, coordinate tag, caption, attribution.                               |
| `src/components/views/destination-detail.tsx` | Validates once, then feeds the hero's **Getting there** button and the map.                    |
| `src/lib/seo.ts`                              | `touristDestinationJsonLd()` emits `GeoCoordinates` from the same guard.                       |

### Why there is a guard at all

`parseCoordinates()` exists because the obvious check — `if (latitude && longitude)` — is wrong:
latitude `0` (the equator: Uganda, Kenya, Indonesia) and longitude `0` (the Greenwich meridian: UK,
Ghana) are real places that a truthiness test silently drops from both the map and the structured
data. It also treats `0, 0` as "no pin" and rejects non-finite or out-of-range numbers, so an
untrusted CMS value can never become a broken iframe URL. Use it anywhere a coordinate pair is read;
`src/lib/coordinates.test.ts` and `src/components/sections/destination-map.test.ts` pin the behaviour
down.

## Deploying

Nothing to configure. No API key, no tile-domain allowlist (`next.config.mjs` unaffected), no
migration — the `coordinates` columns already existed. Two notes:

1. **The map needs a browser request to `openstreetmap.org`.** The iframe is `loading="lazy"`, so it
   only loads when a visitor scrolls to it, and the page degrades to the caption plus the
   **View larger map** link if the embed is blocked. OpenStreetMap's tile usage policy is fine for a
   site at this scale but forbids heavy commercial use — if map views ever reach the millions, move
   the iframe to a tile provider (MapTiler, Stadia, Carto) by changing `mapEmbedUrl()` alone.
2. **Content Security Policy.** The site sets no CSP today. If one is added later, the embed needs
   `frame-src https://www.openstreetmap.org` (the media route's own CSP in
   `src/storage/database-adapter.ts` is unrelated and must not be widened).

## Later: coordinates in the admin

The fields are plain numbers on purpose — they accept a pasted pair on a laptop keyboard with no
JavaScript, and they keep the dashboard honest on a slow connection. A future `type: 'ui'` component
(same pattern as `src/components/admin/redirection-check-field.tsx`) could add a map inside the
admin that sets both values on click. That needs a geocoder (Nominatim, self-hosted or paid) and a
restricted key, so it is deliberately not part of this change.
