import Link from 'next/link'
import { ArrowUpRight, Clock, Mountain, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { PayloadImageFill } from '@/components/ui/payload-image'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import type { TripCard } from '@/lib/data'
import { difficultyBadgeVariant, difficultyLabel } from '@/lib/difficulty'
import { formatNumber, formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

export function TripCard({
  trip,
  priority = false,
  className,
  titleClassName,
  summaryClassName,
}: {
  trip: TripCard
  priority?: boolean
  className?: string
  /** Extra classes for the title — lets a section retune its copy in place. */
  titleClassName?: string
  /** Extra classes for the summary paragraph — lets a section retune its copy in place. */
  summaryClassName?: string
}) {
  const dict = dictionary
  const href = sitePath(`/trips/${trip.slug}`)

  const destinationName =
    trip.destination && typeof trip.destination !== 'number' ? trip.destination.name : null

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden border border-slate-20 bg-card transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-ink-60',
        className,
      )}
    >
      <Link href={href} className="photo-plate relative block aspect-[4/3]">
        <PayloadImageFill
          media={trip.heroImage}
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 45vw, 92vw"
          priority={priority}
          imageClassName="transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
          {trip.featured ? (
            <Badge variant="sage">{dict.common.featured}</Badge>
          ) : (
            <span />
          )}
          <Badge
            variant={difficultyBadgeVariant(trip.difficulty)}
            className="trip-card-difficulty max-w-[10.5rem] text-center leading-snug whitespace-normal"
          >
            {difficultyLabel(trip.difficulty)}
          </Badge>
        </div>
        {destinationName ? (
          <div className="photo-scrim absolute inset-x-0 bottom-0 p-4 pt-12">
            <p className="text-small font-medium text-mist">{destinationName}</p>
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3
          className={cn(
            'trip-card-title font-heading text-card font-semibold break-words text-ink',
            titleClassName,
          )}
        >
          <Link href={href} className="after:absolute after:inset-0">
            {trip.title}
          </Link>
        </h3>

        <p
          className={cn(
            'mt-2 line-clamp-2 card-description-copy leading-relaxed text-ink-60',
            summaryClassName,
          )}
        >
          {trip.summary}
        </p>

        <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-small text-slate-80">
          <div className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            <dt className="sr-only">{dict.trip.duration}</dt>
            <dd>
              {trip.durationDays} {dict.common.days}
            </dd>
          </div>
          {trip.maxAltitude ? (
            <div className="flex items-center gap-1.5">
              <Mountain className="size-4" aria-hidden />
              <dt className="sr-only">{dict.trip.maxAltitude}</dt>
              <dd>{formatNumber(trip.maxAltitude)} m</dd>
            </div>
          ) : null}
          {trip.groupSizeMax ? (
            <div className="flex items-center gap-1.5">
              <Users className="size-4" aria-hidden />
              <dt className="sr-only">{dict.trip.groupSize}</dt>
              <dd>max {trip.groupSizeMax}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-slate-20 pt-4">
          <p className="text-small text-slate-80">
            {dict.common.from}{' '}
            <span className="font-heading text-card font-semibold text-ink">
              {formatPrice(trip.priceFrom, trip.priceCurrency)}
            </span>
            <span className="ml-1 text-slate-80">
              {trip.priceUnit === 'per-group' ? dict.common.perGroup : dict.common.perPerson}
            </span>
          </p>
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-full border border-slate-40 text-ink transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-white"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </article>
  )
}
