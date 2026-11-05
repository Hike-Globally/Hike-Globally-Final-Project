'use client'

import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'

import './about-hike-globally.css'
import { Globe } from './globe/globe'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { sitePath } from '@/i18n/config'

const EYEBROW = 'About Hike Globally'
const HEADING = 'One platform. Every trail on Earth.'
const LEAD =
  'Hike Globally is an affiliate travel platform connecting curious travellers with journeys around the world. Travel packages listed here are offered and operated by independent providers, not by Hike Globally.'

const TICKER_DESTINATIONS = [
  'Nepal',
  'Peru',
  'Iceland',
  'Patagonia',
  'Japan',
  'Morocco',
  'New Zealand',
  'Vietnam',
  'Tanzania',
  'Switzerland',
  'Jordan',
  'Bhutan',
]

/**
 * "About Hike Globally" — sits right after the Curated Travel Packages section on the
 * homepage and states, in plain terms, what the brand is: a travel booking platform selling
 * packages worldwide.
 *
 * A dark, immersive section (same register as the dark Stats/Testimonials CMS blocks) so it
 * reads as a deliberate pause between the two light trip/destination grids around it. The
 * panel is flat navy — no cursor-tracked spotlight, no blurred corner glows — and the
 * interaction budget goes to two things instead of many small flourishes:
 *  1. A real 3D globe — a canvas sphere of land dots, destination pins and great-circle
 *     routes that visitors can drag to spin (and fling, and steer with the keyboard). It
 *     code-splits itself and only loads once the section nears the viewport.
 *  2. An infinite destination ticker that can be paused on hover.
 * The globe is desktop-only: on phones and tablets (everything below `lg`, where the section
 * is still a single stacked column) it is taken out of the layout entirely with
 * `hidden lg:block`, so the section reads as copy + ticker without a large visual eating a
 * screen of scroll. From `lg` up it renders a square visual beside the copy. Under
 * `prefers-reduced-motion` the globe holds still until dragged, and the ticker stops.
 */
export function AboutHikeGlobally() {
  return (
    <section
      className="relative overflow-hidden bg-ink py-20 text-mist md:py-28"
      aria-labelledby="about-hike-globally-heading"
    >
      <div className="container-content relative">
        <div className="grid min-w-0 items-center gap-12 sm:gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Copy column */}
          <div>
            <Reveal>
              <p className="eyebrow text-mist">{EYEBROW}</p>
            </Reveal>
            <Reveal delay={80}>
              <h2
                id="about-hike-globally-heading"
                className="heading-xl home-section-title mt-4 max-w-xl text-white"
              >
                {HEADING}
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="lead home-section-lead mt-6 max-w-xl text-mist/85">{LEAD}</p>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="sage">
                  <Link href={sitePath('/trips')}>
                    Explore packages
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline-light">
                  <Link href={sitePath('/contact')}>Plan your trip</Link>
                </Button>
              </div>
            </Reveal>
          </div>

          {/* Interactive 3D globe — desktop only, hidden below `lg` (see the file header) */}
          <Reveal
            delay={160}
            className="mx-auto hidden w-full max-w-[22rem] lg:block lg:max-w-none"
          >
            <Globe />
          </Reveal>
        </div>
      </div>

      {/* Infinite destination ticker */}
      <Reveal delay={60} className="relative mt-16 border-t border-white/10 pt-8 md:mt-20">
        <div data-about-ticker-group>
          <p className="container-content mb-5 text-label font-medium tracking-[0.18em] text-mist/70 uppercase">
            Currently bookable in
          </p>
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,var(--color-ink)_6%,var(--color-ink)_94%,transparent)]">
            <div className="flex w-max shrink-0 items-center gap-10" data-about-ticker>
              {[...TICKER_DESTINATIONS, ...TICKER_DESTINATIONS].map((destination, index) => (
                <span
                  key={`${destination}-${index}`}
                  className="flex shrink-0 items-center gap-2 text-lead font-medium text-mist/60"
                >
                  <MapPin className="size-4 text-sage-light" aria-hidden="true" />
                  {destination}
                  <span className="ml-8 text-mist/35" aria-hidden="true">
                    /
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
