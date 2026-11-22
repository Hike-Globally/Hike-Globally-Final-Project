import assert from 'node:assert/strict'
import test from 'node:test'
import type { Field } from 'payload'

import { Blog } from '../collections/Blog'
import { Trips } from '../collections/Trips'
import { inlineLinkPreviewBlock, inlineMultiUrlPreviewBlock } from '../fields/content-editor'
import { multiUrlPreviewFields, validateMultiPreviewImageUrl } from '../fields/multi-url-preview'
import { pageSectionsField } from '../fields/page-sections'
import {
  MAX_PREVIEW_LINKS,
  MULTI_URL_PREVIEW_NAME,
  multiPreviewAnimations,
  multiPreviewKeyframes,
  multiPreviewLayouts,
  nearestPreviewIndex,
  normalizeMultiUrlPreview,
  validateMultiPreviewUrl,
  type MultiUrlPreviewSource,
} from './multi-url-preview'
import {
  blogSectionOptions,
  defaultPageSections,
  resolvePageSections,
  resolveSectionContent,
  tripSectionOptions,
  validatePageSections,
  type PageSection,
} from './page-sections'

// Collapsibles and rows expose their children through `fields`; the redesigned admin deliberately
// uses those presentational wrappers instead of tabs, so the persisted schema stays flat.
const flatten = (fields: Field[]): Field[] =>
  fields.flatMap((field) => [field, ...('fields' in field ? flatten(field.fields) : [])])

const isCollapsible = (field: Field): field is Extract<Field, { type: 'collapsible' }> =>
  field.type === 'collapsible'

test('the exact Multi-URL Preview name is available on both detail pages and in the block menu', () => {
  assert.equal(MULTI_URL_PREVIEW_NAME, 'Multi-URL Preview')
  for (const options of [tripSectionOptions, blogSectionOptions]) {
    assert.equal(
      options.find(({ value }) => value === 'multiUrlPreview')?.label,
      MULTI_URL_PREVIEW_NAME,
    )
    assert.ok(
      options.some(({ value }) => value === 'linkPreview'),
      'single preview is not replaced',
    )
    assert.ok(
      !defaultPageSections(options).some(({ kind }) => kind === 'multiUrlPreview'),
      'opt-in; legacy layouts are unchanged',
    )
  }
  assert.equal(inlineMultiUrlPreviewBlock.slug, 'multiUrlPreview')
  assert.equal(inlineMultiUrlPreviewBlock.labels?.singular, MULTI_URL_PREVIEW_NAME)
  assert.equal(inlineLinkPreviewBlock.slug, 'linkPreview')
})

test('a page can repeat and reorder independent collections without duplicating built-in content', () => {
  const sections: PageSection[] = [
    { kind: 'hero' },
    { id: 'one', kind: 'multiUrlPreview', multiPreviewLinks: [{ linkPreviewUrl: '/blog/a' }] },
    { kind: 'html', html: '<p>Between collections</p>' },
    { id: 'two', kind: 'multiUrlPreview', multiPreviewLinks: [{ linkPreviewUrl: '/blog/b' }] },
    { kind: 'multiUrlPreview' },
  ]
  const content = {
    multiUrlPreview: (row: PageSection) => row.multiPreviewLinks?.[0]?.linkPreviewUrl,
  }
  for (const options of [tripSectionOptions, blogSectionOptions]) {
    assert.equal(validatePageSections(sections), true)
    assert.deepEqual(resolvePageSections(sections, options), sections)
    assert.equal(resolveSectionContent(content, sections[1]), '/blog/a')
    assert.equal(resolveSectionContent(content, sections[3]), '/blog/b')
  }
  assert.equal(typeof validatePageSections([...sections, { kind: 'hero' }]), 'string')
})

test('page-section and inline fields share the layouts, animations and per-URL overrides', () => {
  const fields = multiUrlPreviewFields()
  const blockFields = multiUrlPreviewFields({ conditional: false })
  const names = (value: Field[]) =>
    flatten(value).flatMap((field) => ('name' in field ? [field.name] : []))
  assert.deepEqual(names(fields), names(blockFields))
  for (const value of [fields, blockFields]) {
    const controls = flatten(value)
    for (const name of [
      'linkPreviewUrl',
      'linkPreviewTitle',
      'linkPreviewDescription',
      'linkPreviewPrice',
      'linkPreviewOriginalPrice',
      'linkPreviewImage',
      'linkPreviewImageUrl',
    ]) {
      assert.ok(
        controls.some((field) => 'name' in field && field.name === name),
        name,
      )
    }
    const upload = controls.find((field) => 'name' in field && field.name === 'linkPreviewImage')
    assert.ok(upload?.type === 'upload')
    assert.equal(upload.relationTo, 'media')
    const imageUrl = controls.find(
      (field) => 'name' in field && field.name === 'linkPreviewImageUrl',
    )
    assert.ok(imageUrl?.type === 'text')
    assert.equal(imageUrl.validate, validateMultiPreviewImageUrl)
    const layout = controls.find((field) => 'name' in field && field.name === 'multiPreviewLayout')
    assert.ok(layout?.type === 'select')
    assert.deepEqual(layout.options, multiPreviewLayouts)
    const motion = controls.find(
      (field) => 'name' in field && field.name === 'multiPreviewAnimation',
    )
    assert.ok(motion?.type === 'select')
    assert.deepEqual(motion.options, multiPreviewAnimations)
  }
  assert.equal(multiPreviewLayouts.length, 3)
  assert.equal(multiPreviewAnimations.filter(({ value }) => value !== 'none').length, 5)
  assert.equal(validateMultiPreviewImageUrl('https://images.example.com/card.webp'), true)
  assert.equal(validateMultiPreviewImageUrl('/media/card.webp'), true)
  assert.equal(typeof validateMultiPreviewImageUrl('http://127.0.0.1/photo.jpg'), 'string')
  assert.equal(typeof validateMultiPreviewImageUrl('javascript:alert(1)'), 'string')
})

