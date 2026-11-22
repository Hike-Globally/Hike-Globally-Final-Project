import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  altitudeProfile,
  altitudeScale,
  MIN_PROFILE_POINTS,
  profilePaths,
  type AltitudeDayInput,
} from './altitude-profile'

/** The Ghorepani / Poon Hill profile from the reference chart, as itinerary rows. */
const poonHill: AltitudeDayInput[] = [
  { day: 1, place: 'Pokhara', altitude: 820 },
  { day: 2, place: 'Nayapul', altitude: 1070 },
  { day: 3, place: 'Ulleri', altitude: 1960 },
  { day: 4, place: 'Ghorepani', altitude: 2860 },
  { day: 5, place: 'Poon Hill', altitude: 3210 },
  { day: 6, place: 'Tadapani', altitude: 2630 },
  { day: 7, place: 'Ghandruk', altitude: 1940 },
  { day: 8, place: 'Pokhara', altitude: 820 },
]

const rows = (value: ReturnType<typeof altitudeProfile>) => value?.points.map((p) => p.label)

test('profile: nothing worth plotting is null, not an empty chart', () => {
  assert.equal(altitudeProfile([]), null)
  assert.equal(altitudeProfile(null), null)
  assert.equal(altitudeProfile(undefined), null)
  // One point is a dot: the caller falls back to the uploaded image instead.
  assert.equal(altitudeProfile([{ day: 1, place: 'Lukla', altitude: 2860 }]), null)
  assert.equal(MIN_PROFILE_POINTS, 2)
})

test('profile: days without an altitude are skipped, not plotted as zero', () => {
  const profile = altitudeProfile([
    { day: 1, place: 'Lukla', altitude: 2860 },
    { day: 2, place: 'Phakding', altitude: null },
    { day: 3, place: 'Namche', altitude: 3440 },
    { day: 4, place: 'Rest day' }, // no altitude at all
  ])

  assert.deepEqual(rows(profile), ['Lukla', 'Namche'])
  assert.deepEqual(
    profile?.points.map((p) => p.altitude),
    [2860, 3440],
  )
})

test('profile: implausible altitudes are rejected, including typos above Everest', () => {
  const profile = altitudeProfile([
    { day: 1, place: 'A', altitude: 1000 },
    { day: 2, place: 'B', altitude: -5 },
    { day: 3, place: 'C', altitude: 44_000 },
    { day: 4, place: 'D', altitude: Number.NaN },
    { day: 5, place: 'E', altitude: 2000 },
  ])
  assert.deepEqual(rows(profile), ['A', 'E'])
})

test('profile: points follow the day numbers, whatever order the array arrives in', () => {
  const profile = altitudeProfile([...poonHill].reverse())
  assert.deepEqual(
    rows(profile),
    poonHill.map((row) => row.place),
  )
  // x is the position along the axis: 0 at the first day, 1 at the last, evenly spaced between.
  assert.deepEqual(
    profile?.points.map((p) => p.x),
    [0, 0.14286, 0.28571, 0.42857, 0.57143, 0.71429, 0.85714, 1],
  )
})

test('profile: a gap in the day numbers leaves a gap, rather than closing it up', () => {
  const profile = altitudeProfile([
    { day: 1, place: 'A', altitude: 1000 },
    { day: 2, place: 'B', altitude: 2000 },
    { day: 5, place: 'E', altitude: 3000 },
  ])
  // Day 5 sits at the end (x = 1) but its own spacing is derived from day numbers only.
  assert.deepEqual(
    profile?.points.map((p) => p.x),
    [0, 0.25, 1],
  )
})

test('profile: a missing place falls back to "Day n"; an empty one is trimmed', () => {
  const profile = altitudeProfile([
    { day: 1, altitude: 1000 },
    { day: 2, place: '   ', altitude: 2000 },
    { day: 3, place: '  Namche  ', altitude: 3440 },
  ])
  assert.deepEqual(rows(profile), ['Day 1', 'Day 2', 'Namche'])
})

test('profile: extremes are reported from the plotted points only', () => {
  const profile = altitudeProfile(poonHill)
  assert.equal(profile?.minAltitude, 820)
  assert.equal(profile?.maxAltitude, 3210)
  assert.equal(profile?.range, 2390)
})

test('labels: a short itinerary labels every point', () => {
  const profile = altitudeProfile(poonHill)
  assert.deepEqual(
    profile?.labelled,
    poonHill.map(() => true),
  )
})

