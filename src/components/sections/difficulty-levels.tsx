'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { sitePath } from '@/i18n/config'
import { DIFFICULTY_LEVELS, tripsByDifficultyPath } from '@/lib/difficulty'

/**
 * Full-bleed difficulty carousel inspired by the slider sample.
 *
 * The track stays a native horizontal scroller: swipe, trackpad, keyboard and the
 * arrow controls all work without introducing a carousel dependency or autoplay.
 *
 * The track spans the viewport but carries `container-gutter` inline padding, so the first
 * card starts on the same left line as the heading and description above it while the
 * remaining cards still slide in from — and out to — the right-hand edge. `scroll-padding`
 * repeats that gutter, so a card also comes to rest on that line after a swipe instead of
 * snapping to the viewport edge.
 *
 * Each card deep-links to `/trips?difficulty=<rung>` so published trips with that
 * CMS difficulty land on the matching listing.
 */
export function DifficultyLevels() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const maxScroll = track.scrollWidth - track.clientWidth
    setAtStart(track.scrollLeft <= 2)
    setAtEnd(maxScroll <= 2 || track.scrollLeft >= maxScroll - 2)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    measure()
    track.addEventListener('scroll', measure, { passive: true })

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(track)
    Array.from(track.children).forEach((card) => resizeObserver.observe(card))

    return () => {
      track.removeEventListener('scroll', measure)
      resizeObserver.disconnect()
    }
  }, [measure])

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return

    const firstCard = track.firstElementChild as HTMLElement | null
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 20
    const distance = firstCard ? firstCard.getBoundingClientRect().width + gap : track.clientWidth
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    track.scrollBy({ left: distance * direction, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <section
      className="overflow-hidden bg-white py-16 md:py-20"
      aria-labelledby="difficulty-heading"
    >
      <div className="container-content flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="max-w-3xl">
          <p className="eyebrow mb-3">Find your level</p>
          <h2
            id="difficulty-heading"
            className="home-section-title font-heading leading-tight font-semibold tracking-[0.045em] text-ink uppercase"
          >
            Different levels, all epic adventures
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="home-section-intro max-w-2xl leading-relaxed text-ink-60">
              Find your match — from gentle days out to high-altitude challenges.
            </p>
            <span className="hidden text-slate/60 sm:inline" aria-hidden="true">
              /
            </span>
            <Link
              href={sitePath('/trips')}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-deep underline decoration-sage decoration-2 underline-offset-4 transition-colors hover:text-ink"
            >
              Explore all trips
              <ArrowUpRight
                className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        <div
          className="flex shrink-0 items-center gap-3"
          role="group"
          aria-label="Browse difficulty levels"
        >
          <CarouselArrow direction="left" disabled={atStart} onClick={() => scroll(-1)} />
          <CarouselArrow direction="right" disabled={atEnd} onClick={() => scroll(1)} />
        </div>
      </div>

      <div className="relative mt-8 md:mt-10">
        <div
          ref={trackRef}
          role="region"
          aria-label="Nine hiking difficulty levels"
          tabIndex={0}
          className="container-gutter no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline-offset-4 [scroll-padding-inline:var(--container-gutter-offset)] sm:gap-5"
        >
          {DIFFICULTY_LEVELS.map((level, index) => (
            <Link
              key={level.value}
              href={tripsByDifficultyPath(level.value)}
              aria-labelledby={`difficulty-${level.value}-title`}
              aria-describedby={`difficulty-${level.value}-desc`}
              className="group relative isolate h-[min(30rem,72svh)] w-[min(78vw,21rem)] shrink-0 snap-start overflow-hidden bg-ink text-white focus-visible:outline-offset-4 sm:h-[min(31rem,74svh)] sm:w-[min(42vw,20rem)] lg:h-[min(32rem,76svh)] lg:w-[min(23vw,20.5rem)] 3xl:h-[min(36rem,70svh)] 3xl:w-[min(18vw,24rem)] tv:w-[min(16vw,28rem)]"
            >
              <Image
                src={level.image}
                alt=""
                fill
                priority={index < 2}
                sizes="(min-width: 1280px) 328px, (min-width: 640px) 42vw, 78vw"
                style={{ objectPosition: level.objectPosition }}
                className="-z-20 object-cover transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-ink/85 via-ink/35 to-transparent"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-ink/55 via-transparent to-transparent"
                aria-hidden="true"
              />

              <div className="relative p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[0.62rem] font-semibold tracking-[0.2em] text-white/80 uppercase">
                    Level {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="block h-[5px] w-[3.6rem] shrink-0 bg-white/35"
                    role="img"
                    aria-label={`Difficulty scale: ${index + 1} of ${DIFFICULTY_LEVELS.length}`}
                  >
                    <span
                      className="block h-full transition-[width] duration-500"
                      style={{ width: level.meter, backgroundColor: level.meterColor }}
                    />
                  </span>
                </div>

                {/* Card copy is pinned to the sizes the design calls for — 25px
                    headings, 16px descriptions — rather than the responsive
                    description scale, so every rung reads the same at any width. */}
                <h3
                  id={`difficulty-${level.value}-title`}
                  className="mt-3 font-heading text-[25px] leading-snug font-semibold tracking-[0.025em] text-white uppercase"
                >
                  {level.label}
                </h3>
                <p
                  id={`difficulty-${level.value}-desc`}
                  className="mt-2 max-w-[18rem] text-[16px] leading-relaxed text-white/90"
                >
                  {level.description}
                </p>
              </div>

              <span className="absolute inset-x-5 bottom-5 inline-flex items-center gap-1.5 text-[0.78rem] font-medium tracking-[0.04em] text-white/90 uppercase sm:inset-x-6 sm:bottom-6">
                View trips
                <ArrowUpRight
                  className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function CarouselArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right'
  disabled: boolean
  onClick: () => void
}) {
  const Icon = direction === 'left' ? ArrowLeft : ArrowRight

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'left' ? 'Previous difficulty levels' : 'Next difficulty levels'}
      className="inline-flex size-11 items-center justify-center rounded-full border border-ink/20 bg-white text-ink transition duration-300 hover:border-deep hover:bg-deep hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep disabled:cursor-not-allowed disabled:border-ink/10 disabled:text-ink/30 disabled:hover:border-ink/10 disabled:hover:bg-white disabled:hover:text-ink/30"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}
