import { notFound } from 'next/navigation'
import { ArchivePagination } from '@/components/sections/archive-pagination'
import {
  archiveHref,
  hasArchiveFilters,
  parsePage,
  type ArchiveProps,
  tripFilters,
  filterQuery,
  searchString,
} from '@/lib/catalog'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown } from 'lucide-react'

import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { TripsExplorer } from '@/components/views/trips-explorer'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getDestinationFilterOptions, getSettings, getTripsPage } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

import './trips.css'

export const revalidate = 3600

const TRIPS_HERO_IMAGE = '/images/trips/hero.jpg'

export async function generateMetadata({ searchParams }: ArchiveProps): Promise<Metadata> {
  const dict = dictionary
  const search = await searchParams
  const page = parsePage(search.page) ?? notFound()
  const settings = await getSettings()

  return buildMetadata({
    title: page === 1 ? dict.trips.listingTitle : `${dict.trips.listingTitle} — Page ${page}`,
    description: dict.trips.listingSubtitle,
    image: settings.defaultOgImage,
    // Filters are stripped here on purpose: a filtered view is not a URL of its own, so its
    // canonical stays the plain listing. The robots meta below is what keeps it out of the index.
    path: archiveHref('trips', page),
    siteName: settings.siteName,
    // `destination` × `difficulty` × `season` × `type` × `sort` is a combinatorial number of
    // near-identical pages. Crawl them for the trips they link to; never index them.
    noIndex: hasArchiveFilters('trips', searchString(search)),
    follow: true,
  })
}

/**
 * ============================================================================
 * TRIPS LISTING — `/trips`
 * ============================================================================
 */
export default async function TripsPage({ searchParams }: ArchiveProps) {
  const dict = dictionary
  const search = await searchParams
  const page = parsePage(search.page) ?? notFound()
  const destinations = await getDestinationFilterOptions()
  const filters = tripFilters(searchString(search), destinations)
  const destinationId = destinations.find((d) => d.slug.toLowerCase() === filters.destination)?.id
  const { docs: trips, totalDocs, totalPages } = await getTripsPage(page, filters, destinationId)
  if (page > 1 && page > totalPages) notFound()

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
        {/* One flat ink wash plus the shared photo scrim — the same recipe every
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
          filters={filters}
          totalDocs={totalDocs}
          cardSummaryClassName="trips-card-summary"
          destinations={destinations.map((destination) => ({
            slug: destination.slug,
            name: destination.name,
          }))}
        />
      </section>

      <ArchivePagination
        archive="trips"
        page={page}
        totalPages={totalPages}
        filters={filterQuery(filters)}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: sitePath('/') },
            { name: dict.nav.trips, url: archiveHref('trips', page) },
          ]),
          // A CollectionPage whose ItemList is exactly the cards above: the same titles and the
          // same canonical URLs, so the listing hands Google the site structure behind /trips.
          webPageJsonLd({
            type: 'CollectionPage',
            name: dict.trips.listingTitle,
            description: dict.trips.listingSubtitle,
            url: archiveHref('trips', page),
            siteName: dict.structuredData.organization,
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
