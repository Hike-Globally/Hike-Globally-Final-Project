'use client'

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'next/navigation'
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
import {
  DIFFICULTY_VALUES,
  difficultyLabel,
  isDifficulty,
  readDifficultyFromSearch,
  writeDifficultySearch,
} from '@/lib/difficulty'
import {
  clearTripFilterSearch,
  isSeason,
  isTripType,
  readDestinationFromSearch,
  readSeasonFromSearch,
  readTripTypeFromSearch,
  tripTypeLabel,
  writeDestinationSearch,
  writeSeasonSearch,
  writeTripTypeSearch,
} from '@/lib/trip-filters'

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'duration-asc' | 'duration-desc'

const searchListeners = new Set<() => void>()

const notifySearchListeners = () => {
  searchListeners.forEach((listener) => listener())
}

const subscribeSearch = (onStoreChange: () => void) => {
  searchListeners.add(onStoreChange)
  window.addEventListener('popstate', onStoreChange)
  return () => {
    searchListeners.delete(onStoreChange)
    window.removeEventListener('popstate', onStoreChange)
  }
}

const getSearchSnapshot = () => window.location.search
const getSearchServerSnapshot = () => ''

const replaceSearch = (nextSearch: string) => {
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${nextSearch}${window.location.hash}`,
  )
  notifySearchListeners()
}

const setDifficultySearch = (value: string) => {
  replaceSearch(writeDifficultySearch(window.location.search, isDifficulty(value) ? value : 'all'))
}

const setDestinationSearch = (value: string) => {
  replaceSearch(writeDestinationSearch(window.location.search, value))
}

const setSeasonSearch = (value: string) => {
  replaceSearch(writeSeasonSearch(window.location.search, isSeason(value) ? value : 'all'))
}

const setTripTypeSearch = (value: string) => {
  replaceSearch(writeTripTypeSearch(window.location.search, isTripType(value) ? value : 'all'))
}

/**
 * Watches Next.js client navigations between `/trips?...` query strings (for example, clicking a
 * mega-menu filter link while already on `/trips`) and notifies the shared URL store without
 * forcing the surrounding page out of static generation.
 */
function TripsSearchSync() {
  const searchParams = useSearchParams()
  const serialized = searchParams.toString()

  useEffect(() => {
    notifySearchListeners()
  }, [serialized])

  return null
}

/**
 * Client-side trip explorer.
 *
 * TRADE-OFF: filtering happens in the browser, not via server `searchParams`. That keeps /trips
 * statically rendered (instant, CDN-cacheable) instead of turning every filter click into a
 * server round trip. It is the right call up to a few hundred trips; beyond that, move the
 * filtering into the server component with `searchParams` + `<Suspense>`.
 *
 * URL query params (`?difficulty=`, `?destination=`, `?season=`, `?type=`) stay mirrored via
 * `history.replaceState` so the homepage difficulty slider and the Trips mega menu can deep-link
 * straight into any filtered view while keeping `/trips` statically generated.
 */
export function TripsExplorer({
  trips,
  destinations,
  cardSummaryClassName,
}: {
  trips: TripCardData[]
  destinations: { slug: string; name: string }[]
  /** Extra classes for each trip card's summary — lets the page retune card copy in place. */
  cardSummaryClassName?: string
}) {
  const dict = dictionary

  const search = useSyncExternalStore(
    subscribeSearch,
    getSearchSnapshot,
    getSearchServerSnapshot,
  )
  const [sort, setSort] = useState<Sort>('featured')

  const validDestinationSlugs = useMemo(
    () => new Set(destinations.map((item) => item.slug.toLowerCase())),
    [destinations],
  )

  const difficulty = readDifficultyFromSearch(search)
  const destination = readDestinationFromSearch(search, validDestinationSlugs)
  const season = readSeasonFromSearch(search)
  const tripType = readTripTypeFromSearch(search)

  const filtered = useMemo(() => {
    const result = trips.filter((trip) => {
      if (difficulty !== 'all' && trip.difficulty !== difficulty) return false
      if (season !== 'all' && !trip.bestSeasons?.includes(season)) return false
      if (tripType !== 'all' && trip.tripType !== tripType) return false
      if (destination !== 'all') {
        const tripDestination = trip.destination
        const slug =
          tripDestination && typeof tripDestination !== 'number'
            ? tripDestination.slug.toLowerCase()
            : null
        if (slug !== destination) return false
      }
      return true
    })

    const sorted = [...result]
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.priceFrom - b.priceFrom)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.priceFrom - a.priceFrom)
        break
      case 'duration-asc':
        sorted.sort((a, b) => a.durationDays - b.durationDays)
        break
      case 'duration-desc':
        sorted.sort((a, b) => b.durationDays - a.durationDays)
        break
      default:
        sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    }

    return sorted
  }, [trips, difficulty, destination, season, tripType, sort])

  const reset = () => {
    replaceSearch(clearTripFilterSearch(window.location.search))
    setSort('featured')
  }

  const hasFilters =
    difficulty !== 'all' || destination !== 'all' || season !== 'all' || tripType !== 'all'

  return (
    <div>
      <Suspense fallback={null}>
        <TripsSearchSync />
      </Suspense>

      <div className="container-content">
        <div className="border border-slate-20 bg-white p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-2 text-label tracking-[0.12em] text-slate-80 uppercase">
                {dict.trips.difficulty}
              </Label>
              <Select value={difficulty} onValueChange={setDifficultySearch}>
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
              <Select value={season} onValueChange={setSeasonSearch}>
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
              <Select value={destination} onValueChange={setDestinationSearch}>
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
              <Select value={sort} onValueChange={(value) => setSort(value as Sort)}>
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
                {plural(dict.trips as unknown as Record<string, string>, filtered.length)}
              </p>
              {tripType !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setTripTypeSearch('all')}
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
        {filtered.length === 0 ? (
          <div className="border border-dashed border-slate-40 bg-mist p-8 text-center sm:p-12">
            <h2 className="heading-md">{dict.common.noResultsTitle}</h2>
            <p className="lead mx-auto mt-3 max-w-lg">{dict.common.noResultsText}</p>
            <Button variant="outline" className="mt-6" onClick={reset}>
              {dict.common.reset}
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
            {filtered.map((trip, index) => (
              <TripCard
                key={trip.id}
                trip={trip}
                priority={index < 3}
                summaryClassName={cardSummaryClassName}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
