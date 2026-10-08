import type { Metadata } from 'next'

import { PageHeader } from '@/components/sections/page-header'
import { JsonLd } from '@/components/seo/json-ld'
import { TripsExplorer } from '@/components/views/trips-explorer'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getDestinations, getTrips } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata } from '@/lib/seo'

export const revalidate = 3600

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
      <PageHeader
        eyebrow={dict.trips.filterTitle}
        title={dict.trips.listingTitle}
        lead={dict.trips.listingSubtitle}
        breadcrumbs={[{ label: dict.nav.home, href: sitePath('/') }, { label: dict.nav.trips }]}
      />

      <div className="py-12 md:py-16">
        <TripsExplorer
          trips={trips}
          destinations={destinations.map((destination) => ({
            slug: destination.slug,
            name: destination.name,
          }))}
        />
      </div>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.nav.home, url: sitePath('/') },
          { name: dict.nav.trips, url: sitePath('/trips') },
        ])}
      />
    </>
  )
}
