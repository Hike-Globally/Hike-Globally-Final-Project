import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  blogSectionOptions,
  defaultPageSections,
  groupPageSections,
  resolvePageSections,
  tripSectionOptions,
  validatePageSections,
} from './page-sections'
import { pageSectionsField } from '../fields/page-sections'

for (const [name, options] of [
  ['trip', tripSectionOptions],
  ['blog', blogSectionOptions],
] as const) {
  test(`${name}: old documents keep every original section in its original order`, () => {
    for (const value of [undefined, null, []]) {
      assert.deepEqual(resolvePageSections(value, options), defaultPageSections(options))
    }
  })

  test(`${name}: custom HTML rows and existing sections keep the saved order`, () => {
    const defaults = defaultPageSections(options)
    const sections = [
      { id: 'one', kind: 'html', heading: 'Before', html: '<p>Before everything</p>' },
      ...defaults.toReversed(),
      { id: 'two', kind: 'html', html: '<p>After everything</p>' },
    ]
    assert.deepEqual(resolvePageSections(sections, options), sections)
    assert.equal(validatePageSections(sections), true)
    assert.deepEqual(defaults, defaultPageSections(options), 'does not mutate the default layout')
  })

  test(`${name}: removing a built-in row hides it without changing other rows`, () => {
    const sections = defaultPageSections(options).filter(({ kind }) => kind !== 'related')
    assert.deepEqual(resolvePageSections(sections, options), sections)
  })

  test(`${name}: CMS uses a localized sortable array with legacy defaults`, async () => {
    const field = pageSectionsField(options)
    assert.equal(field.type, 'array')
    assert.equal(field.localized, true)
    assert.notEqual(field.admin?.isSortable, false)
    assert.deepEqual(field.defaultValue, defaultPageSections(options))
    const afterRead = field.hooks!.afterRead![0]
    const args = { value: [], req: { locale: 'en' } } as Parameters<typeof afterRead>[0]
    assert.deepEqual(await afterRead(args), defaultPageSections(options))
    const saved = [{ kind: 'html', html: '<p>Saved</p>' }, { kind: 'hero' }]
    assert.deepEqual(await afterRead({ ...args, value: saved }), saved)
    const allLocaleArgs = { ...args, req: { locale: 'all' } } as typeof args
    // Payload passes each locale's array to field hooks, not the enclosing locale map.
    assert.deepEqual(await afterRead({ ...allLocaleArgs, value: saved }), saved)
    assert.deepEqual(await afterRead(allLocaleArgs), defaultPageSections(options))
  })
}

test('blog: the FAQs section follows the article body by default', () => {
  // Layouts saved before the row existed get it in the same place (migration
  // 20261019_045205_blog_faqs); never-saved layouts get it from these defaults.
  assert.deepEqual(
    defaultPageSections(blogSectionOptions).map(({ kind }) => kind),
    ['hero', 'content', 'linkPreview', 'faqs', 'author', 'navigation', 'planning', 'related'],
  )
})

test('blog: Link preview sits straight after the article body and can be hidden', () => {
  const layout = defaultPageSections(blogSectionOptions)
  assert.equal(layout[layout.findIndex(({ kind }) => kind === 'linkPreview') - 1].kind, 'content')
  const hidden = layout.filter(({ kind }) => kind !== 'linkPreview')
  assert.deepEqual(resolvePageSections(hidden, blogSectionOptions), hidden)
})

test('rejects duplicate built-ins, allows any number of distinct HTML sections', () => {
  assert.equal(typeof validatePageSections([{ kind: 'hero' }, { kind: 'hero' }]), 'string')
  assert.equal(validatePageSections([{ kind: 'html' }, { kind: 'html' }]), true)
  assert.deepEqual(
    resolvePageSections(
      [{ kind: 'hero' }, { kind: 'unknown' }, { kind: 'hero' }, { kind: 'html', html: 'ok' }],
      tripSectionOptions,
    ),
    [{ kind: 'hero' }, { kind: 'html', html: 'ok' }],
  )
})

test('full-width sections can be interleaved with body sections without changing DOM order', () => {
  const sections = [
    { kind: 'html' },
    { kind: 'hero' },
    { kind: 'itinerary' },
    { kind: 'html' },
    { kind: 'inquiry' },
    { kind: 'overview' },
    { kind: 'related' },
  ]
  const groups = groupPageSections(sections, ['hero', 'inquiry', 'related'])
  assert.deepEqual(
    groups.map(({ fullWidth }) => fullWidth),
    [false, true, false, true, false, true],
  )
  assert.deepEqual(
    groups.flatMap(({ sections }) => sections),
    sections,
  )
  assert.deepEqual(groups[0].sections, [{ kind: 'html' }])
  assert.deepEqual(groups[2].sections, [{ kind: 'itinerary' }, { kind: 'html' }])
})

test('trip: new content sections have the requested default positions', () => {
  const kinds = defaultPageSections(tripSectionOptions).map(({ kind }) => kind)
  assert.equal(kinds[kinds.indexOf('highlights') - 1], 'whyChoose')
  assert.equal(kinds[kinds.indexOf('highlights') + 1], 'audience')
  assert.equal(kinds[kinds.indexOf('audience') + 1], 'linkPreview')
  assert.equal(kinds[kinds.indexOf('linkPreview') + 1], 'routeMap')
  assert.equal(kinds[kinds.indexOf('itinerary') + 1], 'departures')
  for (const kind of ['whyChoose', 'routeMap', 'departures']) {
    const hidden = defaultPageSections(tripSectionOptions).filter((row) => row.kind !== kind)
    assert.deepEqual(resolvePageSections(hidden, tripSectionOptions), hidden)
  }
})

test('trip: Key Takeaways sits immediately before Overview and can be hidden', () => {
  const layout = defaultPageSections(tripSectionOptions)
  const overview = layout.findIndex(({ kind }) => kind === 'overview')
  assert.equal(layout[overview - 1].kind, 'keyTakeaways')
  const hidden = layout.filter(({ kind }) => kind !== 'keyTakeaways')
  assert.deepEqual(resolvePageSections(hidden, tripSectionOptions), hidden)
})

test('trip: Who is this trip for / not for sits immediately after Highlights and can be hidden', () => {
  const layout = defaultPageSections(tripSectionOptions)
  const highlights = layout.findIndex(({ kind }) => kind === 'highlights')
  assert.equal(layout[highlights + 1].kind, 'audience')
  const hidden = layout.filter(({ kind }) => kind !== 'audience')
  assert.deepEqual(resolvePageSections(hidden, tripSectionOptions), hidden)
  assert.equal(
    groupPageSections(layout, ['hero', 'inquiry', 'related'])[1].sections.some(
      ({ kind }) => kind === 'audience',
    ),
    true,
  )
})
