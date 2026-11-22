import type { Field, NumberField } from 'payload'

/**
 * ============================================================================
 * Map coordinates
 * ============================================================================
 * Editorial coordinates live in Payload — `destinations.coordinates` for a destination,
 * `trips.coordinates` for a trip's route — reach the page as plain numbers, and are then turned into
 * (a) an embedded map URL, (b) a marker position and (c) `GeoCoordinates` structured data. Three
 * call sites, one truth — so the parsing, the guard, the shared admin field and the URL building
 * live here instead of being re-implemented per collection or per component.
 *
 * The guard is the important part. The obvious truthiness check (`latitude && longitude`) is a bug:
 * latitude 0 is the equator (Uganda, Kenya, Indonesia) and longitude 0 is the Greenwich meridian
 * (UK, Ghana), so a real destination sitting on either line silently loses its map and its
 * structured data. Everything below tests for nullish or non-finite values instead, and treats the
 * 0,0 pair — "Null Island", where an empty number input lands by default — as "no coordinates".
 */

/** The subset of a Payload `coordinates` group this module needs. */
export type CoordinatesInput =
  | {
      latitude?: number | null
      longitude?: number | null
    }
  | null
  | undefined

export type Coordinates = {
  latitude: number
  longitude: number
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/**
 * Validates an untrusted coordinate pair.
 *
 * Returns `null` when either half is missing, not a finite number, outside the ±90 / ±180 bounds,
 * or when the pair is exactly 0,0 (an unset form, not a place). Returns the numbers otherwise —
 * including legitimate values of exactly 0 for one half.
 */
export function parseCoordinates(input: CoordinatesInput): Coordinates | null {
  if (!input) return null

  const { latitude, longitude } = input
  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) return null
  if (latitude < -90 || latitude > 90) return null
  if (longitude < -180 || longitude > 180) return null
  if (latitude === 0 && longitude === 0) return null

  return { latitude, longitude }
}

/** `true` when the document has a usable pin. A narrowing helper for template guards. */
export const hasCoordinates = (input: CoordinatesInput): boolean => parseCoordinates(input) !== null

/** Six decimals is ~11 cm — anything longer is noise in a URL and in a React key. */
const round = (value: number): number => Number(value.toFixed(6))

/**
 * The map viewport that shows `coords`.
 *
 * `zoom` counts levels *in* from the whole world: 3 is a continent, 5 a region, 7 a valley, 10 a
 * trailhead — roughly OpenStreetMap's zoom 5 / 7 / 9 / 12. The span halves one step at a time, so a
 * closer map is also a smaller frame and the embed keeps a workable size on the page.
 */
export function mapViewport({ coords, zoom = 5 }: { coords: Coordinates; zoom?: number }): {
  bbox: [number, number, number, number]
  zoom: number
} {
  const safeZoom = Number.isFinite(zoom) ? Math.min(12, Math.max(1, Math.round(zoom))) : 5
  const lonSpan = 360 / 2 ** safeZoom
  const latSpan = lonSpan / 2
  const { latitude, longitude } = coords

  return {
    // bbox is minLon,minLat,maxLon,maxLat. Clamped to the Web Mercator world (±85.05°) because
    // beyond that there are no tiles and the embed renders blank grey.
    bbox: [
      longitude - lonSpan / 2,
      Math.max(-85.05, latitude - latSpan),
      longitude + lonSpan / 2,
      Math.min(85.05, latitude + latSpan),
    ],
    zoom: safeZoom,
  }
}

/**
 * The public map page for a place — the "view larger" link and the no-JavaScript fallback.
 * `zoom` here is OSM's own scale (larger = closer), so it passes straight through.
 */
