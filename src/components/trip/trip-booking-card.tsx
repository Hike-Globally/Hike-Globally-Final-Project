import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Gauge,
  MessageCircle,
  Mountain,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { dictionary } from '@/i18n/dictionaries'
import { difficultyLabel } from '@/lib/difficulty'
import { formatNumber, formatPrice } from '@/lib/format'
import {
  departureCountdown,
  durationLabel,
  metresLabel,
  tripDuration,
  type NextDeparture,
} from '@/lib/trip-page'
import { cn } from '@/lib/utils'
import type { Trip } from '@/payload-types'

/**
 * ============================================================================
 * BOOKING CARD — the sticky purchase panel
 * ============================================================================
 * The single most valuable block on the page, so it carries more information
 * than any other: price (with the per-person unit and any pricing note), the
 * next departure with a real countdown, seat scarcity when the CMS says the
 * group is nearly full, the three facts that decide a booking (duration, grade,
 * altitude), the CTA pair, and the assurances that answer "is this safe?".
 *
 * It is deliberately dark on a white page: it is the one element that must
 * never be mistaken for body copy. `trip-page.css` (`.trip-booking-card`) gives
 * it the sunrise glow.
 *
 * Rendered twice by the page — once sticky in the right rail (desktop) and once
 * inline under the highlights (mobile) — from the same props, so the two can
 * never disagree.
 */
export function TripBookingCard({
  trip,
  bookingHref,
  inquiryHref,
  next,
  whatsapp,
  phone,
  className,
}: {
  trip: Trip
  bookingHref: string
  inquiryHref: string
  next: NextDeparture | null
  whatsapp?: string | null
  phone?: string | null
  className?: string
}) {
  const dict = dictionary
  const perGroup = trip.priceUnit === 'per-group'
  const duration = durationLabel(tripDuration(trip.durationDays, trip.durationNights))
  const altitude = metresLabel(trip.maxAltitude)
  const limited = next?.status === 'limited'

  return (
    <div className={cn('trip-booking-card', className)}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="font-heading text-[0.6875rem] font-semibold tracking-[0.18em] text-sage uppercase">
            {perGroup ? dict.trip.pricePerGroup : dict.trip.pricePerPerson}
          </p>
          {trip.featured ? <Badge variant="sage">{dict.common.featured}</Badge> : null}
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
          <p className="trip-booking-card__price">
            {formatPrice(trip.priceFrom, trip.priceCurrency)}
          </p>
          <span className="pb-1 text-[0.8125rem] text-mist/55">
            {perGroup ? dict.common.perGroup : dict.common.perPerson}
          </span>
        </div>

        {trip.priceNote ? (
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-mist/55">{trip.priceNote}</p>
        ) : null}

        {/* Next departure — the scarcest, most decision-relevant line on the page. */}
        {next ? (
          <div className="mt-5 border border-white/10 bg-white/[0.05] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 font-heading text-[0.625rem] font-semibold tracking-[0.16em] text-mist/55 uppercase">
                <CalendarDays className="size-3.5 text-sage" aria-hidden />
                Next departure
              </p>
              {limited ? (
                <span className="inline-flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-[0.12em] text-ember uppercase">
                  <span className="trip-pulse" aria-hidden />
                  {next.statusLabel}
                </span>
              ) : (
                <span className="text-[0.625rem] font-semibold tracking-[0.12em] text-glacier uppercase">
                  {next.statusLabel}
                </span>
              )}
            </div>
            <p className="mt-2 font-heading text-[0.9375rem] font-semibold text-white">
              {next.startLabel}
            </p>
            <p className="mt-0.5 text-[0.75rem] text-mist/55">
              {departureCountdown(next.daysAway)} · {next.rangeLabel}
            </p>
          </div>
        ) : null}

        <dl className="mt-5 space-y-0 divide-y divide-white/10 border-y border-white/10">
          <Row icon={Clock} label={dict.trip.duration} value={duration} />
          <Row icon={Gauge} label={dict.trip.difficultyLevel} value={difficultyLabel(trip.difficulty)} />
          {altitude ? <Row icon={Mountain} label={dict.trip.maxAltitude} value={altitude} /> : null}
          {trip.groupSizeMax ? (
            <Row
              icon={Users}
              label={dict.trip.groupSize}
              value={`Max ${formatNumber(trip.groupSizeMax)}`}
            />
          ) : null}
        </dl>

        <div className="mt-5 space-y-2.5">
          <Button asChild size="lg" variant="sage" className="group h-12 w-full text-[0.9375rem]">
            <Link href={bookingHref}>
              {dict.trip.bookThisTrek}
              <ArrowRight
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline-light"
            className="h-11 w-full text-[0.875rem]"
          >
            <Link href={inquiryHref}>{dict.trip.enquire}</Link>
          </Button>
        </div>

        <ul className="mt-5 space-y-2">
          <Assurance icon={ShieldCheck}>{dict.trip.assuranceLocal}</Assurance>
          <Assurance icon={MessageCircle}>{dict.trip.assuranceReply}</Assurance>
          <Assurance icon={ShieldCheck}>{dict.trip.assuranceFees}</Assurance>
        </ul>

        {whatsapp || phone ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-[0.8125rem]">
            {whatsapp ? (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-mist/70 transition-colors hover:text-sage"
              >
                WhatsApp
              </a>
            ) : null}
            {phone ? (
              <a
                href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                className="inline-flex items-center gap-1.5 text-mist/70 transition-colors hover:text-sage"
              >
                {phone}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="flex min-w-0 items-center gap-2 text-[0.8125rem] text-mist/60">
        <Icon className="size-3.5 shrink-0 text-sage" aria-hidden />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="min-w-0 truncate text-right font-heading text-[0.8125rem] font-semibold text-white">
        {value}
      </dd>
    </div>
  )
}

function Assurance({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <li className="trip-booking-card__assurance">
      <Icon className="size-3.5" aria-hidden />
      <span>{children}</span>
    </li>
  )
}
