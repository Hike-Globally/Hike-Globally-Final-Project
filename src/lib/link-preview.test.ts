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
  fetchLinkPreviewMetadata,
  parseLinkPreviewMetadata,
  resolveLinkPreview,
  validateLinkPreviewUrl,
  type InternalLinkPreview,
  type LinkPreviewMetadata,
  type LinkPreviewSource,
} from './link-preview'

process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'

const PAGE = 'https://www.example.com/trek/annapurna'

/**
 * `resolveLinkPreview` with the network and the CMS both stubbed: the second argument reads the
 * linked page, the third reads our own CMS (only consulted for links to this site).
 */
const resolve = (
  source: LinkPreviewSource,
  metadata?: (url: string) => Promise<LinkPreviewMetadata | null>,
  internal?: (url: string) => Promise<InternalLinkPreview | null>,
) => resolveLinkPreview(source, { metadata, internal })

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
  assert.equal(await resolve(source, async () => ({ title: 'x' })), null)
  assert.equal(await resolve({}), null)
})

test('resolveLinkPreview returns nothing for an invalid URL instead of fetching it', async () => {
  let fetched = false
  const result = await resolve({ linkPreviewUrl: 'javascript:void(0)' }, async () => {
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
  const card = await resolve(
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
  const card = await resolve(
    {
      linkPreviewUrl: PAGE,
      linkPreviewTitle: 'Typed title',
      linkPreviewPrice: 'US$ 700',
      linkPreviewOriginalPrice: 'US$ 1150',
    },
    async () => null,
  )
  assert.ok(card)
  assert.equal(card.title, 'Typed title')
  assert.equal(card.description, '')
  assert.equal(card.image, null)
  assert.equal(card.price, 'US$ 700')
  assert.equal(card.originalPrice, 'US$ 1150')
})

test('with no title anywhere, the card falls back to the host name', async () => {
  const card = await resolve({ linkPreviewUrl: PAGE }, async () => null)
  assert.ok(card)
  assert.equal(card.title, 'example.com')
})

test('site paths stay in the same tab and resolve against the site origin', async () => {
  const seen: string[] = []
  const card = await resolve({ linkPreviewUrl: '/trips/annapurna' }, async (url) => {
    seen.push(url)
    return null
  })
  assert.ok(card)
  assert.deepEqual(seen, ['https://hikeglobally.com/trips/annapurna'])
  assert.equal(card.href, '/trips/annapurna')
  assert.equal(card.external, false)
})

test('a link to this site’s own address is not treated as external', async () => {
  const card = await resolve(
    { linkPreviewUrl: 'https://hikeglobally.com/blog/altitude' },
    async () => null,
  )
  assert.ok(card)
  assert.equal(card.external, false)
})

/* ------------------------------------------------------------------------------------------------
 * A link to a page on this site: the card shows that page's featured image, read from the CMS.
 * ---------------------------------------------------------------------------------------------- */

/** What the CMS stores (absolute) … */
const FEATURED_ABSOLUTE = 'https://hikeglobally.com/api/media/file/everest-hero.jpg'
/** … and what the card receives: a path, so the browser loads it from this origin directly. */
const FEATURED = '/api/media/file/everest-hero.jpg'

test('a link to one of our own pages shows that page’s featured image, with no network call', async () => {
  const lookedUp: string[] = []
  let networkCalled = false

  const card = await resolve(
    { linkPreviewUrl: '/trips/everest-base-camp' },
    async () => {
      networkCalled = true
      return { title: 'Scraped title', image: 'https://hikeglobally.com/scraped.jpg' }
    },
    async (url) => {
      lookedUp.push(url)
      return {
        title: 'Everest Base Camp Trek',
        description: 'Twelve days.',
        image: FEATURED_ABSOLUTE,
      }
    },
  )

  assert.ok(card)
  assert.equal(card.image, FEATURED)
  assert.equal(card.title, 'Everest Base Camp Trek')
  assert.equal(card.description, 'Twelve days.')
  assert.equal(card.external, false)
  // The featured image answers everything, so our own page is never fetched.
  assert.equal(networkCalled, false)
  assert.deepEqual(lookedUp, ['https://hikeglobally.com/trips/everest-base-camp'])
})

test('a first-party image is handed to the card as a path, so it skips the proxy', async () => {
  const card = await resolve(
    { linkPreviewUrl: '/trips/everest-base-camp' },
    undefined,
    async () => ({ title: 'Trip', description: 'Summary', image: FEATURED_ABSOLUTE }),
  )

  // `/api/media/file/…` is served from this origin; only other people's images need proxying.
  assert.equal(card?.image, '/api/media/file/everest-hero.jpg')
})

test('the CMS is not consulted for another site’s page', async () => {
  let internalCalled = false

  const card = await resolve(
    { linkPreviewUrl: PAGE },
    async () => ({ image: 'https://cdn.example.com/hero.jpg' }),
    async () => {
      internalCalled = true
      return null
    },
  )

  assert.equal(card?.image, 'https://cdn.example.com/hero.jpg')
  assert.equal(internalCalled, false)
})

test('a document with no featured image still falls back to the page, keeping the CMS text', async () => {
  const card = await resolve(
    { linkPreviewUrl: '/blog/no-photo-yet' },
    async () => ({
      title: 'Scraped title',
      description: 'Scraped description',
      image: 'https://cdn.example.com/body.jpg',
    }),
    async () => ({ title: 'Post title', description: 'Post excerpt', image: null }),
  )

  assert.equal(card?.image, 'https://cdn.example.com/body.jpg')
  assert.equal(card?.title, 'Post title')
  assert.equal(card?.description, 'Post excerpt')
})

test('the row’s own title and description still win over the document', async () => {
  const card = await resolve(
    { linkPreviewUrl: '/trips/everest-base-camp', linkPreviewTitle: 'Typed title' },
    undefined,
    async () => ({ title: 'CMS title', description: 'CMS description', image: FEATURED_ABSOLUTE }),
  )

  assert.equal(card?.title, 'Typed title')
  assert.equal(card?.description, 'CMS description')
  assert.equal(card?.image, FEATURED)
})

test('an unknown or unpublished page falls back to reading the page itself', async () => {
  const seen: string[] = []

  const card = await resolve(
    { linkPreviewUrl: '/trips/not-published' },
    async (url) => {
      seen.push(url)
      return { image: 'https://hikeglobally.com/api/media/file/other.jpg' }
    },
    async () => null,
  )

  assert.deepEqual(seen, ['https://hikeglobally.com/trips/not-published'])
  assert.equal(card?.image, '/api/media/file/other.jpg')
  assert.equal(card?.title, 'hikeglobally.com')
})

/* ------------------------------------------------------------------------------------------------
 * Other people's pages: JSON-LD, link tags and body images, since a card that only understands
 * Open Graph on our own site is not a link preview.
 * ---------------------------------------------------------------------------------------------- */

test('JSON-LD is read when a page carries no Open Graph at all', () => {
  const html = `<html><head>
    <script type="application/ld+json">
      {"@context":"https://schema.org","@graph":[
        {"@type":"WebSite","name":"Example Travel"},
        {"@type":"BlogPosting","headline":"Annapurna in November","description":"Cold, clear, quiet.",
         "image":{"@type":"ImageObject","url":"/media/annapurna.jpg"}}
      ]}
    </script>
  </head><body></body></html>`
  const meta = parseLinkPreviewMetadata(html, PAGE)
  assert.equal(meta.title, 'Annapurna in November')
  assert.equal(meta.description, 'Cold, clear, quiet.')
  assert.equal(meta.image, 'https://www.example.com/media/annapurna.jpg')
})

test('JSON-LD survives broken blocks, quoted entities and an image given as a list', () => {
  const html = `<script type="application/ld+json">{not json}</script>
    <script type="application/ld+json">
      {"@type":"Product","name":"Sleeping bag &amp; liner","image":["/a.jpg","/b.jpg"]}
    </script>`
  const meta = parseLinkPreviewMetadata(html, PAGE)
  assert.equal(meta.title, 'Sleeping bag & liner')
  assert.equal(meta.image, 'https://www.example.com/a.jpg')
})

test('every declared image form is understood, best first', () => {
  const secure = parseLinkPreviewMetadata(
    `<meta property="og:image:secure_url" content="https://files.example.com/a.jpg">`,
    PAGE,
  )
  assert.equal(secure.image, 'https://files.example.com/a.jpg')

  const protocolRelative = parseLinkPreviewMetadata(
    `<meta property="twitter:image" content="//cdn.example.com/b.jpg">`,
    PAGE,
  )
  assert.equal(protocolRelative.image, 'https://cdn.example.com/b.jpg')

  const imageSrc = parseLinkPreviewMetadata(`<link rel="image_src" href="/c.jpg">`, PAGE)
  assert.equal(imageSrc.image, 'https://www.example.com/c.jpg')

  const touchIcon = parseLinkPreviewMetadata(
    `<link rel="apple-touch-icon" sizes="180x180" href="/touch.png">`,
    PAGE,
  )
  assert.equal(touchIcon.image, undefined)

  const itemprop = parseLinkPreviewMetadata(
    `<meta itemprop="image" content="https://cdn.example.com/d.png">`,
    PAGE,
  )
  assert.equal(itemprop.image, 'https://cdn.example.com/d.png')

  const openGraphWins = parseLinkPreviewMetadata(
    `<meta property="og:image" content="https://cdn.example.com/hero.jpg">
     <meta property="twitter:image" content="https://cdn.example.com/small.jpg">`,
    PAGE,
  )
  assert.equal(openGraphWins.image, 'https://cdn.example.com/hero.jpg')
})

test('the first usable body image is the last resort, skipping pixels, icons and inline data', () => {
  const html = `<html><head><title>No tags</title></head><body>
    <img src="data:image/gif;base64,R0lGOD" width="1" height="1">
    <img src="/img/pixel.gif">
    <img src="/img/logo.svg">
    <img src="/img/site-logo.png">
    <img src="https://cdn.example.com/hero.jpg" alt="">
  </body></html>`
  const meta = parseLinkPreviewMetadata(html, PAGE)
  assert.equal(meta.image, 'https://cdn.example.com/hero.jpg')
})

test('an unusable image address is dropped rather than shown', () => {
  for (const content of ['data:image/png;base64,AAAA', 'javascript:alert(1)', 'http://[broken']) {
    const meta = parseLinkPreviewMetadata(`<meta property="og:image" content="${content}">`, PAGE)
    assert.equal(meta.image, undefined, content)
  }
})

test('og:site_name is a title only when the page names nothing else', () => {
  const onlySite = parseLinkPreviewMetadata(
    `<meta property="og:site_name" content="Example Travel">`,
    PAGE,
  )
  assert.equal(onlySite.title, 'Example Travel')

  const withTitle = parseLinkPreviewMetadata(
    `<title>Annapurna Base Camp</title><meta property="og:site_name" content="Example Travel">`,
    PAGE,
  )
  assert.equal(withTitle.title, 'Annapurna Base Camp')
})

/* ------------------------------------------------------------------------------------------------
 * The request itself. `fetch` is stubbed, so these run offline but exercise the real read path.
 * ---------------------------------------------------------------------------------------------- */

const withFetch = async (impl: typeof fetch, run: () => Promise<void>): Promise<void> => {
  const original = globalThis.fetch
  globalThis.fetch = impl
  try {
    await run()
  } finally {
    globalThis.fetch = original
  }
}

const htmlResponse = (html: string, headers: Record<string, string> = {}) =>
  new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', ...headers } })

test('a blocked host, an API endpoint or a network error all resolve to null', async () => {
  await withFetch(
    async () => new Response('Forbidden', { status: 403 }),
    async () => {
      assert.equal(await fetchLinkPreviewMetadata(PAGE), null)
    },
  )

  await withFetch(
    async () => new Response('{"a":1}', { headers: { 'content-type': 'application/json' } }),
    async () => {
      assert.equal(await fetchLinkPreviewMetadata(PAGE), null)
    },
  )

  await withFetch(
    async () => {
      throw new Error('ECONNREFUSED')
    },
    async () => {
      assert.equal(await fetchLinkPreviewMetadata(PAGE), null)
    },
  )
})

test('a URL that points directly to a public raster image becomes the preview image', async () => {
  await withFetch(
    async () =>
      new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/webp' } }),
    async () => {
      assert.deepEqual(await fetchLinkPreviewMetadata('https://images.example.com/trek'), {
        image: 'https://images.example.com/trek',
      })
    },
  )
})

test('the page is requested the way a browser would ask for it', async () => {
  let sent: Headers | undefined
  await withFetch(
    async (_input, init) => {
      sent = new Headers(init?.headers)
      return htmlResponse('<title>Hello</title>')
    },
    async () => {
      await fetchLinkPreviewMetadata(PAGE)
    },
  )

  assert.match(sent?.get('user-agent') ?? '', /Mozilla\/5\.0/)
  assert.match(sent?.get('accept') ?? '', /text\/html/)
  assert.match(sent?.get('accept-language') ?? '', /en/)
})

test('a page whose head declares no image is read a little way into the body', async () => {
  const body = `<html><head><title>Field notes</title><meta name="description" content="From the trail"></head>
    <body><main><img src="/media/hero.jpg" alt=""></main></body></html>`

  await withFetch(
    async () => htmlResponse(body),
    async () => {
      const meta = await fetchLinkPreviewMetadata(PAGE)
      assert.equal(meta?.title, 'Field notes')
      assert.equal(meta?.description, 'From the trail')
      assert.equal(meta?.image, 'https://www.example.com/media/hero.jpg')
    },
  )
})

test('an image declared in the head wins over anything in the body', async () => {
  const html = `<html><head><meta property="og:image" content="/a.jpg"></head>
    <body><img src="/b.jpg"></body></html>`

  await withFetch(
    async () => htmlResponse(html),
    async () => {
      const meta = await fetchLinkPreviewMetadata(PAGE)
      assert.equal(meta?.image, 'https://www.example.com/a.jpg')
    },
  )
})

test('a page that declares a non-UTF-8 charset is decoded with it', async () => {
  const latin1 = Buffer.from('<html><head><title>Caf\u00e9 au lait</title></head></html>', 'latin1')

  await withFetch(
    async () =>
      new Response(latin1, { headers: { 'content-type': 'text/html; charset=iso-8859-1' } }),
    async () => {
      const meta = await fetchLinkPreviewMetadata(PAGE)
      assert.equal(meta?.title, 'Café au lait')
    },
  )
})

test('collects ordered, distinct alternatives from metadata and the page body', () => {
  const html = `<html><head>
    <meta property="og:image" content="/featured.jpg">
    <meta name="twitter:image" content="/social.jpg">
    <link rel="apple-touch-icon" href="/icon.png">
    </head><body>
    <img src="data:image/gif;base64,AA" data-src="/body.jpg">
    <img srcset="/responsive.jpg 1x, /responsive-large.jpg 2x">
    <img src="/body.jpg">
    </body></html>`
  const meta = parseLinkPreviewMetadata(html, PAGE)
  assert.equal(meta.image, 'https://www.example.com/featured.jpg')
  assert.deepEqual(meta.images, [
    'https://www.example.com/social.jpg',
    'https://www.example.com/body.jpg',
    'https://www.example.com/responsive-large.jpg',
    'https://www.example.com/responsive.jpg',
  ])
})

test('an invalid featured image does not hide a usable alternate image', () => {
  const meta = parseLinkPreviewMetadata(
    `<meta property="og:image" content="javascript:alert(1)"><meta name="twitter:image" content="/photo.jpg">`,
    PAGE,
  )
  assert.equal(meta.image, 'https://www.example.com/photo.jpg')
})

test('the fetch reads the body even when the head already names an image', async () => {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode('<html><head><meta property="og:image" content="/hero.jpg"></head>'),
      )
      controller.enqueue(encoder.encode('<body><img src="/another.jpg"></body></html>'))
      controller.close()
    },
  })
  await withFetch(
    async () => new Response(stream, { headers: { 'content-type': 'text/html' } }),
    async () => {
      const meta = await fetchLinkPreviewMetadata(PAGE)
      assert.equal(meta?.image, 'https://www.example.com/hero.jpg')
      assert.deepEqual(meta?.images, ['https://www.example.com/another.jpg'])
    },
  )
})

