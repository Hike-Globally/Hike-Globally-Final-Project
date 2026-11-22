import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup as render_ } from 'react-dom/server'

import { AltitudeProfile } from './altitude-profile'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const read = (file: string): string => readFileSync(path.join(repoRoot, file), 'utf8')

const tripDetail = read('src/components/views/trip-detail.tsx')
const chart = read('src/components/sections/altitude-profile.tsx')

const render = (days: Parameters<typeof AltitudeProfile>[0]['days']) =>
  render_(createElement(AltitudeProfile, { days }))

const poonHill = [
  { day: 1, place: 'Pokhara', altitude: 820 },
  { day: 2, place: 'Nayapul', altitude: 1070 },
  { day: 3, place: 'Ulleri', altitude: 1960 },
  { day: 4, place: 'Ghorepani', altitude: 2860 },
  { day: 5, place: 'Poon Hill', altitude: 3210 },
  { day: 6, place: 'Tadapani', altitude: 2630 },
  { day: 7, place: 'Ghandruk', altitude: 1940 },
  { day: 8, place: 'Pokhara', altitude: 820 },
]

test('the chart is inline SVG: no chart library, no client boundary, no canvas', () => {
  assert.doesNotMatch(chart, /^'use client'/m, 'it must stay a server component')
  assert.doesNotMatch(chart, /from '(recharts|chart\.js|d3|victory|nivo|apexcharts)/)
  assert.match(chart, /<svg/)
  assert.doesNotMatch(chart, /<canvas|useEffect|useState|ResizeObserver/)
})

test('the profile scales across the width of its containing trip card', () => {
  const html = render(poonHill)

  assert.match(html, /^<figure class="w-full min-w-0">/)
  assert.match(html, /<svg viewBox="0 0 800 448" class="block h-auto w-full"/)
})

test('a profile renders one dot and one metre label per day, plus every place name', () => {
  const html = render(poonHill)

  assert.equal((html.match(/<circle /g) ?? []).length, 8)
  for (const point of poonHill) {
    assert.ok(html.includes(`${point.altitude}m`), `${point.altitude}m is printed`)
    assert.ok(html.includes(`>${point.place}</text>`), `${point.place} is on the axis`)
  }
  assert.ok(html.includes('d="M'), 'the line path is present')
  // The line, the area, and the Chart icon in the summary line.
  assert.equal((html.match(/<path /g) ?? []).length, 3, 'one area, one line, one icon')
})

test('nothing to plot renders nothing at all', () => {
  assert.equal(render([]), '')
  assert.equal(render([{ day: 1, place: 'Lukla', altitude: 2860 }]), '')
  assert.equal(render(null), '')
})

test('the chart is accessible: a labelled image and the full series as a table', () => {
  const html = render(poonHill)

  assert.match(html, /role="img"/)
  assert.match(html, /aria-label="[^"]*820 to 3,210 metres over 8 days[^"]*"/)
  assert.match(html, /<table>/)
  assert.match(html, /<caption>Altitude profile<\/caption>/)
  assert.equal((html.match(/scope="col"/g) ?? []).length, 3)
  assert.match(html, /sr-only/, 'the table is for assistive tech, not the layout')
  // The sighted summary states what a point means.
  assert.match(html, /Highest point of each day/)
})

test('a long itinerary thins the axis labels but keeps the shape', () => {
  const long = Array.from({ length: 18 }, (_, index) => ({
    day: index + 1,
    place: `Stop ${index + 1}`,
    altitude: 2000 + index * 100,
  }))
  const html = render(long)

  assert.equal((html.match(/<circle /g) ?? []).length, 18, 'every day is still plotted')
  const labels = (html.match(/rotate\(-35/g) ?? []).length
  assert.ok(labels < 18 && labels >= 3, `axis thinned, got ${labels} labels`)
})

test('the value labels at the two ends anchor inward, so they stay inside the frame', () => {
  const html = render(poonHill)
  // Every metre label is anchored to its own dot: the first runs right, the last runs left, and
  // the rest are centred — so neither end can spill past the frame. (The rotated place names are
  // all end-anchored, which is why this matches on the metre suffix to isolate the value labels.)
  const valueLabels = [...html.matchAll(/text-anchor="(start|middle|end)"[^>]*>([^<]*)</g)]
    .filter(([, , text]) => /^\d+m$/.test(text!))
    .map(([, anchor]) => anchor)

  assert.equal(valueLabels.length, 8)
  assert.equal(valueLabels[0], 'start', 'the first value label runs to the right')
  assert.equal(valueLabels.at(-1), 'end', 'the last value label runs to the left')
  assert.deepEqual(new Set(valueLabels.slice(1, -1)), new Set(['middle']))
})

test('the trip page renders the altitude chart from itinerary data, with no image upload fallback', () => {
  assert.match(tripDetail, /const profile = altitudeProfile\(trip\.itinerary\)/)
  assert.match(
    tripDetail,
    /<AltitudeProfile days=\{trip\.itinerary\} className="w-full" title="Altitude chart" \/>/,
  )
  assert.doesNotMatch(tripDetail, /uploadedAltitudeChart|altitudeUpload/)
  assert.doesNotMatch(tripDetail, /md:col-span-2/)

  const items = tripDetail.slice(tripDetail.indexOf('const items = ['))
  const order = items.slice(0, items.indexOf('].filter'))
  assert.match(order, /mapCard,/)
  assert.match(order, /chartCard/)
  assert.doesNotMatch(order, /routeMap/)
})

test('the itinerary collects a place label per day, and says what altitude means', () => {
  const trips = read('src/collections/Trips.ts')
  assert.match(trips, /name: 'place',[\s\S]*?label: 'Place \(chart label\)'/)
  assert.match(trips, /name: 'altitude',[\s\S]*?label: 'Highest point \(m\)'/)
  assert.match(trips, /highest point reached on this day/)
  // The chart needs two points to be a chart.
  assert.match(trips, /Two or more days with an '/)
  assert.match(trips, /altitude are drawn as the trip’s altitude chart/)
})