test('the admin starts with compact collapsed groups and a direct URL field in every row', () => {
  for (const fields of [multiUrlPreviewFields(), multiUrlPreviewFields({ conditional: false })]) {
    const sectionGroups = flatten(fields)
      .filter(isCollapsible)
      .filter(({ label }) => label !== 'Optional card details')
    assert.deepEqual(
      sectionGroups.map(({ label }) => label),
      ['Heading & intro', 'Layout & motion'],
    )
    for (const group of sectionGroups) assert.equal(group.admin?.initCollapsed, true)

    const links = fields.find((field) => 'name' in field && field.name === 'multiPreviewLinks')
    assert.ok(links?.type === 'array')
    assert.equal(links.admin?.initCollapsed, true)

    const url = links.fields.find(
      (field) => 'name' in field && field.name === 'linkPreviewUrl',
    )
    assert.ok(url?.type === 'text')
    const rowGroups = flatten(links.fields).filter(isCollapsible)
    assert.deepEqual(
      rowGroups.map(({ label }) => label),
      ['Optional card details'],
    )
    for (const group of rowGroups) assert.equal(group.admin?.initCollapsed, true)

    // The upload picker must not share a half-width row with the image URL.
    const upload = rowGroups[0].fields.find(
      (field) => 'name' in field && field.name === 'linkPreviewImage',
    )
    assert.ok(upload?.type === 'upload')
    assert.equal(upload.admin?.width, undefined)
    assert.equal(upload.admin?.className, 'hg-multi-url-preview__upload')
  }
})

test('collection fields appear only on their own section; inline blocks have no section condition', () => {
  const field = pageSectionsField(tripSectionOptions).fields.find(
    (field) => 'name' in field && field.name === 'multiPreviewLinks',
  )
  assert.ok(field?.type === 'array')
  const condition = field.admin?.condition as (data: unknown, sibling: unknown) => boolean
  assert.ok(condition)
  assert.equal(condition({}, { kind: 'multiUrlPreview' }), true)
  for (const kind of ['html', 'overview', 'linkPreview'])
    assert.equal(condition({}, { kind }), false)
  const inline = inlineMultiUrlPreviewBlock.fields.find(
    (field) => 'name' in field && field.name === 'multiPreviewLinks',
  )
  assert.ok(inline?.type === 'array')
  assert.equal(inline.admin?.condition, undefined)
  assert.equal(inline.maxRows, MAX_PREVIEW_LINKS)
  assert.notEqual(inline.admin?.isSortable, false)
  const url = inline.fields.find((field) => 'name' in field && field.name === 'linkPreviewUrl')
  assert.ok(url?.type === 'text')
  assert.equal(url.validate, validateMultiPreviewUrl)
})

test('link tables use distinct short names for each collection and its versions', () => {
  const links = multiUrlPreviewFields().find(
    (field) => 'name' in field && field.name === 'multiPreviewLinks',
  )
  assert.ok(links?.type === 'array' && typeof links.dbName === 'function')
  const names = ['trips', 'blog'].flatMap((collection) => {
    const live = links.dbName as (args: { tableName: string }) => string
    const name = live({ tableName: `${collection}_page_sections` })
    const version = `_${live({ tableName: `_${collection}_v_version_page_sections` })}_v`
    for (const value of [name, version]) assert.ok(`${value}_parent_id_idx`.length <= 63)
    return [name, version]
  })
  assert.equal(new Set(names).size, 4)
})

