import { notFound } from 'next/navigation'
import { ArchivePagination } from '@/components/sections/archive-pagination'
import { archiveHref, PAGE_SIZE, parsePage, type ArchiveProps } from '@/lib/catalog'
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
import { getDestinationsPage, getSettings, type DestinationCard } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

import './destinations.css'

export const revalidate = 3600

/**
 * Full-bleed background for the atlas hero.
 *
 * Deliberately bundled with the site instead of pulled from a destination document: the hero
 * is the masthead of the whole listing, so it must look the same whether one region or twenty
 * are published — and it keeps every destination photo available for its own card below.
 */
const DESTINATIONS_HERO_IMAGE = '/images/destinations/hero.jpg'

export async function generateMetadata({ searchParams }: ArchiveProps): Promise<Metadata> {
  const dict = dictionary
  const page = parsePage((await searchParams).page) ?? notFound()
  const settings = await getSettings()

  return buildMetadata({
    title:
      page === 1
        ? dict.destinations.listingTitle
        : `${dict.destinations.listingTitle} — Page ${page}`,
    description: dict.destinations.listingSubtitle,
    image: settings.defaultOgImage,
    path: archiveHref('destinations', page),
    siteName: settings.siteName,
  })
}

/** DESTINATIONS LISTING — `/destinations` */
export default async function DestinationsPage({ searchParams }: ArchiveProps) {
  const dict = dictionary
  const search = await searchParams
  const page = parsePage(search.page) ?? notFound()
  const { docs: destinations, totalPages } = await getDestinationsPage(page)
  if (page > 1 && page > totalPages) notFound()

  return (
    /* `data-destinations-page` scopes this page's fixed description sizes (see
       `destinations.css`): the hero standfirst and every atlas-card description are pinned
       to 16px here, while the same shared classes and utilities keep their own type
       everywhere else on the site. */
    <div data-destinations-page="">
      {/* HERO — full-width banner. Every destination (the featured one included) now appears in
          the atlas grid below, so the hero stands on its own image rather than on a card.
          Marked as the hero region: the global header stays pinned for as long as it is on
          screen (see header-frame.tsx). */}
      <section
        data-header-hero
        className="hero-region relative isolate flex items-end overflow-hidden bg-ink text-mist"
      >
        <Image
          src={DESTINATIONS_HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden="true"
          className="-z-20 object-cover"
        />
        {/* One flat navy wash plus the shared photo scrim — the same recipe the
            trip and journal heroes use, so every photograph on the site sits under
            the same amount of ink. */}
        <div className="absolute inset-0 -z-10 bg-ink/72" aria-hidden="true" />
        <div className="photo-scrim absolute inset-0 -z-10" aria-hidden="true" />

        <div className="container-content relative w-full pt-32 pb-14 md:pb-20">
          <Breadcrumbs
            items={[
              { label: dict.nav.home, href: sitePath('/') },
              { label: dict.nav.destinations },
            ]}
          />

          <p className="eyebrow mt-10 text-mist">The destination atlas · Nepal</p>
          <h1 className="heading-display hero-title mt-5 max-w-3xl text-white">
            {dict.destinations.listingTitle}
          </h1>
          <p className="lead hero-description mt-6 max-w-2xl text-mist">
            {dict.destinations.listingSubtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="#regions"
              className="group inline-flex items-center gap-3 border-b border-mist/45 pb-2 text-small font-medium text-white transition-colors hover:border-mist"
            >
              Explore the atlas
              <ArrowDown
                className="size-4 transition-transform duration-300 group-hover:translate-y-1"
                aria-hidden="true"
              />
            </Link>
            <span className="text-small text-mist/85">
              Led by people who call these mountains home.
            </span>
          </div>
        </div>
      </section>

      <section id="regions" className="scroll-mt-8 py-16 md:py-24">
        <div className="container-content">
          <div className="grid gap-6 border-b border-slate-20 pb-8 md:grid-cols-[1fr_0.72fr] md:items-end md:gap-12 md:pb-10">
            <div>
              <p className="eyebrow">A closer look</p>
              <h2 className="heading-xl mt-3 max-w-2xl">Find the Nepal that feels like yours.</h2>
            </div>
          </div>

          {destinations.length === 0 ? (
            <div className="mt-10 border border-dashed border-slate-40 bg-mist px-6 py-14 text-center md:px-12">
              <p className="eyebrow">The atlas is taking shape</p>
              <h3 className="heading-md mt-3">No destinations are published just yet.</h3>
              <p className="mx-auto mt-3 max-w-lg description-copy leading-relaxed text-ink-60">
                Check back soon, or tell us what kind of Himalayan journey you have in mind.
              </p>
              <Link
                href={sitePath('/contact')}
                className="mt-6 inline-flex items-center gap-2 text-small font-medium text-deep-90 underline decoration-slate-40 decoration-1 underline-offset-4 transition-colors hover:text-deep-80 hover:decoration-deep"
              >
                Plan a trip with us <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 3xl:grid-cols-4">
              {destinations.map((destination, index) => (
                <Reveal key={destination.id} delay={index * 70}>
                  <AtlasCard destination={destination} index={(page - 1) * PAGE_SIZE + index} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-sage-20 py-14 md:py-20">
        <div className="container-content flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">A good place to begin</p>
            <h2 className="heading-lg mt-3">The right route starts with a real conversation.</h2>
            <p className="mt-4 max-w-xl description-copy leading-relaxed text-ink-80">
              Tell us what you are drawn to. Our local team will help shape the region, pace, and
              trail around you.
            </p>
          </div>
          <Link
            href={sitePath('/contact')}
            className="group inline-flex w-full shrink-0 items-center justify-center gap-3 bg-ink px-6 py-4 text-small font-medium text-white transition-colors hover:bg-deep sm:w-auto"
          >
            Plan your trip
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      <ArchivePagination archive="destinations" page={page} totalPages={totalPages} />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: sitePath('/') },
            { name: dict.nav.destinations, url: archiveHref('destinations', page) },
          ]),
          // A CollectionPage whose ItemList is exactly the atlas cards above.
          webPageJsonLd({
            type: 'CollectionPage',
            name: dict.destinations.listingTitle,
            description: dict.destinations.listingSubtitle,
            url: archiveHref('destinations', page),
            siteName: dict.structuredData.organization,
            items: destinations.map((destination) => ({
              name: destination.name,
              url: sitePath(`/destinations/${destination.slug}`),
            })),
          }),
        ]}
      />
    </div>
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
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
            className="-z-20 object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
          />
          <div className="photo-scrim pointer-events-none absolute inset-0 -z-10" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
            <span className="text-label font-medium tracking-[0.18em] text-mist uppercase">
              {regionName(destination.region)}
            </span>
            <span className="text-label font-medium tracking-[0.16em] text-mist/85 tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
            <div>
              <p className="text-label font-medium tracking-[0.15em] text-mist/85 uppercase">
                {destination.country}
              </p>
              <h3 className="mt-2 font-display text-section font-medium break-words text-white">
                {destination.name}
              </h3>
              {destination.tagline ? (
                <p className="destination-card-description mt-2 max-w-sm card-description-copy leading-relaxed text-mist/85">
                  {destination.tagline}
                </p>
              ) : null}
            </div>
            <span className="mb-0.5 inline-flex size-10 shrink-0 items-center justify-center border border-mist/60 text-white transition-colors duration-300 group-hover:border-white group-hover:bg-white group-hover:text-ink">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-20 pt-3 text-label font-medium tracking-[0.15em] text-slate-80 uppercase">
          <span>{destination.country} · Himalaya</span>
          <span className="text-slate-80">Explore region</span>
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
