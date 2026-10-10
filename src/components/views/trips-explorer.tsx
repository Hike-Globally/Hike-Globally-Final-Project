'use client'

import { useMemo, useState } from 'react'

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

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'duration-asc' | 'duration-desc'

/**
 * Client-side trip explorer.
 *
 * TRADE-OFF: filtering happens in the browser, not via `searchParams`. That keeps /trips
 * statically rendered (instant, CDN-cacheable) instead of turning every filter click into a
 * server round trip. It is the right call up to a few hundred trips; beyond that, move the
 * filtering into the server component with `searchParams` + `<Suspense>`.
 */
export function TripsExplorer({
  trips,
  destinations,
}: {
  trips: TripCardData[]
  destinations: { slug: string; name: string }[]
}) {
  const dict = dictionary

  const [difficulty, setDifficulty] = useState<string>('all')
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
    setDifficulty('all')
    setDestination('all')
    setSeason('all')
    setSort('featured')
  }

  const hasFilters = difficulty !== 'all' || destination !== 'all' || season !== 'all'

  return (
    <div>
      <div className="container-content">
        <div className="border border-black/[0.06] bg-card p-5 shadow-[0_1px_2px_rgba(1,22,30,0.04)] md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-2 text-xs tracking-[0.12em] text-slate uppercase">
                {dict.trips.difficulty}
              </Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{dict.trips.any}</SelectItem>
                  {['easy', 'moderate', 'challenging', 'strenuous', 'extreme'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {dict.trips[
                        `difficulty${value.charAt(0).toUpperCase()}${value.slice(1)}` as keyof typeof dict.trips
                      ] ?? value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 text-xs tracking-[0.12em] text-slate uppercase">
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
              <Label className="mb-2 text-xs tracking-[0.12em] text-slate uppercase">
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
              <Label className="mb-2 text-xs tracking-[0.12em] text-slate uppercase">
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

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
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
          <div className="border border-dashed border-black/10 bg-mist p-12 text-center">
            <h2 className="heading-md">{dict.common.noResultsTitle}</h2>
            <p className="lead mx-auto mt-3 max-w-lg">{dict.common.noResultsText}</p>
            <Button variant="outline" className="mt-6" onClick={reset}>
              {dict.common.reset}
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((trip, index) => (
              <TripCard key={trip.id} trip={trip} priority={index < 3} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
