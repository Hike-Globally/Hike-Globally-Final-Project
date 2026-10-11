'use client'

import './about-hike-globally.css'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'

import { CountUp } from '@/components/motion/count-up'
import { DottedGlobe, type GlobeRegion } from '@/components/motion/dotted-globe'
import { Button } from '@/components/ui/button'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { cn } from '@/lib/utils'

/* ==========================================================================
   About Hike Globally — the homepage's "what this company actually is" band.
   ==========================================================================
   It always renders directly after the curated travel packages section (see
   `block-renderer.tsx` for the homepage's section policy), on both the CMS-driven
   homepage and the no-CMS fallback, so the brand statement is never missing.

   The copy — like `curated-trips-section.tsx`'s heading and description — lives in
   TypeScript rather than in Payload: it is the company's own description, it must read
   identically everywhere, and no editor should be able to break the layout with it.

   Why this section is a client component: the globe, the region chips, the count-up
   figures and the scroll reveal are all interactive. Everything else on the page stays
   server-rendered.
   ========================================================================== */

/** The one sentence the section exists to state, split into its two reveal lines. */
export const ABOUT_HEADLINE = ['A travel booking platform', 'for the whole globe.'] as const

export const ABOUT_STATEMENT =
  'Hike Globally is a travel booking platform which offers various travel packages all around the globe.'

/**
 * Figures for the counter band. They are the section's own copy — a real deployment swaps them
 * for the operator's numbers (they are not read from anywhere else).
 */
const FIGURES: { value: number; decimals?: number; suffix: string; label: string }[] = [
  { value: 60, suffix: '+', label: 'Countries covered' },
  { value: 1200, suffix: '+', label: 'Travel packages' },
  { value: 35000, suffix: '+', label: 'Travellers booked' },
  { value: 4.9, decimals: 1, suffix: '/5', label: 'Average trip rating' },
]

/**
 * Regions drawn on the globe. `lat`/`lon` place a marker on the sphere; the count and blurb fill
 * the caption when the region is highlighted.
 */
export const ABOUT_REGIONS: GlobeRegion[] = [
  {
    id: 'himalaya',
    chip: 'Himalaya',
    label: 'Himalaya & Nepal',
    lat: 28,
    lon: 86.9,
    packages: 48,
    blurb: 'Everest, Annapurna, Mustang and the valleys in between — the ground we know best.',
  },
  {
    id: 'alps',
    chip: 'Alps',
    label: 'The Alps',
    lat: 46.5,
    lon: 8,
    packages: 34,
    blurb: 'Hut-to-hut traverses and summit days across the Swiss, French and Italian ranges.',
  },
  {
    id: 'andes',
    chip: 'Andes',
    label: 'Andes & Patagonia',
    lat: -13.2,
    lon: -72.5,
    packages: 26,
    blurb: 'Inca trails, altiplano crossings and the granite towers at the end of the world.',
  },
  {
    id: 'kilimanjaro',
    chip: 'Kilimanjaro',
    label: 'East Africa',
    lat: -3.1,
    lon: 37.4,
    packages: 19,
    blurb: 'Kilimanjaro routes and the safari days that follow them, led by local crews.',
  },
  {
    id: 'japan',
    chip: 'Japan',
    label: 'Japan & East Asia',
    lat: 35.4,
    lon: 138.7,
    packages: 22,
    blurb: 'Fuji, the Nakasendo way and Kyoto — walking trips with ryokan nights.',
  },
  {
    id: 'iceland',
    chip: 'Nordics',
    label: 'Iceland & the Nordics',
    lat: 64.9,
    lon: -19,
    packages: 15,
    blurb: 'Laugavegur, glacier walks and northern-lights itineraries above the Arctic Circle.',
  },
]

