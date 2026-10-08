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

// `src/lib/seo.ts` resolves the origin once, at module load, so the environment has to be set
// before the (dynamic) import.
process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'

const { buildMetadata, canonicalPath, canonicalUrl } = await import('./seo')

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
