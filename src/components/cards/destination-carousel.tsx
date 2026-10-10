'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { DestinationCard } from '@/components/cards/destination-card'
import { SectionHeading } from '@/components/sections/section-heading'
import type { DestinationCard as DestinationCardData } from '@/lib/data'
import { cn } from '@/lib/utils'

/** Matches `gap-6` on the track — turns "one card" into a scroll distance. */
const GAP = 24

/**
 * Destination slider.
 *
 * Three cards are visible at a time on desktop (two on tablet, one on a phone) and the
 * remaining cards sit off to the right. The left/right buttons in the section heading
 * slide the track by exactly one card, so the row always lands on a card edge.
 *
 * Implementation notes:
 * - It is a native horizontally scrollable flex row, so touch/trackpad swiping, keyboard
 *   scrolling and scroll snapping all come for free — no drag handlers, no transform maths.
 * - Buttons are disabled at each end instead of wrapping around, so the order of the
 *   destinations never becomes a surprise.
 * - The arrow slot keeps its width even when the track cannot scroll, so the "view all"
 *   link never jumps on hydration.
 */
export function DestinationCarousel({
  destinations,
  title,
  description,
  action,
  className,
}: {
  destinations: DestinationCardData[]
  title: string
  description?: string | null
  action?: { href: string; label: string } | null
  className?: string
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [atStart, setAtStart] = useState(true)
  // Three cards fit in a row at most, so more than three always overflows — render the
  // arrows with the server HTML instead of popping them in after the first measurement.
  // `measure()` corrects this on mount if the track turns out not to scroll.
  const [atEnd, setAtEnd] = useState(destinations.length <= 3)

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const max = track.scrollWidth - track.clientWidth
    setAtStart(track.scrollLeft <= 2)
    setAtEnd(track.scrollLeft >= max - 2)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(track)
    for (const child of Array.from(track.children)) observer.observe(child)

    track.addEventListener('scroll', measure, { passive: true })

    return () => {
      observer.disconnect()
      track.removeEventListener('scroll', measure)
    }
  }, [measure, destinations.length])

  const canScroll = !atStart || !atEnd

  const slide = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return

    const card = track.firstElementChild as HTMLElement | null
    const step = card ? card.getBoundingClientRect().width + GAP : track.clientWidth
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    track.scrollBy({
      left: step * direction,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className="container-content">
        <SectionHeading
          title={title}
          description={description}
          action={action}
          controls={
            <div className="flex w-24 shrink-0 items-center justify-end gap-2">
              {canScroll ? (
                <>
                  <CarouselArrow direction="left" disabled={atStart} onClick={() => slide(-1)} />
                  <CarouselArrow direction="right" disabled={atEnd} onClick={() => slide(1)} />
                </>
              ) : null}
            </div>
          }
        />

        <div
          ref={trackRef}
          role="group"
          aria-label={title}
          className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain pb-1"
        >
          {destinations.map((destination, index) => (
            <div
              key={destination.id}
              className="w-full shrink-0 snap-start sm:w-[calc((100%_-_1.5rem)/2)] lg:w-[calc((100%_-_3rem)/3)]"
            >
              <DestinationCard
                destination={destination}
                priority={index === 0}
                className="h-full"
              />
            </div>
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
      aria-label={direction === 'left' ? 'Previous destinations' : 'Next destinations'}
      className="inline-flex size-11 items-center justify-center border border-ink/15 text-ink transition-colors duration-300 hover:border-deep hover:bg-deep hover:text-mist disabled:pointer-events-none disabled:opacity-30"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}
