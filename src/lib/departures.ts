/**
 * Trip departure dates — shared parsing, calendar math and formatting for the
 * Payload admin date chooser and the public/preview Departures section.
 *
 * Every calendar calculation runs on `YYYY-MM-DD` strings and UTC noon `Date`
 * values (`YYYY-MM-DDT12:00:00.000Z`), so server-rendered HTML and client-side
 * hydration produce identical dates in every timezone (including UTC+5:45 Nepal
 * and negative UTC offsets).
 */

const LOCALE_TAG = 'en-US'

export const departureStatusOptions = [
  { label: 'Available', value: 'available' },
  { label: 'Guaranteed', value: 'guaranteed' },
  { label: 'Limited spots', value: 'limited' },
  { label: 'Sold out', value: 'sold-out' },
] as const

export type DepartureStatus = (typeof departureStatusOptions)[number]['value']

export type DepartureItemInput = {
  id?: string | null
  startDate?: string | Date | null
  endDate?: string | Date | null
  status?: string | null
  price?: number | null
  note?: string | null
}

export type NormalizedDeparture = {
  id: string
  startDateKey: string
  endDateKey: string
  monthKey: string
  durationDays: number
  status: DepartureStatus
  price: number
  hasCustomPrice: boolean
  note: string | null
}

export type DepartureMonth = {
  monthKey: string
  label: string
  shortLabel: string
  count: number
}

export type CalendarDayCell = {
  dateKey: string
  dayOfMonth: number
  inCurrentMonth: boolean
}

export const CALENDAR_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const statusLabelMap = new Map<string, string>(
  departureStatusOptions.map(({ value, label }) => [value, label]),
)

export function isDepartureStatus(value: unknown): value is DepartureStatus {
  return typeof value === 'string' && statusLabelMap.has(value)
}

export function departureStatusLabel(value: string | null | undefined): string {
  if (!value) return 'Available'
  return statusLabelMap.get(value) ?? value
}

const pad2 = (value: number): string => String(value).padStart(2, '0')

const formatUtcDateKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`

/**
 * Normalizes a Payload ISO date string, bare `YYYY-MM-DD`, or `Date` into `YYYY-MM-DD`.
 * Returns `null` for empty or invalid values (such as `'2026-02-30'`).
 */
export function toDateKey(value: string | Date | null | undefined): string | null {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : formatUtcDateKey(value)
  }

  const trimmed = value.trim()
  if (!trimmed) return null

  const bareMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (bareMatch) {
    const year = Number(bareMatch[1])
    const month = Number(bareMatch[2])
    const day = Number(bareMatch[3])
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null
    }
    return `${bareMatch[1]}-${bareMatch[2]}-${bareMatch[3]}`
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return formatUtcDateKey(parsed)
}

/** `YYYY-MM-DD` → UTC noon `Date` (`YYYY-MM-DDT12:00:00.000Z`). */
export function dateKeyToUtcNoon(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0, 0))
}

/** `YYYY-MM-DD` → ISO string pinned to 12:00 UTC for Payload `dayOnly` date fields. */
export function dateKeyToIsoNoon(dateKey: string): string {
  return dateKeyToUtcNoon(dateKey).toISOString()
}

/** Pure UTC calendar addition across month, year and leap-day boundaries. */
export function addCalendarDays(dateKey: string, days: number): string {
  const date = dateKeyToUtcNoon(dateKey)
  date.setUTCDate(date.getUTCDate() + Math.trunc(days))
  return formatUtcDateKey(date)
}

/** Inclusive day count between two `YYYY-MM-DD` keys (`2026-10-15`..`2026-10-28` → `14`). */
export function daysBetweenInclusive(startDateKey: string, endDateKey: string): number {
  const msPerDay = 86_400_000
  const startMs = dateKeyToUtcNoon(startDateKey).getTime()
  const endMs = dateKeyToUtcNoon(endDateKey).getTime()
  return Math.max(1, Math.round((endMs - startMs) / msPerDay) + 1)
}

/**
 * Uses the editor's explicit `endDate` when valid and not before `startDateKey`;
 * otherwise computes `startDateKey + (tripDurationDays - 1)`.
 */
export function resolveEndDateKey(
  startDateKey: string,
  endDate: string | Date | null | undefined,
  tripDurationDays: number,
): string {
  const explicit = toDateKey(endDate)
  if (explicit && explicit >= startDateKey) return explicit
  const spanDays = Math.max(1, Math.round(Number(tripDurationDays) || 1))
  return addCalendarDays(startDateKey, spanDays - 1)
}

/**
 * Cleans, enriches and chronologically sorts raw CMS departure rows.
 * Draft rows whose start date has not been chosen yet are safely skipped.
 */
export function normalizeDepartures(
  items: readonly DepartureItemInput[] | null | undefined,
  options: { durationDays: number; priceFrom: number },
): NormalizedDeparture[] {
  if (!items?.length) return []

  const normalized: NormalizedDeparture[] = []

  items.forEach((item, index) => {
    const startDateKey = toDateKey(item?.startDate)
    if (!startDateKey) return

    const endDateKey = resolveEndDateKey(startDateKey, item?.endDate, options.durationDays)
    const hasCustomPrice = typeof item?.price === 'number' && Number.isFinite(item.price)
    const status: DepartureStatus = isDepartureStatus(item?.status) ? item.status : 'available'
    const note = item?.note?.trim() ? item.note.trim() : null

    normalized.push({
      id: item?.id ? String(item.id) : `dep-${index}-${startDateKey}`,
      startDateKey,
      endDateKey,
      monthKey: startDateKey.slice(0, 7),
      durationDays: daysBetweenInclusive(startDateKey, endDateKey),
      status,
      price: hasCustomPrice ? item.price! : options.priceFrom,
      hasCustomPrice,
      note,
    })
  })

  return normalized.sort(
    (a, b) =>
      a.startDateKey.localeCompare(b.startDateKey) ||
      a.endDateKey.localeCompare(b.endDateKey) ||
      a.id.localeCompare(b.id),
  )
}

const monthLongFormatter = new Intl.DateTimeFormat(LOCALE_TAG, {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const monthShortFormatter = new Intl.DateTimeFormat(LOCALE_TAG, {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const fullDateFormatter = new Intl.DateTimeFormat(LOCALE_TAG, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

const shortDateFormatter = new Intl.DateTimeFormat(LOCALE_TAG, {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

const weekdayFormatter = new Intl.DateTimeFormat(LOCALE_TAG, {
  weekday: 'short',
  timeZone: 'UTC',
})

export function formatCalendarMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  return monthLongFormatter.format(new Date(Date.UTC(year, month - 1, 15, 12)))
}

export function formatShortMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  return monthShortFormatter.format(new Date(Date.UTC(year, month - 1, 15, 12)))
}

export function formatDepartureDate(dateKey: string): string {
  return fullDateFormatter.format(dateKeyToUtcNoon(dateKey))
}

export function formatDepartureShortDate(dateKey: string): string {
  return shortDateFormatter.format(dateKeyToUtcNoon(dateKey))
}

export function formatDepartureWeekday(dateKey: string): string {
  return weekdayFormatter.format(dateKeyToUtcNoon(dateKey))
}

/**
 * Human-readable date range:
 *   - Same day:      "Oct 15, 2026"
 *   - Same year:     "Oct 15 – Oct 28, 2026"
 *   - Cross-year:    "Dec 24, 2026 – Jan 6, 2027"
 */
export function formatDepartureRange(startDateKey: string, endDateKey: string): string {
  if (startDateKey === endDateKey) return formatDepartureDate(startDateKey)
  if (startDateKey.slice(0, 4) === endDateKey.slice(0, 4)) {
    return `${formatDepartureShortDate(startDateKey)} – ${formatDepartureDate(endDateKey)}`
  }
  return `${formatDepartureDate(startDateKey)} – ${formatDepartureDate(endDateKey)}`
}

/** Distinct chronological months represented in `departures`, with counts. */
export function getDepartureMonths(departures: readonly NormalizedDeparture[]): DepartureMonth[] {
  const counts = new Map<string, number>()
  for (const departure of departures) {
    counts.set(departure.monthKey, (counts.get(departure.monthKey) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, count]) => ({
      monthKey,
      label: formatCalendarMonth(monthKey),
      shortLabel: formatShortMonth(monthKey),
      count,
    }))
}

/** Shifts `'YYYY-MM'` forward or backward by `deltaMonths` (e.g. `'2026-12'` + 1 → `'2027-01'`). */
export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(Date.UTC(year || 2026, (month || 1) - 1 + deltaMonths, 15, 12))
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`
}

export function currentMonthKey(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}`
}

/**
 * Builds the Sunday-through-Saturday day grid for `monthKey` (`YYYY-MM`).
 * Always emits complete 7-day weeks covering every day of the month.
 */
export function buildCalendarMonthGrid(monthKey: string): CalendarDayCell[] {
  const [year, month] = monthKey.split('-').map(Number)
  const firstOfMonth = new Date(Date.UTC(year!, month! - 1, 1, 12))
  const lastOfMonth = new Date(Date.UTC(year!, month!, 0, 12))

  const startOffset = firstOfMonth.getUTCDay()
  const endOffset = 6 - lastOfMonth.getUTCDay()
  const totalDays = lastOfMonth.getUTCDate() + startOffset + endOffset

  const cursor = new Date(firstOfMonth)
  cursor.setUTCDate(cursor.getUTCDate() - startOffset)

  const cells: CalendarDayCell[] = []
  for (let i = 0; i < totalDays; i++) {
    const dateKey = formatUtcDateKey(cursor)
    cells.push({
      dateKey,
      dayOfMonth: cursor.getUTCDate(),
      inCurrentMonth: cursor.getUTCMonth() === month! - 1 && cursor.getUTCFullYear() === year,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return cells
}

/**
 * Deterministic initial selection for SSR & client hydration: prefers the first
 * bookable departure, falling back to the first departure when all are sold out.
 */
export function pickInitialDeparture(
  departures: readonly NormalizedDeparture[],
): NormalizedDeparture | null {
  if (!departures.length) return null
  return departures.find((item) => item.status !== 'sold-out') ?? departures[0]!
}