test('the resolved card preserves alternate page images for the frontend', async () => {
  const card = await resolve({ linkPreviewUrl: PAGE }, async () => ({
    image: 'https://example.com/featured.jpg',
    images: ['https://example.com/another.jpg'],
  }))
  assert.deepEqual(card?.imageAlternatives, ['https://example.com/another.jpg'])
})

test('first-party featured and gallery images are retained for fallback without a self-request', async () => {
  let fetched = false
  const card = await resolve(
    { linkPreviewUrl: '/trips/ghorepani-poon-hill' },
    async () => {
      fetched = true
      return null
    },
    async () => ({
      title: 'Ghorepani Poon Hill Trek',
      description: null,
      image: 'https://hikeglobally.com/api/media/file/featured.jpg',
      images: ['https://hikeglobally.com/api/media/file/gallery.jpg'],
    }),
  )
  assert.equal(fetched, false)
  assert.equal(card?.image, '/api/media/file/featured.jpg')
  assert.deepEqual(card?.imageAlternatives, ['/api/media/file/gallery.jpg'])
})

test('lazy image placeholders do not beat the actual photograph', () => {
  const meta = parseLinkPreviewMetadata(
    '<img src="/placeholder.png" data-srcset="/trek.jpg 1x, /trek-large.jpg 2x">',
    PAGE,
  )
  assert.equal(meta.image, 'https://www.example.com/trek-large.jpg')
})

