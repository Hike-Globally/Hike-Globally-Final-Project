import { TripCard } from '@/components/cards/trip-card'
import { SectionHeading } from '@/components/sections/section-heading'
import type { TripCard as TripCardData } from '@/lib/data'

export const HOMEPAGE_TRIP_LIMIT = 6

const heading = 'Curated Travel Packages'
const description =
  'Explore our curated travel packages designed to suit every budget, travel style, and adventure. From luxury holidays and family vacations to romantic getaways and adventure tours, discover the best travel deals for unforgettable experiences at top destinations.'

export function CuratedTripsSection({
  trips,
  action,
}: {
  trips: TripCardData[]
  action: { href: string; label: string }
}) {
  const visibleTrips = trips.slice(0, HOMEPAGE_TRIP_LIMIT)

  if (visibleTrips.length === 0) return null

  return (
    <section className="py-16 md:py-24">
      <div className="container-content">
        <SectionHeading title={heading} description={description} action={action} />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTrips.map((trip, index) => (
            <TripCard key={trip.id} trip={trip} priority={index < 3} />
          ))}
        </div>
      </div>
    </section>
  )
}
