/**
 * Tests for `/llms.txt`.
 *
 * The contract under test — the same one the module's own header comments promise:
 *
 *   1. the file opens with the site name as an H1 and its tagline as a blockquote, and has no empty
 *      section headings when a collection has nothing published;
 *   2. every published document appears exactly once, on one line, at the URL the page and
 *      `/sitemap.xml` call canonical;
 *   3. nothing `noindex` is advertised, and a CMS page whose slug a route owns is not listed twice;
 *   4. a trip line carries its facts (duration, type, difficulty, altitude, price) before its
 *      summary, and long or multi-line prose cannot break the list it sits in.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import type { LlmsTxtDocument, LlmsTxtSources } from './llms-txt'

// `src/lib/llms-txt.ts` reaches `src/lib/seo.ts`, which resolves the origin once at module load, so
// the environment has to be set before the (dynamic) imports below.
process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'

const { buildLlmsTxt, EMPTY_LLMS_TXT_SOURCES } = await import('./llms-txt')
const { buildSitemap } = await import('./sitemap')
const { placeCategories } = await import('./place-categories')

const ORIGIN = 'https://hikeglobally.com'
const PLACE_URLS = [
  `${ORIGIN}/places`,
  ...placeCategories.map((category) => `${ORIGIN}/places/${category.value}`),
]

const document = (overrides: Partial<LlmsTxtDocument> = {}): LlmsTxtDocument => ({
  title: 'A document',
  slug: 'a-document',
  summary: 'One line about the page.',
  noIndex: false,
  ...overrides,
})

const sources = (overrides: Partial<LlmsTxtSources> = {}): LlmsTxtSources => ({
  ...EMPTY_LLMS_TXT_SOURCES,
  ...overrides,
})

/** Every absolute URL the file offers, in the order it offers them. */
const urls = (text: string): string[] =>
  [...text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((match) => match[1])

/** The lines that are list entries, i.e. the links the file advertises. */
const entries = (text: string): string[] =>
  text.split('\n').filter((line) => line.startsWith('- ['))

/** The `## Section` bodies, keyed by heading — what a reader would skip to. */
const sections = (text: string): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const match of text.matchAll(/^## (.+)\n\n((?:- .*\n?)+)/gm)) {
    result[match[1]] = match[2].trimEnd()
  }
  return result
}

const trip = (overrides: Partial<LlmsTxtDocument> = {}): LlmsTxtDocument =>
  document({
    title: 'Everest Base Camp Trek',
    slug: 'everest-base-camp',
    summary: 'The classic Himalayan journey to the foot of the highest peak.',
    tripType: 'trekking',
    durationDays: 14,
    difficulty: 'challenging',
    maxAltitude: 5364,
    priceFrom: 1850,
    priceCurrency: 'USD',
    ...overrides,
  })

test('opens with the site name as an H1 and the tagline as a blockquote', () => {
  const text = buildLlmsTxt()
  const blocks = text.split('\n\n')

  assert.equal(blocks[0], '# Hike Globally')
  assert.equal(blocks[1], '> Trekking & expeditions in Nepal')
})

