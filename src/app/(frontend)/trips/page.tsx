import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown } from 'lucide-react'

import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { TripsExplorer } from '@/components/views/trips-explorer'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getDestinations, getSettings, getTrips } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

import './trips.css'

export const revalidate = 3600

const TRIPS_HERO_IMAGE = '/images/trips/hero.jpg'

export async function generateMetadata(): Promise<Metadata> {
  const dict = dictionary
  const settings = await getSettings()

  return buildMetadata({
    title: dict.trips.listingTitle,
    description: dict.trips.listingSubtitle,
    image: settings.defaultOgImage,
    path: sitePath('/trips'),
    siteName: settings.siteName,
  })
}

/**
 * ============================================================================
 * TRIPS LISTING — `/trips`
 * ============================================================================
 */
export default async function TripsPage() {
  const dict = dictionary

  const [trips, destinations, settings] = await Promise.all([
    getTrips(),
    getDestinations(),
    getSettings(),
  ])

  return (
    <>
      <section
        aria-labelledby="trips-heading"
        data-header-hero
        data-trips-page
        className="hero-region relative isolate flex items-end overflow-hidden bg-ink text-mist"
      >
        <Image
          src={TRIPS_HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden="true"
          className="-z-20 object-cover"
        />
        {/* One flat navy wash plus the shared photo scrim — the same recipe every
            other photographic header on the site uses. */}
        <div className="absolute inset-0 -z-10 bg-ink/72" aria-hidden="true" />
        <div className="photo-scrim absolute inset-0 -z-10" aria-hidden="true" />

        <div className="container-content relative w-full pt-32 pb-14 md:pb-20">
          <Breadcrumbs
            items={[{ label: dict.nav.home, href: sitePath('/') }, { label: dict.nav.trips }]}
          />

          <p className="eyebrow mt-10 text-mist">Nepal, one trail at a time</p>
          <h1 id="trips-heading" className="heading-display hero-title mt-5 max-w-4xl text-white">
            {dict.trips.listingTitle}
          </h1>
          <p className="lead hero-description mt-6 max-w-2xl text-mist">
            {dict.trips.listingSubtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="#trips"
              className="group inline-flex items-center gap-3 border-b border-mist/45 pb-2 text-small font-medium text-white transition-colors hover:border-mist"
            >
              {dict.trips.filterTitle}
              <ArrowDown
                className="size-4 transition-transform duration-300 group-hover:translate-y-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="trips"
        aria-label={dict.trips.filterTitle}
        data-trips-page
        className="scroll-mt-8 py-12 md:py-16"
      >
        <TripsExplorer
          trips={trips}
          cardSummaryClassName="trips-card-summary"
          destinations={destinations.map((destination) => ({
            slug: destination.slug,
            name: destination.name,
          }))}
        />
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: sitePath('/') },
            { name: dict.nav.trips, url: sitePath('/trips') },
          ]),
          // A CollectionPage whose ItemList is exactly the cards above: the same titles and the
          // same canonical URLs, so the listing hands Google the site structure behind /trips.
          webPageJsonLd({
            type: 'CollectionPage',
            name: dict.trips.listingTitle,
            description: dict.trips.listingSubtitle,
            url: sitePath('/trips'),
            siteName: settings.siteName,
            items: trips.map((trip) => ({
              name: trip.title,
              url: sitePath(`/trips/${trip.slug}`),
            })),
          }),
        ]}
      />
    </>
  )
}
