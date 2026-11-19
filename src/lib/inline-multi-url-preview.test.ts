import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { createElement, type ReactNode } from 'react'
import { renderToReadableStream } from 'react-dom/server'

import { RichText } from '../components/content/rich-text'
import { MultiUrlPreviewSection } from '../components/sections/multi-url-preview-section'
import type { Blog, Setting, Trip } from '../payload-types'
import type { MultiUrlPreviewSource } from './multi-url-preview'
import { hasRichTextContent } from './rich-text-content'

// Both detail views import unrelated section CSS; markup tests do not need a CSS loader.
register(
  'data:text/javascript,' +
    encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('.css')) return { url: 'data:text/javascript,export default {}', shortCircuit: true, format: 'module' }
    return nextResolve(specifier, context)
  }
`),
)

process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'
const { PostDetail } = await import('../components/views/post-detail')
const { TripDetail } = await import('../components/views/trip-detail')
const paragraph = (text: string) => ({ type: 'paragraph', children: [{ type: 'text', text }] })
const preview = (source: MultiUrlPreviewSource) => ({
  type: 'block',
  fields: { blockType: 'multiUrlPreview', ...source },
})
const doc = (...children: unknown[]) =>
  ({
    root: {
      type: 'root',
      children,
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }) as NonNullable<Blog['content']>
const links: MultiUrlPreviewSource = {
  multiPreviewHeading: 'Keep exploring',
  multiPreviewLayout: 'slider',
  multiPreviewAnimation: 'zoom',
  multiPreviewLinks: [
    {
      linkPreviewUrl: '/resources/one',
      linkPreviewTitle: 'First resource',
      linkPreviewRating: 4.6,
      linkPreviewReviewCount: 83,
      linkPreviewPrice: 'US$ 700',
    },
    {
      linkPreviewUrl: '/resources/two',
      linkPreviewTitle: 'Second resource',
      linkPreviewDescription: 'A useful guide.',
      linkPreviewOriginalPrice: 'US$ 900',
    },
  ],
}

async function documentOf(node: ReactNode) {
  const stream = await renderToReadableStream(node)
  return new JSDOM(await new Response(stream).text()).window.document
}

test('a Multi-URL Preview can sit between paragraphs and a table without disturbing the text order', async (t) => {
  const network = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('No self-request allowed')
  })
  const content = doc(
    paragraph('Before the collection'),
    preview(links),
    paragraph('After the collection'),
    {
      type: 'table',
      children: [
        {
          type: 'tablerow',
          children: [{ type: 'tablecell', children: [paragraph('Table preserved')] }],
        },
      ],
    },
  )
  const document = await documentOf(createElement(RichText, { content }))
  assert.equal(network.mock.callCount(), 0)
  const html = document.body.innerHTML
  assert.ok(html.indexOf('Before the collection') < html.indexOf('First resource'))
  assert.ok(html.indexOf('First resource') < html.indexOf('Second resource'))
  assert.ok(html.indexOf('Second resource') < html.indexOf('After the collection'))
  assert.ok(html.indexOf('After the collection') < html.indexOf('Table preserved'))
  const collection = document.querySelector('.multi-url-preview--inline')
  assert.ok(collection)
  assert.equal(collection.getAttribute('data-layout'), 'slider')
  assert.equal(collection.getAttribute('data-animation'), 'zoom')
  assert.equal(collection.querySelector('h3')?.textContent, 'Keep exploring')
  assert.equal(collection.querySelectorAll('.link-preview-card').length, 2)
  assert.match(collection.textContent ?? '', /4\.6.*83 reviews.*US\$ 700/)
  assert.match(collection.textContent ?? '', /A useful guide/)
  assert.equal(
    hasRichTextContent(doc(preview(links))),
    true,
    'a preview-only content section is not hidden',
  )
})

test('empty, invalid and malformed collections render neither a heading nor a spacing wrapper', async () => {
  for (const source of [
    {},
    { multiPreviewLinks: [] },
    { multiPreviewHeading: 'Must stay hidden', multiPreviewLinks: [{ linkPreviewUrl: '' }] },
    {
      multiPreviewLinks: [
        { linkPreviewUrl: 'javascript:alert(1)' },
        { linkPreviewUrl: 'http://127.0.0.1' },
      ],
    },
    { multiPreviewLinks: [null, 42] } as unknown as MultiUrlPreviewSource,
  ]) {
    const content = doc(preview(source))
    assert.equal(hasRichTextContent(content), false)
    const document = await documentOf(createElement(RichText, { content }))
    assert.equal(document.querySelector('.multi-url-preview'), null)
    assert.doesNotMatch(document.body.textContent ?? '', /Must stay hidden/)
  }
})

test('single Link preview, normal formatting and the new block coexist unchanged in one editor', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response('<title>Single page</title>', { headers: { 'content-type': 'text/html' } }),
  )
  const document = await documentOf(
    createElement(RichText, {
      content: doc(
        { type: 'paragraph', children: [{ type: 'text', text: 'Bold copy', format: 1 }] },
        {
          type: 'block',
          fields: {
            blockType: 'linkPreview',
            linkPreviewUrl: '/resources/single',
            linkPreviewTitle: 'Single preview',
          },
        },
        preview(links),
        paragraph('Normal copy'),
      ),
    }),
  )
  assert.equal(document.querySelector('strong')?.textContent, 'Bold copy')
  assert.equal(document.querySelectorAll('.link-preview-card').length, 3)
  assert.equal(document.querySelectorAll('.multi-url-preview .link-preview-card').length, 2)
  assert.match(document.body.textContent ?? '', /Single preview/)
})

test('each top-level section owns its collection and headings remain escaped plain text', async () => {
  const document = await documentOf(
    createElement(MultiUrlPreviewSection, {
      source: {
        ...links,
        multiPreviewHeading: '<script>not code</script>',
        multiPreviewDescription: '<img src=x onerror=alert(1)>',
      },
    }),
  )
  const section = document.querySelector('.multi-url-preview--section')
  assert.ok(section)
  assert.equal(section.querySelector('h2')?.textContent, '<script>not code</script>')
  assert.equal(
    section.querySelector('.multi-url-preview__intro')?.textContent,
    '<img src=x onerror=alert(1)>',
  )
  assert.equal(section.querySelector('script'), null)
  assert.equal(section.querySelector('img[onerror]'), null)
})

const date = '2026-11-19T00:00:00.000Z'
const settings: Pick<Setting, 'siteName' | 'logo' | 'socials'> = { siteName: 'Test Adventures' }
const post: Blog = {
  id: 1,
  title: 'Test journal',
  slug: 'test-journal',
  excerpt: 'Field notes.',
  featuredImage: 1,
  author: 1,
  createdAt: date,
  updatedAt: date,
}
const trip: Trip = {
  id: 1,
  title: 'Test trek',
  slug: 'test-trek',
  summary: 'A week on the trail.',
  heroImage: 1,
  destination: 1,
  tripType: 'trekking',
  durationDays: 7,
  difficulty: 'moderate',
  priceFrom: 900,
  priceCurrency: 'USD',
  createdAt: date,
  updatedAt: date,
}

test('Single Blog renders inline and repeated page-section collections in the saved order', async () => {
  const document = await documentOf(
    createElement(PostDetail, {
      settings,
      related: [],
      post: {
        ...post,
        content: doc(paragraph('Body starts'), preview(links), paragraph('Body ends')),
        pageSections: [
          { kind: 'multiUrlPreview', ...links, multiPreviewHeading: 'Before the article' },
          { kind: 'content' },
          {
            kind: 'multiUrlPreview',
            ...links,
            multiPreviewHeading: 'After the article',
            multiPreviewLayout: 'list',
          },
        ],
      },
    }),
  )
  assert.deepEqual(
    [...document.querySelectorAll('.multi-url-preview__heading')].map((node) => node.textContent),
    ['Before the article', 'Keep exploring', 'After the article'],
  )
  assert.equal(document.querySelectorAll('.multi-url-preview--inline').length, 1)
  assert.equal(document.querySelectorAll('.multi-url-preview--section').length, 2)
  assert.equal(document.querySelectorAll('.link-preview-card').length, 6)
})

test('Single Trip renders Multi-URL Preview in the Essential Information accordion', async () => {
  const document = await documentOf(
    createElement(TripDetail, {
      settings,
      related: [],
      trip: {
        ...trip,
        pageSections: [
          { kind: 'information' },
          {
            kind: 'multiUrlPreview',
            ...links,
            multiPreviewHeading: 'Also worth a look',
            multiPreviewLayout: 'carousel',
            multiPreviewAnimation: 'fade',
          },
        ],
        contentSections: [
          {
            heading: 'Plan your journey',
            content: doc(
              paragraph('Pack carefully.'),
              preview(links),
              paragraph('Ask us for advice.'),
            ),
          },
        ],
      },
    }),
  )
  const embedded = document.querySelector('#essential-information .multi-url-preview--inline')
  assert.ok(embedded, 'the new block survives the real accordion rendering path')
  assert.equal(embedded.querySelector('h3')?.textContent, 'Keep exploring')
  assert.equal(embedded.querySelectorAll('.link-preview-card').length, 2)
  assert.equal(
    document.querySelector('.multi-url-preview--section')?.getAttribute('data-layout'),
    'carousel',
  )
  assert.equal(document.querySelectorAll('.link-preview-card').length, 4)
  assert.match(
    document.querySelector('#essential-information')?.textContent ?? '',
    /Pack carefully.*First resource.*Ask us for advice/s,
  )
})

test('Single Trip renders Hotels Near Destination as a separate accordion section', async () => {
  const document = await documentOf(
    createElement(TripDetail, {
      settings,
      related: [],
      trip: {
        ...trip,
        pageSections: [{ kind: 'hotelsNearDestination' }],
        hotelsNearDestination: [
          {
            heading: 'Highland Lodge',
            content: doc(paragraph('Three kilometers from the trailhead.')),
          },
        ],
      },
    }),
  )

  const section = document.querySelector('#hotels-near-destination')
  assert.ok(section)
  assert.equal(section.querySelector('h2')?.textContent, 'Hotels Near Destination')
  assert.match(
    section.querySelector('.hotels-near-destination-copy')?.textContent ?? '',
    /Three kilometers/,
  )
  assert.equal(
    section.querySelector('[data-slot="accordion-trigger"]')?.textContent?.trim(),
    'Highland Lodge',
  )
  assert.ok(document.querySelector('.trip-section-nav__link[href="#hotels-near-destination"]'))
})
