/**
 * A card that links to a page on this site should show *that page's* featured image — a trip's hero
 * image, a post's featured image — not a favicon and not whatever a scrape of our own page happened
 * to return. These tests pin the two halves of that: which addresses are ours, and which image a
 * document contributes.
 *
 * The database is never touched here: `lookupInternalLinkPreview` only imports the data layer for
 * an address that is ours *and* one of our detail routes, and none of these cases get that far.
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import type { Blog, Destination, Media, Trip } from '@/payload-types'

import {
  internalPreviewTarget,
  lookupInternalLinkPreview,
  previewFromDestination,
  previewFromPost,
  previewFromTrip,
} from './link-preview-internal'

process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'

const media = (url: string): Media => ({ id: 1, url }) as Media

test('recognises our own detail pages, however the address was written', () => {
  assert.deepEqual(internalPreviewTarget('https://hikeglobally.com/trips/everest-base-camp'), {
    kind: 'trips',
    slug: 'everest-base-camp',
  })
  assert.deepEqual(internalPreviewTarget('/blog/how-to-train-for-altitude'), {
    kind: 'blog',
    slug: 'how-to-train-for-altitude',
  })
  assert.deepEqual(internalPreviewTarget('https://www.hikeglobally.com/destinations/khumbu/'), {
    kind: 'destinations',
    slug: 'khumbu',
  })
  // Query strings and fragments are not part of the page.
  assert.deepEqual(
    internalPreviewTarget('https://hikeglobally.com/trips/abc?utm_source=x#itinerary'),
    {
      kind: 'trips',
      slug: 'abc',
    },
  )
  assert.deepEqual(internalPreviewTarget('https://hikeglobally.com/blog/caf%C3%A9'), {
    kind: 'blog',
    slug: 'café',
  })
})

test('leaves every other address alone', () => {
  for (const url of [
    'https://hikeglobally.com/',
    'https://hikeglobally.com/trips',
    'https://hikeglobally.com/blog',
    'https://hikeglobally.com/about',
    'https://hikeglobally.com/trips/abc/brochure',
    'https://hikeglobally.com/contact',
    'not a url',
  ]) {
    assert.equal(internalPreviewTarget(url), null, url)
  }
})

test('a trip contributes its hero image, title and summary', () => {
  const trip = {
    title: ' Everest Base Camp Trek ',
    summary: '  Twelve days to the foot of the world’s highest mountain. ',
    heroImage: media('/api/media/file/ebc-hero.jpg'),
    meta: {},
  } as unknown as Trip

  const preview = previewFromTrip(trip)
  assert.equal(preview.title, 'Everest Base Camp Trek')
  assert.equal(preview.description, 'Twelve days to the foot of the world’s highest mountain.')
  assert.match(preview.image ?? '', /\/api\/media\/file\/ebc-hero\.jpg$/)
  assert.match(preview.image ?? '', /^https?:\/\//)
})

test('a post contributes its featured image, title and excerpt', () => {
  const post = {
    title: 'How to train for altitude',
    excerpt: 'What the weeks before a trek should look like.',
    featuredImage: media('https://blob.example.com/posts/altitude.jpg'),
    meta: {},
  } as unknown as Blog

  const preview = previewFromPost(post)
  assert.equal(preview.title, 'How to train for altitude')
  assert.equal(preview.description, 'What the weeks before a trek should look like.')
  assert.equal(preview.image, 'https://blob.example.com/posts/altitude.jpg')
})

test('a destination contributes its hero image, name and tagline', () => {
  const destination = {
    name: 'Khumbu',
    tagline: 'Everest’s own valley',
    heroImage: media('/api/media/file/khumbu.jpg'),
  } as unknown as Destination

  const preview = previewFromDestination(destination)
  assert.equal(preview.title, 'Khumbu')
  assert.equal(preview.description, 'Everest’s own valley')
  assert.match(preview.image ?? '', /\/api\/media\/file\/khumbu\.jpg$/)
})

test('the featured image wins, and the editor’s sharing image is only the fallback', () => {
  const trip = {
    title: 'Everest Base Camp Trek',
    summary: 'Twelve days.',
    heroImage: media('/api/media/file/ebc-hero.jpg'),
    meta: { image: media('https://cdn.example.com/ebc-share.jpg') },
  } as unknown as Trip

  // The card shows the picture the document is illustrated with.
  assert.match(previewFromTrip(trip).image ?? '', /\/api\/media\/file\/ebc-hero\.jpg$/)

  const noHero = { ...trip, heroImage: undefined } as unknown as Trip
  assert.equal(previewFromTrip(noHero).image, 'https://cdn.example.com/ebc-share.jpg')
})

test('a document with no image, or an unpopulated relationship, contributes no image', () => {
  const noImage = { title: 'x', summary: 'y', heroImage: 12 } as unknown as Trip
  assert.equal(previewFromTrip(noImage).image, null)

  const empty = { title: 'x', summary: null, heroImage: undefined } as unknown as Trip
  assert.equal(previewFromTrip(empty).image, null)
  assert.equal(previewFromTrip(empty).description, null)
})

test('another site’s page is never looked up in our CMS', async () => {
  assert.equal(await lookupInternalLinkPreview('https://example.com/trips/everest-base-camp'), null)
  assert.equal(
    await lookupInternalLinkPreview('https://www.booking.com/hotel/is/blue-lagoon'),
    null,
  )
  assert.equal(await lookupInternalLinkPreview('not a url'), null)
})

test('a trip provides its gallery and sharing image as fallbacks after its featured image', () => {
  const trip = {
    title: 'Ghorepani Poon Hill Trek',
    summary: 'Annapurna foothills.',
    heroImage: media('/api/media/file/poon-hill.jpg'),
    meta: { image: media('/api/media/file/sharing.jpg') },
    gallery: [{ image: media('/api/media/file/forest.jpg') }, { image: 123 }],
  } as unknown as Trip
  const preview = previewFromTrip(trip)
  assert.match(preview.image ?? '', /poon-hill\.jpg$/)
  assert.deepEqual(
    preview.images?.map((url) => new URL(url).pathname),
    ['/api/media/file/sharing.jpg', '/api/media/file/forest.jpg'],
  )
})
