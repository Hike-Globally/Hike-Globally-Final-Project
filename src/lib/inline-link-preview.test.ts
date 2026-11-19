import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToReadableStream } from 'react-dom/server'

import { RichText } from '../components/content/rich-text'
import { Blog } from '../collections/Blog'
import { Trips } from '../collections/Trips'
import { inlineLinkPreviewBlock } from '../fields/content-editor'
import { hasRichTextContent } from './rich-text-content'
import { validateLinkPreviewUrl } from './link-preview'

const paragraph = (text: string) => ({ type: 'paragraph', children: [{ type: 'text', text }] })
const preview = (url: string, extras: Record<string, unknown> = {}) => ({
  type: 'block',
  fields: { blockType: 'linkPreview', linkPreviewUrl: url, ...extras },
})
const doc = (...children: unknown[]) => ({ root: { children } })

async function render(content: unknown) {
  const stream = await renderToReadableStream(createElement(RichText, { content }))
  return new Response(stream).text()
}

test('Blog body and Trip information panels use the shared content editor', () => {
  const blogContent = Blog.fields.find((field) => 'name' in field && field.name === 'content')
  assert.ok(blogContent && blogContent.type === 'richText' && blogContent.editor)
  const panel = Trips.fields.find(
    (field) => field.type === 'collapsible' && field.label === 'Essential Information',
  )
  assert.ok(panel && panel.type === 'collapsible')
  const sections = panel.fields.find((field) => 'name' in field && field.name === 'contentSections')
  assert.ok(sections && sections.type === 'array')
  assert.deepEqual(sections.labels, {
    singular: 'Essential Information section',
    plural: 'Essential Information sections',
  })
  const content = sections.fields.find((field) => 'name' in field && field.name === 'content')
  assert.ok(content && content.type === 'richText' && content.editor)

  const hotelsPanel = Trips.fields.find(
    (field) => field.type === 'collapsible' && field.label === 'Hotels Near Destination',
  )
  assert.ok(hotelsPanel && hotelsPanel.type === 'collapsible')
  const hotels = hotelsPanel.fields.find(
    (field) => 'name' in field && field.name === 'hotelsNearDestination',
  )
  assert.ok(hotels && hotels.type === 'array')
  assert.deepEqual(hotels.labels, { singular: 'Hotel', plural: 'Hotels' })
  const hotelContent = hotels.fields.find((field) => 'name' in field && field.name === 'content')
  assert.ok(hotelContent && hotelContent.type === 'richText' && hotelContent.editor)

  assert.equal(inlineLinkPreviewBlock.slug, 'linkPreview')
  const url = inlineLinkPreviewBlock.fields[0]
  assert.ok(url.type === 'text' && !url.admin?.condition && url.validate)
  assert.equal(url.validate, validateLinkPreviewUrl)
})

test('preview cards remain in content order, reuse metadata and respect overrides', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(
      '<html><head><meta property="og:title" content="Page title"><meta property="og:description" content="Page summary"><meta property="og:image" content="https://example.com/photo.jpg"></head></html>',
      { headers: { 'content-type': 'text/html' } },
    )
  try {
    const html = await render(
      doc(
        paragraph('Before'),
        preview('https://example.com/one', { linkPreviewPrice: '$100', linkPreviewRating: 4.5 }),
        paragraph('Between'),
        preview('https://example.com/two', { linkPreviewTitle: 'Custom title' }),
        paragraph('After'),
      ),
    )
    assert.ok(html.indexOf('Before') < html.indexOf('Page title'))
    assert.ok(html.indexOf('Page title') < html.indexOf('Between'))
    assert.ok(html.indexOf('Between') < html.indexOf('Custom title'))
    assert.ok(html.indexOf('Custom title') < html.indexOf('After'))
    assert.equal((html.match(/class="link-preview-card"/g) ?? []).length, 2)
    assert.match(html, /Page summary/)
    assert.match(html, /\$100/)
    assert.match(html, /4\.5/)
    assert.match(html, /target="_blank" rel="noopener noreferrer"/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('empty, invalid and unknown blocks do not render a card', async () => {
  const content = doc(preview(''), preview('javascript:alert(1)'), {
    type: 'block',
    fields: { blockType: 'other' },
  })
  const html = await render(content)
  assert.doesNotMatch(html, /link-preview-card|javascript:/)
  assert.equal(hasRichTextContent(doc(preview(''))), false)
  assert.equal(hasRichTextContent(doc(preview('https://example.com'))), true)
})
