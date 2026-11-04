import {
  departureStatusLabel,
  formatDepartureDate,
  formatDepartureRange,
  formatShortMonth,
  normalizeDepartures,
  pickInitialDeparture,
  toDateKey,
  type DepartureItemInput,
  type DepartureStatus,
  type NormalizedDeparture,
} from './departures'

/**
 * ============================================================================
 * Trip single page — derived facts for the hero, booking card and section nav.
 * ============================================================================
 *
 * Everything here is pure: no Payload import, no React, no clock reads except the
 * explicit `now` a caller may pass in. That keeps the trip page's most fragile values
 * (departure countdown, seat counts, the anchor list) unit-testable, and it keeps the
 * *server-rendered* result and the *hydrated* result identical when the page is cached
 * for an hour (`revalidate = 3600`).
 *
 * The rules encoded here mirror what the commercial trekking sites do on their trip
 * pages, because those are the values a traveller scans before reading a word:
 *   • "Next departure 12 Mar 2027 · 4 seats left" beside the price
 *   • a row of trip facts (duration, max altitude, grade, group size, season)
 *   • a jump-to section nav that only lists sections the page actually renders
 */

/* -------------------------------------------------------------------------- */
/* Season labels                                                              */
/* -------------------------------------------------------------------------- */

export const SEASON_LABELS = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
} as const

export type SeasonValue = keyof typeof SEASON_LABELS

export const isSeason = (value: unknown): value is SeasonValue =>
  typeof value === 'string' && value in SEASON_LABELS

/** `['spring','autumn']` → `['Spring','Autumn']`, unknown values dropped, CMS order kept. */
export function seasonLabels(values: readonly string[] | null | undefined): string[] {
  if (!values?.length) return []
  return values.filter(isSeason).map((value) => SEASON_LABELS[value])
}

/* -------------------------------------------------------------------------- */
/* Next departure                                                             */
/* -------------------------------------------------------------------------- */

export type NextDeparture = {
  departure: NormalizedDeparture
  /** `guaranteed` / `limited` / `available` — sold-out rows are never returned. */
  status: Exclude<DepartureStatus, 'sold-out'>
  statusLabel: string
  /** "Mar 12, 2027" — matches the departure table's date format. */
  startLabel: string
  /** "12 Mar – 25 Mar 2027" */
  rangeLabel: string
  /** "Mar 2027" */
  monthLabel: string
  /** Whole days from `now` to the start date (0 on the day itself). */
  daysAway: number
  /** Fraction of the group still bookable, 0–1. `null` when the group size is unknown. */
  seatsLeftRatio: number | null
}

/** Calendar-day difference between two `YYYY-MM-DD` keys (b − a). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  if (!ay || !am || !ad || !by || !bm || !bd) return 0
  const start = Date.UTC(ay, am - 1, ad)
  const end = Date.UTC(by, bm - 1, bd)
  return Math.round((end - start) / 86_400_000)
}

/** Today as a `YYYY-MM-DD` key in UTC — the same calendar the departures module uses. */
export const todayKey = (now: Date = new Date()): string =>
  `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(
    now.getUTCDate(),
  ).padStart(2, '0')}`

/**
 * The next bookable departure, or `null`.
 *
 * "Bookable" excludes sold-out rows and rows that have already started — a page cached
 * from yesterday must never advertise a departure that has left. A departure starting
 * today still counts (travellers do book last-minute via the enquiry form).
 */
export function nextDeparture(
  departures: readonly NormalizedDeparture[],
  options: { now?: Date; groupSizeMax?: number | null } = {},
): NextDeparture | null {
  const from = todayKey(options.now ?? new Date())
  // `status !== 'sold-out'` is a runtime filter, not a type guard, so the status is
  // re-read here to narrow it for the return type.
  const departure =
    departures.find((item) => item.status !== 'sold-out' && item.startDateKey >= from) ?? null
  if (!departure || departure.status === 'sold-out') return null

  const groupSizeMax =
    typeof options.groupSizeMax === 'number' && options.groupSizeMax > 0
      ? options.groupSizeMax
      : null

  /**
   * Seats are not stored per departure, so the ratio is a *presentation* hint: a
   * "limited" row is shown as nearly full, a guaranteed row as comfortably open. It
   * drives the pace of a meter only — the exact number of seats is deliberately never
   * printed, because that would be invented data on a live page.
   */
  const seatsLeftRatio =
    groupSizeMax === null ? null : departure.status === 'limited' ? 0.2 : 0.9

  return {
    departure,
    status: departure.status,
    statusLabel: departureStatusLabel(departure.status),
    startLabel: formatDepartureDate(departure.startDateKey),
    rangeLabel: formatDepartureRange(departure.startDateKey, departure.endDateKey),
    monthLabel: formatShortMonth(departure.monthKey),
    daysAway: Math.max(0, daysBetween(from, departure.startDateKey)),
    seatsLeftRatio,
  }
}

