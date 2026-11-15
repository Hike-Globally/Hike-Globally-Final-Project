/**
 * Link preview: URL validation, metadata parsing and the merge rules that decide what the card
 * shows. The network call is injected, so these run offline.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  decodeHtmlEntities,
  parseLinkPreviewMetadata,
  resolveLinkPreview,
  validateLinkPreviewUrl,
  type LinkPreviewMetadata,
  type LinkPreviewSource,
} from './link-preview'

process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'

const PAGE = 'https://www.example.com/trek/annapurna'

test('validateLinkPreviewUrl accepts empty values, absolute web addresses and site paths', () => {
  assert.equal(validateLinkPreviewUrl(''), true)
  assert.equal(validateLinkPreviewUrl(null), true)
  assert.equal(validateLinkPreviewUrl('https://example.com/a?b=1'), true)
  assert.equal(validateLinkPreviewUrl('http://example.com'), true)
  assert.equal(validateLinkPreviewUrl('/trips/annapurna-base-camp'), true)
})

test('validateLinkPreviewUrl rejects other schemes, protocol-relative and plain text', () => {
  for (const bad of ['javascript:alert(1)', 'ftp://example.com', '//example.com', 'not a url']) {
    assert.notEqual(validateLinkPreviewUrl(bad), true, bad)
  }
  assert.notEqual(validateLinkPreviewUrl(42), true)
})

test('decodeHtmlEntities handles named, decimal and hex references and leaves unknown ones alone', () => {
  assert.equal(decodeHtmlEntities('Tom &amp; Jerry &#39;s &#x2019;'), "Tom & Jerry 's \u2019")
  assert.equal(decodeHtmlEntities('&lt;b&gt; &quot;hi&quot;'), '<b> "hi"')
  assert.equal(decodeHtmlEntities('&unknown; &#xZZ;'), '&unknown; &#xZZ;')
})

test('parseLinkPreviewMetadata prefers Open Graph, then Twitter, then the plain title tag', () => {
  const html = `
    <html><head>
      <title>Plain &amp; Simple</title>
      <meta name="description" content="Plain description">
      <meta name="twitter:title" content="Twitter title">
      <meta property="og:title" content="Annapurna &amp; Base Camp">
      <meta property="og:description" content='Deep into the mountains'>
      <meta property="og:image" content="/images/annapurna.jpg">
    </head><body>ignored</body></html>`
  const meta = parseLinkPreviewMetadata(html, PAGE)
  assert.equal(meta.title, 'Annapurna & Base Camp')
  assert.equal(meta.description, 'Deep into the mountains')
  assert.equal(meta.image, 'https://www.example.com/images/annapurna.jpg')
})

test('parseLinkPreviewMetadata falls back to Twitter and the <title> element', () => {
  const twitter = parseLinkPreviewMetadata(
    `<meta name="twitter:title" content="Card title"><meta name="twitter:image" content="https://cdn.example.com/a.png">`,
    PAGE,
  )
  assert.equal(twitter.title, 'Card title')
  assert.equal(twitter.image, 'https://cdn.example.com/a.png')

  const plain = parseLinkPreviewMetadata(
    `<title>
       Only   a title
    </title><meta name="description" content="Meta description">`,
    PAGE,
  )
  assert.equal(plain.title, 'Only a title')
  assert.equal(plain.description, 'Meta description')
  assert.equal(plain.image, undefined)
})

test('parseLinkPreviewMetadata ignores empty content and unusable image addresses', () => {
  const meta = parseLinkPreviewMetadata(
    `<meta property="og:title" content="   "><meta property="og:image" content="http://[broken">`,
    PAGE,
  )
  assert.equal(meta.title, undefined)
  assert.equal(meta.image, undefined)
})

test('resolveLinkPreview returns nothing without a URL, so the section stays hidden', async () => {
  const source: LinkPreviewSource = { linkPreviewUrl: '  ', linkPreviewTitle: 'Ignored' }
  assert.equal(await resolveLinkPreview(source, async () => ({ title: 'x' })), null)
  assert.equal(await resolveLinkPreview({}), null)
})

test('resolveLinkPreview returns nothing for an invalid URL instead of fetching it', async () => {
  let fetched = false
  const result = await resolveLinkPreview({ linkPreviewUrl: 'javascript:void(0)' }, async () => {
    fetched = true
    return null
  })
  assert.equal(result, null)
  assert.equal(fetched, false)
})

test('editor overrides win over the fetched page metadata', async () => {
  const fetched: LinkPreviewMetadata = {
    title: 'Page title',
    description: 'Page description',
    image: 'https://cdn.example.com/hero.jpg',
  }
  const card = await resolveLinkPreview(
    {
      linkPreviewUrl: PAGE,
      linkPreviewTitle: '  Annapurna Base Camp Trek - 11 Days  ',
      linkPreviewDescription: 'Our own summary',
    },
    async () => fetched,
  )
  assert.ok(card)
  assert.equal(card.title, 'Annapurna Base Camp Trek - 11 Days')
  assert.equal(card.description, 'Our own summary')
  assert.equal(card.image, 'https://cdn.example.com/hero.jpg')
  assert.equal(card.href, PAGE)
  assert.equal(card.host, 'example.com')
  assert.equal(card.external, true)
})

test('resolveLinkPreview still renders from the editor fields when the page cannot be read', async () => {
  const card = await resolveLinkPreview(
    {
      linkPreviewUrl: PAGE,
      linkPreviewTitle: 'Typed title',
      linkPreviewRating: 4.8,
      linkPreviewReviewCount: 230,
      linkPreviewPrice: 'US$ 700',
      linkPreviewOriginalPrice: 'US$ 1150',
    },
    async () => null,
  )
  assert.ok(card)
  assert.equal(card.title, 'Typed title')
  assert.equal(card.description, '')
  assert.equal(card.image, null)
  assert.equal(card.rating, 4.8)
  assert.equal(card.reviewCount, 230)
  assert.equal(card.price, 'US$ 700')
  assert.equal(card.originalPrice, 'US$ 1150')
})

test('with no title anywhere, the card falls back to the host name', async () => {
  const card = await resolveLinkPreview({ linkPreviewUrl: PAGE }, async () => null)
  assert.ok(card)
  assert.equal(card.title, 'example.com')
})

test('site paths stay in the same tab and resolve against the site origin', async () => {
  const seen: string[] = []
  const card = await resolveLinkPreview({ linkPreviewUrl: '/trips/annapurna' }, async (url) => {
    seen.push(url)
    return null
  })
  assert.ok(card)
  assert.deepEqual(seen, ['https://hikeglobally.com/trips/annapurna'])
  assert.equal(card.href, '/trips/annapurna')
  assert.equal(card.external, false)
})

test('a link to this site’s own address is not treated as external', async () => {
  const card = await resolveLinkPreview(
    { linkPreviewUrl: 'https://hikeglobally.com/blog/altitude' },
    async () => null,
  )
  assert.ok(card)
  assert.equal(card.external, false)
})

test('ratings are capped at 5 and bad numbers are dropped', async () => {
  const high = await resolveLinkPreview(
    { linkPreviewUrl: PAGE, linkPreviewRating: 7, linkPreviewReviewCount: -3 },
    async () => null,
  )
  assert.equal(high?.rating, 5)
  assert.equal(high?.reviewCount, null)

  const nan = await resolveLinkPreview(
    { linkPreviewUrl: PAGE, linkPreviewRating: Number.NaN },
    async () => null,
  )
  assert.equal(nan?.rating, null)
})
