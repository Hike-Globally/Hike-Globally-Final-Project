/**
 * Tests for the canonical URL helpers.
 *
 * The contract under test: every page on the site points `<link rel="canonical">` at its own exact
 * URL, and that URL is spelled the same way everywhere it appears (canonical, `og:url`, sitemap,
 * JSON-LD). A canonical that drifts from the real URL — a trailing slash here, a filter query
 * there — is how a page gets dropped from the index as a duplicate.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import type { Blog, Media, Trip } from '@/payload-types'

// `src/lib/seo.ts` resolves the origin once, at module load, so the environment has to be set
// before the (dynamic) import.
process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'

const { MAX_KEYWORDS } = await import('../fields/keywords')

const {
  blogPostingJsonLd,
  buildMetadata,
  canonicalPath,
  canonicalUrl,
  normalizeKeywords,
  schemaImageUrl,
  seoFromDoc,
  touristTripJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} = await import('./seo')

test('WebSite emits site-name markup without the retired sitelinks SearchAction', () => {
  const schema = JSON.parse(
    JSON.stringify(websiteJsonLd({
      name: 'Hike Globally',
      alternateName: 'HikeGlobally',
      url: 'https://hikeglobally.com',
    })),
  )

  assert.deepEqual(schema, {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Hike Globally',
    alternateName: 'HikeGlobally',
    url: 'https://hikeglobally.com',
  })
  assert.equal('potentialAction' in schema, false)
})

test('WebSite preserves the supplied name and url when no alternate name is provided', () => {
  const schema = JSON.parse(
    JSON.stringify(websiteJsonLd({
      name: 'Custom site name',
      url: 'https://example.com',
    })),
  )

  assert.deepEqual(schema, {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Custom site name',
    url: 'https://example.com',
  })
})

const pathCases: Array<[string | null | undefined, string]> = [
  // Already canonical.
  ['/', '/'],
  ['/trips', '/trips'],
  ['/trips/everest-base-camp', '/trips/everest-base-camp'],
  // Missing or extra slashes.
  ['trips', '/trips'],
  ['', '/'],
  [null, '/'],
  [undefined, '/'],
  ['/trips/', '/trips'],
  ['/trips//everest/', '/trips/everest'],
  ['  /blog  ', '/blog'],
  // Query strings and hashes are the same page, never a separate canonical.
  ['/trips?page=2', '/trips'],
  ['/trips?destination=khumbu&sort=price', '/trips'],
  ['/trips/everest#day-3', '/trips/everest'],
  ['/trips?utm_source=newsletter#top', '/trips'],
  // Segments are encoded the way they appear in the address bar.
  ['/blog/café', '/blog/caf%C3%A9'],
  ['/blog/caf%C3%A9', '/blog/caf%C3%A9'],
  ['/blog/100%', '/blog/100%25'],
  ['/blog/a b', '/blog/a%20b'],
  // An absolute URL contributes its path only — the canonical can never leave this origin.
  ['https://example.com/trips/', '/trips'],
]

test('canonicalPath normalizes a route to the exact pathname it is served at', () => {
  for (const [input, expected] of pathCases) {
    assert.equal(canonicalPath(input), expected, `canonicalPath(${JSON.stringify(input)})`)
  }
})

test('canonicalPath is idempotent', () => {
  for (const [, expected] of pathCases) {
    assert.equal(canonicalPath(expected), expected, `re-normalizing ${expected}`)
  }
})

test('canonicalUrl prefixes the configured origin', () => {
  assert.equal(
    canonicalUrl('/trips/everest-base-camp'),
    'https://hikeglobally.com/trips/everest-base-camp',
  )
  assert.equal(canonicalUrl('/inquiry/thank-you'), 'https://hikeglobally.com/inquiry/thank-you')
})

test('canonicalUrl renders the homepage as the bare origin, exactly like Next.js does', () => {
  // Next resolves a canonical of `https://hikeglobally.com/` down to the origin. If this helper
  // kept the trailing slash, the sitemap and the page's own canonical would disagree.
  assert.equal(canonicalUrl('/'), 'https://hikeglobally.com')
  assert.equal(canonicalUrl(''), 'https://hikeglobally.com')
  assert.equal(canonicalUrl(), 'https://hikeglobally.com')
})

test('canonicalUrl never carries a query string or a trailing slash', () => {
  for (const url of ['/trips/?page=2', '/blog/', '/destinations/annapurna#treks']) {
    const canonical = canonicalUrl(url)
    assert.ok(!canonical.includes('?'), `${url} → ${canonical}`)
    assert.ok(!canonical.includes('#'), `${url} → ${canonical}`)
    assert.ok(!canonical.endsWith('/'), `${url} → ${canonical}`)
  }
})

test('buildMetadata self-canonicalizes the page and matches og:url', () => {
  const metadata = buildMetadata({ title: 'Everest Base Camp', path: '/trips/everest-base-camp/' })

  assert.equal(metadata.alternates?.canonical, 'https://hikeglobally.com/trips/everest-base-camp')
  assert.equal(metadata.openGraph?.url, 'https://hikeglobally.com/trips/everest-base-camp')
})

test('buildMetadata canonicalizes filtered listings to the unfiltered page', () => {
  const metadata = buildMetadata({ title: 'Trips', path: '/trips?difficulty=hard' })

  assert.equal(metadata.alternates?.canonical, 'https://hikeglobally.com/trips')
})

test('buildMetadata keeps robots noindex independent of the canonical', () => {
  const indexed = buildMetadata({ title: 'Trips', path: '/trips' })
  assert.deepEqual(indexed.robots, {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  })

  const blocked = buildMetadata({ title: 'Thank you', path: '/inquiry/thank-you', noIndex: true })
  assert.deepEqual(blocked.robots, { index: false, follow: false })
  // A noindex page still says which URL it is.
  assert.equal(blocked.alternates?.canonical, 'https://hikeglobally.com/inquiry/thank-you')
})

test('buildMetadata omits empty image keys instead of publishing them', () => {
  // A page with no image of its own must not emit an empty og:image / twitter:image. (Next.js uses
  // a route's openGraph block wholesale, so pages that want the site's default share image ask for
  // it explicitly — see the listing routes passing `settings.defaultOgImage`.)
  const metadata = buildMetadata({ title: 'About', path: '/about' })

  assert.ok(metadata.openGraph, 'openGraph block is missing')
  assert.equal('images' in metadata.openGraph, false)
  assert.ok(metadata.twitter, 'twitter block is missing')
  assert.equal('images' in metadata.twitter, false)
})

test('buildMetadata truncates the description but leaves the canonical alone', () => {
  const metadata = buildMetadata({
    title: 'Long',
    description: 'x'.repeat(400),
    path: '/blog/a-very-long-slug-indeed',
  })

  assert.ok((metadata.description?.length ?? 0) <= 160)
  assert.equal(
    metadata.alternates?.canonical,
    'https://hikeglobally.com/blog/a-very-long-slug-indeed',
  )
})

/* ==========================================================================
   Keywords — the "Keywords" section of a Trip or Blog document
   ========================================================================== */

