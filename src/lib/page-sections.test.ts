import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  blogSectionOptions,
  defaultPageSections,
  groupPageSections,
  linkPreviewAddress,
  orderTripPageSections,
  resolvePageSections,
  resolveSectionContent,
  tripSectionOptions,
  validatePageSections,
  type PageSection,
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
  assert.equal(
    typeof validatePageSections([
      { kind: 'hotelsNearDestination' },
      { kind: 'hotelsNearDestination' },
    ]),
    'string',
  )
  assert.equal(validatePageSections([{ kind: 'html' }, { kind: 'html' }]), true)
  assert.deepEqual(
    resolvePageSections(
      [{ kind: 'hero' }, { kind: 'unknown' }, { kind: 'hero' }, { kind: 'html', html: 'ok' }],
      tripSectionOptions,
    ),
    [{ kind: 'hero' }, { kind: 'html', html: 'ok' }],
  )
})

test('Link preview rows can be repeated, each carrying its own card', () => {
  const sections = [
    { kind: 'hero' },
    { id: 'a', kind: 'linkPreview', linkPreviewUrl: 'https://www.booking.com/hotel/np/annapurna' },
    { id: 'b', kind: 'linkPreview', linkPreviewUrl: '/blog/altitude' },
    // An empty row is kept too, so an editor can add one now and fill it in later.
    { id: 'c', kind: 'linkPreview' },
  ]

  for (const options of [tripSectionOptions, blogSectionOptions]) {
    assert.equal(validatePageSections(sections), true)
    assert.deepEqual(resolvePageSections(sections, options), sections)
  }

  // Everything else still reads the document, so it can only be placed once.
  assert.equal(
    typeof validatePageSections([
      { kind: 'linkPreview' },
      { kind: 'linkPreview' },
      { kind: 'faqs' },
      { kind: 'faqs' },
    ]),
    'string',
  )
  assert.deepEqual(
    resolvePageSections(
      [{ kind: 'linkPreview' }, { kind: 'faqs' }, { kind: 'linkPreview' }, { kind: 'faqs' }],
      tripSectionOptions,
    ),
    [{ kind: 'linkPreview' }, { kind: 'faqs' }, { kind: 'linkPreview' }],
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

test('trip: default primary sections follow the sticky navigation sequence', () => {
  const kinds = defaultPageSections(tripSectionOptions).map(({ kind }) => kind)
  assert.deepEqual(kinds.slice(0, 8), [
    'hero',
    'overview',
    'highlights',
    'itinerary',
    'information',
    'hotelsNearDestination',
    'departures',
    'faqs',
  ])
})

test('trip: existing CMS layouts render primary sections in canonical order and retain extras', () => {
  const saved = [
    { kind: 'related' },
    { id: 'custom-first', kind: 'html', html: '<p>First custom block</p>' },
    { kind: 'faqs' },
    { kind: 'itinerary' },
    { kind: 'overview' },
    { kind: 'keyTakeaways' },
    { kind: 'highlights' },
    { kind: 'departures' },
    { kind: 'information' },
    { kind: 'hotelsNearDestination' },
    { id: 'custom-second', kind: 'html', html: '<p>Second custom block</p>' },
    { kind: 'hero' },
    { kind: 'inquiry' },
  ] satisfies PageSection[]

  const ordered = orderTripPageSections(saved)
  assert.deepEqual(
    ordered.map(({ kind }) => kind),
    [
      'hero',
      'overview',
      'highlights',
      'itinerary',
      'information',
      'hotelsNearDestination',
      'departures',
      'faqs',
      'html',
      'keyTakeaways',
      'html',
      'related',
      'inquiry',
    ],
  )
  assert.deepEqual(
    ordered.filter(({ kind }) => kind === 'html').map(({ id }) => id),
    ['custom-first', 'custom-second'],
  )
})

test('trip: optional core sections can still be omitted from a saved layout', () => {
  const layout = defaultPageSections(tripSectionOptions).filter(
    ({ kind }) => !['highlights', 'hotelsNearDestination', 'departures'].includes(kind),
  )
  assert.deepEqual(
    orderTripPageSections(layout)
      .slice(0, 5)
      .map(({ kind }) => kind),
    ['hero', 'overview', 'itinerary', 'information', 'faqs'],
  )
})

test('the Link preview row owns the card, so it is a URL field inside the row', () => {
  const CARD_FIELDS = [
    'linkPreviewUrl',
    'linkPreviewTitle',
    'linkPreviewDescription',
    'linkPreviewRating',
    'linkPreviewReviewCount',
    'linkPreviewPrice',
    'linkPreviewOriginalPrice',
  ]

  type FieldLike = {
    type: string
    name?: string
    admin?: { condition?: (...args: unknown[]) => boolean }
    fields?: FieldLike[]
  }

  /**
   * Every field in the row, with the condition that decides whether it is shown: its own, or the
   * one on the layout row it sits in (Payload hides a row's children with the row).
   */
  const walk = (
    fields: FieldLike[],
    inherited?: (siblingData: Record<string, unknown>) => boolean,
  ): { name?: string; show: (siblingData: Record<string, unknown>) => boolean }[] =>
    fields.flatMap((field) => {
      const own = field.admin?.condition as
        ((data: unknown, siblingData: Record<string, unknown>) => boolean) | undefined
      const show = (siblingData: Record<string, unknown>) =>
        (inherited?.(siblingData) ?? true) && (own ? own(undefined, siblingData) : true)
      return [{ name: field.name, show }, ...(field.fields ? walk(field.fields, show) : [])]
    })

  for (const [name, options] of [
    ['trip', tripSectionOptions],
    ['blog', blogSectionOptions],
  ] as const) {
    const rowFields = walk(pageSectionsField(options).fields as unknown as FieldLike[])

    for (const cardField of CARD_FIELDS) {
      const field = rowFields.find((candidate) => candidate.name === cardField)
      assert.ok(field, `${name}: ${cardField} is a page-section row field`)
      // Shown on the row that places the card…
      assert.equal(field.show({ kind: 'linkPreview' }), true, `${name}: ${cardField} shown there`)
      // …and nowhere else: the Custom HTML row an editor adds by default must not grow a URL box.
      assert.equal(field.show({ kind: 'html' }), false, `${name}: ${cardField} hidden on HTML rows`)
      assert.equal(
        field.show({ kind: 'overview' }),
        false,
        `${name}: ${cardField} hidden elsewhere`,
      )
    }

    // The reverse still holds: Custom HTML keeps its code editor, and only that.
    const html = rowFields.find((candidate) => candidate.name === 'html')
    assert.equal(html?.show({ kind: 'html' }), true, `${name}: Custom HTML keeps its editor`)
    assert.equal(html?.show({ kind: 'linkPreview' }), false, `${name}: no code box on a card row`)
  }
})

test('a section can be rendered from its own row', () => {
  const content = {
    overview: 'plain',
    linkPreview: (section: PageSection) => `card:${section.linkPreviewUrl}`,
  }
  assert.equal(resolveSectionContent(content, { kind: 'overview' }), 'plain')
  assert.equal(
    resolveSectionContent(content, { kind: 'linkPreview', linkPreviewUrl: '/trips/a' }),
    'card:/trips/a',
  )
  assert.equal(resolveSectionContent(content, { kind: 'unknown' }), undefined)
})

test('repeated Link preview rows are told apart by the address they point at', () => {
  assert.equal(linkPreviewAddress('https://www.booking.com/hotel/np/annapurna'), 'booking.com')
  assert.equal(linkPreviewAddress('  https://guide.example.com/a  '), 'guide.example.com')
  assert.equal(linkPreviewAddress('/blog/altitude'), '/blog/altitude')
  assert.equal(linkPreviewAddress(''), null)
  assert.equal(linkPreviewAddress(null), null)
})