test('quotes the settings the CMS supplies, falling back to the site defaults when empty', () => {
  const custom = buildLlmsTxt(EMPTY_LLMS_TXT_SOURCES, {
    siteName: 'Hike Globally Treks',
    tagline: 'Small-group Himalayan treks since 2011',
    email: 'hello@hikeglobally.com',
  })

  assert.match(custom, /^# Hike Globally Treks$/m)
  assert.match(custom, /^> Small-group Himalayan treks since 2011$/m)
  assert.match(custom, /hello@hikeglobally\.com/)

  const blank = buildLlmsTxt(EMPTY_LLMS_TXT_SOURCES, { siteName: '  ', tagline: null })
  assert.match(blank, /^# Hike Globally$/m)
  assert.match(blank, /^> Trekking & expeditions in Nepal$/m)
})

test('lists every published document once, at its canonical URL', () => {
  const text = buildLlmsTxt(
    sources({
      trips: [trip()],
      destinations: [document({ title: 'Khumbu', slug: 'khumbu', summary: null })],
      posts: [document({ title: 'Training for altitude', slug: 'training-for-altitude' })],
      pages: [document({ title: 'Gear list', slug: 'gear-list' })],
    }),
  )

  assert.deepEqual(
    urls(text).filter((url) => /\/trips\/|\/destinations\/|\/blog\/|\/gear-list$/.test(url)),
    [
      `${ORIGIN}/trips/everest-base-camp`,
      `${ORIGIN}/destinations/khumbu`,
      `${ORIGIN}/blog/training-for-altitude`,
      `${ORIGIN}/gear-list`,
    ],
  )

  // One URL, one line: a duplicate would be a crawl list that argues with itself.
  const listed = urls(text)
  assert.equal(new Set(listed).size, listed.length)
  assert.ok(PLACE_URLS.every((url) => listed.includes(url)))
})

test('spells links the way the canonical tag and the sitemap do', () => {
  const text = buildLlmsTxt(
    sources({
      trips: [trip()],
      destinations: [document({ title: 'Khumbu', slug: 'khumbu' })],
      posts: [document({ title: 'Training for altitude', slug: 'training-for-altitude' })],
      pages: [document({ title: 'Gear list', slug: 'gear-list' })],
    }),
  )

  const sitemapUrls = new Set(
    buildSitemap({
      trips: [{ slug: 'everest-base-camp' }],
      destinations: [{ slug: 'khumbu' }],
      posts: [{ slug: 'training-for-altitude' }],
      pages: [{ slug: 'gear-list' }],
    }).map((entry) => entry.url),
  )

  // `/sitemap.xml` is not a page, so it is the one URL this file offers that the sitemap does not.
  for (const url of urls(text).filter((url) => url !== `${ORIGIN}/sitemap.xml`)) {
    assert.ok(sitemapUrls.has(url), `${url} is in llms.txt but not in the sitemap`)
  }
  assert.ok(PLACE_URLS.every((url) => sitemapUrls.has(url)))
})

test('says nothing about documents that are noindex', () => {
  const text = buildLlmsTxt(
    sources({
      trips: [trip({ noIndex: true })],
      destinations: [document({ title: 'Khumbu', slug: 'khumbu', noIndex: true })],
      posts: [document({ title: 'Hidden post', slug: 'hidden-post', noIndex: true })],
      pages: [document({ title: 'Hidden page', slug: 'hidden-page', noIndex: true })],
    }),
  )

  assert.equal(entries(text).length, entries(buildLlmsTxt()).length)
  assert.doesNotMatch(text, /everest-base-camp|khumbu|hidden-post|hidden-page/)

  // An empty collection omits its heading rather than printing a section with nothing under it.
  for (const heading of ['Trips', 'Destinations', 'Journal']) {
    assert.doesNotMatch(text, new RegExp(`^## ${heading}$`, 'm'))
  }
})

test('does not list a CMS page under a URL a dedicated route already owns', () => {
  const text = buildLlmsTxt(
    sources({
      pages: [
        document({ title: 'Home', slug: 'home' }),
        document({ title: 'Trips', slug: 'trips' }),
        document({ title: 'About', slug: 'about' }),
        document({ title: 'Places', slug: 'places' }),
        document({ title: 'Careers', slug: 'careers' }),
      ],
    }),
  )

  // `home` is served at `/` (linked in the introduction) and `trips` / `about` are real routes.
  assert.doesNotMatch(text, /\]\(https:\/\/hikeglobally\.com\/home\)/)
  assert.equal(urls(text).filter((url) => url === `${ORIGIN}/about`).length, 1)
  assert.equal(urls(text).filter((url) => url === `${ORIGIN}/trips`).length, 0)
  assert.equal(urls(text).filter((url) => url === `${ORIGIN}/places`).length, 1)
  assert.equal(urls(text).filter((url) => url === `${ORIGIN}/careers`).length, 1)
})

test('prints a trip’s facts before its summary, in a stable order', () => {
  const text = buildLlmsTxt(sources({ trips: [trip()] }))

  assert.match(
    text,
    new RegExp(
      `^- \\[Everest Base Camp Trek\\]\\(${ORIGIN}/trips/everest-base-camp\\): ` +
        'Trekking · 14 days · Challenging · max 5,364 m · from 1,850 USD — ' +
        'The classic Himalayan journey to the foot of the highest peak\\.$',
      'm',
    ),
  )
})

test('prints only the facts a document actually has', () => {
  const text = buildLlmsTxt(
    sources({
      trips: [
        trip({
          title: 'Kathmandu Valley Cultural Tour',
          slug: 'kathmandu-valley',
          tripType: 'cultural',
          durationDays: 5,
          difficulty: null,
          maxAltitude: null,
          priceFrom: null,
          priceCurrency: null,
          summary: 'Temples, courtyards and Newari kitchens.',
        }),
      ],
    }),
  )

  assert.match(
    text,
    /- \[Kathmandu Valley Cultural Tour\]\(https:\/\/hikeglobally\.com\/trips\/kathmandu-valley\): Cultural tour · 5 days — Temples, courtyards and Newari kitchens\./,
  )
  assert.doesNotMatch(text, /·\s*·/)
})

test('orders each section by title, whatever order the database returns rows in', () => {
  const text = buildLlmsTxt(
    sources({
      trips: [
        trip({ title: 'Langtang Valley', slug: 'langtang-valley' }),
        trip({ title: 'Annapurna Base Camp', slug: 'annapurna-base-camp' }),
        trip({ title: 'Everest Base Camp Trek', slug: 'everest-base-camp' }),
      ],
    }),
  )

  assert.deepEqual(
    entries(sections(text).Trips).map((line) => line.slice(3, line.indexOf(']'))),
    ['Annapurna Base Camp', 'Everest Base Camp Trek', 'Langtang Valley'],
  )
})

test('keeps every entry on one line, however the copy was written', () => {
  const text = buildLlmsTxt(
    sources({
      trips: [
        trip({
          title: 'Annapurna [North] Base Camp',
          summary:
            'A line\n\nwith a blank line in it, and a second sentence that goes on and on. ' +
            'It keeps going well past two hundred characters so the file cannot print a whole ' +
            'paragraph per trip — an index, not an article — and still leaves room for the facts ' +
            'that came before it on the same line.',
        }),
      ],
    }),
  )

  const line = entries(text)[0]
  assert.match(
    line,
    /^- \[Annapurna \\\[North\\\] Base Camp\]\(https:\/\/hikeglobally\.com\/trips\/everest-base-camp\): Trekking · 14 days/,
  )
  // Brackets in the title cannot end the link early or turn the note into a broken glyph.
  assert.match(line, /\\\[North\\\]/)
  assert.ok(line.includes(' — '))
  assert.ok(line.length < 400, `entry is too long: ${line.length} characters`)
  assert.ok(line.endsWith('…'), 'a long summary is truncated, not printed whole')
  assert.doesNotMatch(text, /\n\n\n/)
})

test('still answers with a truthful file when nothing is published', () => {
  const text = buildLlmsTxt()

  // The introduction points at the homepage; the static pages exist without a CMS document.
  assert.match(text, /lives at https:\/\/hikeglobally\.com:/)
  assert.match(text, /\[Contact\]\(https:\/\/hikeglobally\.com\/contact\)/)
  assert.match(text, /\[About Hike Globally\]\(https:\/\/hikeglobally\.com\/about\)/)
  assert.match(text, /\[Sitemap\]\(https:\/\/hikeglobally\.com\/sitemap\.xml\)/)
  assert.match(text, /^## Places$/m)
  assert.equal(entries(sections(text).Places).length, PLACE_URLS.length)
  assert.ok(PLACE_URLS.every((url) => text.includes(`](${url})`)))

  assert.doesNotMatch(text, /^## (Trips|Destinations|Journal)$/m)
  assert.match(text, /^## Pages$/m)
  assert.match(text, /^## Optional$/m)

  // A well-formed Markdown file: one trailing newline, no empty headings, blank line after each.
  assert.ok(text.endsWith('\n'))
  assert.ok(!text.endsWith('\n\n'))
  assert.doesNotMatch(text, /^## .*\n(?!\n)/m)
})

test('mentions the contact form, and the address only when there is one', () => {
  const withoutEmail = buildLlmsTxt()
  assert.match(withoutEmail, /use the form at https:\/\/hikeglobally\.com\/contact\./)
  assert.doesNotMatch(withoutEmail, /write to/)

  const withEmail = buildLlmsTxt(EMPTY_LLMS_TXT_SOURCES, { email: 'hello@hikeglobally.com' })
  assert.match(withEmail, /write to hello@hikeglobally\.com\./)
})
