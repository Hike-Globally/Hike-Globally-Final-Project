import { TripCard } from '@/components/cards/trip-card'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from '@/components/sections/section-heading'
import { sitePath } from '@/i18n/config'
import { getHomepageTrips } from '@/lib/data'
import type { TripCard as TripCardData } from '@/lib/data'
import { resolveLink } from '@/lib/links'
import { isRenderableTripPick, resolveTripSection } from '@/lib/trip-selection'
import { cn } from '@/lib/utils'
import type { FeaturedTripsBlock, Trip } from '@/payload-types'

const columnClass: Record<string, string> = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
}

export async function FeaturedTrips({ block }: { block: FeaturedTripsBlock }) {
  const limit = block.limit ?? 3

  // The editor's own picks, minus any that cannot be drawn on a card (unpopulated relationship or
  // a since-deleted hero image). A pick that would render an empty image box counts as no pick, so
  // the automatic list below still gets its chance.
  const manualPicks =
    block.source === 'manual' && Array.isArray(block.trips)
      ? block.trips.filter(
          (trip): trip is Trip =>
            typeof trip !== 'number' && Boolean(trip) && isRenderableTripPick(trip),
        )
      : []

  // Nothing to read when the editor chose trips by hand. Otherwise: featured trips, falling back
  // to the newest published ones so an unflagged catalogue still fills this section — a block that
  // renders `null` takes its heading and "View all" link with it, which looks like a broken CMS.
  const automatic = manualPicks.length > 0 ? [] : await getHomepageTrips(limit)

  const trips = resolveTripSection(manualPicks as unknown as TripCardData[], automatic)

  if (trips.length === 0) return null

  const viewAll = resolveLink(block.viewAllLink) ?? {
    href: sitePath('/trips'),
    label: 'View all trips',
    newTab: false,
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container-content">
        <SectionHeading title={block.heading} description={block.subheading} action={viewAll} />

        {/* `limit` sizes the automatic list; a manual selection is exactly what the editor picked,
            so it is allowed to run longer — up to double — rather than silently dropping cards. */}
        <div className={cn('grid gap-6', columnClass[block.columns ?? '3'] ?? columnClass['3'])}>
          {trips.slice(0, limit * 2).map((trip, index) => (
            <Reveal key={trip.id} delay={index * 80}>
              <TripCard trip={trip} priority={index === 0} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
