import { sitePath } from '@/i18n/config'
import type { DestinationCard, TripCard } from '@/lib/data'
import { DIFFICULTY_LEVELS, difficultyLabel, tripsByDifficultyPath } from '@/lib/difficulty'
import { formatPrice } from '@/lib/format'
import { localMediaUrl } from '@/lib/media-url'
import {
  SEASON_VALUES,
  TRIP_TYPE_VALUES,
  seasonLabel,
  tripTypeLabel,
  tripsByDestinationPath,
  tripsBySeasonPath,
  tripsByTypePath,
} from '@/lib/trip-filters'
import { pickAutomaticTrips } from '@/lib/trip-selection'
import type { Media } from '@/payload-types'

export type MegaMenuKind = 'destinations' | 'trips'

export type MegaMenuImage = {
  src: string
  alt: string
  objectPosition: string
}

export type MegaMenuDestination = {
  id: number
  name: string
  slug: string
  href: string
  country: string
  tagline: string | null
  tripCount: number
  featured: boolean
  image: MegaMenuImage | null
}

export type MegaMenuTrip = {
  id: number
  title: string
  slug: string
  href: string
  destinationName: string | null
  durationDays: number
  maxAltitude: number | null
  difficultyLabel: string
  priceFormatted: string
  featured: boolean
  image: MegaMenuImage | null
}

export type MegaMenuTripCompact = {
  id: number
  title: string
  href: string
  durationDays: number
  priceFormatted: string
}

export type MegaMenuFacet = {
  value: string
  label: string
  href: string
  count: number
}

export type MegaMenuData = {
  destinations: {
    items: MegaMenuDestination[]
    totalCount: number
  }
  trips: {
    featuredTrips: MegaMenuTrip[]
    moreTrips: MegaMenuTripCompact[]
    isFeaturedHeading: boolean
    byDestination: MegaMenuFacet[]
    byDifficulty: MegaMenuFacet[]
    byType: MegaMenuFacet[]
    bySeason: MegaMenuFacet[]
    totalCount: number
  }
}

const MAX_DESTINATIONS_IN_MENU = 10
const MAX_FEATURED_TRIPS_IN_MENU = 3
const MAX_MORE_TRIPS_IN_MENU = 4
const MAX_FACET_DESTINATIONS = 6
const MAX_FACET_DIFFICULTIES = 6

