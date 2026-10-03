import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DestinationCard } from '@/components/cards/destination-card'
import { Reveal } from '@/components/motion/reveal'
import { PageHeader } from '@/components/sections/page-header'
import { JsonLd } from '@/components/seo/json-ld'
import { getDictionary } from '@/i18n/dictionaries'
import { isLocale, localizedPath, type Locale } from '@/i18n/config'
import { getDestinations } from '@/lib/data'
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
    title: dict.destinations.listingTitle,
    description: dict.destinations.listingSubtitle,
    path: localizedPath(locale, '/destinations'),
    locale,
  })
}

/** DESTINATIONS LISTING — `/[locale]/destinations` */
export default async function DestinationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params
  if (!isLocale(localeParam)) notFound()

  const locale = localeParam as Locale
  const dict = getDictionary(locale)
  const destinations = await getDestinations(locale)

  const [lead, ...rest] = destinations

  return (
    <>
      <PageHeader
        locale={locale}
        title={dict.destinations.listingTitle}
        lead={dict.destinations.listingSubtitle}
        breadcrumbs={[
          { label: dict.nav.home, href: localizedPath(locale, '/') },
          { label: dict.nav.destinations },
        ]}
      />

      <section className="py-14 md:py-20">
        <div className="container-content">
          {destinations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-mist p-12 text-center">
              <h2 className="heading-md">{dict.common.noResultsTitle}</h2>
              <p className="lead mx-auto mt-3 max-w-lg">{dict.common.noResultsText}</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {lead ? (
                <Reveal>
                  <DestinationCard destination={lead} locale={locale} size="large" priority />
                </Reveal>
              ) : null}
              <div className="grid gap-6 sm:grid-cols-2">
                {rest.map((destination, index) => (
                  <Reveal key={destination.id} delay={index * 70}>
                    <DestinationCard destination={destination} locale={locale} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.nav.home, url: localizedPath(locale, '/') },
          { name: dict.nav.destinations, url: localizedPath(locale, '/destinations') },
        ])}
      />
    </>
  )
}
