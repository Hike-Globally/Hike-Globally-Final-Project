import assert from 'node:assert/strict'
import { test } from 'node:test'

import { normalizeDepartures } from './departures'
import {
  altitudeLabel,
  bookableDepartureCount,
  departureCountdown,
  durationLabel,
  metresLabel,
  nextDeparture,
  nextDepartureForTrip,
  seasonLabels,
  seasonSummary,
  todayKey,
  tripAnchors,
  tripDuration,
  trustBandBreak,
  TRIP_SECTION_IDS,
} from './trip-page'

/**
 * The trip single page's derived facts — the numbers printed beside the price, the
 * anchors in the sticky nav, and the labels in the hero. All pure, so all testable.
 */

const NOW = new Date(Date.UTC(2026, 10, 4, 9, 30)) // 4 Nov 2026

const dep = (
  startDate: string,
  status: 'available' | 'guaranteed' | 'limited' | 'sold-out' = 'available',
  price?: number,
) => ({ startDate, status, price })

test('todayKey is the UTC calendar day of the given instant', () => {
  assert.equal(todayKey(NOW), '2026-11-04')
  // Late-evening UTC can already be "tomorrow" in Kathmandu, but the site formats in UTC.
  assert.equal(todayKey(new Date('2026-11-04T23:59:00Z')), '2026-11-04')
})

test('seasonLabels drops unknown values and keeps CMS order', () => {
  assert.deepEqual(seasonLabels(['autumn', 'spring']), ['Autumn', 'Spring'])
  assert.deepEqual(seasonLabels(['monsoon', 'winter']), ['Winter'])
  assert.deepEqual(seasonLabels(null), [])
  assert.deepEqual(seasonLabels(undefined), [])
  assert.equal(seasonSummary(['spring', 'autumn']), 'Spring · Autumn')
  assert.equal(seasonSummary([]), '')
})

test('tripDuration only reports nights that were actually entered', () => {
  assert.deepEqual(tripDuration(14, 13), { days: 14, nights: 13 })
  assert.deepEqual(tripDuration(14, null), { days: 14, nights: null })
  assert.deepEqual(tripDuration(14, 0), { days: 14, nights: null })
  assert.equal(durationLabel(tripDuration(14, 13)), '14 days / 13 nights')
  assert.equal(durationLabel(tripDuration(9, undefined)), '9 days')
})

test('nextDeparture skips sold-out and already-started rows', () => {
  const departures = normalizeDepartures(
    [
      dep('2026-10-20', 'available'), // in the past
      dep('2026-11-04', 'sold-out'), // today, but full
      dep('2026-11-12', 'limited'),
      dep('2026-12-02', 'guaranteed'),
    ],
    { durationDays: 14, priceFrom: 1890 },
  )

  const next = nextDeparture(departures, { now: NOW, groupSizeMax: 12 })
  assert.ok(next)
  assert.equal(next.departure.startDateKey, '2026-11-12')
  assert.equal(next.status, 'limited')
  assert.equal(next.statusLabel, 'Limited spots')
  assert.equal(next.daysAway, 8)
  assert.equal(next.monthLabel, 'Nov 2026')
  assert.equal(next.startLabel, 'Nov 12, 2026')
  assert.equal(next.rangeLabel, 'Nov 12 – Nov 25, 2026')
  assert.equal(next.seatsLeftRatio, 0.2)
})

test('nextDeparture counts a departure starting today as bookable', () => {
  const departures = normalizeDepartures([dep('2026-11-04')], {
    durationDays: 7,
    priceFrom: 1000,
  })
  const next = nextDeparture(departures, { now: NOW })
  assert.ok(next)
  assert.equal(next.daysAway, 0)
  // No group size on the trip: no seat hint is invented.
  assert.equal(next.seatsLeftRatio, null)
})

test('nextDeparture returns null when nothing is left to sell', () => {
  const departures = normalizeDepartures(
    [dep('2026-10-01'), dep('2026-11-12', 'sold-out')],
    { durationDays: 14, priceFrom: 1890 },
  )
  assert.equal(nextDeparture(departures, { now: NOW, groupSizeMax: 12 }), null)
  assert.equal(nextDeparture([], { now: NOW }), null)
  assert.equal(bookableDepartureCount(departures, NOW), 0)
})

