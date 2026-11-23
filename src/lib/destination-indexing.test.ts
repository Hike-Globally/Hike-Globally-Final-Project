/**
 * Tests for which destination pages earn an index entry.
 *
 * The contract under test: the six continent entries are the thinnest URLs on the site — a
 * continent with one trip is a longer way of saying that one trip, plus a general essay — so a
 * continent is only indexed once it is a real hub (2+ trips) or a real guide (400+ words).
 * Nepal's five regions are the site's topical hubs and are always indexed.
 *
 * The same verdict has to hold in three places at once: the page's robots meta, `/sitemap.xml`
 * (+ `/llms.txt`) and the HTML sitemap chart. A page that hides itself while a sitemap still
 * advertises it is the inconsistency `src/lib/sitemap.test.ts` guards against.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CONTINENT_MIN_TRIPS,
  CONTINENT_MIN_WORDS,
  destinationNoIndexReason,
  destinationWordCount,
  isIndexableDestination,
} from './destination-indexing'

/** A Lexical document with `words` one-word paragraphs. */
const descriptionOf = (words: number): unknown => ({
  root: {
    children: [{ type: 'paragraph', children: [{ text: new Array(words).fill('word').join(' ') }] }],
  },
})

test('a Nepal region is always indexed, even with no trips', () => {
  for (const slug of ['eastern-nepal', 'western-nepal', 'far-western-nepal', 'central-nepal']) {
    assert.equal(
      isIndexableDestination({ slug, tripCount: 0, description: null }),
      true,
      `${slug} is a topical hub`,
    )
  }
})

test('a continent with enough trips is a hub and is indexed', () => {
  assert.equal(
    isIndexableDestination({ slug: 'europe', tripCount: CONTINENT_MIN_TRIPS, description: null }),
    true,
  )
})

test('a continent with enough copy is a guide and is indexed', () => {
  assert.equal(
    isIndexableDestination({
      slug: 'europe',
      tripCount: 1,
      description: descriptionOf(CONTINENT_MIN_WORDS),
    }),
    true,
  )
})

test('a continent with one trip and a short essay stays out of the index', () => {
  const verdict = destinationNoIndexReason({
    slug: 'australia',
    tripCount: 1,
    description: descriptionOf(120),
  })

  assert.ok(verdict, 'the page is noindexed')
  assert.match(verdict ?? '', /1 and 120/, 'the reason states the numbers an editor can act on')
})

test('the editor noIndex checkbox wins over everything', () => {
  assert.equal(
    isIndexableDestination({
      slug: 'eastern-nepal',
      tripCount: 9,
      description: descriptionOf(2000),
      editorNoIndex: true,
    }),
    false,
  )
})

test('a continent at exactly the threshold is indexed; one short of it is not', () => {
  assert.equal(
    isIndexableDestination({ slug: 'asia', tripCount: 1, description: descriptionOf(CONTINENT_MIN_WORDS - 1) }),
    false,
  )
  assert.equal(
    isIndexableDestination({ slug: 'asia', tripCount: CONTINENT_MIN_TRIPS - 1, description: descriptionOf(CONTINENT_MIN_WORDS) }),
    true,
  )
})

test('word counting reads the rich text, not the JSON keys', () => {
  assert.equal(destinationWordCount(descriptionOf(40)), 40)
  assert.equal(destinationWordCount(null), 0)
  assert.equal(destinationWordCount(undefined), 0)
  assert.equal(destinationWordCount({ root: { children: [] } }), 0)
})

test('the sitemap and the page reach the same verdict for the same document', () => {
  const document = { slug: 'australia', tripCount: 1, description: descriptionOf(120) }

  // What `sitemapDocument()` writes into `/sitemap.xml`…
  assert.equal(isIndexableDestination(document), false)
  // …and what the page passes to `buildMetadata({ noIndex })`.
  assert.equal(destinationNoIndexReason(document) !== null, true)
})

test('the sitemap drops a continent the page noindexes', async () => {
  const { sitemapDocument } = await import('./sitemap-records')

  const description = descriptionOf(120)
  const record = { id: 7, slug: 'australia', updatedAt: '2026-03-01T08:00:00.000Z', description }

  // No trips and a short essay: out of the sitemap, exactly as it is out of the index.
  assert.equal(sitemapDocument(record, 'destinations', { tripCounts: {} }).noIndex, true)
  // Two published trips: back in.
  assert.equal(
    sitemapDocument(record, 'destinations', { tripCounts: { 7: 2 } }).noIndex,
    false,
  )
  // A Nepal region is never touched by the rule.
  assert.equal(
    sitemapDocument({ ...record, id: 1, slug: 'eastern-nepal' }, 'destinations', { tripCounts: {} }).noIndex,
    false,
  )
  // The SEO panel's own checkbox still wins.
  assert.equal(
    sitemapDocument(
      { ...record, id: 1, slug: 'eastern-nepal', meta: { noIndex: true } },
      'destinations',
      { tripCounts: {} },
    ).noIndex,
    true,
  )
})
