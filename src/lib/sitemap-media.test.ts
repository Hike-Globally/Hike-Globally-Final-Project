import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { resolveSitemap } from 'next/dist/build/webpack/loaders/metadata/resolve-route-data.js'
import type { Payload } from 'payload'
import type { Media } from '@/payload-types'

process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'
const { sitemapAssetUrl, sitemapMedia } = await import('./sitemap-media')
const { sitemapDocument, readSitemapDocuments } = await import('./sitemap-records')
const { buildSitemap, EMPTY_SITEMAP_SOURCES } = await import('./sitemap')

const origin = 'https://hikeglobally.com'
const image = (url = '/api/media/file/mountain.jpg'): Media => ({
  id: 1, alt: 'Mountain', url, mimeType: 'image/jpeg', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  sizes: { hero: { url: '/api/media/file/crop.webp' } },
})
const video = (overrides: Partial<Media> = {}): Media => ({
  ...image('/api/media/file/trek.mp4'),
  id: 2, mimeType: 'video/mp4', alt: 'A trek & a river', caption: 'Crossing <the bridge> safely.',
  videoThumbnail: image('/api/media/file/video-still.jpg'),
  ...overrides,
})

test('sitemap images use absolute originals, deduplicate, and never advertise videos, PDFs, or bare IDs as images', () => {
  assert.deepEqual(sitemapMedia([
    image(), image(), 23, null, undefined,
    { ...image('/api/media/file/guide.pdf'), mimeType: 'application/pdf' },
    video({ videoThumbnail: null }),
  ]), { images: [`${origin}/api/media/file/mountain.jpg`] })
  const cdn = 'https://cdn.example.com/original.jpg?x=1&y=2'
  assert.deepEqual(sitemapMedia([image(cdn)]).images, [cdn])
  assert.equal(sitemapAssetUrl('HTTPS://CDN.EXAMPLE.COM/photo.jpg'), 'https://cdn.example.com/photo.jpg')
  assert.equal(sitemapAssetUrl('https://old.example.com/api/media/file/photo.jpg'), `${origin}/api/media/file/photo.jpg`)
  for (const invalid of ['', 'javascript:alert(1)', 'data:image/png;base64,x', '//evil.test/x', 'https://user:pass@example.com/x', 'https://user:pass@example.com/api/media/file/x.jpg', 'not a URL']) {
    assert.equal(sitemapAssetUrl(invalid), undefined, invalid)
  }
})

test('video entries require a real title, description, public file, and populated image thumbnail', () => {
  assert.deepEqual(sitemapMedia([video(), video()]), {
    videos: [{
      title: 'A trek & a river', description: 'Crossing <the bridge> safely.',
      content_loc: `${origin}/api/media/file/trek.mp4`,
      thumbnail_loc: `${origin}/api/media/file/video-still.jpg`,
    }],
  })
  for (const overrides of [
    { alt: ' ' }, { caption: '' }, { url: null }, { url: 'javascript:alert(1)' },
    { videoThumbnail: null }, { videoThumbnail: 12 },
    { videoThumbnail: { ...image(), mimeType: 'video/mp4' } },
  ]) {
    assert.deepEqual(sitemapMedia([video(overrides)]), {})
  }
  const long = sitemapMedia([video({ alt: 'x'.repeat(120), caption: 'y'.repeat(2100) })]).videos?.[0]
  assert.equal(long?.title.length, 100)
  assert.equal(long?.description.length, 2048)
})

test('record mapping follows visible hero/gallery sections and the destination four-image limit', () => {
  const gallery = Array.from({ length: 6 }, (_, i) => ({ image: image(`/api/media/file/${i}.jpg`) }))
  const record = { slug: 'everest', heroImage: image(), featuredImage: image(), gallery }
  assert.equal(sitemapDocument(record, 'trips').images?.length, 7)
  assert.deepEqual(sitemapDocument({ ...record, pageSections: [{ kind: 'overview' }] }, 'trips').images, undefined)
  assert.equal(sitemapDocument(record, 'destinations').images?.length, 5)
  assert.equal(sitemapDocument(record, 'blog').images?.length, 1)
  assert.equal(sitemapDocument({ ...record, pageSections: [{ kind: 'content' }] }, 'blog').images, undefined)
  assert.equal(sitemapDocument({ ...record, heroImage: video() }, 'trips').videos?.length, 1)
})

