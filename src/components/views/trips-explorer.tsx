'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'

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

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'duration-asc' | 'duration-desc'

const difficultyListeners = new Set<() => void>()

const subscribeDifficulty = (onStoreChange: () => void) => {
  difficultyListeners.add(onStoreChange)
  window.addEventListener('popstate', onStoreChange)
  return () => {
    difficultyListeners.delete(onStoreChange)
    window.removeEventListener('popstate', onStoreChange)
  }
}

const getDifficultySnapshot = () => readDifficultyFromSearch(window.location.search)

const getDifficultyServerSnapshot = (): 'all' => 'all'

const setDifficultySearch = (value: string) => {
  const next = writeDifficultySearch(window.location.search, isDifficulty(value) ? value : 'all')
  window.history.replaceState(null, '', `${window.location.pathname}${next}${window.location.hash}`)
  difficultyListeners.forEach((listener) => listener())
}

/**
 * Client-side trip explorer.
 *
 * TRADE-OFF: filtering happens in the browser, not via Next `searchParams`. That keeps /trips
 * statically rendered (instant, CDN-cacheable) instead of turning every filter click into a
 * server round trip. It is the right call up to a few hundred trips; beyond that, move the
 * filtering into the server component with `searchParams` + `<Suspense>`.
 *
 * The difficulty filter is the exception that *is* mirrored onto the URL (`?difficulty=`), so
 * the homepage slider can deep-link a rung and land on the matching trips. The write uses
 * `history.replaceState` rather than the App Router, so the page stays static.
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

  const difficulty = useSyncExternalStore(
    subscribeDifficulty,
    getDifficultySnapshot,
    getDifficultyServerSnapshot,
  )
  const [destination, setDestination] = useState<string>('all')
  const [season, setSeason] = useState<string>('all')
  const [sort, setSort] = useState<Sort>('featured')

  const filtered = useMemo(() => {
    const result = trips.filter((trip) => {
      if (difficulty !== 'all' && trip.difficulty !== difficulty) return false
      if (season !== 'all' && !trip.bestSeasons?.includes(season as 'spring')) return false
      if (destination !== 'all') {
        const tripDestination = trip.destination
        const slug =
          tripDestination && typeof tripDestination !== 'number' ? tripDestination.slug : null
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
  }, [trips, difficulty, destination, season, sort])

  const reset = () => {
    setDifficultySearch('all')
    setDestination('all')
    setSeason('all')
    setSort('featured')
  }

  const hasFilters = difficulty !== 'all' || destination !== 'all' || season !== 'all'

  return (
    <div>
      <div className="container-content">
        <div className="border border-slate-20 bg-white p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-2 text-xs tracking-[0.12em] text-slate-80 uppercase">
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
              <Label className="mb-2 text-xs tracking-[0.12em] text-slate-80 uppercase">
                {dict.trips.season}
              </Label>
              <Select value={season} onValueChange={setSeason}>
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
              <Label className="mb-2 text-xs tracking-[0.12em] text-slate-80 uppercase">
                {dict.trips.destination}
              </Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{dict.trips.any}</SelectItem>
                  {destinations.map((item) => (
                    <SelectItem key={item.slug} value={item.slug}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 text-xs tracking-[0.12em] text-slate-80 uppercase">
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
            <p className="text-[0.9375rem] text-ink-60">
              {plural(dict.trips as unknown as Record<string, string>, filtered.length)}
            </p>
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
