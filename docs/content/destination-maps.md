# Map coordinates (destinations and trips)

Two pages can carry an interactive map, and both are fed by the same pair of numbers entered in the
admin:

| Where                | Admin panel                                                                                  | What the map shows                                                           |
| -------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Destination** page | **Map coordinates** (below _Best time to visit_)                                             | The destination's location, full-width                                       |
| **Trip** page        | **Trailhead / route coordinates**, inside the _Route map, live map and altitude chart_ panel | The trailhead, sitting **between** _Original route map_ and _Altitude chart_ |

The altitude chart in that same row is generated from the itinerary rather than uploaded — see
[altitude-chart.md](altitude-chart.md).

The page renders a pinned OpenStreetMap embed and the same numbers fill geographic structured data:
`GeoCoordinates` on a destination's `TouristDestination`, and `subjectOf.about` → `Place` →
`GeoCoordinates` on a trip (a `TouristTrip` is a product, not a location, so it has no coordinates
property of its own).

One pin, one pair of numbers, one place to enter them — and one field definition shared by both
collections, so the rules can never drift apart.

## For editors

| Field         | Range                    | What to paste                                                         |
| ------------- | ------------------------ | --------------------------------------------------------------------- |
| **Latitude**  | −90 (south) … 90 (north) | The **first** number of the pair — `27.7172` from `27.7172, 85.3240`. |
| **Longitude** | −180 (west) … 180 (east) | The **second** number — `85.3240`.                                    |

- **Getting a pair:** in Google Maps, right-click the exact spot and choose the coordinates at the
  top of the menu — that copies `27.7172, 85.3240`. Any other source works too: OpenStreetMap's share
  dialog, a GPS track, a guidebook.
- **Both or neither.** Saving one half without the other is rejected, because half a pin cannot be
  mapped. Leave both empty to publish the page without a map — nothing else breaks, and on a trip the
  section falls back to just the images it has.
- **`0, 0` is rejected.** That pair is in the Gulf of Guinea and is what a cleared number input
  leaves behind. A real zero is fine: `0, 30` (the equator) and `51.48, 0` (Greenwich) both map.
- Coordinates are not localized — a place has one position in every language.
- Changing a coordinate revalidates the page, exactly like editing the copy.

**Choose the point of interest, not a region outline.** The destination map opens at zoom 5 (roughly
a province or small country); a trip map opens at zoom 9 (a valley, so the trailhead's neighbours are
readable). Either way the pin should sit on the place a traveller would search for.

## On the live page

`CoordinatesMap` (`src/components/sections/coordinates-map.tsx`) renders:

- a keyless `openstreetmap.org/export/embed.html` iframe with a single marker,
- a small tag over the tile with the coordinates to four decimals (copy/paste friendly),
- an optional heading, a caption, a **View larger map** link to openstreetmap.org, and the required
  ODbL credit.

**Destination page** — full width under the copy column, above the trips rail.

**Trip page** — the _Route map, live map and altitude chart_ row, in this fixed reading order:

```
Original route map  →  Live map  →  Altitude chart
```

The live map sits between the two images because it is the interactive counterpart of the scanned
route map above it, and the chart is the altitude profile of the same route below it — three views of
one line, left to right. On a phone the three stack in that same order. Any one of them can be
missing: three items lay out on three tracks, two on two, and a lone item keeps the full column.

The whole thing is a **server component with no JavaScript bundle**: the embed is a URL, so React
never hydrates anything and Leaflet/MapLibre/Google Maps SDKs are not needed. This matches the
project's preference for a tiny payload (the homepage globe is hand-written canvas for the same
reason — see `globe-renderer.ts`). The trade-offs are OSM's tile styling, one marker only, and no
route polyline — the uploaded route map still does that job.

## Code map

| File                                          | Role                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/lib/coordinates.ts`                      | `parseCoordinates()` guard, `coordinatesField()` (the shared admin field), URL builders.  |
| `src/components/sections/coordinates-map.tsx` | The embed itself — iframe, coordinate tag, heading, caption, attribution.                 |
| `src/collections/Destinations.ts`             | `coordinatesField({ description })` — destination help text.                              |
| `src/collections/Trips.ts`                    | `coordinatesField({ … })` between the route-map and altitude-chart uploads.               |
| `src/components/views/destination-detail.tsx` | Validates once, then feeds the hero's **Getting there** button and the full-width map.    |
| `src/components/views/trip-detail.tsx`        | `RouteMapSection` — collects the figures, then lays out route map → map → altitude chart. |
| `src/lib/seo.ts`                              | `GeoCoordinates` on a destination, `Place` on a trip, both from the same guard.           |

### Why there is a guard at all

`parseCoordinates()` exists because the obvious check — `if (latitude && longitude)` — is wrong:
latitude `0` (the equator: Uganda, Kenya, Indonesia) and longitude `0` (the Greenwich meridian: UK,
Ghana) are real places that a truthiness test silently drops from both the map and the structured
data. It also treats `0, 0` as "no pin" and rejects non-finite or out-of-range numbers, so an
untrusted CMS value can never become a broken iframe URL. Use it anywhere a coordinate pair is read;
`src/lib/coordinates.test.ts` and `src/components/sections/coordinates-map.test.ts` pin the behaviour
down.

## Deploying

Nothing to configure. No API key, no tile-domain allowlist (`next.config.mjs` unaffected). The one
schema change is migration **`20261122_140000_trip_coordinates`**, which adds the four nullable
numeric columns (`trips.coordinates_latitude|longitude` and their `_trips_v` twins) — additive, no
backfill, and `npm run build` / `npm run migrate` applies it. Two notes:

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
(same pattern as `src/components/admin/redirection-check-field.tsx`) could add a map inside the admin
that sets both values on click. That needs a geocoder (Nominatim, self-hosted or paid) and a
restricted key, so it is deliberately not part of this change.
