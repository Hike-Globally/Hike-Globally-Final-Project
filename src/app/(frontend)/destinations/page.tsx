import type { Metadata } from 'next'

import { DestinationCard } from '@/components/cards/destination-card'
import { Reveal } from '@/components/motion/reveal'
import { PageHeader } from '@/components/sections/page-header'
import { JsonLd } from '@/components/seo/json-ld'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getDestinations } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const dict = dictionary

  return buildMetadata({
    title: dict.destinations.listingTitle,
    description: dict.destinations.listingSubtitle,
    path: sitePath('/destinations'),
  })
}

/** DESTINATIONS LISTING — `/destinations` */
export default async function DestinationsPage() {
  const dict = dictionary
  const destinations = await getDestinations()

  const [lead, ...rest] = destinations

  return (
    <>
      <PageHeader
        title={dict.destinations.listingTitle}
        lead={dict.destinations.listingSubtitle}
        breadcrumbs={[
          { label: dict.nav.home, href: sitePath('/') },
          { label: dict.nav.destinations },
        ]}
      />

      <section className="py-14 md:py-20">
        <div className="container-content">
          {destinations.length === 0 ? (
            <div className="border border-dashed border-black/10 bg-mist p-12 text-center">
              <h2 className="heading-md">{dict.common.noResultsTitle}</h2>
              <p className="lead mx-auto mt-3 max-w-lg">{dict.common.noResultsText}</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {lead ? (
                <Reveal>
                  <DestinationCard destination={lead} size="large" priority />
                </Reveal>
              ) : null}
              <div className="grid gap-6 sm:grid-cols-2">
                {rest.map((destination, index) => (
                  <Reveal key={destination.id} delay={index * 70}>
                    <DestinationCard destination={destination} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.nav.home, url: sitePath('/') },
          { name: dict.nav.destinations, url: sitePath('/destinations') },
        ])}
      />
    </>
  )
}
