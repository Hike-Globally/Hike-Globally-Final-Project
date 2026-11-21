import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createElement } from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { JSDOM } from 'jsdom'

import config from '../payload.config'
import { Blog } from '../collections/Blog'
import { Destinations } from '../collections/Destinations'
import { Pages } from '../collections/Pages'
import { Trips } from '../collections/Trips'
import { RichText } from '../components/content/rich-text'
import { EssentialInformationSection } from '../components/sections/essential-information-section'
import { inlineBoxedContentBlock } from '../fields/content-editor'
import type { Trip } from '../payload-types'
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
  sizes: {
    thumbnail: { url: '/api/media/file/mountain-pass-400x300.jpg', width: 400, height: 300 },
    card: { url: '/api/media/file/mountain-pass-1024x768.jpg', width: 1024, height: 768 },
  },
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

/**
 * Every rich-text field in the project — in every collection, every global and every block —
 * must offer Boxed Content.
 *
 * This is the regression that matters, and it has two halves.
 *
 * 1. A rich-text field may pass the shared editor explicitly. If it does not, Payload falls back
 *    to the root editor in `payload.config.ts`. The two used to be *different* editors: the root
 *    one had no `BlocksFeature` at all. A field that forgot `editor: contentEditor()` therefore
 *    lost the entire block menu with no error anywhere — the ribbon just quietly had no blocks
 *    dropdown — which is exactly how Boxed Content went missing from some editors while showing
 *    up in others. The config now points the root editor at the shared editor, so there is one
 *    definition and no reduced fallback to fall into.
 * 2. The blocks offered have to be the shared editor's blocks. Blocks are declared on the
 *    feature's `serverFeatureProps` and, once Payload sanitises the editor, copied onto
 *    `sanitizedServerFeatureProps`. Reading only the former is how an audit script can report
 *    "no blocks" for a field whose ribbon plainly has them, so both shapes are accepted here.
 *
 * The walk covers collections, globals and page-builder blocks — the destination copy, the
 * audience panels and the Pages rich-text block were all outside the old Trips/Blog-only walk.
 */
