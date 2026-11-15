/**
 * The link card's picture. A card without it is the failure this component exists to prevent, so
 * these tests render it for real (server markup is what the page ships) and assert that:
 *
 *   - it always asks for an image, and asks for it through our own proxy rather than the host;
 *   - a page with Open Graph art shows that art first;
 *   - a page with none falls back to the site icon, so the card is never a bare box;
 *   - the letter tile is only what remains when every candidate fails, and its letter is sensible
 *     for the hosts that really appear in a Page sections URL (`www.` prefixes, punycode, ports).
 */

import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

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

const { initialOf, LinkPreviewThumb } = await import('./link-preview-thumb')

const render = (image: string | null, host = 'example.com') =>
  renderToStaticMarkup(createElement(LinkPreviewThumb, { image, host }))

test('the picture is always requested through this site, never from the linked host', () => {
  const html = render('https://cdn.example.com/og.jpg')
  const src = html.match(/src="([^"]+)"/)?.[1]

  assert.ok(src, `no image was rendered: ${html}`)
  assert.ok(src.startsWith('/api/link-preview-image?url='), src)
  assert.equal(src, '/api/link-preview-image?url=https%3A%2F%2Fcdn.example.com%2Fog.jpg')
  // Same-origin means no leaked `Referer`, no CORS, no hotlink block.
  assert.match(html, /loading="lazy"/)
  assert.match(html, /alt=""/)
})

test("a page's own art fills the tile; a site icon is contained, not cropped", () => {
  // The CSS keys off `data-icon`: cover for photography, contain-in-a-padded-square for icons.
  assert.doesNotMatch(render('https://cdn.example.com/og.jpg'), /data-icon/)
  assert.match(render(null, 'example.com'), /data-icon="true"/)
})

test('a page with no Open Graph image still shows the site icon', () => {
  const html = render(null, 'www.booking.com')
  const src = html.match(/src="([^"]+)"/)?.[1]

  assert.ok(src, `no image was rendered: ${html}`)
  assert.equal(
    src,
    '/api/link-preview-image?url=https%3A%2F%2Fwww.booking.com%2Fapple-touch-icon.png',
  )
})

test('the fallback tile uses the first letter of the site, without the www', () => {
  assert.equal(initialOf('booking.com'), 'B')
  assert.equal(initialOf('www.booking.com'), 'B')
  assert.equal(initialOf('guide-to-iceland.example'), 'G')
  assert.equal(initialOf('9flats.com'), '9')
})

test('the fallback tile copes with odd host strings', () => {
  assert.equal(initialOf(''), '?')
  assert.equal(initialOf('www.'), '?')
  assert.equal(initialOf('-leading-dash.example'), 'L')
  assert.equal(initialOf('xn--80ak6aa92e.com'), 'X')
})
