import { RichText } from '@/components/content/rich-text'
import { TripSectionHeading } from '@/components/trip/trip-section-heading'
import { dictionary } from '@/i18n/dictionaries'
import { normalizeDepartures } from '@/lib/departures'
import { hasRichTextContent } from '@/lib/rich-text-content'
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
  className,
}: {
  trip: Trip
  bookingHref: string
  hasExternalBookingLink: boolean
  className?: string
}) {
  const departures = normalizeDepartures(trip.departureDates, {
    durationDays: trip.durationDays,
    priceFrom: trip.priceFrom,
  })
  const hasNotes = hasRichTextContent(trip.departures)

  if (!departures.length && !hasNotes) return null

  return (
    <section
      id="departures"
      aria-labelledby="departures-heading"
      className={cn('trip-section', className)}
    >
      <TripSectionHeading
        id="departures-heading"
        eyebrow={dictionary.trip.sectionDates}
        title={dictionary.trip.departures}
        description={dictionary.trip.departuresIntro}
      />

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
          <RichText content={trip.departures} />
        </div>
      ) : null}
    </section>
  )
}
