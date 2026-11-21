import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { JSDOM } from 'jsdom'

import { Blog } from '../collections/Blog'
import { Trips } from '../collections/Trips'
import { RichText } from '../components/content/rich-text'
import { inlineBoxedContentBlock } from '../fields/content-editor'
import { getArticleHeadings } from './article-headings'
import { lexicalToPlainText, readingTimeMinutes } from './format'
import { hasRichTextContent } from './rich-text-content'

const paragraph = (text: string) => ({ type: 'paragraph', children: [{ type: 'text', text }] })
const boxedContent = (fields: Record<string, unknown>) => ({
  type: 'block',
  fields: { blockType: 'boxedContent', ...fields },
})
const doc = (...children: unknown[]) => ({ root: { children } })

const image = {
  id: 42,
  alt: 'A quiet mountain pass at sunrise',
  url: '/api/media/file/mountain-pass.jpg',
  mimeType: 'image/jpeg',
  width: 1600,
  height: 1200,
  updatedAt: '2026-11-21T00:00:00.000Z',
  createdAt: '2026-11-21T00:00:00.000Z',
}

async function render(content: unknown, headingIds?: readonly string[]) {
  const stream = await renderToReadableStream(createElement(RichText, { content, headingIds }))
  return new JSDOM(await new Response(stream).text()).window.document
}

test('Boxed Content is available in the shared Trip and Blog rich-text editor', () => {
  assert.equal(inlineBoxedContentBlock.slug, 'boxedContent')
  assert.equal(inlineBoxedContentBlock.labels?.singular, 'Boxed Content')

  const fields = inlineBoxedContentBlock.fields
  for (const name of ['heading', 'description', 'image']) {
    assert.ok(
      fields.some((field) => 'name' in field && field.name === name),
      name,
    )
  }

  const heading = fields.find((field) => 'name' in field && field.name === 'heading')
  const description = fields.find((field) => 'name' in field && field.name === 'description')
  const upload = fields.find((field) => 'name' in field && field.name === 'image')
  assert.ok(heading?.type === 'text' && heading.required)
  assert.ok(description?.type === 'textarea' && description.required)
  assert.ok(upload?.type === 'upload' && upload.required)
  assert.equal(upload.relationTo, 'media')
  assert.deepEqual(upload.filterOptions, { mimeType: { contains: 'image/' } })

  const blogBody = Blog.fields.find((field) => 'name' in field && field.name === 'content')
  const tripOverview = Trips.fields.find((field) => 'name' in field && field.name === 'description')
  assert.ok(blogBody?.type === 'richText' && blogBody.editor)
  assert.ok(tripOverview?.type === 'richText' && tripOverview.editor)
})

test('Boxed Content renders an accessible image-left / copy-right feature in document order', async () => {
  const content = doc(
    paragraph('Before the feature'),
    boxedContent({
      heading: 'A slower way to the summit',
      description: 'Take the high trail.\nPause where the valley opens.',
      image,
    }),
    paragraph('After the feature'),
  )
  const headingIds = getArticleHeadings(content).map(({ id }) => id)
  const document = await render(content, headingIds)

  const feature = document.querySelector<HTMLElement>('[data-boxed-content]')
  assert.ok(feature)
  const title = feature.querySelector('h2')
  assert.equal(title?.textContent, 'A slower way to the summit')
  assert.equal(title?.id, 'story-a-slower-way-to-the-summit')
  assert.equal(
    feature.querySelector('p')?.textContent,
    'Take the high trail.\nPause where the valley opens.',
  )
  assert.equal(
    feature.querySelector('.boxed-content__media img')?.getAttribute('alt'),
    'A quiet mountain pass at sunrise',
  )
  assert.equal(
    feature
      .querySelector('.boxed-content__frame')
      ?.firstElementChild?.className.includes('boxed-content__media'),
    true,
  )
  assert.equal(
    feature
      .querySelector('.boxed-content__frame')
      ?.lastElementChild?.className.includes('boxed-content__copy'),
    true,
  )
  assert.ok(feature.getAttribute('aria-labelledby'))
  assert.ok(
    (document.body.textContent ?? '').indexOf('Before the feature') <
      (document.body.textContent ?? '').indexOf('A slower way to the summit'),
  )
  assert.ok(
    (document.body.textContent ?? '').indexOf('A slower way to the summit') <
      (document.body.textContent ?? '').indexOf('After the feature'),
  )
})

test('Boxed Content participates in article outlines, reading time, SEO text and content visibility', () => {
  const content = doc(
    { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Approach' }] },
    boxedContent({
      heading: 'The final ridge',
      description: 'Move steadily and leave no trace.',
      image,
    }),
    { type: 'heading', tag: 'h3', children: [{ type: 'text', text: 'On the way down' }] },
  )

  assert.deepEqual(
    getArticleHeadings(content).map(({ label, level }) => ({ label, level })),
    [
      { label: 'Approach', level: 2 },
      { label: 'The final ridge', level: 2 },
      { label: 'On the way down', level: 3 },
    ],
  )
  assert.equal(
    lexicalToPlainText(content),
    'Approach The final ridge Move steadily and leave no trace. On the way down',
  )
  assert.equal(readingTimeMinutes(content), 1)
  assert.equal(hasRichTextContent(doc(boxedContent({}))), false)
  assert.equal(hasRichTextContent(doc(boxedContent({ image }))), false)
  assert.equal(hasRichTextContent(doc(boxedContent({ description: 'A real feature.' }))), true)
})
