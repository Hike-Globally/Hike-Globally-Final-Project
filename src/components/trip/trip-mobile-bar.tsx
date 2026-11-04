'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

import { dictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/utils'

/**
 * ============================================================================
 * MOBILE BOOKING BAR
 * ============================================================================
 * On a phone the sticky rail does not exist, and a 10,000-pixel trip page can
 * leave the price and the CTA thousands of pixels behind the reader. This bar
 * pins them to the bottom edge instead — the same pattern the reference trip
 * pages use ("Book a Trip / Ask a Question").
 *
 * It appears once the hero has scrolled away (so it never covers the hero's own
 * CTAs) and hides again if the reader returns to the top. It is a client island
 * of a few hundred bytes; the price and the hrefs are server-rendered props.
 */
export function TripMobileBar({
  priceLabel,
  unitLabel,
  price,
  nextLabel,
  href,
  enquiryHref,
}: {
  priceLabel: string
  unitLabel: string
  price: string
  /** "Next departure Mar 12, 2027" — the second line. */
  nextLabel: string | null
  href: string
  enquiryHref: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hero = document.querySelector('[data-header-hero]')
    if (!hero || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry?.isIntersecting),
      // Fire a little before the hero is fully gone, so the bar is settled by
      // the time the reader reaches the first section.
      { rootMargin: '-40% 0px 0px 0px' },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/97 px-3 pt-2.5 backdrop-blur-md transition-transform duration-500 ease-brand lg:hidden',
        'pb-[max(0.625rem,env(safe-area-inset-bottom))]',
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[0.625rem] tracking-[0.16em] text-mist/55 uppercase">
            {priceLabel}
          </p>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-heading text-lg leading-none font-semibold text-white">
              {price}
            </span>
            <span className="text-[0.6875rem] text-mist/60">{unitLabel}</span>
          </p>
          {nextLabel ? (
            <p className="mt-0.5 truncate text-[0.6875rem] text-sage">{nextLabel}</p>
          ) : null}
        </div>

        <Link
          href={enquiryHref}
          className="shrink-0 border border-white/20 px-3.5 py-2.5 font-heading text-[0.75rem] font-semibold text-white"
        >
          {dictionary.trip.enquireNow}
        </Link>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 bg-sage px-4 py-2.5 font-heading text-[0.8125rem] font-semibold text-ink"
        >
          {dictionary.trip.bookThisTrek}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