test('keeps repeated Open Graph and all JSON-LD image alternatives including footer data', () => {
  const meta = parseLinkPreviewMetadata(
    `<head>
    <meta property="og:image" content="/broken.jpg">
    <meta property="og:image" content="/featured.jpg">
    </head><body><script type="application/ld+json">
    {"@type":"Article","image":["/schema-first.jpg",{"contentUrl":"/schema-second.jpg"}]}
    </script><img src="/body.jpg"></body>`,
    PAGE,
  )
  assert.equal(meta.image, 'https://www.example.com/broken.jpg')
  assert.deepEqual(meta.images, [
    'https://www.example.com/featured.jpg',
    'https://www.example.com/schema-first.jpg',
    'https://www.example.com/schema-second.jpg',
    'https://www.example.com/body.jpg',
  ])
})

test('prefers featured body markup and supports original lazy images, picture sources and base URLs', () => {
  const meta = parseLinkPreviewMetadata(
    `<head><base href="https://cdn.example.com/assets/"></head>
    <img src="ordinary.jpg"><img class="wp-post-image" data-original="featured.jpg" src="placeholder.png">
    <picture><source srcset="small.webp 320w, large.webp 1280w"><img data-lazy-srcset="lazy.jpg 2x"></picture>`,
    PAGE,
  )
  assert.equal(meta.image, 'https://cdn.example.com/assets/featured.jpg')
  assert.deepEqual(meta.images, [
    'https://cdn.example.com/assets/ordinary.jpg',
    'https://cdn.example.com/assets/large.webp',
    'https://cdn.example.com/assets/small.webp',
    'https://cdn.example.com/assets/lazy.jpg',
  ])
})

