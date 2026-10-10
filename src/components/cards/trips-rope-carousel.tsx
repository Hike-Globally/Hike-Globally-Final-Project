import { RopeCarousel, type RopeCarouselItem } from '@/components/cards/rope-carousel'
import { Reveal } from '@/components/motion/reveal'
import { resolveMediaImage } from '@/components/ui/payload-image'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import type { TripCard } from '@/lib/data'

import { TripCard as TripCardView } from './trip-card'

/**
 * Homepage trips gallery rendered as the "Rope Curve Carousel" — the hanging
 * cards animation from `animation.html` (ropecurvecarousel.framer.website),
 * recreated 1:1 in `rope-carousel.tsx`.
 *
 * The rope needs at least three cards to read as a clothesline; with fewer
 * renderable trips we fall back to the classic card grid so the section never
 * looks thin.
 */
export function TripsRopeCarousel({ trips, label }: { trips: TripCard[]; label?: string }) {
  const dict = dictionary

  const items: RopeCarouselItem[] = trips
    .filter((trip) => typeof trip.heroImage === 'object' && trip.heroImage !== null)
    .map((trip) => ({
      href: sitePath(`/trips/${trip.slug}`),
      title: trip.title,
      caption: trip.summary,
      image: resolveMediaImage(trip.heroImage, 'card'),
    }))

  if (items.length < 3) {
    return (
      <div className="container-content">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip, index) => (
            <Reveal key={trip.id} delay={index * 80}>
              <TripCardView trip={trip} priority={index === 0} />
            </Reveal>
          ))}
        </div>
      </div>
    )
  }

  return <RopeCarousel items={items} label={label ?? dict.nav.trips} className="w-full" />
}
