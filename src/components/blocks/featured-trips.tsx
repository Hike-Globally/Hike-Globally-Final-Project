import {
  CuratedTripsSection,
  HOMEPAGE_TRIP_LIMIT,
} from '@/components/sections/curated-trips-section'
import { sitePath } from '@/i18n/config'
import { getHomepageTrips } from '@/lib/data'
import type { TripCard as TripCardData } from '@/lib/data'
import { resolveLink } from '@/lib/links'
import { isRenderableTripPick, resolveTripSection } from '@/lib/trip-selection'
import type { FeaturedTripsBlock, Trip } from '@/payload-types'

export async function FeaturedTrips({ block }: { block: FeaturedTripsBlock }) {
  // Keep the editor's picks, but never render more than six cards. If the block has no valid
  // manual picks, load up to six featured trips (or the newest published trips as a fallback).
  const manualPicks =
    block.source === 'manual' && Array.isArray(block.trips)
      ? block.trips.filter(
          (trip): trip is Trip =>
            typeof trip !== 'number' && Boolean(trip) && isRenderableTripPick(trip),
        )
      : []

  const automatic = manualPicks.length > 0 ? [] : await getHomepageTrips(HOMEPAGE_TRIP_LIMIT)

  const trips = resolveTripSection(manualPicks as unknown as TripCardData[], automatic).slice(
    0,
    HOMEPAGE_TRIP_LIMIT,
  )

  if (trips.length === 0) return null

  const viewAll = resolveLink(block.viewAllLink) ?? {
    href: sitePath('/trips'),
    label: 'View all trips',
    newTab: false,
  }

  return <CuratedTripsSection trips={trips} action={{ href: viewAll.href, label: viewAll.label }} />
}