test('uses background images or a page logo if there is no content photograph', () => {
  const meta = parseLinkPreviewMetadata(
    `<img src="/logo.png">
    <div style="background-image: url('/mountain.jpg')"></div>
    <div data-bg="/forest.jpg"></div>`,
    PAGE,
  )
  assert.equal(meta.image, 'https://www.example.com/mountain.jpg')
  assert.deepEqual(meta.images, [
    'https://www.example.com/forest.jpg',
    'https://www.example.com/logo.png',
  ])
  assert.equal(
    parseLinkPreviewMetadata('<img src="/logo.png">', PAGE).image,
    'https://www.example.com/logo.png',
  )
})

test('does not extract phantom images from comments or script strings, and ignores arbitrary meta names', () => {
  const meta = parseLinkPreviewMetadata(
    `<!-- <meta property="og:image" content="/old.jpg"> -->
    <script>const html = '<img src="/fake.jpg">';</script>
    <meta name="__proto__" content="malicious"><img src="/real.jpg">`,
    PAGE,
  )
  assert.equal(meta.image, 'https://www.example.com/real.jpg')
})

test('reads images beyond the old 64 KiB body window, while capping the downloaded document', async () => {
  const encoder = new TextEncoder()
  let cancelled = false
  let reads = 0
  const stream = new ReadableStream({
    pull(controller) {
      reads++
      if (reads === 1)
        controller.enqueue(encoder.encode('<head><title>Long page</title></head><body>'))
      else if (reads === 2)
        controller.enqueue(encoder.encode(' '.repeat(400_000) + '<img src="/deep.jpg">'))
      else controller.enqueue(encoder.encode(' '.repeat(128 * 1024)))
    },
    cancel() {
      cancelled = true
    },
  })
  const meta = await fetchLinkPreviewMetadata(
    PAGE,
    async () => new Response(stream, { headers: { 'content-type': 'text/html' } }),
  )
  assert.equal(meta?.image, 'https://www.example.com/deep.jpg')
  assert.equal(cancelled, true)
  assert.ok(reads < 20, 'stops reading an unbounded response at 2 MiB')
})

test('JSON-LD ImageObject graph references do not mask the actual image URL', () => {
  const meta = parseLinkPreviewMetadata(
    `<script type="application/ld+json">{
    "@graph":[
      {"@type":"WebPage","primaryImageOfPage":{"@id":"https://publisher.example.com/article#primaryimage"}},
      {"@type":"ImageObject","@id":"https://publisher.example.com/article#primaryimage","contentUrl":"/real-photo.jpg"}
    ]
  }</script>`,
    PAGE,
  )
  assert.equal(meta.image, 'https://www.example.com/real-photo.jpg')
})
