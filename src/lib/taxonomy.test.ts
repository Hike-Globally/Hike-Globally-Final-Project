/**
 * `/destinations` and `/places` — two taxonomies that must read as a hierarchy, not as rivals.
 *
 * The region atlas (`/destinations/<region>`) and the landscape index (`/places/<landscape>`) are
 * parallel ways into the same trips: a region is *where* a journey happens, a landscape is *what
 * you walk through*. Both are real, so neither can be retired — but if the two hubs carry
 * near-synonymous titles and never reference each other, a search engine sees two pages competing
 * for the same "where should I go" queries, and picks one at random.
 *
 * Three things keep them apart, and this file pins all of them:
 *
 *  1. each hub names its own taxonomy in its title, and never the other's;
 *  2. each hub links to the other, so the split is visible in the crawl graph;
 *  3. each detail page links across to the other taxonomy, derived from the trips it renders —
 *     which is what makes the relationship data rather than copy an editor must keep in sync.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { Destination } from '@/payload-types'
import type { TripCard } from '@/lib/data'

process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'

const { DestinationDetail } = await import('@/components/views/destination-detail')
const { landscapesOf, regionsOf } = await import('./taxonomy')

const repoRoot = path.resolve(import.meta.dirname, '../..')
const read = (file: string): string => readFileSync(path.join(repoRoot, file), 'utf8')

/* -------------------------------------------------------------------------- */
/* The helpers                                                                 */
/* -------------------------------------------------------------------------- */

test('landscapesOf keeps the canonical category order and lists each landscape once', () => {
  const trips = [
    { placeCategories: ['base-camps', 'mountain-passes'] },
    { placeCategories: ['mountain-passes', 'temples'] },
    { placeCategories: [] },
    { placeCategories: null },
    {},
  ]

  assert.deepEqual(
    landscapesOf(trips).map((category) => category.value),
    // `placeCategories` order, not first-seen order: mountain-passes is third in the canon,
    // base-camps fifth, temples last.
    ['mountain-passes', 'base-camps', 'temples'],
  )
})

test('landscapesOf ignores values that are not Browse Places categories', () => {
  assert.deepEqual(
    landscapesOf([{ placeCategories: ['not-a-landscape', 'lakes', 42 as unknown as string] }]).map(
      (category) => category.value,
    ),
    ['lakes'],
  )
  assert.deepEqual(landscapesOf([]), [])
})

test('regionsOf lists each region once, in the order the trips are listed', () => {
  const trips = [
    { destination: { name: 'Khumbu', slug: 'khumbu' } },
    { destination: { name: 'Annapurna', slug: 'annapurna' } },
    { destination: { name: 'Khumbu', slug: 'khumbu' } },
  ]

  assert.deepEqual(regionsOf(trips), [
    { name: 'Khumbu', slug: 'khumbu' },
    { name: 'Annapurna', slug: 'annapurna' },
  ])
})

test('regionsOf skips a trip whose destination is only an id, and malformed rows', () => {
  assert.deepEqual(
    regionsOf([
      { destination: 42 },
      { destination: null },
      { destination: undefined },
      { destination: {} },
      { destination: { name: 'No slug' } },
      { destination: { slug: 'no-name' } },
      { destination: { name: '', slug: 'empty-name' } },
    ]),
    [],
  )
})

/* -------------------------------------------------------------------------- */
/* The rendered hierarchy                                                      */
/* -------------------------------------------------------------------------- */

