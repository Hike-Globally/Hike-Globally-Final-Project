import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'

import { Reveal } from '@/components/motion/reveal'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { PayloadImageFill } from '@/components/ui/payload-image'
import { JsonLd } from '@/components/seo/json-ld'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getDestinations, type DestinationCard } from '@/lib/data'
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
  const [featuredDestination, ...otherDestinations] = destinations
  const destinationCount = String(destinations.length).padStart(2, '0')

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink text-mist">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_42%,rgba(18,69,89,0.58),transparent_62%)]"
          aria-hidden="true"
        />
        <div className="container-content relative grid min-h-[720px] items-center gap-12 pt-32 pb-12 sm:min-h-[760px] lg:grid-cols-[0.9fr_1fr] lg:gap-16 lg:pt-32 lg:pb-16">
          <div className="max-w-xl">
            <Breadcrumbs
              items={[
                { label: dict.nav.home, href: sitePath('/') },
                { label: dict.nav.destinations },
              ]}
            />

            <p className="eyebrow mt-10 text-sage">The destination atlas · Nepal</p>
            <h1 className="heading-display mt-5 text-white">
              <span className="block">The Himalaya,</span>
              <span className="block text-sage">in all its scale.</span>
            </h1>
            <p className="lead mt-6 max-w-xl text-mist/75">{dict.destinations.listingSubtitle}</p>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                href="#regions"
                className="group inline-flex items-center gap-3 border-b border-sage/70 pb-2 text-sm font-medium text-white transition-colors hover:border-white"
              >
                Explore the atlas
                <ArrowDown
                  className="size-4 transition-transform duration-300 group-hover:translate-y-1"
                  aria-hidden="true"
                />
              </Link>
              <span className="text-sm text-mist/55">
                Led by people who call these mountains home.
              </span>
            </div>

            <div className="mt-12 grid max-w-md grid-cols-2 gap-6 border-t border-white/15 pt-5">
              <div>
                <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-sage uppercase">
                  Places on the map
                </p>
                <p className="mt-2 font-heading text-3xl font-semibold text-white">
                  {destinationCount}
                </p>
              </div>
              <div>
                <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-sage uppercase">
                  A different kind of trip
                </p>
                <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-mist/75">
                  Planned on the ground, around you.
                </p>
              </div>
            </div>
          </div>

          <FeatureDestination destination={featuredDestination} count={destinationCount} />
        </div>
      </section>

      <section id="regions" className="scroll-mt-8 py-16 md:py-24">
        <div className="container-content">
          <div className="grid gap-6 border-b border-ink/10 pb-8 md:grid-cols-[1fr_0.72fr] md:items-end md:gap-12 md:pb-10">
            <div>
              <p className="eyebrow">A closer look</p>
              <h2 className="heading-xl mt-3 max-w-2xl">Find the Nepal that feels like yours.</h2>
            </div>
            <p className="max-w-xl text-[0.98rem] leading-relaxed text-ink-60 md:justify-self-end">
              From well-loved trails to quieter corners beyond the usual route, each region has a
              character all its own. Start with a place; we will help with the rest.
            </p>
          </div>

          {destinations.length === 0 ? (
            <div className="mt-10 border border-dashed border-ink/15 bg-mist px-6 py-14 text-center md:px-12">
              <p className="eyebrow">The atlas is taking shape</p>
              <h3 className="heading-md mt-3">No destinations are published just yet.</h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-60">
                Check back soon, or tell us what kind of Himalayan journey you have in mind.
              </p>
              <Link
                href={sitePath('/inquiry')}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-deep underline decoration-sage decoration-2 underline-offset-4"
              >
                Plan a trip with us <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          ) : otherDestinations.length > 0 ? (
            <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
              {otherDestinations.map((destination, index) => (
                <Reveal key={destination.id} delay={index * 70}>
                  <AtlasCard destination={destination} index={index + 1} />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm text-ink-60">
              Explore the featured region above, or get in touch and we will help you find your next
              trail.
            </p>
          )}
        </div>
      </section>

      <section className="bg-sage-20 py-14 md:py-20">
        <div className="container-content flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">A good place to begin</p>
            <h2 className="heading-lg mt-3">The right route starts with a real conversation.</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-ink-80">
              Tell us what you are drawn to. Our local team will help shape the region, pace, and
              trail around you.
            </p>
          </div>
          <Link
            href={sitePath('/inquiry')}
            className="group inline-flex shrink-0 items-center justify-center gap-3 bg-ink px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-deep"
          >
            Plan your trip
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
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

function FeatureDestination({
  destination,
  count,
}: {
  destination?: DestinationCard
  count: string
}) {
  if (!destination) {
    return (
      <div className="relative isolate min-h-[460px] overflow-hidden bg-deep sm:min-h-[560px] lg:h-[640px] lg:min-h-0">
        <Image
          src="/images/admin/himalaya-03.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 48vw, 92vw"
          className="-z-20 object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/15 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
          <p className="eyebrow text-sage">The mountains are waiting</p>
          <h2 className="heading-lg mt-3 max-w-md text-white">Your next story starts here.</h2>
        </div>
      </div>
    )
  }

  return (
    <article className="group relative isolate min-h-[460px] overflow-hidden bg-deep sm:min-h-[560px] lg:h-[640px] lg:min-h-0">
      <Link
        href={sitePath(`/destinations/${destination.slug}`)}
        aria-label={`Explore ${destination.name}`}
        className="absolute inset-0 z-10 focus-visible:outline-offset-[-5px]"
      />
      <PayloadImageFill
        media={destination.heroImage}
        size="hero"
        sizes="(min-width: 1024px) 48vw, 92vw"
        priority
        className="-z-20 object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/15 to-ink/10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5 sm:p-7">
        <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-white/85 uppercase">
          A place to begin
        </span>
        <span className="text-[0.65rem] font-semibold tracking-[0.16em] text-white/85 tabular-nums">
          01 / {count}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 sm:p-9">
        <p className="eyebrow text-sage">{regionName(destination.region)}</p>
        <h2 className="heading-lg mt-2 text-white">{destination.name}</h2>
        {destination.tagline ? (
          <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-white/80">
            {destination.tagline}
          </p>
        ) : null}
        <span className="mt-6 inline-flex size-11 items-center justify-center border border-white/60 text-white transition-colors duration-300 group-hover:border-sage group-hover:bg-sage group-hover:text-ink">
          <ArrowUpRight className="size-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

function AtlasCard({ destination, index }: { destination: DestinationCard; index: number }) {
  return (
    <article className="group">
      <Link
        href={sitePath(`/destinations/${destination.slug}`)}
        aria-label={`Explore ${destination.name}`}
        className="block focus-visible:outline-offset-4"
      >
        <div className="relative isolate aspect-[4/5] overflow-hidden bg-ink">
          <PayloadImageFill
            media={destination.heroImage}
            size="tablet"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
            className="-z-20 object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
          />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/10 to-ink/10" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
            <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-white/85 uppercase">
              {regionName(destination.region)}
            </span>
            <span className="text-[0.65rem] font-semibold tracking-[0.16em] text-white/75 tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="text-[0.7rem] font-medium tracking-[0.15em] text-sage uppercase">
                {destination.country}
              </p>
              <h3 className="mt-2 font-heading text-2xl leading-tight font-semibold text-white sm:text-[1.7rem]">
                {destination.name}
              </h3>
              {destination.tagline ? (
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">
                  {destination.tagline}
                </p>
              ) : null}
            </div>
            <span className="mb-0.5 inline-flex size-10 shrink-0 items-center justify-center border border-white/60 text-white transition-colors duration-300 group-hover:border-sage group-hover:bg-sage group-hover:text-ink">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-ink/10 pt-3 text-[0.7rem] font-semibold tracking-[0.15em] text-slate uppercase">
          <span>{destination.country} · Himalaya</span>
          <span className="text-ink/45">Explore region</span>
        </div>
      </Link>
    </article>
  )
}

function regionName(region: string): string {
  const key =
    `region${region.charAt(0).toUpperCase()}${region.slice(1)}` as keyof typeof dictionary.destinations
  return dictionary.destinations[key] ?? region
}
