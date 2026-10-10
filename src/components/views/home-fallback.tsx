import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { HomepageHeroBackground } from '@/components/blocks/hero-background'
import { DestinationCard } from '@/components/cards/destination-card'
import { PostCard } from '@/components/cards/post-card'
import { TripCard } from '@/components/cards/trip-card'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from '@/components/sections/section-heading'
import { Button } from '@/components/ui/button'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getFeaturedDestinations, getFeaturedTrips, getPosts, getSettings } from '@/lib/data'

/**
 * Rendered when no page with the slug `home` exists in Payload yet.
 * It still shows real CMS content, so a fresh database produces a presentable site
 * rather than an empty shell.
 */
export async function HomeFallback() {
  const dict = dictionary
  const [settings, trips, destinations, posts] = await Promise.all([
    getSettings(),
    getFeaturedTrips(3),
    getFeaturedDestinations(3),
    getPosts(3),
  ])

  return (
    <>
      <section className="relative isolate flex min-h-[88svh] items-center overflow-hidden bg-ink text-mist">
        <HomepageHeroBackground />

        <div className="container-content py-24 md:py-28">
          <div className="max-w-3xl">
            <p className="eyebrow mb-5 text-sage">{settings.tagline ?? dict.nav.home}</p>
            <h1 className="heading-display text-white">Walk where the map runs out of names.</h1>
            <p className="lead mt-6 max-w-2xl text-mist/85">
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

      {trips.length > 0 ? (
        <section className="py-16 md:py-24">
          <div className="container-content">
            <SectionHeading
              title={dict.nav.trips}
              description={dict.trips.listingSubtitle}
              action={{ href: sitePath('/trips'), label: dict.common.viewAll }}
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip, index) => (
                <Reveal key={trip.id} delay={index * 80}>
                  <TripCard trip={trip} priority={index === 0} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {destinations.length > 0 ? (
        <section className="py-16 md:py-24">
          <div className="container-content">
            <SectionHeading
              title={dict.nav.destinations}
              description={dict.destinations.listingSubtitle}
              action={{ href: sitePath('/destinations'), label: dict.common.viewAll }}
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((destination, index) => (
                <Reveal key={destination.id} delay={index * 80}>
                  <DestinationCard destination={destination} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section className="py-16 md:py-24">
          <div className="container-content">
            <SectionHeading
              title={dict.blog.latest}
              description={dict.blog.listingSubtitle}
              action={{ href: sitePath('/blog'), label: dict.common.viewAll }}
            />
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <Reveal key={post.id} delay={index * 80}>
                  <PostCard post={post} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-16 md:py-24">
        <div className="container-content">
          <div className="relative overflow-hidden bg-sage px-8 py-14 md:px-16 md:py-20">
            <div className="relative max-w-2xl">
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
    </>
  )
}
