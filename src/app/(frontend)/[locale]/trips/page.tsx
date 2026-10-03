import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/sections/page-header'
import { JsonLd } from '@/components/seo/json-ld'
import { TripsExplorer } from '@/components/views/trips-explorer'
import { getDictionary } from '@/i18n/dictionaries'
import { isLocale, localizedPath, type Locale } from '@/i18n/config'
import { getDestinations, getTrips } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const dict = getDictionary(locale)

  return buildMetadata({
    title: dict.trips.listingTitle,
    description: dict.trips.listingSubtitle,
    path: localizedPath(locale, '/trips'),
    locale,
  })
}

/**
 * ============================================================================
 * TRIPS LISTING — `/[locale]/trips`
 * ============================================================================
 */
export default async function TripsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params
  if (!isLocale(localeParam)) notFound()

  const locale = localeParam as Locale
  const dict = getDictionary(locale)

  const [trips, destinations] = await Promise.all([getTrips(locale), getDestinations(locale)])

  return (
    <>
      <PageHeader
        locale={locale}
        eyebrow={dict.trips.filterTitle}
        title={dict.trips.listingTitle}
        lead={dict.trips.listingSubtitle}
        breadcrumbs={[{ label: dict.nav.home, href: localizedPath(locale, '/') }, { label: dict.nav.trips }]}
      />

      <div className="py-12 md:py-16">
        <TripsExplorer
          trips={trips}
          locale={locale}
          destinations={destinations.map((destination) => ({
            slug: destination.slug,
            name: destination.name,
          }))}
        />
      </div>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.nav.home, url: localizedPath(locale, '/') },
          { name: dict.nav.trips, url: localizedPath(locale, '/trips') },
        ])}
      />
    </>
  )
}