test('CMS page media respects the homepage hero replacement and inquiry cutoff', () => {
  const blocks = [
    { blockType: 'hero', backgroundImage: image('/first.jpg') },
    { blockType: 'gallery', images: [{ image: image('/gallery.jpg') }] },
    { blockType: 'inquiry' },
    { blockType: 'hero', backgroundImage: image('/hidden.jpg') },
  ]
  const home = sitemapDocument({ slug: 'home', blocks }, 'pages')
  assert.deepEqual(home.images, [`${origin}/images/home/hero-bg.webp`, `${origin}/gallery.jpg`])
  const page = sitemapDocument({ slug: 'landing', blocks }, 'pages')
  assert.deepEqual(page.images, [`${origin}/first.jpg`, `${origin}/gallery.jpg`, `${origin}/hidden.jpg`])
  const entries = buildSitemap({ ...EMPTY_SITEMAP_SOURCES, pages: [home, page] })
  assert.deepEqual(entries[0].images, [`${origin}/images/home/hero-bg.webp`, `${origin}/gallery.jpg`])
  assert.ok(!entries.some(({ url }) => url === `${origin}/home`))
  assert.deepEqual(entries.find(({ url }) => url === `${origin}/landing`)?.images, page.images)
})

test('a CMS homepage with no hero does not advertise an invisible bundled photograph', () => {
  const home = sitemapDocument({ slug: 'home', blocks: [{ blockType: 'inquiry' }] }, 'pages')
  const entries = buildSitemap({ ...EMPTY_SITEMAP_SOURCES, pages: [home] })
  assert.equal(entries[0].images, undefined)
  assert.deepEqual(buildSitemap()[0].images, [`${origin}/images/home/hero-bg.webp`])
})

test('media from noindex or shadowed documents never leaks into other sitemap entries', () => {
  const hidden = sitemapDocument({ slug: 'hidden', heroImage: video(), meta: { noIndex: true } }, 'trips')
  const home = sitemapDocument({ slug: 'home', meta: { noIndex: true }, blocks: [
    { blockType: 'gallery', images: [{ image: image('/private.jpg') }] },
  ] }, 'pages')
  const xml = resolveSitemap(buildSitemap({ ...EMPTY_SITEMAP_SOURCES, trips: [hidden], pages: [home] }))
  assert.doesNotMatch(xml, /hidden|trek.mp4|private.jpg|video:video/)
})

test('the actual Next serializer produces well-formed image/video XML with text and query parameters escaped exactly once', () => {
  const uploads = [image('https://cdn.example.com/photo.jpg?x=1&y=2'), video()]
  const record = sitemapDocument({ slug: 'test', heroImage: uploads[0], gallery: [{ image: uploads[1] }] }, 'trips')
  const xml = resolveSitemap(buildSitemap({ ...EMPTY_SITEMAP_SOURCES, trips: [record] }))
  const document = new JSDOM(xml, { contentType: 'text/xml' }).window.document
  assert.equal(document.querySelector('parsererror'), null)
  assert.match(xml, /xmlns:image="http:\/\/www.google.com\/schemas\/sitemap-image\/1.1"/)
  assert.match(xml, /xmlns:video="http:\/\/www.google.com\/schemas\/sitemap-video\/1.1"/)
  assert.equal(document.getElementsByTagName('video:title')[0].textContent, 'A trek & a river')
  assert.equal(document.getElementsByTagName('video:description')[0].textContent, 'Crossing <the bridge> safely.')
  assert.ok([...document.getElementsByTagName('image:loc')].some((node) => node.textContent === uploads[0].url))
  assert.equal(document.getElementsByTagName('video:content_loc')[0].textContent, `${origin}/api/media/file/trek.mp4`)
  assert.doesNotMatch(xml, /crop.webp|rating|review/)
})

test('sitemap readers paginate published content and populate only needed media, independently of slug readers', async () => {
  const requests: Record<string, unknown>[] = []
  const payload = { find: async (args: Record<string, unknown>) => {
    requests.push(args)
    return {
      docs: [{ slug: `trip-${args.page}`, heroImage: image() }],
      hasNextPage: args.page === 1,
    }
  } } as unknown as Pick<Payload, 'find'>
  const docs = await readSitemapDocuments(payload, 'trips')
  assert.equal(docs.length, 2)
  assert.deepEqual(requests.map(({ page }) => page), [1, 2])
  for (const request of requests) {
    assert.equal(request.depth, 2)
    assert.equal(request.overrideAccess, false)
    assert.deepEqual(request.where, { _status: { equals: 'published' } })
    assert.match(JSON.stringify(request.select), /heroImage|gallery/)
    assert.match(JSON.stringify(request.populate), /videoThumbnail/)
  }
  assert.deepEqual(docs[1].images, [`${origin}/api/media/file/mountain.jpg`])
})