test('bookableDepartureCount counts open departures from today on', () => {
  const departures = normalizeDepartures(
    [
      dep('2026-10-01'),
      dep('2026-11-12'),
      dep('2026-11-26', 'sold-out'),
      dep('2026-12-10', 'guaranteed'),
    ],
    { durationDays: 14, priceFrom: 1890 },
  )
  assert.equal(bookableDepartureCount(departures, NOW), 2)
})

test('nextDepartureForTrip normalises raw CMS rows in one call', () => {
  const next = nextDepartureForTrip([dep('2026-12-02', 'guaranteed', 2100)], {
    durationDays: 11,
    priceFrom: 1890,
    now: NOW,
    groupSizeMax: 10,
  })
  assert.ok(next)
  assert.equal(next.departure.price, 2100)
  assert.equal(next.status, 'guaranteed')
  assert.equal(next.seatsLeftRatio, 0.9)

  assert.equal(
    nextDepartureForTrip([], { durationDays: 11, priceFrom: 1890, now: NOW }),
    null,
  )
})

test('departureCountdown reads like a countdown, not a date', () => {
  assert.equal(departureCountdown(0), 'Departs today')
  assert.equal(departureCountdown(1), 'Departs tomorrow')
  assert.equal(departureCountdown(9), 'Departs in 9 days')
  assert.equal(departureCountdown(21), 'Departs in 3 weeks')
  assert.equal(departureCountdown(95), 'Departs in 3 months')
})

test('altitude helpers print both units and reject empty values', () => {
  assert.equal(altitudeLabel(5364), '5,364 m / 17,598 ft')
  assert.equal(altitudeLabel(0), null)
  assert.equal(altitudeLabel(null), null)
  assert.equal(altitudeLabel(Number.NaN), null)
  assert.equal(metresLabel(4130), '4,130 m')
  assert.equal(metresLabel(undefined), null)
})

test('tripAnchors lists only rendered sections, in document order, without duplicates', () => {
  assert.deepEqual(
    tripAnchors(['hero', 'overview', 'itinerary', 'overview', 'faqs', 'related']),
    [
      { id: 'overview', label: 'Overview' },
      { id: 'itinerary', label: 'Itinerary' },
      { id: 'faqs', label: 'FAQs' },
    ],
  )

  // A section the page hides (no FAQ content, an empty gallery) is not linked.
  assert.deepEqual(
    tripAnchors(['overview', 'faqs', 'gallery'], new Set(['overview', 'gallery'])),
    [
      { id: 'overview', label: 'Overview' },
      { id: 'gallery', label: 'Gallery' },
    ],
  )

  assert.deepEqual(tripAnchors([]), [])
})

test('every section anchor id is unique and kebab-cased', () => {
  const ids = Object.values(TRIP_SECTION_IDS)
  assert.equal(new Set(ids).size, ids.length)
  for (const id of ids) assert.match(id, /^[a-z][a-z-]*$/)
})

test('trustBandBreak picks a real break, not the end of the page', () => {
  const kinds = (...values: string[]) => values.map((kind) => ({ kind }))

  // Preferred break: after the route map, with plenty of page either side.
  assert.equal(
    trustBandBreak(kinds('overview', 'highlights', 'routeMap', 'itinerary', 'inclusions', 'faqs')),
    2,
  )
  // No route map: fall back to the highlights.
  assert.equal(
    trustBandBreak(kinds('overview', 'highlights', 'itinerary', 'inclusions', 'faqs')),
    1,
  )
  // Neither a route map nor highlights: the overview is too close to the hero to
  // break after, so the band falls back to the middle of the body (`middle - 1`,
  // i.e. after "itinerary") instead of reading as a second hero.
  assert.equal(
    trustBandBreak(kinds('overview', 'itinerary', 'inclusions', 'packing', 'faqs')),
    1,
  )
})

test('trustBandBreak refuses to crowd or back onto the closing bands', () => {
  const kinds = (...values: string[]) => values.map((kind) => ({ kind }))

  // Too little page to break up.
  assert.equal(trustBandBreak(kinds('overview', 'itinerary', 'inclusions')), -1)
  assert.equal(trustBandBreak([]), -1)

  // A break candidate too close to the hero is skipped, not used.
  assert.equal(
    trustBandBreak(kinds('overview', 'itinerary', 'highlights', 'inclusions', 'faqs')),
    2,
  )

  // Every candidate lands at the very end → no band at all, rather than one
  // sitting directly above the dark inquiry section.
  assert.equal(
    trustBandBreak(kinds('information', 'inclusions', 'packing', 'overview')), -1,
  )
})
