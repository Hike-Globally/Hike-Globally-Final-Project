'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { sitePath } from '@/i18n/config'

type DifficultyLevel = {
  name: string
  description: string
  image: string
  meter: string
  meterColor: string
  objectPosition?: string
}

const difficultyLevels: DifficultyLevel[] = [
  {
    name: 'Easy',
    description: 'Gentle days on welcoming trails — a beautiful first step into the mountains.',
    image: '/images/difficulty/easy.jpg',
    meter: '20%',
    meterColor: '#a9ed72',
  },
  {
    name: 'Easy – Moderate',
    description: 'Unhurried walks, a little more elevation, and plenty of time to take it in.',
    image: '/images/difficulty/easy-moderate.jpg',
    meter: '29%',
    meterColor: '#a9ed72',
    objectPosition: '50% 58%',
  },
  {
    name: 'Moderate',
    description: 'Steady trail days with rewarding climbs and room to find your rhythm.',
    image: '/images/difficulty/moderate.jpg',
    meter: '39%',
    meterColor: '#65a8d5',
    objectPosition: '50% 58%',
  },
  {
    name: 'Moderate – Challenging',
    description: 'Longer days, sustained ascents, and trails that ask a little more of you.',
    image: '/images/difficulty/moderate-challenging.jpg',
    meter: '49%',
    meterColor: '#65a8d5',
    objectPosition: '50% 55%',
  },
  {
    name: 'Challenging',
    description: 'Big mountain days for hikers ready to work for an unforgettable view.',
    image: '/images/difficulty/challenging.jpg',
    meter: '60%',
    meterColor: '#f5a044',
    objectPosition: '50% 55%',
  },
  {
    name: 'Challenging – Strenuous',
    description: 'Long, demanding days at altitude — preparation makes all the difference.',
    image: '/images/difficulty/challenging-strenuous.jpg',
    meter: '70%',
    meterColor: '#f5a044',
    objectPosition: '50% 62%',
  },
  {
    name: 'Strenuous',
    description: 'A serious endurance test across remote terrain and consecutive hard days.',
    image: '/images/difficulty/strenuous.jpg',
    meter: '80%',
    meterColor: '#f2743e',
    objectPosition: '50% 65%',
  },
  {
    name: 'Strenuous – Extreme',
    description: 'High, exposed routes for seasoned trekkers with experience to match.',
    image: '/images/difficulty/strenuous-extreme.jpg',
    meter: '90%',
    meterColor: '#eb584b',
    objectPosition: '50% 63%',
  },
  {
    name: 'Extreme',
    description: 'Technical, high-altitude objectives for experienced expedition climbers.',
    image: '/images/difficulty/extreme.jpg',
    meter: '100%',
    meterColor: '#df3646',
    objectPosition: '50% 67%',
  },
]

/**
 * Full-bleed difficulty carousel inspired by the slider sample.
 *
 * The track stays a native horizontal scroller: swipe, trackpad, keyboard and the
 * arrow controls all work without introducing a carousel dependency or autoplay.
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
      <div className="container-content">
        <div className="max-w-3xl">
          <p className="eyebrow mb-3">Find your level</p>
          <h2
            id="difficulty-heading"
            className="font-heading text-[clamp(1.15rem,1.5vw,1.55rem)] leading-tight font-semibold tracking-[0.045em] text-ink uppercase"
          >
            Different levels, all epic adventures
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="max-w-2xl text-sm leading-relaxed text-ink-60 md:text-base">
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
      </div>

      <div className="relative mt-8 md:mt-10">
        <div
          ref={trackRef}
          role="region"
          aria-label="Nine hiking difficulty levels"
          tabIndex={0}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline-offset-4 sm:gap-5"
          style={{ paddingInline: 'max(1.5rem, calc((100vw - 80rem) / 2))' }}
        >
          {difficultyLevels.map((level, index) => (
            <article
              key={level.name}
              className="group relative isolate h-[30rem] w-[78vw] max-w-[21rem] shrink-0 snap-start overflow-hidden bg-ink text-white sm:h-[31rem] sm:w-[min(42vw,20rem)] lg:h-[32rem] lg:w-[min(23vw,20.5rem)]"
            >
              <Image
                src={level.image}
                alt=""
                fill
                priority={index < 2}
                sizes="(min-width: 1280px) 328px, (min-width: 640px) 42vw, 78vw"
                style={{ objectPosition: level.objectPosition ?? 'center' }}
                className="-z-20 object-cover transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-ink/85 via-ink/35 to-transparent"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-ink/25 via-transparent to-transparent"
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
                    aria-label={`Difficulty scale: ${index + 1} of ${difficultyLevels.length}`}
                  >
                    <span
                      className="block h-full transition-[width] duration-500"
                      style={{ width: level.meter, backgroundColor: level.meterColor }}
                    />
                  </span>
                </div>

                <h3 className="mt-3 font-heading text-[0.93rem] leading-snug font-semibold tracking-[0.025em] text-white uppercase sm:text-base">
                  {level.name}
                </h3>
                <p className="mt-2 max-w-[18rem] text-[0.79rem] leading-relaxed text-white/90 sm:text-[0.84rem]">
                  {level.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between px-2 sm:px-3">
          <CarouselArrow direction="left" disabled={atStart} onClick={() => scroll(-1)} />
          <CarouselArrow direction="right" disabled={atEnd} onClick={() => scroll(1)} />
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
      className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border border-white/25 bg-ink/80 text-white shadow-lg backdrop-blur-sm transition duration-300 hover:bg-deep disabled:pointer-events-none disabled:opacity-0"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}
