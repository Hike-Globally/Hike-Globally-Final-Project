# Altitude chart

The altitude chart on a trip page is **generated from the day-by-day itinerary** — an editable
elevation profile of the trek, not an uploaded picture. The image upload still exists, and is used
whenever the itinerary cannot produce a profile.

## For editors

Two fields on each itinerary day drive the chart:

| Field                   | What to enter                                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Place (chart label)** | The short name printed under the day's dot — `Namche Bazaar`, not `Phakding to Namche Bazaar (3,440 m)`. Max 40 characters. Leave empty and the axis prints `Day n`. |
| **Highest point (m)**   | Metres above sea level at the **highest point reached that day** — a pass, a viewpoint, a summit — not the bed you sleep in.                                         |

- **Two or more days with an altitude** draw a chart. A single day is a dot, so the page falls back
  to the uploaded **Altitude chart** image instead.
- **Days without an altitude are skipped**, not plotted at zero. You can leave a rest day or a
  transfer day blank and the line simply connects the days around it.
- Points are ordered by the **day number**, so the `day` field decides the x-axis, not the order of
  the rows.
- The day's own **title** is untouched — it stays the full sentence shown in the itinerary. `place`
  is only the chart label.

### Why "highest point", not "sleeping altitude"

A profile chart answers "how high does this trek go?". On a day that crosses a pass and then drops
to a village, the pass is the point a reader wants to see. So the field is the day's high point.

The one thing an itinerary model cannot show is a same-day side trip _beyond_ the day's endpoint:
Ghorepani → Poon Hill → Tadapani is one day with one altitude in the CMS. The author records Poon
Hill's 3,210 m on that day, which is exactly what the route's own printed chart does.

## On the live page

The _Original route map and altitude chart_ section lays out three things, left to right:

```
Original route map  →  Live map  →  Altitude chart
```

- the generated chart spans **two of the three tracks** (an 18-day profile has 18 labels and needs
  the width), with the live map in the third;
- on a phone the row stacks in the same order;
- any of the three can be missing without leaving a hole.

The chart itself (`src/components/sections/altitude-profile.tsx`) is **inline SVG in a server
component** — no chart library, no client boundary, no `useEffect`, maybe 4 KB of markup. It is in
the HTML at first paint, styles from the brand tokens, and scales fluidly with its column. Same
reasoning as the globe (`globe-renderer.ts`) and the map embed (`coordinates-map.tsx`): the payload
cost of a charting library is larger than the chart.

Accessibility: the SVG carries `role="img"` with a one-line summary, and the full series is repeated
in a visually hidden `<table>` — so a screen reader gets the numbers, not a picture of them.

## How the drawing works

`src/lib/altitude-profile.ts` is pure and tested; the component only draws what it returns.

1. **Collect** — days with a finite altitude between 0 and 8,850 m. Anything else is dropped.
2. **Order** — by `day`; `x` is `(day − first) / (last − first)`, so a gap in the numbering leaves
   a visible gap instead of closing up silently.
3. **Scale** — the vertical range is padded 8% (minimum 80 m) and rounded outward to a tidy step on
   the 1 / 2 / 2.5 / 5 × 10ⁿ ladder. It never starts at zero: a 3,200 m trek plotted from sea level
   is a flat smear. The step rounds to the _nearest_ nice value rather than up, because rounding up
   (700 → 1,000) would stretch the axis to 0 and flatten the curve.
4. **Thin labels** — every point is labelled up to 8. Beyond that, labels step by a multiple, and
   the first, last and highest are always labelled.
5. **Paths** — one polyline, one closed area, coordinates rounded to 0.1 so the server and client
   markup match exactly.

## Code map

| File                                           | Role                                                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/lib/altitude-profile.ts`                  | Collecting, ordering, the vertical scale, label thinning, SVG paths.               |
| `src/components/sections/altitude-profile.tsx` | The SVG itself: line, area, dots, value labels, rotated place names, hidden table. |
| `src/collections/Trips.ts`                     | `itinerary[].place` and `itinerary[].altitude` (labelled "Highest point").         |
| `src/components/views/trip-detail.tsx`         | `RouteMapSection` — generated chart, with the upload as the fallback.              |

## Deploying

One migration: **`20261122_160000_itinerary_place`** adds a nullable `place` `varchar` to
`trips_itinerary` and `_trips_v_version_itinerary` (itinerary rows are localized, so the column sits
beside `title`). Additive, no backfill; existing days simply print `Day n` until an editor fills the
label in. `npm run build` / `npm run migrate` applies it.

Nothing else to configure — no API, no key, no external service. The chart is computed at render
time from data already in the database, so it revalidates with the page (see `revalidateTrip`).