/** Strips query string, hash and trailing slash so `/trips/` and `/trips?sort=asc` both match `/trips`. */
const normalizePath = (href: string): string => {
  const withoutHashOrQuery = href.split(/[?#]/, 1)[0] ?? ''
  const trimmed = withoutHashOrQuery.trim().toLowerCase()
  if (trimmed === '/') return '/'
  return trimmed.replace(/\/+$/, '')
}

/**
 * Identifies whether a top-level header nav item should open the Destinations or Trips mega menu.
 * Every other tab (Journal, About, Contact, or deep links to individual pages) returns `null`
 * so existing tabs keep their exact current behavior.
 */
export const resolveMegaMenuKind = (link: { href: string; label: string }): MegaMenuKind | null => {
  const path = normalizePath(link.href)
  if (path === '/destinations') return 'destinations'
  if (path === '/trips') return 'trips'

  if (!path || path === '#') {
    const label = link.label.trim().toLowerCase()
    if (label === 'destinations') return 'destinations'
    if (label === 'trips') return 'trips'
  }

  return null
}

/**
 * Resolves a Payload Media upload into a lightweight image descriptor using the original upload
 * URL (never generated crops) and skipping videos.
 */
const resolveMenuImage = (
  media: number | Media | null | undefined,
  fallbackAlt: string,
): MegaMenuImage | null => {
  if (!media || typeof media === 'number' || !media.url) return null
  if (media.mimeType?.startsWith('video/')) return null
  const src = localMediaUrl(media.url)
  if (!src) return null
  const objectPosition = `${media.focalX ?? 50}% ${media.focalY ?? 50}%`
  return { src, alt: media.alt || fallbackAlt, objectPosition }
}

/**
 * Transforms published Destinations and Trips into the compact, serializable payload the
 * header's Destinations and Trips mega menus render.
 */
export const buildMegaMenuData = ({
  destinations,
  trips,
}: {
  destinations: DestinationCard[]
  trips: TripCard[]
}): MegaMenuData => {
  const tripCountByDestinationSlug = new Map<string, number>()
  const destinationNameBySlug = new Map<string, string>()

  for (const destination of destinations) {
    if (destination.slug) {
      destinationNameBySlug.set(destination.slug.toLowerCase(), destination.name)
    }
  }

  for (const trip of trips) {
    if (trip.destination && typeof trip.destination !== 'number' && trip.destination.slug) {
      const slug = trip.destination.slug.toLowerCase()
      tripCountByDestinationSlug.set(slug, (tripCountByDestinationSlug.get(slug) ?? 0) + 1)
      if (!destinationNameBySlug.has(slug) && trip.destination.name) {
        destinationNameBySlug.set(slug, trip.destination.name)
      }
    }
  }

  const sortedDestinations = [...destinations].sort((a, b) => {
    const featuredDiff = Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    if (featuredDiff !== 0) return featuredDiff
    const countA = tripCountByDestinationSlug.get(a.slug.toLowerCase()) ?? 0
    const countB = tripCountByDestinationSlug.get(b.slug.toLowerCase()) ?? 0
    if (countB !== countA) return countB - countA
    return a.name.localeCompare(b.name)
  })

  const menuDestinations: MegaMenuDestination[] = sortedDestinations
    .slice(0, MAX_DESTINATIONS_IN_MENU)
    .map((destination) => ({
      id: destination.id,
      name: destination.name,
      slug: destination.slug,
      href: sitePath(destination.href ?? `/destinations/${destination.slug}`),
      country: destination.country,
      tagline: destination.tagline ?? null,
      tripCount: tripCountByDestinationSlug.get(destination.slug.toLowerCase()) ?? 0,
      featured: Boolean(destination.featured),
      image: resolveMenuImage(destination.heroImage, destination.name),
    }))

  const flaggedFeatured = trips.filter((trip) => Boolean(trip.featured))
  const automaticFeatured = pickAutomaticTrips(flaggedFeatured, trips).slice(
    0,
    MAX_FEATURED_TRIPS_IN_MENU,
  )
  const featuredIds = new Set(automaticFeatured.map((trip) => trip.id))

  const featuredTrips: MegaMenuTrip[] = automaticFeatured.map((trip) => ({
    id: trip.id,
    title: trip.title,
    slug: trip.slug,
    href: sitePath(`/trips/${trip.slug}`),
    destinationName:
      trip.destination && typeof trip.destination !== 'number' ? trip.destination.name : null,
    durationDays: trip.durationDays,
    maxAltitude: trip.maxAltitude ?? null,
    difficultyLabel: difficultyLabel(trip.difficulty),
    priceFormatted: formatPrice(trip.priceFrom, trip.priceCurrency),
    featured: Boolean(trip.featured),
    image: resolveMenuImage(trip.heroImage, trip.title),
  }))

  const moreTrips: MegaMenuTripCompact[] = trips
    .filter((trip) => !featuredIds.has(trip.id))
    .slice(0, MAX_MORE_TRIPS_IN_MENU)
    .map((trip) => ({
      id: trip.id,
      title: trip.title,
      href: sitePath(`/trips/${trip.slug}`),
      durationDays: trip.durationDays,
      priceFormatted: formatPrice(trip.priceFrom, trip.priceCurrency),
    }))

  const byDestination: MegaMenuFacet[] = Array.from(tripCountByDestinationSlug.entries())
    .map(([slug, count]) => ({
      value: slug,
      label: destinationNameBySlug.get(slug) ?? slug,
      href: tripsByDestinationPath(slug),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, MAX_FACET_DESTINATIONS)

  const difficultyCounts = new Map<string, number>()
  const typeCounts = new Map<string, number>()
  const seasonCounts = new Map<string, number>()

  for (const trip of trips) {
    difficultyCounts.set(trip.difficulty, (difficultyCounts.get(trip.difficulty) ?? 0) + 1)
    typeCounts.set(trip.tripType, (typeCounts.get(trip.tripType) ?? 0) + 1)
    for (const season of trip.bestSeasons ?? []) {
      seasonCounts.set(season, (seasonCounts.get(season) ?? 0) + 1)
    }
  }

  const byDifficulty: MegaMenuFacet[] = DIFFICULTY_LEVELS.filter(
    (level) => (difficultyCounts.get(level.value) ?? 0) > 0,
  )
    .slice(0, MAX_FACET_DIFFICULTIES)
    .map((level) => ({
      value: level.value,
      label: level.label,
      href: tripsByDifficultyPath(level.value),
      count: difficultyCounts.get(level.value) ?? 0,
    }))

  const activeTypes: MegaMenuFacet[] = TRIP_TYPE_VALUES.filter(
    (type) => (typeCounts.get(type) ?? 0) > 0,
  ).map((type) => ({
    value: type,
    label: tripTypeLabel(type),
    href: tripsByTypePath(type),
    count: typeCounts.get(type) ?? 0,
  }))
  // Only surface the trip-style facet when published trips actually span multiple styles.
  const byType = activeTypes.length >= 2 ? activeTypes : []

  const bySeason: MegaMenuFacet[] = SEASON_VALUES.filter(
    (season) => (seasonCounts.get(season) ?? 0) > 0,
  ).map((season) => ({
    value: season,
    label: seasonLabel(season),
    href: tripsBySeasonPath(season),
    count: seasonCounts.get(season) ?? 0,
  }))

  return {
    destinations: {
      items: menuDestinations,
      totalCount: destinations.length,
    },
    trips: {
      featuredTrips,
      moreTrips,
      isFeaturedHeading: flaggedFeatured.length > 0,
      byDestination,
      byDifficulty,
      byType,
      bySeason,
      totalCount: trips.length,
    },
  }
}

/**
 * Keeps custom CMS dropdown links an editor added under Header → Destinations / Trips
 * while filtering out entries that duplicate the mega menu's root CTA or auto-listed routes.
 */
export const filterExtraCustomLinks = <T extends { href: string; label: string }>(
  children: T[],
  existingHrefs: ReadonlySet<string>,
  rootHref: string,
): T[] => {
  const normalizedRoot = normalizePath(rootHref)
  const normalizedExisting = new Set(Array.from(existingHrefs, (href) => href.trim().toLowerCase()))
  const normalizedExistingPaths = new Set(Array.from(existingHrefs, (href) => normalizePath(href)))

  const seen = new Set<string>()
  const result: T[] = []

  for (const child of children) {
    const rawKey = child.href.trim().toLowerCase()
    const pathKey = normalizePath(child.href)
    const hasQuery = child.href.includes('?')

    // Drop duplicates of the root index link ("All trips" -> /trips, "All destinations" -> /destinations)
    if (!hasQuery && pathKey === normalizedRoot) continue
    // Drop exact duplicates of links already rendered in the mega menu
    if (normalizedExisting.has(rawKey)) continue
    // Drop duplicate destination/trip detail links
    if (!hasQuery && normalizedExistingPaths.has(pathKey)) continue
    // Drop legacy `?region=` duplicates when `?destination=` for the same slug is already shown
    if (hasQuery) {
      const query = child.href.split('?')[1] ?? ''
      const region = new URLSearchParams(query).get('region')?.trim().toLowerCase()
      if (
        region &&
        (normalizedExisting.has(tripsByDestinationPath(region).toLowerCase()) ||
          Array.from(normalizedExisting).some(
            (href) =>
              href.includes(`destination=${encodeURIComponent(region)}`) ||
              region.startsWith(`${href.split('destination=')[1] ?? '\0'}-`),
          ))
      ) {
        continue
      }
    }

    if (seen.has(rawKey)) continue
    seen.add(rawKey)
    result.push(child)
  }

  return result
}
