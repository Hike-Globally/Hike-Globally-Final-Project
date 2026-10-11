import Link from 'next/link'
import { Clock, Compass, MapPin } from 'lucide-react'

import { RichText } from '@/components/content/rich-text'
import { DestinationCard } from '@/components/cards/destination-card'
import { TripCard } from '@/components/cards/trip-card'
import { Reveal } from '@/components/motion/reveal'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PayloadImage, PayloadImageFill } from '@/components/ui/payload-image'
import { dictionary, plural, type Dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import type { DestinationCard as DestinationCardData, TripCard as TripCardData } from '@/lib/data'
import { breadcrumbJsonLd, touristDestinationJsonLd } from '@/lib/seo'
import type { Destination } from '@/payload-types'

const regionLabel = (region: string, dict: Dictionary): string =>
  dict.destinations[
    `region${region.charAt(0).toUpperCase()}${region.slice(1)}` as keyof typeof dict.destinations
  ] ?? region

export function DestinationDetail({
  destination,
  trips,
  otherDestinations,
}: {
  destination: Destination
  trips: TripCardData[]
  otherDestinations: DestinationCardData[]
}) {
  const dict = dictionary

  const seasons = (destination.bestSeasons ?? []).map(
    (season) =>
      dict.destinations[
        `season${season.charAt(0).toUpperCase()}${season.slice(1)}` as keyof typeof dict.destinations
      ] ?? season,
  )

  const mapUrl =
    destination.coordinates?.latitude && destination.coordinates?.longitude
      ? `https://www.openstreetmap.org/?mlat=${destination.coordinates.latitude}&mlon=${destination.coordinates.longitude}#map=9/${destination.coordinates.latitude}/${destination.coordinates.longitude}`
      : null

  return (
    <>
      {/* Hero region: while this banner is on screen the global header stays pinned
          (see header-frame.tsx). */}
      <section
        data-header-hero
        className="relative isolate min-h-[64svh] overflow-hidden bg-ink text-mist"
      >
        <PayloadImageFill
          media={destination.heroImage}
          size="hero"
          sizes="100vw"
          priority
          className="-z-10"
          imageClassName="object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-ink/58" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-ink/85 to-transparent" />

        <div className="container-content pt-28 pb-16 md:pt-36 md:pb-20">
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: dict.nav.home, href: sitePath('/') },
              { label: dict.nav.destinations, href: sitePath('/destinations') },
              { label: destination.name },
            ]}
          />

          <div className="flex flex-wrap items-center gap-3 text-[0.75rem] tracking-[0.14em] text-sage uppercase">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden />
              {destination.country}
            </span>
            <span className="text-mist/40">/</span>
            <span className="flex items-center gap-1.5">
              <Compass className="size-3.5" aria-hidden />
              {regionLabel(destination.region, dict)}
            </span>
          </div>

          <h1 className="heading-xl mt-5 max-w-4xl text-white">{destination.name}</h1>
          {destination.tagline ? (
            <p className="lead mt-5 max-w-2xl text-mist/85">{destination.tagline}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {mapUrl ? (
              <Button asChild variant="outline-light" size="lg">
                <Link href={mapUrl} target="_blank" rel="noopener noreferrer">
                  {dict.destinations.gettingThere}
                </Link>
              </Button>
            ) : null}
            <Button asChild size="lg" variant="sage">
              <Link href="#trips">
                {plural(dict.destinations as unknown as Record<string, string>, trips.length)}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-content grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          {/* Destination copy — 17px pure-black running copy (see `.single-page-body`). */}
          <div className="single-page-body">
            <h2 className="heading-lg">
              {dict.destinations.about} {destination.name}
            </h2>
            <div className="mt-6">
              <RichText content={destination.description} />
            </div>

            {destination.gettingThere ? (
              <div className="mt-12">
                <h3 className="heading-md">{dict.destinations.gettingThere}</h3>
                <div className="mt-5">
                  <RichText content={destination.gettingThere} />
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
            {seasons.length ? (
              <div className="bg-sage-20 p-7">
                <h2 className="heading-md mb-4 flex items-center gap-2">
                  <Clock className="size-4 text-deep" aria-hidden />
                  {dict.destinations.bestTime}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {seasons.map((season) => (
                    <li key={season}>
                      <Badge variant="light">{season}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {destination.gallery?.length ? (
              <div className="grid grid-cols-2 gap-3">
                {destination.gallery.slice(0, 4).map((item, index) => (
                  <div key={item.id ?? index} className="overflow-hidden bg-mist-60">
                    <PayloadImage
                      media={item.image}
                      size="card"
                      sizes="(min-width: 1024px) 20vw, 45vw"
                      className="aspect-square w-full"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {trips.length ? (
        <section id="trips" className="scroll-mt-24 bg-mist py-16 md:py-24">
          <div className="container-content">
            <h2 className="heading-lg mb-3">
              {dict.destinations.tripsHere} {destination.name}
            </h2>
            <p className="lead mb-10">
              {plural(dict.destinations as unknown as Record<string, string>, trips.length)}
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip, index) => (
                <Reveal key={trip.id} delay={index * 70}>
                  <TripCard trip={trip} priority={index < 3} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {otherDestinations.length ? (
        <section className="py-16 md:py-24">
          <div className="container-content">
            <h2 className="heading-lg mb-10">{dict.destinations.listingTitle}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherDestinations.map((destinationItem, index) => (
                <Reveal key={destinationItem.id} delay={index * 70}>
                  <DestinationCard destination={destinationItem} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: sitePath('/') },
            { name: dict.nav.destinations, url: sitePath('/destinations') },
            { name: destination.name, url: sitePath(`/destinations/${destination.slug}`) },
          ]),
          touristDestinationJsonLd({
            destination,
            url: sitePath(`/destinations/${destination.slug}`),
            image:
              typeof destination.heroImage === 'object' && destination.heroImage?.url
                ? destination.heroImage.url
                : undefined,
          }),
        ]}
      />
    </>
  )
}
