import { DestinationCard } from '@/components/cards/destination-card'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from '@/components/sections/section-heading'
import { sitePath } from '@/i18n/config'
import { getFeaturedDestinations } from '@/lib/data'
import type { DestinationCard as DestinationCardData } from '@/lib/data'
import type { Destination, FeaturedDestinationsBlock } from '@/payload-types'
import { resolveLink } from '@/lib/links'

export async function FeaturedDestinations({ block }: { block: FeaturedDestinationsBlock }) {
  let destinations: DestinationCardData[] = []

  if (
    block.source === 'manual' &&
    Array.isArray(block.destinations) &&
    block.destinations.length > 0
  ) {
    destinations = block.destinations
      .filter(
        (destination): destination is Destination =>
          typeof destination !== 'number' && Boolean(destination),
      )
      .filter(
        (destination) =>
          Boolean(destination.heroImage) && typeof destination.heroImage !== 'number',
      )
      .map((destination) => destination as unknown as DestinationCardData)
  }

  if (destinations.length === 0) {
    destinations = await getFeaturedDestinations(block.limit ?? 3)
  }

  if (destinations.length === 0) return null

  const viewAll = resolveLink(block.viewAllLink) ?? {
    href: sitePath('/destinations'),
    label: 'View all destinations',
    newTab: false,
  }

  const editorial = block.layout === 'editorial' && destinations.length >= 3

  return (
    <section className="py-16 md:py-24">
      <div className="container-content">
        <SectionHeading title={block.heading} description={block.subheading} action={viewAll} />

        {editorial ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <DestinationCard destination={destinations[0]!} size="large" priority />
            </Reveal>
            <div className="grid gap-6">
              {destinations.slice(1, 3).map((destination, index) => (
                <Reveal key={destination.id} delay={index * 90}>
                  <DestinationCard destination={destination} />
                </Reveal>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination, index) => (
              <Reveal key={destination.id} delay={index * 80}>
                <DestinationCard destination={destination} priority={index === 0} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