test('normalizeKeywords accepts the chip list the CMS field produces', () => {
  assert.deepEqual(
    normalizeKeywords(['everest base camp trek', 'ebc trek cost', 'khumbu valley trek']),
    ['everest base camp trek', 'ebc trek cost', 'khumbu valley trek'],
  )
})

test('normalizeKeywords splits a pasted comma/newline list into one keyword each', () => {
  assert.deepEqual(
    normalizeKeywords('everest base camp trek, gokyo lakes trek\ngokyo ri hike;island peak'),
    ['everest base camp trek', 'gokyo lakes trek', 'gokyo ri hike', 'island peak'],
  )
})

test('normalizeKeywords trims, collapses whitespace, drops empties and de-duplicates', () => {
  assert.deepEqual(
    normalizeKeywords(['  Everest   Base Camp ', 'everest base camp', '', '   ', null, undefined]),
    ['Everest Base Camp'],
  )
  assert.deepEqual(normalizeKeywords(null), [])
  assert.deepEqual(normalizeKeywords(undefined), [])
  assert.deepEqual(normalizeKeywords([]), [])
})

test('normalizeKeywords caps the list at the CMS limit', () => {
  const many = Array.from({ length: 40 }, (_, index) => `keyword ${index}`)
  assert.equal(normalizeKeywords(many).length, MAX_KEYWORDS)
  assert.equal(normalizeKeywords(many)[MAX_KEYWORDS - 1], `keyword ${MAX_KEYWORDS - 1}`)
})

