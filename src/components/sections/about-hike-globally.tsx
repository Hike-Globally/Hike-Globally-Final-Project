'use client'

import Link from 'next/link'
import { useRef, type CSSProperties, type PointerEvent } from 'react'
import { ArrowRight, MapPin } from 'lucide-react'

import './about-hike-globally.css'
import { Globe } from './globe/globe'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { sitePath } from '@/i18n/config'

const EYEBROW = 'About Hike Globally'
const HEADING = 'One platform. Every trail on Earth.'
const LEAD =
  'Hike Globally is a travel booking platform that curates and sells travel packages to destinations all around the globe — treks, safaris, coastal escapes and city breaks — researched, priced and ready to book in one place.'

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
 * interaction budget goes to three things instead of many small flourishes:
 *  1. A cursor-tracked spotlight that makes the whole section feel alive under the pointer.
 *  2. A real 3D globe — a canvas sphere of land dots, destination pins and great-circle
 *     routes that visitors can drag to spin (and fling, and steer with the keyboard). It
 *     code-splits itself and only loads once the section nears the viewport.
 *  3. An infinite destination ticker that can be paused on hover.
 * The globe is desktop-only: on phones and tablets (everything below `lg`, where the section
 * is still a single stacked column) it is taken out of the layout entirely with
 * `hidden lg:block`, so the section reads as copy + ticker without a large visual eating a
 * screen of scroll. From `lg` up it renders a square visual beside the copy. Under
 * `prefers-reduced-motion` the globe holds still until dragged, and the ticker stops.
 */
export function AboutHikeGlobally() {
  const glowRef = useRef<HTMLDivElement>(null)

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    glowRef.current?.style.setProperty('--ahg-x', `${x}%`)
    glowRef.current?.style.setProperty('--ahg-y', `${y}%`)
  }

  return (
    <section
      onPointerMove={handlePointerMove}
      className="relative overflow-hidden bg-ink py-20 text-mist md:py-28"
      aria-labelledby="about-hike-globally-heading"
    >
      {/* Cursor-tracked spotlight */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80 transition-[background] duration-300"
        style={
          {
            '--ahg-x': '20%',
            '--ahg-y': '10%',
            background:
              'radial-gradient(640px circle at var(--ahg-x) var(--ahg-y), color-mix(in srgb, var(--color-sage) 16%, transparent), transparent 62%)',
          } as CSSProperties
        }
      />
      {/* Ambient corner glows for depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full bg-deep/40 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 size-[22rem] rounded-full bg-sage/10 blur-[100px]"
      />

      <div className="container-content relative">
        <div className="grid min-w-0 items-center gap-12 sm:gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Copy column */}
          <div>
            <Reveal>
              <p className="eyebrow text-sage">{EYEBROW}</p>
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
              <p className="lead home-section-lead mt-6 max-w-xl text-mist/75">{LEAD}</p>
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
                  <Link href={sitePath('/inquiry')}>Plan your trip</Link>
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
          <p className="container-content mb-5 text-[0.75rem] font-semibold tracking-[0.18em] text-mist/45 uppercase">
            Currently bookable in
          </p>
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div className="flex w-max shrink-0 items-center gap-10" data-about-ticker>
              {[...TICKER_DESTINATIONS, ...TICKER_DESTINATIONS].map((destination, index) => (
                <span
                  key={`${destination}-${index}`}
                  className="flex shrink-0 items-center gap-2 text-base font-medium text-mist/60 sm:text-lg 3xl:text-xl"
                >
                  <MapPin className="size-4 text-sage" aria-hidden="true" />
                  {destination}
                  <span className="ml-8 text-slate/50" aria-hidden="true">
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
