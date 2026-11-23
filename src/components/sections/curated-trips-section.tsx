import { TripCard } from '@/components/cards/trip-card'
import { SectionHeading } from '@/components/sections/section-heading'
import type { TripCard as TripCardData } from '@/lib/data'

import './curated-trips-section.css'

export const HOMEPAGE_TRIP_LIMIT = 6

const heading = 'Curated Travel Packages'
const description =
  'Explore our curated travel packages designed to suit every budget, travel style, and adventure. From luxury holidays and family vacations to romantic getaways and adventure tours, discover the best travel deals for unforgettable experiences at top destinations.'

export function CuratedTripsSection({
  trips,
  action,
  priorityFirst = false,
}: {
  trips: TripCardData[]
  action: { href: string; label: string }
  /**
   * Preload the first card's cover — only for a section that *opens* the page, where that
   * card is the LCP element. Below a hero the whole grid is below the fold, so every cover
   * lazy-loads instead of competing with the hero for bandwidth (see `payload-image.tsx`).
   */
  priorityFirst?: boolean
}) {
  const visibleTrips = trips.slice(0, HOMEPAGE_TRIP_LIMIT)

  if (visibleTrips.length === 0) return null

  return (
    <section data-curated-trips="" className="py-16 md:py-24">
      <div className="container-content">
        <SectionHeading
          title={heading}
          description={description}
          action={action}
          titleClassName="home-section-title"
          descriptionClassName="home-section-intro ct-description"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
          {visibleTrips.map((trip, index) => (
            <TripCard
              key={trip.id}
              trip={trip}
              priority={priorityFirst && index === 0}
              titleClassName="ct-card-title"
              summaryClassName="ct-card-summary"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
