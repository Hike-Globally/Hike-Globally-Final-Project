import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown } from 'lucide-react'

import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { TripsExplorer } from '@/components/views/trips-explorer'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getDestinations, getTrips } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata } from '@/lib/seo'

export const revalidate = 3600

const TRIPS_HERO_IMAGE = '/images/trips/hero.jpg'

export async function generateMetadata(): Promise<Metadata> {
  const dict = dictionary

  return buildMetadata({
    title: dict.trips.listingTitle,
    description: dict.trips.listingSubtitle,
    path: sitePath('/trips'),
  })
}

/**
 * ============================================================================
 * TRIPS LISTING — `/trips`
 * ============================================================================
 */
export default async function TripsPage() {
  const dict = dictionary

  const [trips, destinations] = await Promise.all([getTrips(), getDestinations()])

  return (
    <>
      <section
        aria-labelledby="trips-heading"
        data-header-hero
        className="relative isolate flex min-h-[min(78svh,52rem)] items-end overflow-hidden bg-ink text-mist"
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
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/55 to-ink/30"
          aria-hidden="true"
        />

        <div className="container-content relative w-full pt-32 pb-14 md:pb-20">
          <Breadcrumbs
            items={[{ label: dict.nav.home, href: sitePath('/') }, { label: dict.nav.trips }]}
          />

          <p className="eyebrow mt-10 text-sage">Nepal, one trail at a time</p>
          <h1 id="trips-heading" className="heading-display mt-5 max-w-4xl text-white">
            {dict.trips.listingTitle}
          </h1>
          <p className="lead mt-6 max-w-2xl text-mist/80">{dict.trips.listingSubtitle}</p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="#trips"
              className="group inline-flex items-center gap-3 border-b border-sage/70 pb-2 text-sm font-medium text-white transition-colors hover:border-white"
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
        className="scroll-mt-8 py-12 md:py-16"
      >
        <TripsExplorer
          trips={trips}
          destinations={destinations.map((destination) => ({
            slug: destination.slug,
            name: destination.name,
          }))}
        />
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.nav.home, url: sitePath('/') },
          { name: dict.nav.trips, url: sitePath('/trips') },
        ])}
      />
    </>
  )
}
