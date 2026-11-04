import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock, Gauge, Mountain, Users } from 'lucide-react'

import { ArticleShareButton } from '@/components/blog/article-share-button'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { Button } from '@/components/ui/button'
import { PayloadImageFill } from '@/components/ui/payload-image'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { difficultyLabel } from '@/lib/difficulty'
import { altitudeLabel, durationLabel, seasonSummary, tripDuration } from '@/lib/trip-page'
import { cn } from '@/lib/utils'
import type { Destination, Trip } from '@/payload-types'

/**
 * ============================================================================
 * TRIP HERO
 * ============================================================================
 * The page's opening statement: a cinematic photograph, the trip's name, the
 * three facts a traveller checks first (how long, how high, how hard) and the
 * two actions that matter (enquire, see the dates).
 *
 * The colour work happens in `trip-page.css` (`.trip-hero*`): a deep-ink wash
 * that guarantees contrast, an amber "sunrise" glow bleeding in from the top
 * right, a vignette, and a sage→ember hairline where the photo meets the white
 * page. Nothing here is a flat `bg-ink` band with a photograph behind it.
 *
 * Everything is server-rendered — no client JS is needed for the hero itself.
 */
export function TripHero({
  trip,
  destination,
  amountHref,
  hasDepartures,
  whatsapp,
}: {
  trip: Trip
  destination: Destination | null
  /** Where the secondary CTA points: the departures table, or the itinerary. */
  amountHref: string
  hasDepartures: boolean
  whatsapp?: string | null
}) {
  const dict = dictionary
  const duration = durationLabel(
    tripDuration(trip.durationDays, trip.durationNights),
  )
  const altitude = altitudeLabel(trip.maxAltitude)
  const season = seasonSummary(trip.bestSeasons)

  const facts: { icon: typeof Clock; label: string; value: string }[] = [
    { icon: Clock, label: dict.trip.duration, value: duration },
    ...(altitude ? [{ icon: Mountain, label: dict.trip.maxAltitude, value: altitude }] : []),
    {
      icon: Gauge,
      label: dict.trip.difficulty,
      value: difficultyLabel(trip.difficulty),
    },
    ...(trip.groupSizeMax
      ? [{ icon: Users, label: dict.trip.groupSize, value: `Max ${trip.groupSizeMax}` }]
      : []),
    ...(season ? [{ icon: CalendarDays, label: dict.trip.bestSeason, value: season }] : []),
  ]

  return (
    <section data-header-hero className="trip-hero">
      <div className="trip-hero__media">
        <PayloadImageFill
          media={trip.heroImage}
          sizes="100vw"
          priority
          imageClassName="object-cover"
        />
      </div>
      <div aria-hidden className="trip-hero__wash" />
      <div aria-hidden className="trip-hero__sunrise" />
      <div aria-hidden className="trip-hero__vignette" />
      <div aria-hidden className="trip-hero__horizon" />

      <div className="container-content relative pt-28 pb-10 md:pt-36 md:pb-14">
        {/* Breadcrumb + share: the two pieces of wayfinding a trip page needs
            before the title. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Breadcrumbs
            items={[
              { label: dict.nav.home, href: sitePath('/') },
              { label: dict.nav.trips, href: sitePath('/trips') },
              { label: trip.title },
            ]}
          />
          <ArticleShareButton
            title={trip.title}
            shareLabel={dict.trip.shareTrip}
            copiedLabel={dict.common.copied}
            errorLabel={dict.common.shareError}
            tone="dark"
            className="hidden sm:inline-flex"
          />
        </div>

        {/* Destination + trip type, as small glass pills. */}
        <div className="mt-8 flex flex-wrap items-center gap-2.5">
          {destination ? (
            <Link
              href={sitePath(`/destinations/${destination.slug}`)}
              className="group inline-flex items-center gap-2 border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-[0.6875rem] font-medium tracking-[0.16em] text-white uppercase backdrop-blur transition-colors hover:border-sage/60 hover:bg-white/[0.14]"
            >
              <span className="size-1.5 rounded-full bg-sage transition-transform group-hover:scale-125" />
              {destination.name}
            </Link>
          ) : null}
          <span className="inline-flex items-center gap-2 border border-sage/40 bg-sage/15 px-3.5 py-1.5 text-[0.6875rem] font-medium tracking-[0.16em] text-sage uppercase backdrop-blur">
            {TRIP_TYPE_LABELS[trip.tripType]}
          </span>
          {trip.featured ? (
            <span className="inline-flex items-center gap-2 border border-ember/40 bg-ember/20 px-3.5 py-1.5 text-[0.6875rem] font-medium tracking-[0.16em] text-white uppercase backdrop-blur">
              {dict.common.featured}
            </span>
          ) : null}
        </div>

        <h1 className="trip-hero__title mt-6 max-w-5xl text-white">{trip.title}</h1>

        {/* The sunrise rule under the title — small, but it is what makes the
            header read as designed rather than as a CMS field. */}
        <div className="horizon-line mt-7 max-w-md" aria-hidden />

        <p className="lead mt-6 max-w-2xl text-[1.0625rem] text-mist/85 md:text-lg">
          {trip.summary}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" variant="sage" className="group h-13 px-8">
            <Link href="#inquiry">
              {dict.trip.enquire}
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline-light" className="h-13 px-7 backdrop-blur">
            <Link href={amountHref}>
              {hasDepartures ? dict.trip.viewAllDates : dict.trip.itinerary}
            </Link>
          </Button>
          {whatsapp ? (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-13 items-center gap-2 px-4 text-[0.9375rem] font-medium text-white/80 transition-colors hover:text-white"
            >
              <WhatsAppMark />
              WhatsApp
            </a>
          ) : null}
        </div>

        {/* Trip at a glance — a glass strip that replaces the old in-hero
            description list. Five facts, one line each, readable at a glance. */}
        <dl className="trip-facts mt-10 md:mt-14">
          {facts.map((fact) => (
            <div key={fact.label} className="trip-facts__cell">
              <span className="trip-facts__icon">
                <fact.icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <dt className="trip-facts__label">{fact.label}</dt>
                <dd className="trip-facts__value" title={fact.value}>
                  {fact.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/**
 * Trip type labels — a local map rather than `dict.trips.type*` because the
 * dictionary keys are camel-cased by hand and a mismatch would type-check as a
 * silently missing label. Each value here matches the dictionary string exactly.
 */
const TRIP_TYPE_LABELS: Record<Trip['tripType'], string> = {
  trekking: dictionary.trips.typeTrekking,
  expedition: dictionary.trips.typeExpedition,
  'peak-climbing': dictionary.trips.typePeakClimbing,
  cultural: dictionary.trips.typeCultural,
  heli: dictionary.trips.typeHeli,
  'multi-sport': dictionary.trips.typeMultiSport,
}

/** Inline WhatsApp glyph — lucide has no brand icons. */
function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      fill="currentColor"
      className={cn('size-4', className)}
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.13c-.24.68-1.4 1.3-1.93 1.35-.53.05-1.03.24-3.47-.72-2.93-1.15-4.77-4.2-4.91-4.4-.15-.2-1.17-1.56-1.17-2.98 0-1.42.75-2.11 1.01-2.4.27-.29.58-.36.78-.36l.56.01c.18 0 .42-.07.65.5.24.58.8 2 .87 2.14.07.15.12.32.02.51-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.75 1.24 1.61 2.01 1.1.99 2.03 1.29 2.32 1.44.29.15.46.12.63-.07.17-.2.73-.85.92-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.13.07.73-.17 1.41Z" />
    </svg>
  )
}