test('buildMetadata publishes keywords as meta keywords', () => {
  const metadata = buildMetadata({
    title: 'Everest Base Camp Trek',
    path: '/trips/everest-base-camp',
    keywords: ['everest base camp trek', 'ebc trek itinerary', 'everest base camp trek'],
  })

  assert.deepEqual(metadata.keywords, ['everest base camp trek', 'ebc trek itinerary'])
})

test('buildMetadata emits no keywords tag when the list is empty', () => {
  // An empty <meta name="keywords"> is worse than none: it looks like a mistake, not like a choice.
  assert.equal(buildMetadata({ title: 'Trips', path: '/trips' }).keywords, undefined)
  assert.equal(buildMetadata({ title: 'Trips', path: '/trips', keywords: [] }).keywords, undefined)
  assert.equal(
    buildMetadata({ title: 'Trips', path: '/trips', keywords: ['', '  '] }).keywords,
    undefined,
  )
})

test('buildMetadata adds article:tag Open Graph tags on posts only', () => {
  const keywords = ['trekking permits', 'timCard 2026']

  const article = buildMetadata({
    title: 'A guide to trekking permits',
    path: '/blog/trekking-permits',
    type: 'article',
    keywords,
  })
  assert.deepEqual(
    article.openGraph && 'tags' in article.openGraph ? article.openGraph.tags : null,
    keywords,
  )

  // `article:tag` is only valid on og:type=article, so a website page must not carry it.
  const website = buildMetadata({
    title: 'Trips',
    path: '/trips',
    keywords,
  })
  assert.equal(website.openGraph && 'tags' in website.openGraph, false)
})

test('seoFromDoc reads the keywords section of a document', () => {
  const seo = seoFromDoc(
    { keywords: ['annapurna circuit trek', ' annapurna circuit  '], meta: { title: 'Override' } },
    { title: 'Annapurna Circuit' },
  )

  assert.deepEqual(seo.keywords, ['annapurna circuit trek', 'annapurna circuit'])
  assert.equal(seo.title, 'Override')

  // A collection without the Keywords section yields an empty list, never undefined.
  assert.deepEqual(seoFromDoc({}, { title: 'About' }).keywords, [])
})

/* ==========================================================================
   Structured data — absolute URLs and the keyword list
   ========================================================================== */

const media = {
  id: 1,
  url: '/api/media/file/everest.jpg',
  alt: 'Everest',
  sizes: {
    og: { url: '/api/media/file/everest-1200x630.webp', width: 1200, height: 630 },
    hero: { url: '/api/media/file/everest-1920x1080.webp', width: 1920, height: 1080 },
  },
} as unknown as Media

