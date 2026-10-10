/**
 * Regression tests for the homepage "Featured trips" selection rules.
 *
 * The bug these guard: `FeaturedTrips` built its list from `getFeaturedTrips()` alone — trips that
 * are published *and* ticked `featured` — and returned `null` when that was empty. So a site whose
 * operator published trips without ticking the checkbox had no trips section on the homepage at all:
 * no heading, no "View all" link, nothing in the server log. `/trips` still listed them, which made
 * it look like the homepage query or the cache was broken.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { isRenderableTripPick, pickAutomaticTrips, resolveTripSection } from './trip-selection'

const trip = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  heroImage: { id: id * 100, url: `/images/trip-${id}.jpg`, alt: 'Trail' },
  ...overrides,
})

test('an empty featured list promotes the published fallback instead of hiding the section', () => {
  // The regression itself: zero featured trips used to mean an empty section, which the block
  // treats as "render nothing".
  const published = [trip(1), trip(2), trip(3)]

  assert.deepEqual(pickAutomaticTrips([], published), published)
  assert.equal(pickAutomaticTrips([], published).length, 3)
})

test('featured trips are never diluted with unflagged ones', () => {
  const featured = [trip(7), trip(8)]
  const published = [trip(1), trip(2), trip(3)]

  assert.deepEqual(pickAutomaticTrips(featured, published), featured)
})

test('a site with no published trips at all still gets an empty list', () => {
  // The fallback must stay bounded to real published content: an empty section is correct here,
  // and the block hides itself rather than inventing a trip.
  assert.deepEqual(pickAutomaticTrips([], []), [])
})

test('manual picks beat the automatic list, and no manual picks defer to it', () => {
  const picks = [trip(42)]
  const automatic = [trip(1), trip(2)]

  assert.deepEqual(resolveTripSection(picks, automatic), picks)
  assert.deepEqual(resolveTripSection([], automatic), automatic)
})

test('unusable manual picks are dropped, so the automatic list takes over', () => {
  // A relationship can come back as a bare id (depth 0) or with the image gone (deleted upload).
  assert.equal(isRenderableTripPick(trip(1)), true)
  assert.equal(isRenderableTripPick(4), false)
  assert.equal(isRenderableTripPick(null), false)
  assert.equal(isRenderableTripPick(undefined), false)
  assert.equal(isRenderableTripPick(trip(2, { heroImage: undefined })), false)
  assert.equal(isRenderableTripPick(trip(3, { heroImage: null })), false)
  // `heroImage: 12` is an unpopulated upload relationship — no URL to render from.
  assert.equal(isRenderableTripPick(trip(4, { heroImage: 12 })), false)

  const usable = [trip(1), trip(5)].filter(isRenderableTripPick)
  const unusable = [3, null, trip(2, { heroImage: null }), trip(4, { heroImage: 12 })].filter(
    isRenderableTripPick,
  )

  assert.equal(unusable.length, 0)
  // Every pick unusable → nothing manual → the automatic list wins.
  assert.deepEqual(resolveTripSection(unusable, [trip(9)]), [trip(9)])
  assert.equal(usable.length, 2)
})

test('the full chain keeps the documented precedence: manual > featured > published', () => {
  const manual = [trip(100)]
  const featured = [trip(101), trip(102)]
  const published = [trip(103), trip(104), trip(105)]

  const section = (picks: unknown[], feat: unknown[], pub: unknown[]) =>
    resolveTripSection(picks, pickAutomaticTrips(feat, pub))

  assert.deepEqual(section(manual, featured, published), manual)
  assert.deepEqual(section([], featured, published), featured)
  assert.deepEqual(section([], [], published), published)
  assert.deepEqual(section([], [], []), [])
})
