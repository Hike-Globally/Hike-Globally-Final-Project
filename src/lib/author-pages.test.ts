/**
 * `/authors` and `/authors/[slug]` — rendered output, not just the data helpers.
 *
 * The data layer is covered by the sitemap and structured-data suites; this file checks what a
 * visitor and a crawler actually receive: the identity is readable, the work links go to real
 * URLs, an empty profile degrades to a sentence rather than a blank page, and no account field
 * ever reaches the markup.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'

import type { AuthorProfileRecord, PostCard, TripCard } from './data'

// The detail view imports section CSS, which is irrelevant to server-markup assertions.
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

const { AuthorDetail } = await import('@/components/views/author-detail')
const { AuthorCard } = await import('@/components/cards/author-card')

const date = '2026-11-01T00:00:00.000Z'
const image = {
  id: 1,
  alt: 'Test image',
  url: '/api/media/file/test.jpg',
  mimeType: 'image/jpeg',
  width: 1200,
  height: 800,
  createdAt: date,
  updatedAt: date,
} as unknown as AuthorProfileRecord['avatar']

const author: AuthorProfileRecord = {
  id: 1,
  name: 'Sarita Gurung',
  slug: 'sarita-gurung',
  bio: 'UIAGM aspirant guide from Ghandruk.',
  jobTitle: 'Senior trekking guide',
  education: 'Mountain leadership, Nepal Mountain Academy',
  credentials: [{ credential: 'Wilderness First Responder' }],
  website: 'https://sarita.example.com',
  socials: [{ platform: 'instagram', url: 'https://www.instagram.com/sarita' }],
  avatar: image,
  updatedAt: date,
}

const post: PostCard = {
  id: 1,
  title: 'Acclimatising properly',
  slug: 'acclimatising-properly',
  excerpt: 'The rule of thumb, and when to break it.',
  featuredImage: image as PostCard['featuredImage'],
  publishedAt: date,
  createdAt: date,
  author: { id: 1, name: 'Sarita Gurung' },
}

const trip: TripCard = {
  id: 2,
  title: 'Everest Base Camp',
  slug: 'everest-base-camp',
  summary: 'Twelve days to the foot of the world.',
  heroImage: image as TripCard['heroImage'],
  tripType: 'trekking',
  durationDays: 12,
  difficulty: 'moderate',
  priceFrom: 1800,
  priceCurrency: 'USD',
  destination: { id: 3, name: 'Khumbu', slug: 'khumbu' },
}

const documentOf = (html: string): Document => new JSDOM(html).window.document

const renderDetail = (overrides: Partial<Parameters<typeof AuthorDetail>[0]> = {}) =>
  renderToStaticMarkup(
    createElement(AuthorDetail, {
      author,
      posts: [post],
      trips: [trip],
      ...overrides,
    }),
  )

test('the profile page shows the identity and links to the author’s published work', () => {
  const document = documentOf(renderDetail())
  const text = document.body.textContent ?? ''

  assert.equal(document.querySelector('h1')?.textContent, author.name)
  assert.equal(document.querySelector('h1')?.getAttribute('class'), 'heading-display hero-title max-w-4xl 3xl:max-w-5xl text-ink')
  for (const fact of [author.jobTitle!, author.bio!, author.education!, author.credentials![0]!.credential]) {
    assert.ok(text.includes(fact), `${fact} must be visible`)
  }

  // The two columns are the whole point: who they are, and what they wrote. A card carries two
  // links to the same URL (the image and the title), so assert on the set rather than the first.
  const hrefsOf = (href: string) =>
    [...document.querySelectorAll(`a[href="${href}"]`)].map((a) => a.textContent)
  assert.ok(hrefsOf('/blog/acclimatising-properly').includes(post.title))
  assert.ok(hrefsOf('/trips/everest-base-camp').includes(trip.title))

  // External identity links keep `rel="me"` so they read as "this is the same person elsewhere".
  // `httpUrl()` normalizes to a trailing slash, so match on the origin rather than the raw string.
  const website = document.querySelector('a[href^="https://sarita.example.com"]')
  assert.equal(website?.getAttribute('rel'), 'author me')
  const instagram = document.querySelector('a[href^="https://www.instagram.com/sarita"]')
  assert.equal(instagram?.getAttribute('rel'), 'me')

  // Nothing private may ever reach the page.
  assert.doesNotMatch(renderDetail(), /private-|"email"|"hash"|"salt"|"roles"|"sessions"/)
})

test('the breadcrumb trails back to the authors index', () => {
  const document = documentOf(renderDetail())
  const crumbs = [...document.querySelectorAll('nav[aria-label="Breadcrumb"] a')].map((a) => [
    a.textContent,
    a.getAttribute('href'),
  ])
  assert.deepEqual(crumbs, [
    ['Home', '/'],
    ['Authors & guides', '/authors'],
  ])
})

test('a profile with no work yet says so instead of rendering an empty page', () => {
  const document = documentOf(renderDetail({ posts: [], trips: [] }))
  const text = document.body.textContent ?? ''

  assert.ok(text.includes('No published field notes yet.'))
  assert.ok(text.includes('No published trips yet.'))
  assert.equal(document.querySelector('a[href^="/blog/"]'), null)
  assert.equal(document.querySelector('a[href^="/trips/"]'), null)
})

test('the identity column collapses gracefully when only a name is known', () => {
  const html = renderToStaticMarkup(
    createElement(AuthorDetail, {
      author: { id: 9, name: 'Pemba Sherpa', slug: 'pemba-sherpa', avatar: null },
      posts: [],
      trips: [],
    }),
  )
  const document = documentOf(html)

  assert.equal(document.querySelector('h1')?.textContent, 'Pemba Sherpa')
  assert.doesNotMatch(html, /undefined|Education|Professional credentials/)
})

test('an author card links its portrait and its name to the same profile URL', () => {
  const document = documentOf(renderToStaticMarkup(createElement(AuthorCard, { author })))
  const hrefs = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href'))

  assert.deepEqual(hrefs, ['/authors/sarita-gurung', '/authors/sarita-gurung'])
  assert.equal(document.querySelector('h2')?.textContent, author.name)
  assert.ok(document.body.textContent?.includes(author.jobTitle!))
})

test('an author card with no portrait still renders, with a monogram instead of a broken image', () => {
  const html = renderToStaticMarkup(
    createElement(AuthorCard, {
      author: { ...author, avatar: null, bio: null },
    }),
  )
  const document = documentOf(html)

  assert.equal(document.querySelector('img'), null)
  assert.equal(document.querySelector('h2')?.textContent, author.name)
  // The monogram is decorative, so it must be hidden from assistive technology.
  assert.equal(document.querySelector('[aria-hidden="true"]')?.textContent, 'S')
})
