import { RichText } from '@/components/content/rich-text'
import { dictionary } from '@/i18n/dictionaries'
import { normalizeDepartures } from '@/lib/departures'
import { hasRichTextContent } from '@/lib/rich-text-content'
import type { InternalLinker } from '@/lib/internal-links'
import { cn } from '@/lib/utils'
import type { Trip } from '@/payload-types'

import { DeparturesCalendar } from './departures-calendar'

/**
 * Trip Departures section — shared by the public route and live draft preview.
 *
 * Renders the interactive calendar and chronological departure schedule when
 * `departureDates` are present, plus any optional rich-text departure notes
 * below it (preserving backward compatibility with trips that only use rich text).
 */
export function DeparturesSection({
  trip,
  bookingHref,
  hasExternalBookingLink,
  className = 'py-16 md:py-24',
  linker,
}: {
  trip: Trip
  bookingHref: string
  hasExternalBookingLink: boolean
  /** The page's automated internal linking (see `src/lib/internal-links.ts`). */
  linker?: InternalLinker | null
  className?: string
}) {
  const departures = normalizeDepartures(trip.departureDates, {
    durationDays: trip.durationDays,
    priceFrom: trip.priceFrom,
  })
  const hasNotes = hasRichTextContent(trip.departures)

  if (!departures.length && !hasNotes) return null

  return (
    <section id="departures" className={cn('scroll-mt-24', className)}>
      <div className="mb-10">
        <h2 className="heading-lg">{dictionary.trip.departures}</h2>
      </div>

      {departures.length ? (
        <DeparturesCalendar
          departures={departures}
          priceCurrency={trip.priceCurrency}
          priceUnit={trip.priceUnit}
          tripSlug={trip.slug}
          bookingHref={bookingHref}
          hasExternalBookingLink={hasExternalBookingLink}
        />
      ) : null}

      {hasNotes ? (
        <div className={cn('overflow-x-auto', departures.length ? 'mt-8' : '')}>
          <RichText content={trip.departures} linker={linker} />
        </div>
      ) : null}
    </section>
  )
}
