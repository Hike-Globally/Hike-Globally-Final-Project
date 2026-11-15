'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { DestinationCard } from '@/components/cards/destination-card'
import { SectionHeading } from '@/components/sections/section-heading'
import type { DestinationCard as DestinationCardData } from '@/lib/data'
import { cn } from '@/lib/utils'

/**
 * Destination slider.
 *
 * The track slides exactly like the difficulty-level slider: it spans the full viewport
 * but carries `container-gutter` inline padding, so the first card starts on the same
 * left line as the heading while the remaining cards still slide in from — and out to —
 * the right-hand edge of the screen. `scroll-padding` repeats that gutter, so a card also
 * comes to rest on that line after a swipe instead of snapping to the viewport edge.
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
  titleClassName,
  descriptionClassName,
}: {
  destinations: DestinationCardData[]
  title: string
  description?: string | null
  action?: { href: string; label: string } | null
  className?: string
  titleClassName?: string
  descriptionClassName?: string
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

    const firstCard = track.firstElementChild as HTMLElement | null
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 20
    const distance = firstCard ? firstCard.getBoundingClientRect().width + gap : track.clientWidth
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    track.scrollBy({
      left: distance * direction,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <section className={cn('overflow-hidden py-16 md:py-24', className)}>
      <div className="container-content">
        <SectionHeading
          title={title}
          description={description}
          action={action}
          titleClassName={titleClassName}
          descriptionClassName={descriptionClassName}
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
      </div>

      <div
        ref={trackRef}
        role="region"
        aria-label={title}
        tabIndex={0}
        className="container-gutter no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline-offset-4 [scroll-padding-inline:var(--container-gutter-offset)] sm:gap-5"
      >
        {destinations.map((destination, index) => (
          <div
            key={destination.id}
            className="w-full shrink-0 snap-start sm:w-[calc((100%_-_1.25rem)/2)] lg:w-[calc((100%_-_2.5rem)/3)] 3xl:w-[calc((100%_-_3.75rem)/4)]"
          >
            <DestinationCard destination={destination} priority={index === 0} className="h-full" />
          </div>
        ))}
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
      className="inline-flex size-11 cursor-pointer items-center justify-center rounded-[7px] border border-ink/22 bg-paper text-ink shadow-2xs transition-[background-color,border-color,color,box-shadow,transform] duration-250 ease-[var(--ease-brand)] hover:border-btn-primary hover:bg-btn-primary hover:text-white active:translate-y-px disabled:pointer-events-none disabled:border-slate-20 disabled:bg-mist disabled:text-slate-40 disabled:shadow-none"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}
