import { sitePath } from '@/i18n/config'
import { dictionary } from '@/i18n/dictionaries'
import type { Trip } from '@/payload-types'

/**
 * Pure URL query helpers for `/trips` filtering (destination, season, trip style).
 *
 * Mirrors `src/lib/difficulty.ts`: reading and writing `window.location.search` directly
 * keeps `/trips` statically renderable while letting mega-menu items and external links
 * deep-link into any filtered slice of the catalog.
 */

export const DESTINATION_QUERY_PARAM = 'destination'
export const LEGACY_REGION_QUERY_PARAM = 'region'
export const SEASON_QUERY_PARAM = 'season'
export const TRIP_TYPE_QUERY_PARAM = 'type'

export const SEASON_VALUES = ['spring', 'autumn', 'winter', 'summer'] as const
export type Season = (typeof SEASON_VALUES)[number]

const seasonSet: ReadonlySet<string> = new Set(SEASON_VALUES)

export const isSeason = (value: unknown): value is Season =>
  typeof value === 'string' && seasonSet.has(value)

export const seasonLabel = (value: string): string => {
  switch (value) {
    case 'spring':
      return dictionary.trips.seasonSpring
    case 'summer':
      return dictionary.trips.seasonSummer
    case 'autumn':
      return dictionary.trips.seasonAutumn
    case 'winter':
      return dictionary.trips.seasonWinter
    default:
      return value
  }
}

export const TRIP_TYPE_VALUES = [
  'trekking',
  'expedition',
  'peak-climbing',
  'cultural',
  'heli',
  'multi-sport',
] as const satisfies readonly Trip['tripType'][]

export type TripType = (typeof TRIP_TYPE_VALUES)[number]

const tripTypeSet: ReadonlySet<string> = new Set(TRIP_TYPE_VALUES)

export const isTripType = (value: unknown): value is TripType =>
  typeof value === 'string' && tripTypeSet.has(value)

export const tripTypeLabel = (value: string): string => {
  switch (value) {
    case 'trekking':
      return dictionary.trips.typeTrekking
    case 'expedition':
      return dictionary.trips.typeExpedition
    case 'peak-climbing':
      return dictionary.trips.typePeakClimbing
    case 'cultural':
      return dictionary.trips.typeCultural
    case 'heli':
      return dictionary.trips.typeHeli
    case 'multi-sport':
      return dictionary.trips.typeMultiSport
    default:
      return value
  }
}

const toParams = (search: string) =>
  new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)

const serializeParams = (params: URLSearchParams): string => {
  const next = params.toString()
  return next ? `?${next}` : ''
}

/**
 * Reads `?destination=<slug>` (or legacy `?region=<slug>`) from a query string.
 * When `validSlugs` is provided, rejects unknown slugs so stale links fall back to `'all'`.
 */
export const readDestinationFromSearch = (
  search: string,
  validSlugs?: ReadonlySet<string>,
): string => {
  const params = toParams(search)
  const raw = (
    params.get(DESTINATION_QUERY_PARAM) ??
    params.get(LEGACY_REGION_QUERY_PARAM) ??
    ''
  )
    .trim()
    .toLowerCase()

  if (!raw || raw === 'all') return 'all'
  if (validSlugs && !validSlugs.has(raw)) return 'all'
  return raw
}

export const writeDestinationSearch = (search: string, value: string): string => {
  const params = toParams(search)
  params.delete(LEGACY_REGION_QUERY_PARAM)
  const normalized = value.trim()
  if (!normalized || normalized === 'all') params.delete(DESTINATION_QUERY_PARAM)
  else params.set(DESTINATION_QUERY_PARAM, normalized)
  return serializeParams(params)
}

export const readSeasonFromSearch = (search: string): Season | 'all' => {
  const value = toParams(search).get(SEASON_QUERY_PARAM)
  return value && isSeason(value) ? value : 'all'
}

export const writeSeasonSearch = (search: string, value: Season | 'all'): string => {
  const params = toParams(search)
  if (value === 'all') params.delete(SEASON_QUERY_PARAM)
  else params.set(SEASON_QUERY_PARAM, value)
  return serializeParams(params)
}

export const readTripTypeFromSearch = (search: string): TripType | 'all' => {
  const value = toParams(search).get(TRIP_TYPE_QUERY_PARAM)
  return value && isTripType(value) ? value : 'all'
}

export const writeTripTypeSearch = (search: string, value: TripType | 'all'): string => {
  const params = toParams(search)
  if (value === 'all') params.delete(TRIP_TYPE_QUERY_PARAM)
  else params.set(TRIP_TYPE_QUERY_PARAM, value)
  return serializeParams(params)
}

export const clearTripFilterSearch = (search: string): string => {
  const params = toParams(search)
  params.delete('difficulty')
  params.delete(DESTINATION_QUERY_PARAM)
  params.delete(LEGACY_REGION_QUERY_PARAM)
  params.delete(SEASON_QUERY_PARAM)
  params.delete(TRIP_TYPE_QUERY_PARAM)
  return serializeParams(params)
}

/** Public hrefs for filtered `/trips` views linked from the Trips mega menu. */
export const tripsByDestinationPath = (slug: string): string =>
  sitePath(`/trips?${DESTINATION_QUERY_PARAM}=${encodeURIComponent(slug)}`)

export const tripsBySeasonPath = (season: Season): string =>
  sitePath(`/trips?${SEASON_QUERY_PARAM}=${encodeURIComponent(season)}`)

export const tripsByTypePath = (type: TripType): string =>
  sitePath(`/trips?${TRIP_TYPE_QUERY_PARAM}=${encodeURIComponent(type)}`)
