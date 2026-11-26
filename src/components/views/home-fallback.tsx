import Link from 'next/link'

import { CtaCard } from '@/components/blocks/cta'
import { HomepageHeroBackground } from '@/components/blocks/hero-background'
import { HomepageDestinations } from '@/components/blocks/homepage-destinations'
import { AboutHikeGlobally } from '@/components/sections/about-hike-globally'
import {
  CuratedTripsSection,
  HOMEPAGE_TRIP_LIMIT,
} from '@/components/sections/curated-trips-section'
import { HeroScrollCover } from '@/components/motion/hero-scroll-cover'
import { DifficultyLevels } from '@/components/sections/difficulty-levels'
import { BrowsePlaces } from '@/components/sections/browse-places'
import { LatestBlogsSection } from '@/components/sections/latest-blogs-section'
import { LatestNewsSection } from '@/components/sections/latest-news-section'
import { Button } from '@/components/ui/button'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getHomepageTrips, getSettings } from '@/lib/data'

/**
 * Rendered when no page with the slug `home` exists in Payload yet.
 * It still shows real CMS content, so a fresh database produces a presentable site
 * rather than an empty shell.
 */
export async function HomeFallback() {
  const dict = dictionary
  const [settings, trips] = await Promise.all([
    getSettings(),
    // Same rules as the CMS block: featured trips first, newest published ones if nothing is
    // flagged, so the homepage never loses this section over a missing checkbox.
    getHomepageTrips(HOMEPAGE_TRIP_LIMIT),
  ])
  const heroEyebrow = settings.tagline?.trim()
  const showHeroEyebrow = Boolean(heroEyebrow && heroEyebrow.toLowerCase() !== 'home')

  const heroSection = (
    <section className="hero-region relative isolate flex h-full items-end overflow-hidden bg-ink text-mist">
      <HomepageHeroBackground />

      <div className="container-content pt-24 pb-20 md:pt-28 md:pb-20 [@media(max-height:500px)]:py-8">
        {/* Mirrors `blocks/hero.tsx` on the homepage: full-width copy column, with the
            standfirst capped at the same ~576px measure it always had. */}
        <div className="max-w-none min-w-0">
          {showHeroEyebrow ? <p className="eyebrow mb-5 text-mist">{heroEyebrow}</p> : null}
          <h1 className="heading-display hero-title hero-title--cal max-w-4xl text-white 3xl:max-w-5xl">
            Discover Global <i>Adventures with Hike Globally</i>
          </h1>
          <p className="lead hero-description mt-6 max-w-[36rem] text-mist">
            Explore family tours, trekking adventures, and practical travel guides to inspire your
            next journey across Nepal and destinations worldwide.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {/* "Trips" — the ember accent (`sage` → `bg-btn-accent`, #C24B38),
                matching the CMS hero's primary button on the homepage. */}
            <Button asChild size="lg" variant="sage">
              <Link href={sitePath('/trips')}>{dict.nav.trips}</Link>
            </Button>
            <Button asChild size="lg" variant="haze">
              <Link href={sitePath('/contact')}>{dict.nav.inquiry}</Link>
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

  // Both destination sliders (Nepal regions, then the continents) — fixed lists.
  const destinationsSection = <HomepageDestinations />

  // The homepage ends at the "Plan your trip" card — nothing after it. The journal
  // board and the news index always sit immediately before it, so reading the latest
  // field notes is the last thing a visitor does before being asked to plan a trip. The card is
  // the shared `CtaCard` (see blocks/cta.tsx), so this fallback closing moment is the
  // same cinematic card a CMS `cta` block renders.
  const inquirySection = (
    <CtaCard
      eyebrow={dict.cta.eyebrow}
      heading={dict.cta.heading}
      text={dict.inquiry.subtitle}
      link={{ href: sitePath('/contact'), label: dict.cta.action }}
      variant="dark"
    />
  )

  // Journal board, news index + "Plan your trip", in that order, whichever branch renders them.
  const closingSections = (
    <>
      <LatestBlogsSection />
      <LatestNewsSection />
      {inquirySection}
    </>
  )

  const firstSection = trips.length > 0 ? tripsSection : destinationsSection

  const subsequentSections = (
    <>
      {trips.length > 0 ? destinationsSection : null}
      {closingSections}
    </>
  )

  return (
    <HeroScrollCover
      hero={heroSection}
      firstSection={
        <>
          <DifficultyLevels />
          <BrowsePlaces />
        </>
      }
      subsequentSections={
        <>
          {firstSection}
          {subsequentSections}
        </>
      }
    />
  )
}
