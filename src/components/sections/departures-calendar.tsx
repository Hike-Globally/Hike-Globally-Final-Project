'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Calendar, Check, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { surface } from '@/components/ui/surface'
import { dictionary } from '@/i18n/dictionaries'
import {
  CALENDAR_WEEKDAYS,
  buildCalendarMonthGrid,
  departureStatusLabel,
  formatCalendarMonth,
  formatDepartureDate,
  formatDepartureRange,
  formatDepartureWeekday,
  getDepartureMonths,
  pickInitialDeparture,
  shiftMonthKey,
  type DepartureStatus,
  type NormalizedDeparture,
} from '@/lib/departures'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Trip } from '@/payload-types'

function StatusBadge({ status }: { status: DepartureStatus }) {
  const label = departureStatusLabel(status)

  if (status === 'guaranteed') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-sage-90 px-2.5 py-0.5 font-heading text-label font-semibold tracking-[0.12em] text-white uppercase">
        <Check className="size-3" strokeWidth={3} aria-hidden />
        {label}
      </span>
    )
  }

  if (status === 'limited') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-ink px-2.5 py-0.5 font-heading text-label font-semibold tracking-[0.12em] text-mist uppercase">
        {label}
      </span>
    )
  }

  if (status === 'sold-out') {
    return (
      <span className="inline-flex items-center gap-1.5 bg-mist px-2.5 py-0.5 font-heading text-label font-semibold tracking-[0.12em] text-ink-60 uppercase">
        {label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 border border-sage-40 bg-sage-20 px-2.5 py-0.5 font-heading text-label font-semibold tracking-[0.12em] text-sage-80 uppercase">
      {label}
    </span>
  )
}

export function DeparturesCalendar({
  departures,
  priceCurrency,
  priceUnit,
  tripSlug,
  bookingHref,
  hasExternalBookingLink,
}: {
  departures: NormalizedDeparture[]
  priceCurrency: Trip['priceCurrency']
  priceUnit: Trip['priceUnit']
  tripSlug?: string | null
  bookingHref: string
  hasExternalBookingLink: boolean
}) {
  const dict = dictionary
  const initialDeparture = useMemo(() => pickInitialDeparture(departures), [departures])

  const [selectedId, setSelectedId] = useState<string | null>(() => initialDeparture?.id ?? null)
  const [calendarMonth, setCalendarMonth] = useState<string>(
    () => initialDeparture?.monthKey ?? departures[0]?.monthKey ?? '2026-10',
  )
  const [activeMonthFilter, setActiveMonthFilter] = useState<string>('all')

  const selectedDeparture = useMemo(
    () => departures.find((item) => item.id === selectedId) ?? initialDeparture,
    [departures, initialDeparture, selectedId],
  )

  const months = useMemo(() => getDepartureMonths(departures), [departures])

  const departuresByStartDate = useMemo(() => {
    const map = new Map<string, NormalizedDeparture[]>()
    for (const item of departures) {
      const existing = map.get(item.startDateKey)
      if (existing) existing.push(item)
      else map.set(item.startDateKey, [item])
    }
    return map
  }, [departures])

  const visibleDepartures = useMemo(
    () =>
      activeMonthFilter === 'all'
        ? departures
        : departures.filter((item) => item.monthKey === activeMonthFilter),
    [activeMonthFilter, departures],
  )

  const calendarCells = useMemo(() => buildCalendarMonthGrid(calendarMonth), [calendarMonth])

  const departuresInCalendarMonth = useMemo(
    () => departures.filter((item) => item.monthKey === calendarMonth).length,
    [calendarMonth, departures],
  )

  const perGroup = priceUnit === 'per-group'
  const unitLabel = perGroup ? dict.common.perGroup : dict.common.perPerson

  const handleSelectMonthFilter = (monthKey: string) => {
    setActiveMonthFilter(monthKey)
    if (monthKey === 'all') return
    setCalendarMonth(monthKey)
    if (selectedDeparture?.monthKey !== monthKey) {
      const firstInMonth =
        departures.find((item) => item.monthKey === monthKey && item.status !== 'sold-out') ??
        departures.find((item) => item.monthKey === monthKey)
      if (firstInMonth) setSelectedId(firstInMonth.id)
    }
  }

  const handleStepCalendarMonth = (delta: number) => {
    const nextMonth = shiftMonthKey(calendarMonth, delta)
    setCalendarMonth(nextMonth)
    if (activeMonthFilter !== 'all') {
      setActiveMonthFilter(nextMonth)
    }
  }

  const handleSelectDeparture = (departure: NormalizedDeparture) => {
    setSelectedId(departure.id)
    setCalendarMonth(departure.monthKey)
    if (activeMonthFilter !== 'all' && activeMonthFilter !== departure.monthKey) {
      setActiveMonthFilter(departure.monthKey)
    }
  }

  const buildBookingHref = (departure: NormalizedDeparture): string => {
    if (hasExternalBookingLink || bookingHref.startsWith('#')) {
      return bookingHref
    }
    const separator = bookingHref.includes('?') ? '&' : '?'
    const params = new URLSearchParams()
    if (tripSlug) params.set('trip', tripSlug)
    params.set('startDate', departure.startDateKey)
    return `${bookingHref}${separator}${params.toString()}`
  }

  const handleBookClick = (departure: NormalizedDeparture) => {
    setSelectedId(departure.id)
    setCalendarMonth(departure.monthKey)
    if (!hasExternalBookingLink && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hg:select-departure-date', {
          detail: { startDate: departure.startDateKey, tripSlug: tripSlug ?? undefined },
        }),
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Month quick-filter strip */}
      <div
        role="group"
        aria-label="Filter departures by month"
        className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap"
      >
        <button
          type="button"
          onClick={() => handleSelectMonthFilter('all')}
          aria-pressed={activeMonthFilter === 'all'}
          className={cn(
            'shrink-0 cursor-pointer rounded-[7px] border px-3.5 py-2 font-heading text-label font-semibold tracking-[0.08em] uppercase transition-[background-color,border-color,color,box-shadow]',
            activeMonthFilter === 'all'
              ? 'border-btn-primary bg-btn-primary text-white shadow-2xs'
              : 'border-ink/18 bg-white text-ink-80 hover:border-ink/45 hover:bg-mist hover:text-ink',
          )}
        >
          {dict.trip.allDates} ({departures.length})
        </button>

        {months.map((month) => {
          const active = activeMonthFilter === month.monthKey
          return (
            <button
              key={month.monthKey}
              type="button"
              onClick={() => handleSelectMonthFilter(month.monthKey)}
              aria-pressed={active}
              className={cn(
                'shrink-0 cursor-pointer rounded-[7px] border px-3.5 py-2 font-heading text-label font-semibold tracking-[0.08em] uppercase transition-[background-color,border-color,color,box-shadow]',
                active
                  ? 'border-btn-primary bg-btn-primary text-white shadow-2xs'
                  : 'border-ink/18 bg-white text-ink-80 hover:border-ink/45 hover:bg-mist hover:text-ink',
              )}
            >
              {month.shortLabel} ({month.count})
            </button>
          )
        })}
      </div>

      {/* Calendar + Departure Dates schedule */}
      <div className="grid items-start gap-6 xl:grid-cols-[21.5rem_minmax(0,1fr)]">
        {/* Interactive Month Calendar */}
        <div className={cn(surface, 'p-5 sm:p-6 xl:sticky xl:top-28')}>
          <div className="flex items-center justify-between gap-3 pb-4">
            <button
              type="button"
              onClick={() => handleStepCalendarMonth(-1)}
              aria-label={dict.trip.previousMonth}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-[7px] border border-ink/20 bg-white text-ink shadow-2xs transition-colors hover:border-btn-primary hover:bg-btn-primary hover:text-white"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>

            <div className="min-w-0 text-center">
              <p className="font-heading text-body font-semibold text-ink">
                {formatCalendarMonth(calendarMonth)}
              </p>
              <p className="mt-0.5 text-label text-slate-80">
                {departuresInCalendarMonth === 1
                  ? '1 departure'
                  : `${departuresInCalendarMonth} departures`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleStepCalendarMonth(1)}
              aria-label={dict.trip.nextMonth}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-[7px] border border-ink/20 bg-white text-ink shadow-2xs transition-colors hover:border-btn-primary hover:bg-btn-primary hover:text-white"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>

          <div
            className="grid grid-cols-7 gap-1 border-t border-slate-20 pt-4 pb-2 text-center"
            aria-hidden
          >
            {CALENDAR_WEEKDAYS.map((weekday) => (
              <span
                key={weekday}
                className="font-heading text-label font-semibold tracking-[0.12em] text-slate-80 uppercase"
              >
                {weekday}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const matchingDepartures = departuresByStartDate.get(cell.dateKey)
              const primaryDeparture =
                matchingDepartures?.find((item) => item.status !== 'sold-out') ??
                matchingDepartures?.[0]
              const isSelectedStart = Boolean(
                selectedDeparture && cell.dateKey === selectedDeparture.startDateKey,
              )
              const inSelectedWindow = Boolean(
                selectedDeparture &&
                cell.dateKey > selectedDeparture.startDateKey &&
                cell.dateKey <= selectedDeparture.endDateKey,
              )
              const isSelectedEnd = Boolean(
                selectedDeparture &&
                selectedDeparture.endDateKey !== selectedDeparture.startDateKey &&
                cell.dateKey === selectedDeparture.endDateKey,
              )

              if (primaryDeparture) {
                const allSoldOut = matchingDepartures!.every((item) => item.status === 'sold-out')
                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    aria-pressed={isSelectedStart}
                    aria-label={`${formatDepartureDate(cell.dateKey)} — ${departureStatusLabel(primaryDeparture.status)}, ${formatPrice(primaryDeparture.price, priceCurrency)}`}
                    onClick={() => handleSelectDeparture(primaryDeparture)}
                    className={cn(
                      'relative flex h-10 cursor-pointer flex-col items-center justify-center rounded-[7px] font-heading text-small font-semibold transition-colors',
                      !cell.inCurrentMonth && !isSelectedStart && 'opacity-65',
                      isSelectedStart
                        ? 'bg-btn-primary text-white'
                        : allSoldOut
                          ? 'bg-mist text-ink-70 line-through ring-1 ring-slate-20 hover:bg-mist-60'
                          : 'bg-sage-20 text-ink ring-1 ring-sage-40 hover:bg-sage-40',
                    )}
                  >
                    <span>{cell.dayOfMonth}</span>
                    <span
                      aria-hidden
                      className={cn(
                        'mt-0.5 size-1 rounded-full',
                        isSelectedStart ? 'bg-sage-light' : allSoldOut ? 'bg-slate-40' : 'bg-sage-90',
                      )}
                    />
                  </button>
                )
              }

              return (
                <span
                  key={cell.dateKey}
                  className={cn(
                    'grid h-10 place-items-center rounded-[7px] text-small',
                    inSelectedWindow
                      ? isSelectedEnd
                        ? 'bg-haze-20 font-heading font-semibold text-deep-90 ring-1 ring-haze-40'
                        : 'bg-haze-20 font-medium text-deep-90'
                      : cell.inCurrentMonth
                        ? 'text-ink-70'
                        : 'text-slate-80',
                  )}
                >
                  {cell.dayOfMonth}
                </span>
              )
            })}
          </div>

          <div className="mt-5 space-y-3 border-t border-slate-20 pt-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-label text-ink-70">
              <span className="inline-flex items-center gap-2">
                <span aria-hidden className="inline-block size-3 bg-sage-20 ring-1 ring-sage-40" />
                {dict.trip.departureDateLegend}
              </span>
              <span className="inline-flex items-center gap-2">
                <span aria-hidden className="inline-block size-3 bg-haze-20 ring-1 ring-haze-40" />
                {dict.trip.selectedWindowLegend}
              </span>
            </div>

            {selectedDeparture ? (
              <div className="flex items-center gap-2.5 bg-mist px-3 py-2.5 text-label text-ink">
                <Calendar className="size-3.5 shrink-0 text-deep" aria-hidden />
                <span className="min-w-0 truncate font-heading font-semibold">
                  {formatDepartureRange(
                    selectedDeparture.startDateKey,
                    selectedDeparture.endDateKey,
                  )}
                </span>
                <span className="ml-auto shrink-0 text-slate-80">
                  {selectedDeparture.durationDays} {dict.common.days}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Departure Dates List */}
        <div className="min-w-0 space-y-3.5">
          {visibleDepartures.length ? (
            <ul className="space-y-3.5">
              {visibleDepartures.map((departure) => {
                const isSelected = selectedDeparture?.id === departure.id
                const soldOut = departure.status === 'sold-out'
                const startWeekday = formatDepartureWeekday(departure.startDateKey)
                const endWeekday = formatDepartureWeekday(departure.endDateKey)
                const weekdaySummary =
                  departure.startDateKey === departure.endDateKey
                    ? startWeekday
                    : `${startWeekday} – ${endWeekday}`

                return (
                  <li
                    key={departure.id}
                    onClick={() => handleSelectDeparture(departure)}
                    className={cn(
                      surface,
                      'cursor-pointer border-l-[3px] p-4 transition-colors sm:p-5',
                      isSelected
                        ? 'border-l-sage bg-mist'
                        : 'border-l-transparent hover:border-l-slate-40',
                    )}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            onClick={(event) => {
                              event.stopPropagation()
                              handleSelectDeparture(departure)
                            }}
                            className="cursor-pointer rounded-[7px] text-left font-heading text-subhead font-semibold text-ink hover:text-deep"
                          >
                            {formatDepartureRange(departure.startDateKey, departure.endDateKey)}
                          </button>
                          <StatusBadge status={departure.status} />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-60">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="size-3.5 text-slate-80" aria-hidden />
                            {weekdaySummary} · {departure.durationDays} {dict.common.days}
                          </span>
                          {departure.note ? (
                            <span className="font-medium text-deep">· {departure.note}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-t border-slate-20 pt-3 sm:shrink-0 sm:justify-end sm:border-t-0 sm:pt-0">
                        <div className="sm:text-right">
                          <p className="font-heading text-card font-semibold text-ink">
                            {formatPrice(departure.price, priceCurrency)}
                          </p>
                          <p className="text-label text-ink-60">{unitLabel}</p>
                        </div>

                        {soldOut ? (
                          <span className="inline-flex h-8 items-center rounded-[7px] border border-slate-20 bg-mist px-3.5 font-heading text-label font-semibold tracking-[0.08em] text-ink-60 uppercase">
                            {departureStatusLabel('sold-out')}
                          </span>
                        ) : (
                          <Button
                            asChild
                            size="sm"
                            variant={isSelected ? 'default' : 'sage'}
                            className="shrink-0"
                          >
                            <Link
                              href={buildBookingHref(departure)}
                              onClick={(event) => {
                                event.stopPropagation()
                                handleBookClick(departure)
                              }}
                            >
                              {hasExternalBookingLink ? dict.trip.bookNow : dict.trip.enquireDate}
                              <ArrowRight className="size-3.5" aria-hidden />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className={cn(surface, 'flex flex-wrap items-center justify-between gap-4 p-6')}>
              <p className="text-ui text-ink-70">{dict.trip.noDeparturesInMonth}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleSelectMonthFilter('all')}
              >
                {dict.trip.viewAllDates}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