test('Blog body, Trip Essential Information and other rendered Trip bodies expose the content editor', () => {
  const blog = flatten(Blog.fields).find((field) => 'name' in field && field.name === 'content')
  assert.ok(blog?.type === 'richText' && blog.editor)
  const fields = flatten(Trips.fields)
  for (const name of ['description', 'whyChooseThisTrek', 'departures']) {
    const field = fields.find((field) => 'name' in field && field.name === name)
    assert.ok(field?.type === 'richText' && field.editor, name)
  }
  const sections = fields.find((field) => 'name' in field && field.name === 'contentSections')
  assert.ok(sections?.type === 'array')
  const content = sections.fields.find((field) => 'name' in field && field.name === 'content')
  assert.ok(content?.type === 'richText' && content.editor)
})

test('multi-URL validation accepts site paths and public HTTP(S) addresses', () => {
  for (const value of [
    undefined,
    null,
    '',
    '/trips/everest?date=2027#route',
    ' https://example.com/a ',
    'http://example.com:80/guide',
    'https://example.com:443/guide',
  ]) {
    assert.equal(validateMultiPreviewUrl(value), true, String(value))
  }
})

test('multi-URL validation rejects unsafe protocols, private hosts, credentials, ports and URL tricks', () => {
  for (const value of [
    42,
    '  ',
    'example.com',
    '//example.com',
    'javascript:alert(1)',
    'data:text/html,x',
    'file:///etc/passwd',
    'https://user:pass@example.com/',
    'https://example.com:3000',
    'http://127.0.0.1',
    'http://0x7f000001',
    'http://10.0.0.1',
    'http://169.254.169.254',
    'http://[::1]',
    'http://[::ffff:127.0.0.1]',
    'http://thing.internal',
    'http://localhost',
    '/\\example.com',
    'https://exam\nple.com',
    '/a\u0000b',
  ]) {
    assert.equal(typeof validateMultiPreviewUrl(value), 'string', String(value))
  }
})

test('normalization drops invalid rows, trims overrides, keeps order and caps the batch', () => {
  const source = {
    multiPreviewHeading: '  Recommended reading  ',
    multiPreviewDescription: ' A few useful guides. ',
    multiPreviewLayout: 'invalid',
    multiPreviewAnimation: 'invalid',
    multiPreviewLinks: [
      null,
      {},
      { linkPreviewUrl: 'javascript:alert(1)' },
      {
        id: ' first ',
        linkPreviewUrl: ' /blog/one ',
        linkPreviewTitle: ' Editor title ',
        linkPreviewDescription: 5,
        linkPreviewPrice: ' US$ 700 ',
        linkPreviewOriginalPrice: ' US$ 900 ',
        linkPreviewImage: { url: '/media/uploaded.webp', mimeType: 'image/webp' },
        linkPreviewImageUrl: 'https://images.example.com/remote.webp',
      },
      ...Array.from({ length: 20 }, (_, i) => ({ linkPreviewUrl: `/blog/${i}` })),
    ],
  } as unknown as MultiUrlPreviewSource
  const result = normalizeMultiUrlPreview(source)
  assert.equal(result.heading, 'Recommended reading')
  assert.equal(result.description, 'A few useful guides.')
  assert.equal(result.layout, 'slider')
  assert.equal(result.animation, 'rise')
  assert.equal(result.links.length, MAX_PREVIEW_LINKS)
  assert.deepEqual(result.links[0], {
    id: 'first',
    linkPreviewUrl: '/blog/one',
    linkPreviewTitle: 'Editor title',
    linkPreviewDescription: undefined,
    linkPreviewPrice: 'US$ 700',
    linkPreviewOriginalPrice: 'US$ 900',
    linkPreviewImage: { url: '/media/uploaded.webp', mimeType: 'image/webp' },
    linkPreviewImageUrl: 'https://images.example.com/remote.webp',
  })
  assert.equal(
    source.multiPreviewHeading,
    '  Recommended reading  ',
    'does not mutate the saved document',
  )
  assert.deepEqual(normalizeMultiUrlPreview({ multiPreviewLinks: null }).links, [])
})

test('five presets have distinct real keyframes and every saved preset survives normalization', () => {
  assert.equal(
    new Set(Object.values(multiPreviewKeyframes).map((frames) => JSON.stringify(frames))).size,
    5,
  )
  for (const { value } of multiPreviewAnimations) {
    assert.equal(normalizeMultiUrlPreview({ multiPreviewAnimation: value }).animation, value)
    if (value !== 'none') assert.equal(multiPreviewKeyframes[value].at(-1)?.opacity, 1)
  }
  for (const { value } of multiPreviewLayouts) {
    assert.equal(normalizeMultiUrlPreview({ multiPreviewLayout: value }).layout, value)
  }
})

test('nearest snap index handles swipe offsets, endpoints, ties and an empty track', () => {
  assert.equal(nearestPreviewIndex([], 100), 0)
  assert.equal(nearestPreviewIndex([0, 300, 600], -20), 0)
  assert.equal(nearestPreviewIndex([0, 300, 600], 170), 1)
  assert.equal(nearestPreviewIndex([0, 300, 600], 150), 0)
  assert.equal(nearestPreviewIndex([0, 300, 600], 1000), 2)
})
