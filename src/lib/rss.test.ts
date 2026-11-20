import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import type { Payload } from 'payload'

import type { RssPost } from './rss'

process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'
const { buildRssFeed, readRssPosts, RSS_POST_LIMIT } = await import('./rss')
const { buildSitemap, EMPTY_SITEMAP_SOURCES } = await import('./sitemap')
const { isReservedPageSlug } = await import('./site-routes')
const options = { siteName: 'Hike Globally', tagline: 'Travel guides & trekking stories' }
const post = (overrides: Partial<RssPost> = {}): RssPost => ({
  title: 'A Himalayan journey', slug: 'a-journey', excerpt: 'Explore the mountain trails.',
  _status: 'published', publishedAt: '2026-04-01T08:00:00Z',
  createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-04-02T08:00:00Z', ...overrides,
})
const parse = (posts: RssPost[] = []) => new JSDOM(buildRssFeed(posts, options), { contentType: 'text/xml' }).window.document

// Parsing as XML throws immediately on unescaped ampersands or invalid XML characters.
test('RSS 2.0 has channel metadata, a self link, UTF-8 text, and well-formed escaped summaries', () => {
  const document = parse([post({ title: 'Trekking & café <tips> 🏔', excerpt: 'A <script>alert("x")</script> & a trail\u0001' })])
  assert.equal(document.querySelector('rss')?.getAttribute('version'), '2.0')
  assert.equal(document.querySelector('channel > title')?.textContent, 'Hike Globally — Blog')
  assert.equal(document.querySelector('channel > link')?.textContent, 'https://hikeglobally.com/blog')
  assert.equal(document.querySelector('channel > description')?.textContent, options.tagline)
  assert.equal(document.querySelector('language')?.textContent, 'en')
  const self = document.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0]
  assert.equal(self.getAttribute('href'), 'https://hikeglobally.com/feed.xml')
  assert.equal(self.getAttribute('rel'), 'self')
  assert.equal(self.getAttribute('type'), 'application/rss+xml')
  assert.equal(document.querySelector('item > title')?.textContent, 'Trekking & café <tips> 🏔')
  const description = document.querySelector('item > description')!
  assert.equal(description.children.length, 0)
  const html = JSDOM.fragment(description.textContent ?? '')
  assert.equal(html.querySelector('script'), null)
  assert.equal(html.textContent, 'A <script>alert("x")</script> & a trail')
})

test('items use canonical URLs and stable permalink GUIDs even after edits', () => {
  const item = parse([post({ slug: 'café & trekking/' })]).querySelector('item')!
  const url = 'https://hikeglobally.com/blog/caf%C3%A9%20%26%20trekking'
  assert.equal(item.querySelector('link')?.textContent, url)
  assert.equal(item.querySelector('guid')?.textContent, url)
  assert.equal(item.querySelector('guid')?.getAttribute('isPermaLink'), 'true')
  const edited = parse([post({ slug: 'café & trekking/', title: 'Changed', updatedAt: '2026-06-01' })])
  assert.equal(edited.querySelector('guid')?.textContent, url)
})

test('drafts, noindex posts, empty titles/slugs and duplicate URLs are excluded', () => {
  const document = parse([
    post({ _status: 'draft', slug: 'draft' }), post({ meta: { noIndex: true }, slug: 'hidden' }),
    post({ title: '  ' }), post({ slug: null }), post({ slug: '' }),
    post(), post({ slug: 'a-journey/' }),
  ])
  assert.equal(document.querySelectorAll('item').length, 1)
  assert.equal(document.querySelector('item > link')?.textContent, 'https://hikeglobally.com/blog/a-journey')
})

test('the latest 50 posts are ordered by publication date, not edit time', () => {
  const document = parse(Array.from({ length: 70 }, (_, i) => post({
    slug: `post-${i}`, publishedAt: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
  })))
  const items = [...document.querySelectorAll('item')]
  assert.equal(items.length, RSS_POST_LIMIT)
  assert.equal(items[0].querySelector('link')?.textContent, 'https://hikeglobally.com/blog/post-69')
  assert.equal(items.at(-1)?.querySelector('link')?.textContent, 'https://hikeglobally.com/blog/post-20')
})

test('publication and build dates come from records, with honest fallbacks and no clock-generated dates', () => {
  const document = parse([post()])
  assert.equal(document.querySelector('pubDate')?.textContent, 'Wed, 01 Apr 2026 08:00:00 GMT')
  assert.equal(document.querySelector('lastBuildDate')?.textContent, 'Thu, 02 Apr 2026 08:00:00 GMT')
  const fallback = parse([post({ publishedAt: 'invalid', updatedAt: null })])
  assert.equal(fallback.querySelector('pubDate')?.textContent, 'Sun, 01 Mar 2026 08:00:00 GMT')
  const missing = parse([post({ publishedAt: null, createdAt: null, updatedAt: 'broken' })])
  assert.equal(missing.querySelector('pubDate'), null)
  assert.equal(missing.querySelector('lastBuildDate'), null)
  assert.equal(parse().querySelectorAll('item').length, 0)
  assert.equal(parse().querySelector('lastBuildDate'), null)
})

test('database reader filters before limiting, uses public access, and fetches no bodies or private authors', async () => {
  const requests: Record<string, unknown>[] = []
  const payload = { find: async (query: Record<string, unknown>) => {
    requests.push(query)
    return { docs: requests.length === 1 ? [post()] : [post({ slug: 'legacy', publishedAt: null })] }
  } } as unknown as Pick<Payload, 'find'>
  const posts = await readRssPosts(payload)
  assert.equal(posts.length, 2)
  assert.equal(requests.length, 2)
  for (const [index, request] of requests.entries()) {
    assert.equal(request.collection, 'blog')
    assert.equal(request.depth, 0)
    assert.equal(request.limit, 50)
    assert.equal(request.overrideAccess, false)
    assert.deepEqual(request.sort, index === 0 ? ['-publishedAt', '-createdAt', 'id'] : ['-createdAt', 'id'])
    assert.deepEqual(request.where, { and: [
      { _status: { equals: 'published' } }, { 'meta.noIndex': { not_equals: true } },
      { publishedAt: { exists: index === 0 } },
    ] })
    assert.doesNotMatch(JSON.stringify(request.select), /content|author|email|password/)
  }
  assert.equal(parse(posts).querySelectorAll('item').length, 2)
})

test('autodiscovery lives in the root head and the feed cannot become a CMS landing-page sitemap entry', () => {
  const layout = readFileSync(new URL('../app/(frontend)/layout.tsx', import.meta.url), 'utf8')
  const head = layout.slice(layout.lastIndexOf('<head>'), layout.lastIndexOf('</head>'))
  assert.match(head, /rel="alternate"\s+type="application\/rss\+xml"/)
  assert.match(head, /href=\{absoluteUrl\(RSS_FEED_PATH\)\}/)
  assert.equal(isReservedPageSlug('feed.xml'), true)
  const sitemap = buildSitemap({ ...EMPTY_SITEMAP_SOURCES, pages: [{ slug: 'feed.xml' }] })
  assert.ok(!sitemap.some(({ url }) => url.endsWith('/feed.xml')))
  const data = readFileSync(new URL('./data.ts', import.meta.url), 'utf8')
  const reader = data.slice(data.indexOf('export const getRssPosts'), data.indexOf('export const getFeaturedPosts'))
  assert.match(reader, /CACHE_TAG.posts/)
  assert.match(reader, /\[\],/)
  assert.doesNotMatch(reader, /defaultPosts/)
})