/** Ticker of package names — the "various travel packages, all around the globe" line, in full. */
const TICKER = [
  'Everest Base Camp',
  'Annapurna Circuit',
  'Upper Mustang',
  'Dolpo',
  'Kathmandu Valley',
  'Swiss Alps',
  'Dolomites',
  'Iceland',
  'Kilimanjaro',
  'Machu Picchu',
  'Patagonia',
  'Kyoto & Nakasendo',
  'Santorini',
  'Amalfi Coast',
  'Marrakech',
  'Norwegian Fjords',
  'Bali',
  'New Zealand Alps',
  'Cape Winelands',
  'Galápagos',
]

/** One shared curve, matching `--ease-brand`, for every entry animation in the section. */
const BRAND_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const group = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.075, delayChildren: 0.04 } },
}

/** Headline lines rise out from behind their own mask. */
const line = {
  hidden: { y: '115%' },
  visible: (index: number) => ({
    y: '0%',
    transition: { duration: 0.95, ease: BRAND_EASE, delay: index * 0.1 },
  }),
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: BRAND_EASE, delay: index * 0.06 },
  }),
}

const drawRule = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 1, ease: BRAND_EASE, delay: 0.15 } },
}

const drawUnderline = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 1.1, ease: BRAND_EASE, delay: 0.75 } },
}

const globeIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1.15, ease: BRAND_EASE } },
}

/** Same trigger everywhere: as soon as the section's leading edge is properly on screen. */
const VIEWPORT = { once: true, amount: 'some', margin: '0px 0px -12% 0px' } as const

/* Hydration-safe "is the client running?" flag: the server snapshot is `false`, so the first
   client render matches the server HTML exactly, and the real value arrives in a re-render
   right after hydration. Same pattern as `hero-scroll-cover.tsx`. */
const emptySubscribe = () => () => {}
const getMountedSnapshot = () => true
const getMountedServerSnapshot = () => false

