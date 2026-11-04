'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { TripAnchor } from '@/lib/trip-page'

/**
 * ============================================================================
 * TRIP SECTION NAV
 * ============================================================================
 * The sticky strip of in-page links under the hero — the navigation pattern
 * every commercial trekking page uses, because a trip page is 10,000+ pixels
 * long and a visitor arrives from Google at an arbitrary anchor.
 *
 * Two behaviours:
 *   1. Every link is a real `#id` anchor, so it works before hydration and
 *      without JavaScript.
 *   2. Once hydrated, an IntersectionObserver marks the section currently in
 *      the reading band, which underlines its link and keeps it scrolled into
 *      view inside the strip on narrow screens.
 *
 * The observer is dismissed when it cannot help (no `IntersectionObserver`, or
 * `prefers-reduced-motion`) — the nav then stays a plain list of anchors rather
 * than mis-reporting the active section.
 */
export function TripSectionNav({
  anchors,
  label,
  withPrice,
}: {
  anchors: TripAnchor[]
  /** Accessible name for the `<nav>`; also the strip's first, non-link label. */
  label: string
  /** Small price/CTA docked at the right end of the strip, optional. */
  withPrice?: { href: string; label: string } | null
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (anchors.length < 2) return

    const sections = anchors.flatMap(({ id }) => {
      const element = document.getElementById(id)
      return element ? [element] : []
    })
    if (!sections.length) return

    // The reading band: anything whose top has passed 30% down the viewport is
    // "current". Cheaper and steadier than a threshold-based observer for tall
    // sections (the itinerary alone is thousands of pixels).
    let frame = 0
    const update = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const line = window.innerHeight * 0.3
        let current = sections[0]?.id ?? null
        for (const section of sections) {
          if (section.getBoundingClientRect().top > line) break
          current = section.id
        }
        setActiveId(current)
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [anchors])

  // Keep the active tab visible inside the horizontally scrolling strip.
  useEffect(() => {
    if (!activeId) return
    const link = document.querySelector<HTMLElement>(`.trip-nav__link[href="#${activeId}"]`)
    link?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activeId])

  if (anchors.length < 2) return null

  return (
    <nav aria-label={label} className="trip-nav">
      <div className="container-content flex items-center gap-4">
        <div className="trip-nav__track min-w-0 flex-1">
          {anchors.map((anchor) => (
            <Link
              key={anchor.id}
              href={`#${anchor.id}`}
              aria-current={activeId === anchor.id ? 'true' : undefined}
              className={cn('trip-nav__link')}
            >
              {anchor.label}
            </Link>
          ))}
        </div>

        {withPrice ? (
          <Link
            href={withPrice.href}
            className="hidden shrink-0 border border-deep bg-deep px-4 py-2 font-heading text-[0.8125rem] font-semibold text-white transition-colors hover:bg-ink lg:inline-flex"
          >
            {withPrice.label}
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
