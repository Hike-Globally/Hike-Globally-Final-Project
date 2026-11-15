/**
 * The link card's markup. These tests render it for real and pin the things a reader complained
 * about, so a future styling change cannot quietly undo them:
 *
 *   - the card always carries an image, and always through this site's own image proxy;
 *   - the price block is part of the card's middle row (after the body, before the open arrow),
 *     not a separate strip at the foot of the box;
 *   - the rating, the review count and the "was" price are all present when the row sets them;
 *   - external links open in a new tab, internal ones stay in the current one.
 */

import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { ResolvedLinkPreview } from '@/lib/link-preview'

/** Node cannot load a `.css` specifier; this hook turns any of them into an empty module. */
register(
  'data:text/javascript,' +
    encodeURIComponent(
      `export async function resolve(specifier, context, nextResolve) {
         if (specifier.endsWith('.css')) {
           return { url: 'data:text/javascript,export default {}', shortCircuit: true, format: 'module' }
         }
         return nextResolve(specifier, context)
       }`,
    ),
)

const { LinkPreviewCard } = await import('./link-preview-card')

const card = (overrides: Partial<ResolvedLinkPreview> = {}): ResolvedLinkPreview => ({
  href: 'https://www.booking.com/hotel/is/blue-lagoon.html',
  external: true,
  host: 'booking.com',
  title: 'Blue Lagoon Retreat, Grindavík',
  description: 'Geothermal spa hotel with a private lagoon entrance.',
  image: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/12345.jpg',
  rating: 4.6,
  reviewCount: 1234,
  price: '$289',
  originalPrice: '$410',
  ...overrides,
})

const render = (overrides: Partial<ResolvedLinkPreview> = {}) =>
  renderToStaticMarkup(createElement(LinkPreviewCard, { card: card(overrides) }))

test('the card always shows an image, fetched through this site', () => {
  const withImage = render()
  const src = withImage.match(/src="([^"]+)"/)?.[1]
  assert.ok(src, 'no image in the card')
  assert.ok(src.startsWith('/api/link-preview-image?url='), src)

  // No Open Graph art: the site's icon still puts a picture in the card.
  const withoutImage = render({ image: null })
  assert.match(withoutImage, /src="\/api\/link-preview-image\?url=https%3A%2F%2Fbooking\.com%2F/)
})

test('a featured image from this site is loaded from this origin, not through the proxy', () => {
  const html = render({ image: '/api/media/file/everest-hero.jpg' })
  const src = html.match(/src="([^"]+)"/)?.[1]
  assert.equal(src, '/api/media/file/everest-hero.jpg')
})

test('the price sits in the card row, between the body and the open arrow', () => {
  const html = render()

  const body = html.indexOf('class="link-preview-body"')
  const price = html.indexOf('class="link-preview-price"')
  const go = html.indexOf('class="link-preview-go"')

  assert.ok(body > -1 && price > -1 && go > -1, html)
  assert.ok(body < price, 'the price block must follow the body, not lead it')
  assert.ok(price < go, 'the price block must not be pushed past the card’s open arrow')
  assert.match(html, /class="link-preview-price-was"[^>]*>\$410</)
  assert.match(html, /class="link-preview-price-now"[^>]*>\$289</)
})

test('rating, review count and prices all appear when the row sets them', () => {
  const html = render()
  assert.match(html, />4\.6</)
  assert.match(html, />1,234 reviews</)
  assert.match(
    html,
    /class="link-preview-stars-row link-preview-stars-row--filled"[^>]*style="width:92%"/,
  )
})

test('the host is printed once, as an eyebrow above the title', () => {
  const html = render()
  const host = html.indexOf('class="link-preview-host"')
  const title = html.indexOf('class="link-preview-title"')
  assert.ok(host > -1 && host < title)
  assert.match(html, />booking\.com</)

  // A page with no metadata at all: the title *is* the host, so it must not be repeated.
  assert.doesNotMatch(render({ title: 'booking.com', description: '' }), /link-preview-host"/)
})

test('an external link opens in a new tab, an internal one does not', () => {
  assert.match(render(), /target="_blank"/)
  assert.match(render(), /rel="noopener noreferrer"/)

  const internal = render({
    href: '/trips/everest-base-camp',
    external: false,
    host: 'hike.global',
  })
  assert.doesNotMatch(internal, /target="_blank"/)
  assert.doesNotMatch(internal, /rel="noopener noreferrer"/)
})

test('a card with no price leaves no empty price block behind', () => {
  const html = render({ price: null, originalPrice: null })
  assert.doesNotMatch(html, /link-preview-price/)
  assert.match(html, /class="link-preview-go"/)
})