test('schemaImageUrl resolves a Media document to an absolute URL', () => {
  // schema.org drops relative image URLs, so nothing may reach JSON-LD un-prefixed.
  assert.equal(
    schemaImageUrl(media),
    'https://hikeglobally.com/api/media/file/everest.jpg',
  )
  assert.equal(
    schemaImageUrl({ ...media, sizes: {} } as unknown as Media),
    'https://hikeglobally.com/api/media/file/everest.jpg',
  )
  assert.equal(
    schemaImageUrl('/api/media/file/everest.jpg'),
    'https://hikeglobally.com/api/media/file/everest.jpg',
  )
  assert.equal(schemaImageUrl('https://cdn.example.com/x.jpg'), 'https://cdn.example.com/x.jpg')
  assert.equal(schemaImageUrl(null), undefined)
})

test('blogPostingJsonLd carries the keyword list and an absolute image', () => {
  const post = {
    title: 'Trekking permits in Nepal',
    excerpt: 'What you need.',
    content: { root: { children: [{ text: 'One two three' }] } },
    keywords: ['nepal trekking permits', 'timS card'],
    categories: ['trekking-guides'],
  } as unknown as Blog

  const jsonLd = blogPostingJsonLd({
    post,
    url: '/blog/trekking-permits',
    authorName: 'Pemba',
    image: media,
    siteName: 'Hike Globally',
    categories: ['Trekking guides'],
  })

  assert.equal(jsonLd.keywords, 'nepal trekking permits, timS card')
  assert.deepEqual(jsonLd.image, ['https://hikeglobally.com/api/media/file/everest.jpg'])
  assert.deepEqual(jsonLd.articleSection, ['Trekking guides'])
  assert.equal(jsonLd.url, 'https://hikeglobally.com/blog/trekking-permits')
  assert.equal(jsonLd.wordCount, 3)
})

test('touristTripJsonLd carries the keyword list, duration and an absolute image', () => {
  const trip = {
    title: 'Everest Base Camp Trek',
    summary: 'Fourteen days in the Khumbu.',
    difficulty: 'challenging',
    durationDays: 14,
    priceFrom: 1850,
    priceCurrency: 'USD',
    keywords: ['everest base camp trek', 'ebc trek'],
    itinerary: [
      { day: 1, title: 'Fly to Lukla' },
      { day: 2, title: 'Walk to Namche' },
    ],
  } as unknown as Trip

  const jsonLd = touristTripJsonLd({
    trip,
    url: '/trips/everest-base-camp',
    image: media,
    destinationName: 'Khumbu',
    siteName: 'Hike Globally',
  })

  assert.equal(jsonLd.keywords, 'everest base camp trek, ebc trek')
  assert.equal(jsonLd.duration, 'P14D')
  assert.deepEqual(jsonLd.image, ['https://hikeglobally.com/api/media/file/everest.jpg'])
  assert.equal(jsonLd.offers, undefined)
})

test('webPageJsonLd lists a collection with canonical URLs', () => {
  const jsonLd = webPageJsonLd({
    type: 'CollectionPage',
    name: 'Trekking in Nepal',
    url: '/trips',
    items: [
      { name: 'Everest Base Camp', url: '/trips/everest-base-camp/' },
      { name: 'Annapurna Circuit', url: '/trips/annapurna-circuit?page=2' },
    ],
  })

  assert.equal(jsonLd['@type'], 'CollectionPage')
  assert.equal(jsonLd.url, 'https://hikeglobally.com/trips')

  const list = jsonLd.mainEntity as { numberOfItems: number; itemListElement: unknown[] }
  assert.equal(list.numberOfItems, 2)
  assert.deepEqual(list.itemListElement, [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Everest Base Camp',
      url: 'https://hikeglobally.com/trips/everest-base-camp',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Annapurna Circuit',
      url: 'https://hikeglobally.com/trips/annapurna-circuit',
    },
  ])
})

test('webPageJsonLd omits the ItemList when a page has nothing to list', () => {
  const jsonLd = webPageJsonLd({ name: 'Responsible travel', url: '/responsible-travel' })

  assert.equal(jsonLd['@type'], 'WebPage')
  assert.equal(jsonLd.mainEntity, undefined)
  assert.equal(jsonLd.image, undefined)
})