test('labels: a long itinerary thins the axis but keeps the first, last and highest', () => {
  const long = Array.from({ length: 18 }, (_, index) => ({
    day: index + 1,
    place: `Stop ${index + 1}`,
    // A peak in the middle, like a summit day.
    altitude: 2000 + index * 100 + (index === 11 ? 900 : 0),
  }))

  const profile = altitudeProfile(long)!
  const printed = profile.labelled.flatMap((shown, index) => (shown ? [index] : []))

  assert.ok(printed.length <= 8, `at most 8 labels print, got ${printed.length}`)
  assert.ok(printed.length >= 3, 'the axis is not stripped bare')
  assert.equal(printed[0], 0, 'the first day is always labelled')
  assert.equal(printed.at(-1), 17, 'the last day is always labelled')

  const tallest = profile.points.reduce(
    (best, point, index) => (point.altitude > profile.points[best]!.altitude ? index : best),
    0,
  )
  assert.ok(printed.includes(tallest), 'the highest point is always labelled')
})

test('scale: the axis is padded and rounded outward to tidy ticks — never from zero', () => {
  const profile = altitudeProfile(poonHill)!
  const scale = altitudeScale(profile)

  assert.ok(scale.from > 0, 'a 3,000 m trek must not be plotted from sea level')
  assert.ok(scale.from <= profile.minAltitude, 'the lowest point stays inside the frame')
  assert.ok(scale.to >= profile.maxAltitude, 'the highest point stays inside the frame')
  assert.ok(scale.to - scale.from < profile.range * 4, 'the padding stays reasonable')

  // Ticks are evenly spaced and land on round numbers.
  const gaps = scale.ticks.slice(1).map((tick, index) => tick - scale.ticks[index]!)
  assert.equal(new Set(gaps).size, 1, 'evenly spaced')
  assert.ok(
    scale.ticks.every((tick) => tick % gaps[0]! === 0),
    'round numbers',
  )
})

test('scale: a flat route still gets a readable range instead of collapsing', () => {
  const flat = altitudeProfile([
    { day: 1, place: 'A', altitude: 3440 },
    { day: 2, place: 'B', altitude: 3440 },
  ])!
  const scale = altitudeScale(flat)

  assert.ok(scale.to - scale.from >= 200, 'a flat profile keeps a minimum vertical span')
  assert.ok(scale.from >= 0)
  assert.ok(scale.ticks.length >= 2)
})

test('paths: line and area share coordinates, and the area closes on the baseline', () => {
  const profile = altitudeProfile(poonHill)!
  const scale = altitudeScale(profile)
  const padding = { top: 30, right: 16, bottom: 60, left: 56 }
  const { line, area, coords } = profilePaths({
    points: profile.points,
    scale,
    width: 800,
    height: 360,
    padding,
  })

  assert.equal(coords.length, 8)
  assert.ok(
    line.startsWith(`M${coords[0]!.x} ${coords[0]!.y}`),
    'the line starts at the first point',
  )
  assert.ok(
    line.endsWith(`L${coords[7]!.x} ${coords[7]!.y}`),
    'and ends at the last point, not the baseline',
  )

  const baseline = 360 - padding.bottom
  assert.ok(area.startsWith(line), 'the area is the line, continued')
  assert.ok(
    area.endsWith(`L${coords[0]!.x} ${baseline} Z`),
    'closed back to the first x at the base',
  )

  // The lowest point sits lower on screen (larger y) than the highest.
  const lowest = coords[0]!
  const highest = coords[4]!
  assert.ok(highest.y < lowest.y, 'higher altitude draws nearer the top')

  // Everything stays inside the plot box.
  for (const { x, y } of coords) {
    assert.ok(x >= padding.left - 0.1 && x <= 800 - padding.right + 0.1, `x ${x} inside the box`)
    assert.ok(y >= padding.top - 0.1 && y <= 360 - padding.bottom + 0.1, `y ${y} inside the box`)
  }
})

test('paths: coordinates are rounded, so server and client render identical strings', () => {
  const profile = altitudeProfile(poonHill)!
  const scale = altitudeScale(profile)
  const padding = { top: 30, right: 16, bottom: 60, left: 56 }
  const first = profilePaths({ points: profile.points, scale, width: 800, height: 360, padding })
  const second = profilePaths({ points: profile.points, scale, width: 800, height: 360, padding })

  assert.equal(first.line, second.line)
  assert.equal(first.area, second.area)
  assert.doesNotMatch(first.line, /\d\.\d{3,}/, 'no floating-point noise in the path')
})
