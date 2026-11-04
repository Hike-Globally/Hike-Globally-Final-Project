import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { Trip } from '../../payload-types'
import { TripDetail } from '../views/trip-detail'

/**
 * Structure of the trip single page.
 *
 * These assertions are deliberately about *what a visitor gets*, not about class
 * names: the hero exists and is marked as the page's hero region, the in-page nav
 * only links to sections that render, the price appears in a booking card, and the
 * FAQ structured data is still emitted. A restyle can change every class on the
 * page and these tests stay green; a section that silently disappears does not.
 *
 * Run with `npm test`.
 */

const richText = (text: string) => ({
  root: {
    type: 'root',
    children: [
      { type: 'paragraph', version: 1, children: [{ type: 'text', text, version: 1 }] },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
})

const baseTrip = {
  id: 1,
  title: 'Everest Base Camp Trek',
  slug: 'everest-base-camp-trek',
  summary: 'Fourteen days to the foot of the highest mountain on earth.',
  heroImage: 1,
  destination: 1,
  tripType: 'trekking',
  durationDays: 14,
  durationNights: 13,
  maxAltitude: 5545,
  groupSizeMax: 12,
  difficulty: 'challenging',
  bestSeasons: ['spring', 'autumn'],
  priceFrom: 1890,
  priceCurrency: 'USD',
  priceUnit: 'per-person',
  priceNote: 'Based on a group of 4',
  description: richText('Overview body.'),
  pageSections: null,
  updatedAt: '2026-11-04T00:00:00.000Z',
  createdAt: '2026-11-04T00:00:00.000Z',
} as unknown as Trip

const render = (trip: Trip) =>
  renderToStaticMarkup(
    createElement(TripDetail, {
      trip,
      related: [],
      tripOptions: [],
      formEmail: 'hello@example.com',
      whatsapp: '9779851000000',
    }),
  )

const anchorsIn = (html: string) =>
  [...html.matchAll(/class="trip-nav__link" href="#([a-z-]+)"/g)].map((match) => match[1])

test('the trip page leads with a hero inside the header-hero region', () => {
  const html = render(baseTrip)

  assert.match(html, /data-trip-page=""/)
  // The global header stays pinned while this element is on screen.
  assert.match(html, /<section data-header-hero="true" class="trip-hero">/)
  // Title, best-season and the both-units altitude are all above the fold.
  assert.match(html, /Everest Base Camp Trek/)
  assert.match(html, /5,545 m \/ 18,192 ft/)
  assert.match(html, /Spring · Autumn/)
  assert.match(html, /14 days \/ 13 nights/)
})

test('the booking card shows the price, the next departure and the assurances', () => {
  const html = render({
    ...baseTrip,
    departureDates: [{ id: 'dep-1', startDate: '2027-03-12', status: 'limited' }],
  } as unknown as Trip)

  assert.match(html, /\$1,890/)
  assert.match(html, /Next departure/)
  assert.match(html, /Mar 12, 2027/)
  // The scarcity signal only appears for a "limited" row.
  assert.match(html, /Limited spots/)
  assert.match(html, /trip-pulse/)
  assert.match(html, /Govt-registered local agency/)
})

test('a trip with no departures makes no departure claims', () => {
  const html = render(baseTrip)

  assert.doesNotMatch(html, /Next departure/)
  assert.doesNotMatch(html, /trip-pulse/)
  // And the hero's secondary CTA falls back to the itinerary.
  assert.match(html, /Detailed Itinerary/)
})

test('the in-page nav links only to sections that actually render', () => {
  const sparse = render(baseTrip)
  const sparseAnchors = anchorsIn(sparse)

  // No itinerary days, highlights, packing list, gallery or FAQs on this trip.
  assert.deepEqual(sparseAnchors, ['overview', 'inquiry'])
  // …and no anchor points at content that is not there.
  for (const id of sparseAnchors) assert.match(sparse, new RegExp(`id="${id}"`))

  const full = render({
    ...baseTrip,
    keyTakeaways: [{ id: 'kt-1', text: 'Kala Patthar sunrise' }],
    highlights: [{ id: 'hl-1', text: 'Namche Bazaar' }],
    packingList: [{ id: 'pk-1', item: 'Down jacket' }],
    included: [{ id: 'in-1', item: 'Airport transfers' }],
    faqs: [{ id: 'fq-1', question: 'Do I need experience?', answer: 'No.' }],
    itinerary: [
      { id: 'd1', day: 1, title: 'Fly to Lukla', description: 'Desc' },
      { id: 'd2', day: 2, title: 'Phakding', description: 'Desc' },
    ],
  } as unknown as Trip)
  const fullAnchors = anchorsIn(full)

  assert.deepEqual(fullAnchors, [
    'key-takeaways',
    'overview',
    'highlights',
    'itinerary',
    'inclusions',
    'packing-list',
    'faqs',
    'inquiry',
  ])
  for (const id of fullAnchors) assert.match(full, new RegExp(`id="${id}"`))
})

test('Who Is This Trek For / Not For render after Why Choose This Trek, and hide when empty', () => {
  const html = render({
    ...baseTrip,
    whyChooseThisTrek: richText('Small groups, local guides.'),
    whoIsThisTrekFor: richText('Fit walkers who want the classic Everest route.'),
    whoIsThisTrekNotFor: richText('Travellers who want luxury lodges every night.'),
    highlights: [{ id: 'hl-1', text: 'Namche Bazaar' }],
  } as unknown as Trip)

  // Both sections print their heading and their content.
  assert.match(html, /Who is this trek for/)
  assert.match(html, /Who is this trek not for/)
  assert.match(html, /Fit walkers who want the classic Everest route\./)
  assert.match(html, /Travellers who want luxury lodges every night\./)

  // Order on the page: Why Choose This Trek → For → Not For → Highlights.
  const whyChoose = html.indexOf('id="why-choose-this-trek"')
  const whoFor = html.indexOf('id="who-is-this-trek-for"')
  const whoNotFor = html.indexOf('id="who-is-this-trek-not-for"')
  const highlights = html.indexOf('id="highlights"')
  assert.ok(whyChoose > 0 && whoFor > whyChoose && whoNotFor > whoFor && highlights > whoNotFor)

  // The sticky nav links to both, in the same order.
  const anchors = anchorsIn(html)
  assert.deepEqual(anchors, [
    'overview',
    'why-choose-this-trek',
    'who-is-this-trek-for',
    'who-is-this-trek-not-for',
    'highlights',
    'inquiry',
  ])

  // Empty fields render nothing — no heading, no anchor.
  const sparse = render(baseTrip)
  assert.doesNotMatch(sparse, /Who is this trek/)
  assert.doesNotMatch(anchorsIn(sparse).join(','), /who-is-this-trek/)
})

test('the dark trust band breaks up the body instead of ending the page', () => {
  const html = render({
    ...baseTrip,
    keyTakeaways: [{ id: 'kt-1', text: 'Stand at Base Camp' }],
    highlights: [{ id: 'hl-1', text: 'Namche Bazaar' }],
    included: [{ id: 'in-1', item: 'Airport transfers' }],
    packingList: [{ id: 'pk-1', item: 'Down jacket' }],
    faqs: [{ id: 'fq-1', question: 'Do I need experience?', answer: 'No.' }],
  } as unknown as Trip)

  const band = html.indexOf('trip-band-dark')
  const inquiry = html.indexOf('id="inquiry"')
  const faqs = html.indexOf('id="faqs"')

  assert.ok(band > 0, 'trust band renders')
  assert.ok(band < inquiry, 'trust band is not stacked on the dark inquiry section')
  assert.ok(faqs > band, 'the band interrupts the body rather than trailing it')
})

test('sections keep their anchors and the FAQ structured data survives', () => {
  const html = render({
    ...baseTrip,
    faqs: [{ id: 'fq-1', question: 'Do I need experience?', answer: 'No.' }],
  } as unknown as Trip)

  assert.match(html, /application\/ld\+json/)
  assert.match(html, /"@type":"FAQPage"|"@type":"Question"/)
  // The itinerary and FAQ anchors are the ones the nav links to.
  assert.match(html, /id="faqs"/)
})
