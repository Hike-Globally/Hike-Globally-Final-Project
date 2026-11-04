import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Trip-page section heading.
 *
 * Every content band on the trip page opens the same way: a 48px gradient rule,
 * a small navy eyebrow and a large heading. That repetition is the point — it is
 * what makes a very long page feel like a sequence of chapters instead of one
 * scroll. The rule and eyebrow live in `trip-page.css` (`.trip-section*`).
 *
 * `action` slots a control at the right end of the heading row (the itinerary's
 * "expand all" switch, a "view all dates" link, a photo count).
 */
export function TripSectionHeading({
  title,
  eyebrow,
  id,
  action,
  level = 'h2',
  className,
  description,
}: {
  title: string
  eyebrow?: string | null
  /** `id` for the heading itself, so a section can wire up `aria-labelledby`. */
  id?: string
  action?: ReactNode
  level?: 'h2' | 'h3'
  className?: string
  description?: string | null
}) {
  const Heading = level

  return (
    <div className={cn('mb-8', className)}>
      <div className="trip-section__rule" aria-hidden />
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {eyebrow ? <p className="trip-section__eyebrow">{eyebrow}</p> : null}
          <Heading id={id} className="trip-section__heading">
            {title}
          </Heading>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {description ? (
        <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-60">{description}</p>
      ) : null}
    </div>
  )
}
