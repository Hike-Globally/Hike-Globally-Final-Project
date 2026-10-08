import { TripCard } from '@/components/cards/trip-card'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from '@/components/sections/section-heading'
import { sitePath } from '@/i18n/config'
import { getFeaturedTrips } from '@/lib/data'
import type { FeaturedTripsBlock, Trip } from '@/payload-types'
import type { TripCard as TripCardData } from '@/lib/data'
import { resolveLink } from '@/lib/links'
import { cn } from '@/lib/utils'

const columnClass: Record<string, string> = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
}

export async function FeaturedTrips({ block }: { block: FeaturedTripsBlock }) {
  let trips: TripCardData[] = []

  if (block.source === 'manual' && Array.isArray(block.trips) && block.trips.length > 0) {
    trips = block.trips
      .filter((trip): trip is Trip => typeof trip !== 'number' && Boolean(trip))
      .filter((trip) => Boolean(trip.heroImage) && typeof trip.heroImage !== 'number')
      .map((trip) => trip as unknown as TripCardData)
  }

  if (trips.length === 0) {
    trips = await getFeaturedTrips(block.limit ?? 3)
  }

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

        <div className={cn('grid gap-6', columnClass[block.columns ?? '3'] ?? columnClass['3'])}>
          {trips.slice(0, (block.limit ?? 3) * 2).map((trip, index) => (
            <Reveal key={trip.id} delay={index * 80}>
              <TripCard trip={trip} priority={index === 0} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