export function mapPageUrl(coords: Coordinates, zoom = 9): string {
  const lat = round(coords.latitude)
  const lon = round(coords.longitude)
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`
}

/**
 * keyless OpenStreetMap embed of one pinned place.
 *
 * No API key, no JavaScript bundle, no tile-domain allowlist — the browser simply frames a URL,
 * which is in keeping with the project's preference for a tiny payload (see `globe-renderer.ts`).
 * The trade-offs are no custom styling, no clustering, and no drag-to-set inside the admin.
 *
 * Attribution lives in the embed's own chrome; the `<figcaption>` beside it still credits
 * OpenStreetMap contributors, as the ODbL asks.
 */
export function mapEmbedUrl({
  coords,
  zoom = 5,
  label,
}: {
  coords: Coordinates
  zoom?: number
  /** Popup title, normally the destination name. `&` is stripped: the embed's parser splits on it. */
  label?: string
}): string {
  const view = mapViewport({ coords, zoom })
  // Built by hand rather than with `URLSearchParams`, which escapes the separating commas to
  // `%2C`. Commas are legal in a query string, and the embed's parser expects them literal.
  const query = [
    `bbox=${view.bbox.map(round).join(',')}`,
    'layer=mapnik',
    // The marker is `lat,lon` — the reverse of bbox, and the classic embed gotcha.
    `marker=${round(coords.latitude)},${round(coords.longitude)}`,
  ]
  if (label) query.push(`title=${encodeURIComponent(label.replace(/&/g, 'and'))}`)

  return `https://www.openstreetmap.org/export/embed.html?${query.join('&')}`
}

/** `27.7172, 85.3240` — the clipboard-friendly form, for the map's caption. */
export function formatCoordinates(coords: Coordinates, decimals = 4): string {
  return `${coords.latitude.toFixed(decimals)}, ${coords.longitude.toFixed(decimals)}`
}

/**
 * The `coordinates` pair as an admin field, shared by Destinations and Trips.
 *
 * A factory rather than two copies: the ±90 / ±180 bounds, the "both or neither" rule, the `0,0`
 * rule and the editor hints have to be identical everywhere, or one collection quietly accepts a pin
 * the other rejects.
 *
 * `min`/`max` already keep each half in range. What they cannot catch is an editor filling only one
 * field — the page would then have no map, with nothing in the admin explaining why. Both fields
 * carry the pair check (each watches the other), so whichever one the editor filled last raises the
 * error. Drafts skip field validation in Payload, so autosave still works mid-edit; the check bites
 * on publish. `0, 0` is the Gulf of Guinea, and it is what a number input cleared back to zero leaves
 * behind — treated as "no coordinates", matching `parseCoordinates()` above.
 */
const coordinatePairValidator =
  (other: 'latitude' | 'longitude') =>
  (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
    const isSet = (candidate: unknown): candidate is number =>
      typeof candidate === 'number' && Number.isFinite(candidate)

    const thisSet = isSet(value)
    const otherValue = (siblingData ?? {})[other]
    const otherSet = isSet(otherValue)

    if (thisSet !== otherSet) {
      return 'Enter both latitude and longitude, or leave both empty — one alone cannot be mapped.'
    }
    if (thisSet && value === 0 && otherValue === 0) {
      return '0, 0 is the Gulf of Guinea (the “empty pair”). Leave both fields empty instead.'
    }
    return true
  }

const coordinateField = ({
  name,
  label,
  description,
  min,
  max,
  other,
}: {
  name: 'latitude' | 'longitude'
  label: string
  description: string
  min: number
  max: number
  other: 'latitude' | 'longitude'
}): NumberField => ({
  name,
  label,
  type: 'number',
  required: false,
  min,
  max,
  admin: {
    width: '50%',
    step: 0.000001,
    placeholder: name === 'latitude' ? '27.7172' : '85.3240',
    description,
  },
  validate: coordinatePairValidator(other),
})

/**
 * A `coordinates` group: latitude and longitude as plain numbers.
 *
 * Plain numbers are deliberate — they accept a pasted pair on any keyboard, need no JavaScript, and
 * keep the dashboard fast on a slow connection. A future `type: 'ui'` component (the pattern in
 * `src/components/admin/redirection-check-field.tsx`) could add a click-to-set map later; that needs
 * a geocoder and a restricted key, so it is not part of this field.
 */
export const coordinatesField = ({
  label = 'Map coordinates',
  description,
}: {
  label?: string
  description?: string
} = {}): Field => ({
  name: 'coordinates',
  type: 'group',
  label,
  admin: description ? { description } : {},
  fields: [
    coordinateField({
      name: 'latitude',
      label: 'Latitude',
      description: '−90 (south) to 90 (north). The first number of a pasted pair.',
      min: -90,
      max: 90,
      other: 'longitude',
    }),
    coordinateField({
      name: 'longitude',
      label: 'Longitude',
      description: '−180 (west) to 180 (east). The second number of a pasted pair.',
      min: -180,
      max: 180,
      other: 'latitude',
    }),
  ],
})
