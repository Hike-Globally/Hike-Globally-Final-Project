/**
 * Render tests for `/destinations/[slug]`.
 *
 * The unit tests above prove the helpers; these prove the page actually uses them. Both defects
 * here were only visible in the rendered HTML: the same sentence three times on Eastern Nepal,
 * and "More trekking regions" above a rail of continents.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { DestinationDetail } from '@/components/views/destination-detail'
import type { DestinationCard, TripCard } from './data'
import type { Destination } from '@/payload-types'

/** A minimal, CMS-shaped Lexical document — typed like the field it stands in for. */
const richText = (text: string): NonNullable<Destination['description']> => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    direction: null,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [{ type: 'text', text, format: 0, style: '', version: 1 }],
      },
    ],
  },
})

const EASTERN_NEPAL =
  'Explore Eastern Nepal, renowned for Mount Kanchenjunga, tea gardens, lush hills, scenic trekking trails, and rich cultural experiences.'

const destination = (overrides: Partial<Destination> = {}): Destination =>
  ({
    id: 1,
    name: 'Eastern Nepal',
    slug: 'eastern-nepal',
    country: 'Nepal',
    region: 'kanchenjunga',
    tagline: EASTERN_NEPAL,
    description: richText(EASTERN_NEPAL),
    gettingThere: richText(EASTERN_NEPAL),
    heroImage: null,
    bestSeasons: ['spring'],
    gallery: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }) as unknown as Destination

const render = (props: Partial<Parameters<typeof DestinationDetail>[0]> = {}): string =>
  renderToStaticMarkup(
    createElement(DestinationDetail, {
      destination: destination(),
      trips: [],
      otherDestinations: [],
      linker: null,
      ...props,
    } as never),
  )

/** The page without its JSON-LD — the visible copy a visitor and a crawler actually read. */
const visibleCopy = (html: string): string => html.replace(/<script[\s\S]*?<\/script>/g, '')

test('a sentence repeated across three CMS fields renders once', () => {
  const html = visibleCopy(render())

  assert.equal(html.split(EASTERN_NEPAL).length - 1, 1)
  assert.doesNotMatch(html, /<h3[^>]*>Getting there/, 'the repeated block is not rendered')
  assert.match(html, /<h2[^>]*>About Eastern Nepal<\/h2>/, 'the copy keeps its heading')
})

test('a destination with three different blocks renders all of them', () => {
  const html = render({
    destination: destination({
      tagline: 'Tea gardens and Kanchenjunga.',
      description: richText('Eastern Nepal runs from the Terai to the border.'),
      gettingThere: richText('Fly to Bhadrapur, then drive to Taplejung.'),
    }),
  })

  assert.match(html, /Tea gardens and Kanchenjunga\./)
  assert.match(html, /Eastern Nepal runs from the Terai to the border\./)
  assert.match(html, /Fly to Bhadrapur, then drive to Taplejung\./)
  assert.match(html, /<h3[^>]*>Getting there/)
})

test('a continent page labels its rail as destinations, not regions', () => {
  const continents: DestinationCard[] = [
    { id: 2, name: 'Asia', slug: 'asia', country: 'Nepal', region: 'other', heroImage: null as never },
  ]

  const html = render({
    destination: destination({
      id: 5,
      name: 'Europe',
      slug: 'europe',
      tagline: 'Cliffs, fjords and alpine trails.',
      description: richText('Europe packs several mountain ranges into one train ride.'),
      gettingThere: null,
    }),
    otherDestinations: continents,
  })

  assert.match(html, /More trekking destinations/)
  assert.doesNotMatch(html, /More trekking regions/)
})

test('the trips section is published as an ItemList', () => {
  const trip = {
    id: 9,
    title: 'Laugavegur Trail',
    slug: 'the-laugavegur-trail',
    summary: 'Four days across rhyolite and black sand.',
    heroImage: null,
    tripType: 'trekking',
    durationDays: 4,
    difficulty: 'moderate',
    priceFrom: 600,
    priceCurrency: 'USD',
  } as unknown as TripCard

  const html = render({ destination: destination({ slug: 'europe', name: 'Europe' }), trips: [trip] })
  const jsonLd = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/g) ?? []
  const itemList = jsonLd.find((block) => block.includes('"ItemList"'))

  assert.ok(itemList, 'an ItemList block is emitted')
  assert.match(itemList ?? '', /"numberOfItems":1/)
  assert.match(itemList ?? '', /\/trips\/the-laugavegur-trail/)
})