export function AboutHikeGlobally() {
  const dict = dictionary
  const reduceMotion = useReducedMotion()
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getMountedSnapshot,
    getMountedServerSnapshot,
  )

  // Region highlighting is shared by the globe canvas and the chip row, so hovering either one
  // lights up both. Which region is highlighted is read-only state: the globe never mutates it
  // itself, it only reports what the pointer is over.
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = ABOUT_REGIONS.find((region) => region.id === activeId) ?? null

  const sectionRef = useRef<HTMLElement | null>(null)
  const spotlightRef = useRef<HTMLDivElement | null>(null)

  // The globe drifts a little against the scroll, so the section reads as depth rather than as a
  // flat band. Spring-smoothed to stay in the same physical language as the hero's cover motion.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const globeDrift = useSpring(useTransform(scrollYProgress, [0, 1], [42, -42]), {
    stiffness: 120,
    damping: 30,
    mass: 0.6,
  })

  /**
   * Arm the entrance choreography.
   *
   * The animated elements ship the animation library's start state as an inline style, so the
   * server HTML on its own would show the section half empty. Setting this attribute is what
   * lets those styles count — see the `:not([data-armed])` rule in the section stylesheet. It is
   * deliberately not React state: it changes nothing about the rendered tree, so there is no
   * re-render and nothing for hydration to disagree about.
   */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    section.dataset.armed = 'true'
  }, [])

  /**
   * Pointer spotlight.
   *
   * Written straight to CSS custom properties inside a rAF callback: moving the highlight
   * through React state would re-render the section (canvas included) on every mouse move.
   * Touch devices and reduced-motion visitors never attach the listener at all — the gradient
   * simply stays at `--hg-spot-opacity: 0`.
   */
  useEffect(() => {
    const section = sectionRef.current
    const spotlight = spotlightRef.current
    if (!section || !spotlight) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0

    const handleMove = (event: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const rect = section.getBoundingClientRect()
        spotlight.style.setProperty('--hg-spot-x', `${event.clientX - rect.left}px`)
        spotlight.style.setProperty('--hg-spot-y', `${event.clientY - rect.top}px`)
        spotlight.style.setProperty('--hg-spot-opacity', '1')
      })
    }

    const handleLeave = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      spotlight.style.setProperty('--hg-spot-opacity', '0')
    }

    section.addEventListener('pointermove', handleMove)
    section.addEventListener('pointerleave', handleLeave)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      section.removeEventListener('pointermove', handleMove)
      section.removeEventListener('pointerleave', handleLeave)
    }
  }, [])

  return (
    <section
      id="about-hike-globally"
      aria-labelledby="about-heading"
      ref={sectionRef}
      // `hg-about` scopes the section-local stylesheet, including the rule that keeps the copy
      // visible before the entrance choreography is armed.
      className="hg-about relative isolate overflow-hidden bg-ink py-20 text-mist md:py-28"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="hg-about-grid absolute inset-0" />
        <div className="absolute -top-52 -left-40 size-[42rem] rounded-full bg-deep/45 blur-[130px]" />
        <div className="absolute -right-32 -bottom-72 size-[36rem] rounded-full bg-sage/10 blur-[140px]" />
        <div ref={spotlightRef} className="hg-about-spotlight absolute inset-0" />
      </div>

      <div className="container-content relative">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 xl:gap-20">
          {/* ------------------------------------------------ the statement */}
          <motion.div
            data-hg-reveal
            variants={group}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <div className="flex items-center gap-3">
              <motion.span
                data-hg-reveal
                variants={drawRule}
                className="h-px w-12 origin-left bg-gradient-to-r from-sage/90 to-sage/0"
              />
              <p className="eyebrow text-sage">About Hike Globally</p>
            </div>

            <h2
              id="about-heading"
              className="mt-6 font-heading text-[clamp(2rem,1.28rem+1.85vw,3.4rem)] leading-[1.06] font-semibold tracking-[-0.025em] text-white"
            >
              {ABOUT_HEADLINE.map((text, index) => (
                <span key={text} className="block overflow-hidden pb-[0.14em]">
                  <motion.span data-hg-reveal variants={line} custom={index} className="block">
                    {index === ABOUT_HEADLINE.length - 1 ? (
                      <span className="relative inline-block">
                        {text}
                        <motion.span
                          data-hg-reveal
                          variants={drawUnderline}
                          aria-hidden="true"
                          className="absolute bottom-[0.06em] left-0 h-[3px] w-full origin-left bg-gradient-to-r from-sage via-sage/70 to-transparent"
                        />
                      </span>
                    ) : (
                      text
                    )}
                  </motion.span>
                </span>
              ))}
            </h2>

            <motion.p data-hg-reveal variants={fadeUp} className="lead mt-8 max-w-xl text-mist/80">
              {ABOUT_STATEMENT} From Himalayan treks and alpine traverses to island escapes, city
              breaks, safaris and family holidays — every trip is built with local partners, graded
              honestly for difficulty, and booked end to end in one place.
            </motion.p>

            <motion.p
              data-hg-reveal
              variants={fadeUp}
              className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-mist/60"
            >
              One platform, one booking, one team behind it: route knowledge from people who have
              walked the trail, transparent pricing with nothing added at checkout, and a real
              answer within a day — wherever in the world you are heading.
            </motion.p>

            <motion.div data-hg-reveal variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="sage" className="group">
                <Link href={sitePath('/trips')}>
                  Browse travel packages
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline-light">
                <Link href={sitePath('/inquiry')}>{dict.nav.inquiry}</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* ------------------------------------------------ the globe */}
          <motion.div
            data-hg-reveal
            variants={group}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="relative"
          >
            <motion.div
              data-hg-reveal
              variants={globeIn}
              style={isMounted && !reduceMotion ? { y: globeDrift } : undefined}
              className="relative mx-auto aspect-square w-full max-w-[32rem]"
            >
              {/* Corner ticks: the site is square-cornered, so the globe gets a surveyor's frame. */}
              <span aria-hidden="true" className="absolute top-0 left-0 size-5 border-t border-l border-sage/25" />
              <span aria-hidden="true" className="absolute top-0 right-0 size-5 border-t border-r border-sage/25" />
              <span aria-hidden="true" className="absolute bottom-0 left-0 size-5 border-b border-l border-sage/25" />
              <span aria-hidden="true" className="absolute right-0 bottom-0 size-5 border-r border-b border-sage/25" />

              <DottedGlobe
                regions={ABOUT_REGIONS}
                activeId={activeId}
                onActivate={setActiveId}
              />
            </motion.div>

            <motion.div data-hg-reveal variants={fadeUp} className="mt-7">
              <div
                role="group"
                aria-label="Highlight a region on the globe"
                className="flex flex-wrap gap-2"
              >
                {ABOUT_REGIONS.map((region) => {
                  const isActive = region.id === activeId

                  return (
                    <button
                      key={region.id}
                      type="button"
                      aria-pressed={isActive}
                      onMouseEnter={() => setActiveId(region.id)}
                      onMouseLeave={() => setActiveId(null)}
                      onFocus={() => setActiveId(region.id)}
                      onBlur={() => setActiveId(null)}
                      onClick={() => setActiveId(isActive ? null : region.id)}
                      className={cn(
                        'border px-3 py-1.5 font-heading text-[0.6875rem] font-semibold tracking-[0.14em] uppercase transition-colors duration-300',
                        isActive
                          ? 'border-sage/70 bg-sage/15 text-white'
                          : 'border-white/15 text-mist/60 hover:border-sage/50 hover:text-white',
                      )}
                    >
                      {region.chip}
                    </button>
                  )
                })}
              </div>

              {/* The caption answers whatever the pointer is over. It sits on a fixed min-height so
                  the chips never move as the text under them changes length. */}
              <div className="mt-5 min-h-[4.5rem] border-l-2 border-sage/50 pl-4">
                <p className="font-heading text-sm font-semibold text-white">
                  {active ? (
                    <>{`${active.label} · ${active.packages} travel packages`}</>
                  ) : (
                    'Travel packages on six continents'
                  )}
                </p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-mist/60">
                  {active
                    ? active.blurb
                    : 'Hover a region — or move across the globe — to see where Hike Globally runs trips.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ------------------------------------------------ figures */}
        <motion.dl
          data-hg-reveal
          variants={group}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-white/10 pt-10 md:mt-20 md:grid-cols-4 md:gap-x-10"
        >
          {FIGURES.map((figure, index) => (
            <motion.div
              key={figure.label}
              data-hg-reveal
              variants={fadeUp}
              custom={index}
              className="md:border-l md:border-white/10 md:pl-10 md:first:border-l-0 md:first:pl-0"
            >
              <dd className="font-heading text-[clamp(2rem,1.4rem+1.6vw,3rem)] leading-none font-semibold tracking-tight text-sage">
                <CountUp
                  value={figure.value}
                  decimals={figure.decimals}
                  suffix={figure.suffix}
                />
              </dd>
              <dt className="mt-3 font-heading text-[0.6875rem] font-semibold tracking-[0.16em] text-mist/55 uppercase">
                {figure.label}
              </dt>
            </motion.div>
          ))}
        </motion.dl>
      </div>

      {/* ------------------------------------------------ package ticker */}
      <div
        aria-hidden="true"
        className="hg-about-marquee relative mt-16 overflow-hidden border-y border-white/10 py-5 md:mt-20"
      >
        <div className="hg-about-marquee-track">
          {[0, 1, 2].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center">
              {TICKER.map((item) => (
                <li key={`${copy}-${item}`} className="flex shrink-0 items-center">
                  <span className="px-6 font-heading text-[0.6875rem] font-semibold tracking-[0.22em] whitespace-nowrap text-mist/45 uppercase">
                    {item}
                  </span>
                  <span className="size-1 rotate-45 bg-sage/50" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}
