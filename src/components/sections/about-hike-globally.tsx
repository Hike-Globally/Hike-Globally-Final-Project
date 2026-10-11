'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { animate, motion, useInView, useMotionValue, useSpring, useTransform } from 'motion/react'
import { ArrowRight, Compass, Globe2, HeadphonesIcon, MapPin, ShieldCheck, Star } from 'lucide-react'

import './about-hike-globally.css'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { sitePath } from '@/i18n/config'
import { cn } from '@/lib/utils'

const EYEBROW = 'About Hike Globally'
const HEADING = 'One platform. Every trail on Earth.'
const LEAD =
  'Hike Globally is a travel booking platform that curates and sells travel packages to destinations all around the globe — treks, safaris, coastal escapes and city breaks — researched, priced and ready to book in one place.'

const PILLARS = [
  {
    icon: Globe2,
    title: 'Worldwide reach',
    description: 'Packages spanning 50+ countries across six continents, and counting.',
  },
  {
    icon: Compass,
    title: 'Hand-picked routes',
    description: 'Every itinerary is scouted and vetted by our own team before it goes live.',
  },
  {
    icon: ShieldCheck,
    title: 'Booked with confidence',
    description: 'Transparent pricing, secure checkout, and licensed local operators only.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Real humans, 24/7',
    description: 'A real person replies within a day — before you book and while you travel.',
  },
] as const

const STATS = [
  { value: 120, suffix: '+', label: 'Travel packages' },
  { value: 54, suffix: '', label: 'Countries covered' },
  { value: 32, suffix: 'k+', label: 'Travelers hosted' },
  { value: 4.9, decimals: 1, suffix: '', label: 'Average rating' },
] as const

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

const INNER_ORBIT_ANGLES = [20, 140, 260]
const OUTER_ORBIT_ANGLES = [70, 190, 310]

/**
 * "About Hike Globally" — sits right after the Curated Travel Packages section on the
 * homepage and states, in plain terms, what the brand is: a travel booking platform selling
 * packages worldwide.
 *
 * A dark, immersive section (same register as the dark Stats/Testimonials CMS blocks) so it
 * reads as a deliberate pause between the two light trip/destination grids around it. The
 * interaction budget goes to three things instead of many small flourishes:
 *  1. A cursor-tracked spotlight that makes the whole section feel alive under the pointer.
 *  2. A hand-built CSS/SVG-free orbit — a glowing globe with two independently spinning rings
 *     of destination pins — that tilts toward the pointer in 3D.
 *  3. Count-up stats and an infinite destination ticker, both driven by real scroll/viewport
 *     state rather than autoplay, so nothing moves before a visitor actually arrives here.
 * Every animation collapses to a static, fully legible layout under `prefers-reduced-motion`.
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
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Copy column */}
          <div>
            <Reveal>
              <p className="eyebrow text-sage">{EYEBROW}</p>
            </Reveal>
            <Reveal delay={80}>
              <h2
                id="about-hike-globally-heading"
                className="heading-xl mt-4 max-w-xl text-white"
              >
                {HEADING}
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="lead mt-6 max-w-xl text-mist/75">{LEAD}</p>
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

            <ul className="mt-12 grid gap-4 sm:grid-cols-2" role="list">
              {PILLARS.map((pillar, index) => (
                <Reveal key={pillar.title} as="li" delay={260 + index * 70}>
                  <PillarCard {...pillar} />
                </Reveal>
              ))}
            </ul>
          </div>

          {/* Interactive globe visual */}
          <Reveal delay={160} className="mx-auto w-full max-w-[22rem] lg:max-w-none">
            <GlobeVisual />
          </Reveal>
        </div>

        {/* Count-up stats */}
        <Reveal delay={120} className="mt-20 md:mt-24">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-white/10 pt-10 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <dd className="font-heading text-4xl font-semibold tracking-tight text-sage md:text-5xl">
                  <StatCounter value={stat.value} decimals={'decimals' in stat ? stat.decimals : 0} suffix={stat.suffix} />
                </dd>
                <dt className="mt-2 text-[0.9375rem] text-mist/70">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </Reveal>
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
                  className="flex shrink-0 items-center gap-2 text-lg font-medium text-mist/60"
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

function PillarCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Globe2
  title: string
  description: string
}) {
  return (
    <div className="group relative h-full overflow-hidden border border-white/10 bg-white/[0.03] p-5 transition-colors duration-300 hover:border-sage/40 hover:bg-white/[0.06]">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-sage via-sage/60 to-transparent transition-transform duration-500 ease-[var(--ease-brand)] group-hover:scale-x-100"
      />
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-sage/15 text-sage transition-transform duration-500 ease-[var(--ease-brand)] group-hover:-translate-y-0.5 group-hover:rotate-6">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-[0.95rem] font-semibold tracking-[0.01em] text-white">{title}</h3>
      <p className="mt-1.5 text-[0.84rem] leading-relaxed text-mist/65">{description}</p>
    </div>
  )
}