/** `normalizeDepartures` + `nextDeparture` in one call, for the server-rendered strip. */
export function nextDepartureForTrip(
  items: readonly DepartureItemInput[] | null | undefined,
  options: { durationDays: number; priceFrom: number; now?: Date; groupSizeMax?: number | null },
): NextDeparture | null {
  const departures = normalizeDepartures(items, {
    durationDays: options.durationDays,
    priceFrom: options.priceFrom,
  })
  return nextDeparture(departures, { now: options.now, groupSizeMax: options.groupSizeMax })
}

/** Count of departures that are still bookable from `now` on. */
export function bookableDepartureCount(
  departures: readonly NormalizedDeparture[],
  now: Date = new Date(),
): number {
  const from = todayKey(now)
  return departures.filter((item) => item.status !== 'sold-out' && item.startDateKey >= from)
    .length
}

/** The departure the booking card highlights: earliest open one, else the very first. */
export const featuredDeparture = pickInitialDeparture

/* -------------------------------------------------------------------------- */
/* Trip facts (the stat row under the hero)                                   */
/* -------------------------------------------------------------------------- */

export type TripDuration = { days: number; nights: number | null }

/**
 * Nights are only shown when the CMS has them; a trip with 14 days and no nights
 * entered must read "14 days", not "14 days / 0 nights".
 */
export function tripDuration(days: number, nights?: number | null): TripDuration {
  return {
    days: Number.isFinite(days) ? Math.max(0, Math.trunc(days)) : 0,
    nights: typeof nights === 'number' && nights > 0 ? Math.trunc(nights) : null,
  }
}

/** "14 days / 13 nights", or "14 days" when nights were not entered. */
export function durationLabel({ days, nights }: TripDuration): string {
  return nights ? `${days} days / ${nights} nights` : `${days} days`
}

/** A season range from the CMS multi-select: `Spring · Autumn`, or `Year-round`? No — empty. */
export function seasonSummary(values: readonly string[] | null | undefined): string {
  const labels = seasonLabels(values)
  return labels.join(' · ')
}

/* -------------------------------------------------------------------------- */
/* Section navigation                                                         */
/* -------------------------------------------------------------------------- */

export type TripAnchor = { id: string; label: string }

/**
 * The sections a trip page renders as anchors, in the order they appear.
 *
 * The labels are the ones the sections themselves print, shortened only where the
 * heading is a sentence ("Essential Information You Must Know" → "Essential info").
 * A section is listed only when the page will actually render it — an anchor to an
 * empty section is worse than no anchor at all.
 */
export const TRIP_SECTION_LABELS = {
  overview: 'Overview',
  keyTakeaways: 'Key takeaways',
  whyChoose: 'Why us',
  highlights: 'Highlights',
  routeMap: 'Route map',
  itinerary: 'Itinerary',
  departures: 'Departures',
  information: 'Essential info',
  inclusions: 'Includes',
  packing: 'Packing list',
  faqs: 'FAQs',
  gallery: 'Gallery',
  inquiry: 'Enquire',
} as const

export type TripSectionKind = keyof typeof TRIP_SECTION_LABELS

/** Which kinds have an `id` in the rendered page, so `#kind` scrolls somewhere real. */
export const TRIP_SECTION_IDS: Record<TripSectionKind, string> = {
  overview: 'overview',
  keyTakeaways: 'key-takeaways',
  whyChoose: 'why-choose-this-trek',
  highlights: 'highlights',
  routeMap: 'route-map',
  itinerary: 'itinerary',
  departures: 'departures',
  information: 'essential-information',
  inclusions: 'inclusions',
  packing: 'packing-list',
  faqs: 'faqs',
  gallery: 'gallery',
  inquiry: 'inquiry',
}

