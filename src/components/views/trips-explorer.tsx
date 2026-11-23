'use client'

import { useRouter } from 'next/navigation'
import { archiveHref, filterQuery, type TripFilters } from '@/lib/catalog'
import { X } from 'lucide-react'

import { TripCard } from '@/components/cards/trip-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { dictionary, plural } from '@/i18n/dictionaries'
import type { TripCard as TripCardData } from '@/lib/data'
import { DIFFICULTY_VALUES, difficultyLabel } from '@/lib/difficulty'
import { tripTypeLabel } from '@/lib/trip-filters'

export function TripsExplorer({
  trips,
  destinations,
  cardSummaryClassName,
  filters,
  totalDocs,
}: {
  filters: TripFilters
  totalDocs: number
  trips: TripCardData[]
  destinations: { slug: string; name: string }[]
  /** Extra classes for each trip card's summary — lets the page retune card copy in place. */
  cardSummaryClassName?: string
}) {
  const dict = dictionary

  const router = useRouter()
  const { difficulty, destination, season, type: tripType, sort } = filters
  const update = (key: keyof TripFilters, value: string) => {
    router.push(archiveHref('trips', 1, filterQuery({ ...filters, [key]: value })), {
      scroll: false,
    })
  }
  const reset = () => router.push('/trips', { scroll: false })
  const hasFilters =
    difficulty !== 'all' || destination !== 'all' || season !== 'all' || tripType !== 'all'

  return (
    <div>
      <div className="container-content">
        <div className="border border-slate-20 bg-white p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-2 text-label tracking-[0.12em] text-slate-80 uppercase">
                {dict.trips.difficulty}
              </Label>
              <Select value={difficulty} onValueChange={(value) => update('difficulty', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{dict.trips.any}</SelectItem>
                  {DIFFICULTY_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {difficultyLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 text-label tracking-[0.12em] text-slate-80 uppercase">
                {dict.trips.season}
              </Label>
              <Select value={season} onValueChange={(value) => update('season', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{dict.trips.any}</SelectItem>
                  {['spring', 'summer', 'autumn', 'winter'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {dict.destinations[
                        `season${value.charAt(0).toUpperCase()}${value.slice(1)}` as keyof typeof dict.destinations
                      ] ?? value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 text-label tracking-[0.12em] text-slate-80 uppercase">
                {dict.trips.destination}
              </Label>
              <Select value={destination} onValueChange={(value) => update('destination', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{dict.trips.any}</SelectItem>
                  {destinations.map((item) => (
                    <SelectItem key={item.slug} value={item.slug.toLowerCase()}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 text-label tracking-[0.12em] text-slate-80 uppercase">
                {dict.trips.sort}
              </Label>
              <Select value={sort} onValueChange={(value) => update('sort', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">{dict.trips.sortFeatured}</SelectItem>
                  <SelectItem value="price-asc">{dict.trips.sortPriceAsc}</SelectItem>
                  <SelectItem value="price-desc">{dict.trips.sortPriceDesc}</SelectItem>
                  <SelectItem value="duration-asc">{dict.trips.sortDurationAsc}</SelectItem>
                  <SelectItem value="duration-desc">{dict.trips.sortDurationDesc}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-20 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-ui text-ink-60">
                {plural(dict.trips as unknown as Record<string, string>, totalDocs)}
              </p>
              {tripType !== 'all' ? (
                <button
                  type="button"
                  onClick={() => update('type', 'all')}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-[7px] border border-slate-40 bg-mist px-2.5 py-1 text-small font-medium text-ink transition-colors hover:border-ink hover:bg-mist-60"
                >
                  <span>Style: {tripTypeLabel(tripType)}</span>
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                {dict.common.reset}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container-content mt-12">
        {trips.length === 0 ? (
          <div className="border border-dashed border-slate-40 bg-mist p-8 text-center sm:p-12">
            <h2 className="heading-md">{dict.common.noResultsTitle}</h2>
            <p className="lead mx-auto mt-3 max-w-lg">{dict.common.noResultsText}</p>
            <Button variant="outline" className="mt-6" onClick={reset}>
              {dict.common.reset}
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} summaryClassName={cardSummaryClassName} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