test('every rich-text field in the project offers Boxed Content', async () => {
  // `buildConfig` returns a promise, so the root-editor check below has to await it.
  const appConfig = await config
  const blockSlugsFromProps = (props: unknown): string[] => {
    const blocks = (props as { blocks?: { slug?: unknown }[] } | undefined)?.blocks
    return Array.isArray(blocks) ? blocks.map((block) => String(block?.slug)) : []
  }

  const blockSlugs = (editor: unknown): string[] => {
    if (!editor || typeof editor !== 'object') return []
    const candidate = editor as {
      features?: unknown
      editorConfig?: { resolvedFeatureMap?: Map<string, { sanitizedServerFeatureProps?: unknown }> }
    }

    // A sanitised editor has already resolved its features into a lazy factory's payload.
    const resolved = candidate.editorConfig?.resolvedFeatureMap
    if (resolved) {
      return blockSlugsFromProps(resolved.get('blocks')?.sanitizedServerFeatureProps)
    }

    // Two shapes appear here, and both must work. A *field* editor is a lazy `lexicalEditor()`
    // factory whose `features` is still a function; the *root* editor in `payload.config.ts` has
    // already been invoked by `buildConfig`, so its `features` is the resolved array. Reading only
    // one of them reports "no blocks" for a ribbon that plainly has them.
    const source = candidate.features
    if (typeof source !== 'function' && !Array.isArray(source)) return []
    const features = Array.isArray(source)
      ? source
      : (source as (args: { defaultFeatures: unknown[]; rootFeatures: unknown[] }) => unknown[])({
          defaultFeatures: [],
          rootFeatures: [],
        })
    if (!Array.isArray(features)) return []
    const blocks = features.find((feature) => (feature as { key?: string }).key === 'blocks')
    return blockSlugsFromProps(
      (blocks as { serverFeatureProps?: unknown } | undefined)?.serverFeatureProps,
    )
  }

  const richTextFields: { path: string; editor: unknown }[] = []
  const walk = (fields: readonly unknown[] | undefined, path: string) => {
    for (const field of (fields ?? []) as {
      type?: string
      name?: string
      label?: unknown
      fields?: unknown[]
      blocks?: unknown[]
    }[]) {
      if (!field || typeof field !== 'object') continue
      const name =
        field.name ?? (typeof field.label === 'string' ? field.label : undefined) ?? field.type
      const next = `${path} › ${name}`
      if (field.type === 'richText') {
        richTextFields.push({ path: next, editor: (field as { editor?: unknown }).editor })
      }
      if (Array.isArray(field.fields)) walk(field.fields, next)
      if (field.type === 'blocks' && Array.isArray(field.blocks)) {
        for (const block of field.blocks as { slug?: string; fields?: unknown[] }[]) {
          walk(block?.fields, `${next} › [${block?.slug ?? 'block'}]`)
        }
      }
    }
  }

  const rootEditor = appConfig.editor
  walk(Blog.fields, 'blog')
  walk(Trips.fields, 'trips')
  walk(Destinations.fields, 'destinations')
  walk(Pages.fields, 'pages')
  for (const global of appConfig.globals ?? []) walk(global.fields, `global:${global.slug}`)
  for (const block of appConfig.blocks ?? []) walk(block.fields, `block:[${block.slug}]`)

  // The fallback itself must be the shared editor: a field that omits `editor` gets this one.
  assert.ok(
    blockSlugs(rootEditor).includes('boxedContent'),
    `the root editor in payload.config.ts does not offer Boxed Content (blocks: ${
      blockSlugs(rootEditor).join(', ') || 'none'
    })`,
  )

  assert.ok(richTextFields.length >= 8, 'expected the trip, post, destination and page editors')
  const rootSlugs = blockSlugs(rootEditor)
  for (const { path, editor } of richTextFields) {
    // A field that omits the editor inherits the root one, so that is what it must be judged
    // against. Checking only the fields that pass an editor would let a field that quietly fell
    // back to a reduced root editor pass — which is precisely the bug this test exists for.
    const slugs = editor ? blockSlugs(editor) : rootSlugs
    assert.ok(
      slugs.includes('boxedContent'),
      `${path} does not offer Boxed Content (blocks: ${slugs.join(', ') || 'none'})`,
    )
  }
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
  const photo = feature.querySelector('.boxed-content__media img')
  assert.equal(photo?.getAttribute('alt'), 'A quiet mountain pass at sunrise')
  // Boxed Content serves the untouched original upload directly rather than
  // routing through `/_next/image` downscaling or q=75 recompression.
  assert.equal(photo?.getAttribute('src'), '/api/media/file/mountain-pass.jpg')
  assert.equal(photo?.getAttribute('srcset'), null)
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

test('Boxed Content distinguishes media vs copy-only frames and renders cleanly inside Trip Content Sections', async () => {
  const sections = [
    {
      id: 'acclimatisation',
      heading: 'Acclimatisation and pacing',
      content: doc(
        boxedContent({
          heading: 'Rest day in Namche',
          description: 'Climb high to Everest View Hotel, then sleep lower in the amphitheatre.',
          image,
        }),
        boxedContent({
          heading: 'Hydration on the trail',
          description: 'Drink three to four litres daily above 3,000 metres.',
        }),
      ),
    },
  ] as unknown as NonNullable<Trip['contentSections']>

  const stream = await renderToReadableStream(
    createElement(EssentialInformationSection, {
      title: 'Essential Information',
      sections,
    }),
  )
  const document = new JSDOM(await new Response(stream).text()).window.document
  const features = document.querySelectorAll<HTMLElement>('[data-boxed-content]')
  assert.equal(features.length, 2)

  const withMediaFrame = features[0]?.querySelector('.boxed-content__frame')
  const withoutMediaFrame = features[1]?.querySelector('.boxed-content__frame')
  assert.equal(withMediaFrame?.classList.contains('boxed-content__frame--with-media'), true)
  assert.equal(withoutMediaFrame?.classList.contains('boxed-content__frame--with-media'), false)
  assert.equal(withoutMediaFrame?.querySelector('.boxed-content__media'), null)

  // Inside Essential Information accordions, Boxed Content headings step down to H3 subheadings.
  const subheadings = Array.from(features).map((item) => item.querySelector('h3')?.textContent)
  assert.deepEqual(subheadings, ['Rest day in Namche', 'Hydration on the trail'])
})

test('Boxed Content CSS uses an alluring alpine-twilight surface with WCAG AA/AAA contrast, ungraded original photos, container-query responsiveness, and zero-gap geometry', () => {
  const globalsCss = readFileSync(new URL('../app/(frontend)/globals.css', import.meta.url), 'utf8')

  const channel = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const luminance = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    return (
      0.2126 * channel((n >> 16) & 255) +
      0.7152 * channel((n >> 8) & 255) +
      0.0722 * channel(n & 255)
    )
  }
  const contrast = (a: string, b: string) => {
    const l1 = luminance(a)
    const l2 = luminance(b)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }

  const token = (name: string) =>
    globalsCss.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))?.[1]

  const surface = token('boxed-surface')
  const surfaceDeep = token('boxed-surface-deep')
  const surfaceMid = token('boxed-surface-mid')
  const surfaceLit = token('boxed-surface-lit')
  const glow = token('boxed-glow')
  const title = token('boxed-title')
  const copy = token('boxed-copy')
  const accent = token('boxed-accent')

  assert.ok(surface && surfaceDeep && surfaceMid && surfaceLit && glow && title && copy && accent)
  for (const bg of [surface, surfaceDeep, surfaceMid, surfaceLit, glow]) {
    assert.ok(contrast(title, bg) >= 4.5, `title meets WCAG AA on ${bg}`)
    assert.ok(contrast(copy, bg) >= 4.5, `description meets WCAG AA on ${bg}`)
    assert.ok(contrast(accent, bg) >= 3, `accent rule meets 3:1 on ${bg}`)
  }

  const boxedStart = globalsCss.indexOf('.boxed-content {')
  assert.ok(boxedStart !== -1, 'expected .boxed-content styles in globals.css')
  const boxedSection = globalsCss.slice(
    boxedStart,
    globalsCss.indexOf('Single pages — running copy', boxedStart),
  )

  // Layered alpine-twilight surface, ungraded original photo & container-driven responsiveness
  assert.match(boxedSection, /background-color:\s*var\(--color-boxed-surface\)/)
  assert.match(boxedSection, /linear-gradient\(/)
  assert.match(boxedSection, /radial-gradient\(/)
  assert.match(boxedSection, /\.boxed-content__photo\s*\{\s*filter:\s*none;/)
  assert.match(boxedSection, /container:\s*boxed-content\s*\/\s*inline-size/)
  assert.match(boxedSection, /@container boxed-content\s*\(min-width:\s*34rem\)/)

  // Zero-gap geometry: no forced 1:1 square on side-by-side media, no 16ch title cap,
  // copy-only cards stay single-column, and outer margins collapse cleanly in content sections.
  assert.doesNotMatch(boxedSection, /aspect-ratio:\s*1\s*\/\s*1/)
  assert.doesNotMatch(boxedSection, /max-width:\s*16ch/)
  assert.match(boxedSection, /\.boxed-content__frame--with-media\s*\{/)
  assert.match(
    boxedSection,
    /\.boxed-content__frame--with-media\s+\.boxed-content__media\s*\{[\s\S]*?aspect-ratio:\s*auto;[\s\S]*?height:\s*100%;/,
  )
  assert.match(boxedSection, /\.boxed-content:first-child\s*\{\s*margin-block-start:\s*0;/)
  assert.match(boxedSection, /\.boxed-content:last-child\s*\{\s*margin-block-end:\s*0;/)
  assert.match(
    boxedSection,
    /\.boxed-content\s*\+\s*\.boxed-content\s*\{\s*margin-block-start:\s*1rem;/,
  )
})