export function isTripSectionKind(value: string): value is TripSectionKind {
  return value in TRIP_SECTION_LABELS
}

/**
 * Builds the in-page nav from the trip's resolved section list.
 *
 * `visible` is the set of kinds whose content is non-empty; pass it so the nav never
 * links to a section the page hides (an FAQ anchor with no questions, say). Order
 * follows the document, so an editor who moves Itinerary above Overview gets a nav
 * that matches the page.
 */
export function tripAnchors(
  kinds: readonly string[],
  visible: ReadonlySet<string> = new Set(Object.keys(TRIP_SECTION_LABELS)),
): TripAnchor[] {
  const seen = new Set<string>()
  const anchors: TripAnchor[] = []
  for (const kind of kinds) {
    if (!isTripSectionKind(kind) || seen.has(kind) || !visible.has(kind)) continue
    seen.add(kind)
    anchors.push({ id: TRIP_SECTION_IDS[kind], label: TRIP_SECTION_LABELS[kind] })
  }
  return anchors
}

/* -------------------------------------------------------------------------- */
/* Where the dark trust band interrupts the page                              */
/* -------------------------------------------------------------------------- */

/**
 * Kinds that make a natural break for the full-bleed dark band, best first.
 *
 * The band is a *breath* in the page, so it goes after the trip has been
 * introduced and before the practical detail starts: after the route map /
 * altitude chart when there is one (that closes the "what and where" chapter),
 * otherwise after the highlights, otherwise after the overview.
 */
const TRUST_BAND_BREAKS = ['routeMap', 'highlights', 'overview'] as const

/**
 * Index in the body-section list *after which* the dark trust band is inserted,
 * or `-1` when the band would crowd the page.
 *
 * `groupPageSections` merges every adjacent body section into one run, so the
 * band cannot be placed by group alone — without this, it would always land
 * between the last body section and the inquiry form (i.e. at the very end,
 * where it reads as a second footer rather than as a break).
 *
 * Guard rails, both covered by tests:
 *   • at least 3 body sections before the cut, so the band is not in the hero's lap;
 *   • at least 2 after it, so the band never sits directly above the inquiry
 *     band (two dark full-bleed sections back to back).
 */
export function trustBandBreak(sections: readonly { kind: string }[]): number {
  if (sections.length < 5) return -1

  for (const kind of TRUST_BAND_BREAKS) {
    const index = sections.findIndex((section) => section.kind === kind)
    if (index >= 2 && sections.length - 1 - index >= 2) return index
  }

  const middle = Math.floor(sections.length / 2)
  return middle >= 2 && sections.length - middle >= 2 ? middle - 1 : -1
}

/* -------------------------------------------------------------------------- */
/* Small formatting helpers used across the page                              */
/* -------------------------------------------------------------------------- */

/** Altitude in both units: `5,364 m / 17,598 ft` — what the reference pages print. */
export function altitudeLabel(metres: number | null | undefined): string | null {
  if (typeof metres !== 'number' || !Number.isFinite(metres) || metres <= 0) return null
  const feet = Math.round(metres * 3.28084)
  return `${metres.toLocaleString('en-US')} m / ${feet.toLocaleString('en-US')} ft`
}

/** Altitude in metres only — for compact rows where the feet value would wrap. */
export function metresLabel(metres: number | null | undefined): string | null {
  if (typeof metres !== 'number' || !Number.isFinite(metres) || metres <= 0) return null
  return `${metres.toLocaleString('en-US')} m`
}

/** "in 34 days" / "tomorrow" / "today" — a soft countdown for the booking card. */
export function departureCountdown(daysAway: number): string {
  if (daysAway <= 0) return 'Departs today'
  if (daysAway === 1) return 'Departs tomorrow'
  if (daysAway < 14) return `Departs in ${daysAway} days`
  if (daysAway < 60) return `Departs in ${Math.round(daysAway / 7)} weeks`
  return `Departs in ${Math.round(daysAway / 30)} months`
}

/** Validates an ISO date the CMS may hand back as a string or Date. */
export const departureDateKey = toDateKey