const khumbu = {
  id: 1,
  name: 'Khumbu',
  slug: 'khumbu',
  country: 'Nepal',
  region: 'khumbu',
  tagline: 'The high approaches to Everest.',
  heroImage: 1,
  description: {
    root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 },
  },
  gallery: [],
  bestSeasons: ['spring', 'autumn'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as unknown as Destination

const trip = (overrides: Partial<TripCard> = {}): TripCard =>
  ({
    id: 1,
    title: 'Everest Base Camp Trek',
    slug: 'everest-base-camp',
    summary: 'Fourteen days in the Khumbu.',
    heroImage: 1,
    tripType: 'trekking',
    durationDays: 14,
    difficulty: 'challenging',
    priceFrom: 1850,
    priceCurrency: 'USD',
    placeCategories: ['base-camps', 'mountain-passes'],
    destination: { id: 1, name: 'Khumbu', slug: 'khumbu' },
    ...overrides,
  }) as unknown as TripCard

test('a region page links to the landscapes its own trips walk through', () => {
  const html = renderToStaticMarkup(
    createElement(DestinationDetail, {
      destination: khumbu,
      trips: [trip(), trip({ id: 2, placeCategories: ['temples'] })],
      otherDestinations: [],
    }),
  )

  // The relationship is derived from the trips above, not written by hand.
  assert.match(html, /Landscapes in Khumbu/)
  assert.match(html, /href="\/places\/mountain-passes"/)
  assert.match(html, /href="\/places\/base-camps"/)
  assert.match(html, /href="\/places\/temples"/)
  // Nothing the region's trips do not touch is offered.
  assert.doesNotMatch(html, /href="\/places\/canyons"/)
  assert.doesNotMatch(html, /href="\/places\/caves"/)

  // The band is the bridge to the other taxonomy, so it must say which one it is.
  assert.match(html, /Browse by landscape/)
})

test('a region page with no tagged trips offers no landscapes at all', () => {
  const html = renderToStaticMarkup(
    createElement(DestinationDetail, {
      destination: khumbu,
      trips: [trip({ placeCategories: [] })],
      otherDestinations: [],
    }),
  )

  assert.doesNotMatch(html, /Landscapes in Khumbu/)
  assert.doesNotMatch(html, /place-category-links/)
})

/* -------------------------------------------------------------------------- */
/* The hubs                                                                    */
/* -------------------------------------------------------------------------- */

test('each hub names its own taxonomy in its title, and never the other one', () => {
  const dictionary = read('src/i18n/dictionaries.ts')
  const placesPage = read('src/app/(frontend)/places/page.tsx')

  // Scope to the `destinations` block: `trips` and `blog` each carry a `listingTitle` too.
  const destinationsBlock = /  destinations: \{[\s\S]*?\n  \},/.exec(dictionary)?.[0]
  assert.ok(destinationsBlock, 'the dictionary has a destinations block')
  const destinationsTitle = /listingTitle: '([^']+)'/.exec(destinationsBlock)?.[1]
  const placesTitle = /const INDEX_TITLE = '([^']+)'/.exec(placesPage)?.[1]

  assert.ok(destinationsTitle, 'the destinations listing has a title')
  assert.ok(placesTitle, 'the places index has a title')

  assert.match(destinationsTitle, /region/i)
  assert.doesNotMatch(destinationsTitle, /landscape/i)
  assert.match(placesTitle, /landscape/i)
  assert.doesNotMatch(placesTitle, /region/i)
  assert.notEqual(destinationsTitle, placesTitle)

  // The same split in the visible headlines, so a crawler is told twice.
  assert.match(read('src/app/(frontend)/destinations/page.tsx'), /region by region\./)
  assert.match(placesPage, /title="Places worth the journey, by landscape"/)
})

test('each hub links to the other, so the split is in the crawl graph', () => {
  const destinationsPage = read('src/app/(frontend)/destinations/page.tsx')
  const placesPage = read('src/app/(frontend)/places/page.tsx')

  assert.match(destinationsPage, /href=\{PLACE_INDEX_PATH\}/, '`/destinations` links to `/places`')
  assert.match(
    placesPage,
    /href=\{sitePath\('\/destinations'\)\}/,
    '`/places` links to `/destinations`',
  )
})

test('detail pages name their taxonomy and link across to the other one', () => {
  const destinationRoute = read('src/app/(frontend)/destinations/[slug]/page.tsx')
  const placeRoute = read('src/app/(frontend)/places/[slug]/page.tsx')

  // Titles: a bare "Khumbu" or "Lakes" could be either taxonomy.
  assert.match(destinationRoute, /— trekking region`/)
  assert.match(placeRoute, /— treks by landscape`/)

  // The cross-links, derived from the trips the page already renders.
  assert.match(
    read('src/components/views/destination-detail.tsx'),
    /<PlaceCategoryLinks[\s\S]{0,300}heading=\{`Landscapes in /,
  )
  assert.match(placeRoute, /<DestinationLinks regions=\{regionsOf\(content\.trips\)\}/)
})