/** Counts up from 0 to `value` once the element scrolls into view; renders statically under reduced motion. */
function StatCounter({
  value,
  decimals = 0,
  suffix = '',
}: {
  value: number
  decimals?: number
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [display, setDisplay] = useState(() =>
    (prefersReducedMotion ? value : 0).toFixed(decimals),
  )

  useEffect(() => {
    if (prefersReducedMotion || !isInView) return

    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest.toFixed(decimals)),
    })

    return () => controls.stop()
  }, [isInView, value, decimals, prefersReducedMotion])

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  )
}

/** Globe with two independently spinning orbit rings of destination pins, tilting toward the pointer. */
function GlobeVisual() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pointerX = useMotionValue(0.5)
  const pointerY = useMotionValue(0.5)

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [12, -12]), {
    stiffness: 140,
    damping: 18,
    mass: 0.6,
  })
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-14, 14]), {
    stiffness: 140,
    damping: 18,
    mass: 0.6,
  })

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - rect.left) / rect.width)
    pointerY.set((event.clientY - rect.top) / rect.height)
  }

  const handlePointerLeave = () => {
    pointerX.set(0.5)
    pointerY.set(0.5)
  }

  return (
    <div
      ref={wrapperRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative mx-auto aspect-square w-72 sm:w-80 md:w-[22rem] lg:w-[24rem]"
      style={{ perspective: '1100px' }}
      data-about-globe
    >
      {/* Floating badges */}
      <div className="ahg-float pointer-events-none absolute -top-2 right-0 z-20 flex items-center gap-2 border border-white/10 bg-ink/80 px-3 py-2 text-xs font-medium text-white shadow-[0_18px_40px_-14px_rgba(0,0,0,0.7)] backdrop-blur-sm sm:right-4">
        <Globe2 className="size-3.5 text-sage" aria-hidden="true" />
        120+ destinations
      </div>
      <div
        className="ahg-float pointer-events-none absolute bottom-6 -left-2 z-20 flex items-center gap-2 border border-white/10 bg-ink/80 px-3 py-2 text-xs font-medium text-white shadow-[0_18px_40px_-14px_rgba(0,0,0,0.7)] backdrop-blur-sm sm:-left-6"
        style={{ animationDelay: '-3s' }}
      >
        <Star className="size-3.5 fill-sage text-sage" aria-hidden="true" />
        4.9 rated by travelers
      </div>

      <motion.div
        style={{ rotateX, rotateY }}
        className="relative h-full w-full [transform-style:preserve-3d]"
      >
        {/* Pulse rings */}
        <span className="ahg-pulse absolute inset-[30%] rounded-full border border-sage/60" aria-hidden="true" />

        {/* Sphere */}
        <div
          className="ahg-sphere absolute inset-[28%] overflow-hidden rounded-full shadow-[0_0_90px_-10px_rgba(174,195,176,0.5)]"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, var(--color-slate) 0%, var(--color-deep) 48%, var(--color-ink) 100%)',
          }}
          aria-hidden="true"
        >
          <span className="absolute inset-0 rounded-full border border-white/15" />
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/15" />
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
          <span className="absolute inset-[18%] rounded-full border border-white/10" />
          <span className="absolute inset-[36%] rounded-full border border-white/10" />
        </div>

        {/* Inner orbit ring */}
        <div
          className="ahg-ring absolute inset-[14%] rounded-full border border-dashed border-sage/35"
          style={{ '--orbit-duration': '26s' } as CSSProperties}
          aria-hidden="true"
        >
          {INNER_ORBIT_ANGLES.map((angle) => (
            <OrbitPin key={angle} angle={angle} icon={MapPin} />
          ))}
        </div>

        {/* Outer orbit ring */}
        <div
          className="ahg-ring ahg-ring--reverse absolute inset-0 rounded-full border border-dashed border-slate/30"
          style={{ '--orbit-duration': '38s' } as CSSProperties}
          aria-hidden="true"
        >
          {OUTER_ORBIT_ANGLES.map((angle) => (
            <OrbitPin key={angle} angle={angle} icon={Compass} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function OrbitPin({ angle, icon: Icon }: { angle: number; icon: typeof MapPin }) {
  return (
    <div className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
      <div className="absolute top-1/2 left-full -translate-x-1/2 -translate-y-1/2">
        <div className="ahg-pin-counter">
          <span
            className={cn(
              'flex size-8 items-center justify-center rounded-full border border-sage/50 bg-white text-deep shadow-[0_10px_26px_-8px_rgba(0,0,0,0.55)]',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  )
}
