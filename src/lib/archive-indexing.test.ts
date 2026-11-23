/**
 * Archive indexing — which listing URLs may be indexed, and which may only be crawled.
 *
 * A listing's filters multiply one archive into a combinatorial number of near-identical pages:
 * `destination` × `difficulty` × `season` × `type` × `sort` on `/trips`, and every topic on
 * `/blog`. Those URLs are useful to *crawl* — they are how a crawler reaches the cards they
 * render — and useless to *index*, because they are narrower views of content the plain listing
 * already shows. So they carry `noindex,follow` while their canonical stays the plain listing.
 *
 * Pagination is the opposite case. `/trips?page=2` is a different page of the archive with
 * different cards, and `rel=prev/next` has been retired since 2019 — so it must be indexable
 * *and* listed in the sitemap, or nothing reaches page 3 at all.
 *
 * Both rules are asserted against the routes' real `generateMetadata`, not against a mock.
 */
import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'
import type { Metadata } from 'next'

// The listing routes import their stylesheets, which Node cannot load.
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
process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'

const { generateMetadata: tripsMetadata } = await import('@/app/(frontend)/trips/page')
const { generateMetadata: blogMetadata } = await import('@/app/(frontend)/blog/page')
const { generateMetadata: destinationsMetadata } =
  await import('@/app/(frontend)/destinations/page')

/** `generateMetadata` as the route sees a request for `search`. */
const metadataFor =
  (generate: (props: { searchParams: Promise<Record<string, string>> }) => Promise<Metadata>) =>
  (search: Record<string, string> = {}): Promise<Metadata> =>
    generate({ searchParams: Promise.resolve(search) })

const trips = metadataFor(tripsMetadata)
const blog = metadataFor(blogMetadata)
const destinations = metadataFor(destinationsMetadata)

const robotsOf = (metadata: Metadata) => metadata.robots as Record<string, unknown>
const canonicalOf = (metadata: Metadata) =>
  String((metadata.alternates as Record<string, unknown>).canonical)

test('a plain archive listing is indexable, and so is every page of it', async () => {
  for (const [route, search] of [
    ['/trips', {}],
    ['/trips?page=2', { page: '2' }],
    ['/trips?page=9', { page: '9' }],
  ] as const) {
    const metadata = await trips(search)
    assert.deepEqual(robotsOf(metadata), {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    })
    assert.equal(canonicalOf(metadata), `https://hikeglobally.com${route}`)
  }

  // `/destinations` has no facets at all — pagination is the only parameter it accepts.
  assert.deepEqual(robotsOf(await destinations({ page: '2' })), {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  })
  assert.equal(robotsOf(await destinations({ page: '2' })).index, true)
  assert.deepEqual(robotsOf(await blog({ page: '3' })).index, true)
})

test('every filtered archive URL is noindex but still followed', async () => {
  const searches: Record<string, string>[] = [
    { difficulty: 'easy' },
    { destination: 'khumbu' },
    { season: 'spring' },
    { type: 'trekking' },
    { sort: 'price-asc' },
    // A filter at its default renders exactly what the plain listing renders — still a duplicate.
    { sort: 'featured' },
    // A value the filters ignore: the URL exists, so it is kept out of the index either way.
    { difficulty: 'not-a-level' },
    {
      destination: 'khumbu',
      difficulty: 'easy',
      season: 'spring',
      type: 'trekking',
      sort: 'price-asc',
    },
    // Filtering does not stop the archive being paginated.
    { difficulty: 'easy', page: '2' },
  ]

  for (const search of searches) {
    const metadata = await trips(search)
    assert.deepEqual(
      robotsOf(metadata),
      { index: false, follow: true },
      `/trips?${new URLSearchParams(search)} should be noindex,follow`,
    )
  }

  // The blog's single facet behaves the same way.
  assert.deepEqual(robotsOf(await blog({ category: 'trekking' })), { index: false, follow: true })
  assert.deepEqual(robotsOf(await blog({ category: 'trekking', page: '2' })), {
    index: false,
    follow: true,
  })
})

test('a filtered URL still canonicalizes to the plain listing', async () => {
  // The robots meta keeps the URL out of the index; the canonical consolidates it. Together they
  // say "this is a filtered view of /trips" — never a page competing with /trips.
  assert.equal(canonicalOf(await trips({ difficulty: 'easy' })), 'https://hikeglobally.com/trips')
  assert.equal(
    canonicalOf(await trips({ difficulty: 'easy', page: '2' })),
    'https://hikeglobally.com/trips?page=2',
  )
  assert.equal(canonicalOf(await blog({ category: 'trekking' })), 'https://hikeglobally.com/blog')
})

test('a page beyond the end of an archive is a 404, not an indexable URL', async () => {
  // The routes call `notFound()` from `generateMetadata` when the page number is out of range or
  // not a number, so no metadata is ever produced for a URL that has no content.
  for (const search of [{ page: '0' }, { page: '-1' }, { page: 'two' }, { page: '1e3' }]) {
    await assert.rejects(trips(search), /NEXT_HTTP_ERROR_FALLBACK;404/)
  }
})
