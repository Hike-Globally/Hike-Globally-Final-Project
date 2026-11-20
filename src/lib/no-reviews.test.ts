import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

import { Pages } from '../collections/Pages'
import { linkPreviewSectionFields } from '../fields/link-preview'
import { multiUrlPreviewFields } from '../fields/multi-url-preview'
import { inlineLinkPreviewBlock, inlineMultiUrlPreviewBlock } from '../fields/content-editor'
import { resolveLinkPreview } from './link-preview'
import { normalizeMultiUrlPreview } from './multi-url-preview'

test('the CMS no longer registers a Testimonials block', () => {
  const blocks = Pages.fields.find((field) => 'name' in field && field.name === 'blocks')
  assert.ok(blocks && blocks.type === 'blocks')
  assert.ok(blocks.blocks.length > 0)
  assert.ok(blocks.blocks.every((block) => block.slug !== 'testimonials'))
  assert.equal(existsSync(new URL('../blocks/Testimonials.ts', import.meta.url)), false)
  assert.equal(existsSync(new URL('../components/blocks/testimonials.tsx', import.meta.url)), false)
})

test('layout and inline link-card editors expose prices but no rating or review fields', () => {
  for (const fields of [
    linkPreviewSectionFields(),
    multiUrlPreviewFields(),
    inlineLinkPreviewBlock.fields,
    inlineMultiUrlPreviewBlock.fields,
  ]) {
    const schema = JSON.stringify(fields)
    assert.match(schema, /linkPreviewPrice/)
    assert.doesNotMatch(schema, /linkPreviewRating|linkPreviewReviewCount/)
  }
})

test('legacy saved card ratings are discarded by single and multi-link resolvers', async () => {
  const legacy = {
    linkPreviewUrl: 'https://example.com/trip',
    linkPreviewTitle: 'A trip',
    linkPreviewRating: 4.9,
    linkPreviewReviewCount: 200,
    linkPreviewPrice: '$700',
  }
  const card = await resolveLinkPreview(legacy, { metadata: async () => null })
  assert.ok(card)
  assert.equal(card.price, '$700')
  assert.doesNotMatch(JSON.stringify(card), /rating|reviewCount/i)
  const normalized = normalizeMultiUrlPreview({ multiPreviewLinks: [legacy] })
  assert.equal(normalized.links[0].linkPreviewPrice, '$700')
  assert.doesNotMatch(JSON.stringify(normalized), /linkPreviewRating|linkPreviewReviewCount/)
})

test('generated CMS types, seed content and SEO builders contain no review feature', () => {
  const types = readFileSync(new URL('../payload-types.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(types, /TestimonialsBlock|linkPreviewRating|linkPreviewReviewCount/)
  const seed = readFileSync(new URL('../scripts/seed.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(seed, /testimonials|Average rating|verified reviews/)
  const seo = readFileSync(new URL('./seo.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(seo, /['"]@type['"]:\s*['"](?:Review|AggregateRating)['"]|['"](?:aggregateRating|reviewRating|review)['"]\s*:/)
})
