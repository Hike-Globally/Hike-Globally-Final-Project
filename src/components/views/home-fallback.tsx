import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { HomepageHeroBackground } from '@/components/blocks/hero-background'
import { DestinationCard } from '@/components/cards/destination-card'
import { DestinationCarousel } from '@/components/cards/destination-carousel'
import { AboutHikeGlobally } from '@/components/sections/about-hike-globally'
import {
  CuratedTripsSection,
  HOMEPAGE_TRIP_LIMIT,
} from '@/components/sections/curated-trips-section'
import { HeroScrollCover } from '@/components/motion/hero-scroll-cover'
import { Reveal } from '@/components/motion/reveal'
import { DifficultyLevels } from '@/components/sections/difficulty-levels'
import { SectionHeading } from '@/components/sections/section-heading'
import { Button } from '@/components/ui/button'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getDestinationSlider, getHomepageTrips, getSettings } from '@/lib/data'

/**
 * Rendered when no page with the slug `home` exists in Payload yet.
 * It still shows real CMS content, so a fresh database produces a presentable site
 * rather than an empty shell.
 */
export async function HomeFallback() {
  const dict = dictionary
  const [settings, trips, destinations] = await Promise.all([
    getSettings(),
    // Same rules as the CMS block: featured trips first, newest published ones if nothing is
    // flagged, so the homepage never loses this section over a missing checkbox.
    getHomepageTrips(HOMEPAGE_TRIP_LIMIT),
    // Three destination cards are visible at a time; the rest are reached with the arrows.
    getDestinationSlider(6),
  ])
  const heroEyebrow = settings.tagline?.trim()
  const showHeroEyebrow = Boolean(heroEyebrow && heroEyebrow.toLowerCase() !== 'home')

  const heroSection = (
    <section className="relative isolate flex h-full min-h-[100svh] items-end overflow-hidden bg-ink text-mist">
      <HomepageHeroBackground />

      <div className="container-content pt-24 pb-20 md:pt-28 md:pb-20 [@media(max-height:500px)]:py-8">
        {/* Mirrors `blocks/hero.tsx` on the homepage: full-width copy column, with the
            standfirst capped at the same ~576px measure it always had. */}
        <div className="max-w-none min-w-0">
          {showHeroEyebrow ? <p className="eyebrow mb-5 text-sage">{heroEyebrow}</p> : null}
          {/* The `<i>` is the accent line — 90px Instrument Serif italic under the
              120px "Walk Where The" (see `homepage.css`). CMS-driven pages reach it
              by writing the same tag into the hero heading field. */}
          <h1 className="heading-display home-hero-title text-white">
            Walk Where The <i>Map Runs Out of Names</i>
          </h1>
          <p className="lead home-hero-lead mt-6 max-w-[36rem] text-mist/85">
            Small-group treks and expeditions across Nepal, led by guides who grew up on these
            trails. Tell us what you are dreaming of — we will build the itinerary around it.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="sage">
              <Link href={sitePath('/trips')}>{dict.nav.trips}</Link>
            </Button>
            <Button asChild size="lg" variant="outline-light">
              <Link href={sitePath('/inquiry')}>{dict.nav.inquiry}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )

  const tripsSection = (
    <>
      <CuratedTripsSection
        trips={trips}
        action={{ href: sitePath('/trips'), label: dict.common.viewAll }}
      />
      <AboutHikeGlobally />
    </>
  )

  const destinationsSection =
    destinations.length === 0 ? null : destinations.length > 3 ? (
      <DestinationCarousel
        destinations={destinations}
        title={dict.nav.destinations}
        description={dict.destinations.listingSubtitle}
        action={{ href: sitePath('/destinations'), label: dict.common.viewAll }}
        titleClassName="home-section-title"
        descriptionClassName="home-section-intro"
      />
    ) : (
      <section className="py-16 md:py-24">
        <div className="container-content">
          <SectionHeading
            title={dict.nav.destinations}
            description={dict.destinations.listingSubtitle}
            action={{ href: sitePath('/destinations'), label: dict.common.viewAll }}
            titleClassName="home-section-title"
            descriptionClassName="home-section-intro"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
            {destinations.map((destination, index) => (
              <Reveal key={destination.id} delay={index * 80}>
                <DestinationCard destination={destination} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    )

  // The homepage ends at the "Plan your trip" section — no journal/blog tiles and nothing after it.
  const inquirySection = (
    <section className="py-16 md:py-24">
      <div className="container-content">
        <div className="relative overflow-hidden bg-sage px-5 py-10 sm:px-8 sm:py-14 md:px-16 md:py-20 3xl:px-20 3xl:py-24">
          <div className="relative max-w-2xl min-w-0 3xl:max-w-3xl">
            <h2 className="heading-lg text-ink">{dict.inquiry.title}</h2>
            <p className="lead mt-5 text-ink-70">{dict.inquiry.subtitle}</p>
            <Button asChild size="lg" className="mt-9">
              <Link href={sitePath('/inquiry')}>
                {dict.inquiry.submit}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )

  const firstSection =
    trips.length > 0 ? tripsSection : destinations.length > 0 ? destinationsSection : inquirySection

  const subsequentSections = (
    <>
      {trips.length > 0 ? destinationsSection : null}
      {trips.length > 0 || destinations.length > 0 ? inquirySection : null}
    </>
  )

  return (
    <HeroScrollCover
      hero={heroSection}
      firstSection={<DifficultyLevels />}
      subsequentSections={
        <>
          {firstSection}
          {subsequentSections}
        </>
      }
    />
  )
}
