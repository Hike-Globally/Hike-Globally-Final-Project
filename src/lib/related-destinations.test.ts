/**
 * Tests for the "More trekking regions" rail on `/destinations/[slug]`.
 *
 * The contract under test: a destination only recommends destinations of its own kind. Before
 * this, the rail was "everything that is not me" in `-featured` order, so Europe and Australia —
 * both with a single trip — ended their pages with three Nepali regions under a heading that
 * called them "more trekking regions". A crawler reading that graph was told the site's own idea
 * of "related to Europe" is Nepal.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import type { DestinationCard } from './data'
import { relatedDestinations, relatedDestinationsHeading } from './related-destinations'

const destination = (
  id: number,
  slug: string,
  country: string,
  region: DestinationCard['region'] = 'other',
  featured = false,
): DestinationCard => ({ id, slug, country, region, featured, name: slug, heroImage: {} as never })

const NEPAL_REGIONS = [
  destination(1, 'eastern-nepal', 'Nepal', 'kanchenjunga', true),
  destination(2, 'central-nepal', 'Nepal', 'kathmandu', true),
  destination(3, 'western-nepal', 'Nepal', 'annapurna', true),
  destination(4, 'far-western-nepal', 'Nepal', 'dolpo', false),
]

const CONTINENTS = [
  destination(5, 'europe', 'Nepal', 'other', false),
  destination(6, 'australia', 'Nepal', 'other', false),
  destination(7, 'asia', 'Nepal', 'other', false),
  destination(8, 'africa', 'Nepal', 'other', false),
  destination(9, 'north-america', 'Nepal', 'other', false),
]

const all = [...NEPAL_REGIONS, ...CONTINENTS]

test('a continent page recommends continents, never Nepal regions', () => {
  const europe = CONTINENTS[0]
  const related = relatedDestinations(europe, all, 3)

  assert.equal(related.length, 3)
  assert.ok(related.every((item) => CONTINENTS.some((continent) => continent.id === item.id)))
  assert.ok(related.every((item) => NEPAL_REGIONS.every((region) => region.id !== item.id)))
  assert.ok(related.every((item) => item.id !== europe.id), 'never the page itself')
})

test('a region page recommends regions, never continents', () => {
  const eastern = NEPAL_REGIONS[0]
  const related = relatedDestinations(eastern, all, 3)

  assert.equal(related.length, 3)
  for (const item of related) {
    assert.ok(NEPAL_REGIONS.some((region) => region.id === item.id), `${item.slug} is a Nepal region`)
    assert.notEqual(item.id, eastern.id)
  }
})

test('the limit is honoured and a small group is not padded', () => {
  assert.equal(relatedDestinations(CONTINENTS[0], all, 1).length, 1)
  // Only the four other continents are eligible once the page itself is excluded.
  assert.equal(relatedDestinations(CONTINENTS[1], CONTINENTS, 5).length, 4)
})

test('shared country outranks a shared region bucket', () => {
  const current = destination(10, 'annapurna-base-camp', 'Nepal', 'annapurna')
  const sameCountryOtherRegion = destination(11, 'everest-base-camp', 'Nepal', 'khumbu')
  const sameRegionOtherCountry = destination(12, 'tour-du-mont-blanc', 'France', 'annapurna')
  const unrelated = destination(13, 'larapinta', 'Australia', 'other')

  const related = relatedDestinations(current, [
    unrelated,
    sameRegionOtherCountry,
    sameCountryOtherRegion,
  ])

  assert.deepEqual(
    related.map((item) => item.slug),
    ['everest-base-camp', 'tour-du-mont-blanc', 'larapinta'],
  )
})

test('the rail heading follows what the rail holds', () => {
  assert.equal(relatedDestinationsHeading({ slug: 'europe', name: 'Europe' }), 'More trekking destinations')
  assert.equal(relatedDestinationsHeading({ slug: 'eastern-nepal', name: 'Eastern Nepal' }), 'More trekking regions')
})
