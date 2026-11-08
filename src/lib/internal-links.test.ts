/**
 * Tests for automated internal keyword linking.
 *
 * The contract under test: the site links its own copy to the pages it wants to rank, using the
 * phrases each document already declares — and it does so without ever producing the patterns that
 * make automated linking look like spam. Concretely:
 *
 *  · the first, longest mention of a phrase wins, and only once per page;
 *  · one link per target, never a link to the page itself, never past the per-page cap;
 *  · headings, lists, quotes, tables and links an editor already put there are left alone;
 *  · the anchor text is the copy exactly as written;
 *  · the same input always produces the same HTML.
 *
 * The second half renders real Lexical fixtures through `<RichText>` to prove the engine and the
 * renderer agree — the unit rules mean nothing if the wiring drops them.
 *
 * Nothing here touches a database: the index is compiled from fixture documents and handed to the
 * renderer through its `linker` prop, which is the same seam the four detail routes use.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildLinkTargets,
  compileLinkIndex,
  findLinkCandidates,
  humanizeSlug,
  InternalLinker,
  phrasesForTarget,
  splitAutoLinkedText,
  COLLECTION_WEIGHT,
  type InternalLinkCollection,
  type InternalLinkConfig,
  type InternalLinkSelf,
  type LexicalNode,
  type LinkIndex,
} from './internal-links'

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                    */
/* -------------------------------------------------------------------------- */

type FixtureDoc = {
  collection: InternalLinkCollection
  id: number
  slug: string
  title: string
  keywords?: (string | null)[] | null
  href: string
}

const DOCS: FixtureDoc[] = [
  {
    collection: 'trips',
    id: 1,
    slug: 'everest-base-camp-trek',
    title: 'Everest Base Camp Trek',
    // An editor's keyword list deliberately overlapping the title, plus one phrase the title does
    // not contain — the abbreviation travellers actually search with.
    keywords: ['everest base camp trek', 'EBC trek'],
    href: '/trips/everest-base-camp-trek',
  },
  {
    collection: 'trips',
    id: 2,
    slug: 'annapurna-circuit-trek',
    title: 'Annapurna Circuit Trek',
    keywords: null,
    href: '/trips/annapurna-circuit-trek',
  },
  {
    collection: 'destinations',
    id: 3,
    slug: 'khumbu',
    // One word: never derived as a phrase (see the derivation rules below).
    title: 'Khumbu',
    keywords: null,
    href: '/destinations/khumbu',
  },
  {
    collection: 'destinations',
    id: 4,
    slug: 'sagarmatha-national-park',
    title: 'Sagarmatha National Park',
    keywords: null,
    href: '/destinations/sagarmatha-national-park',
  },
  {
    collection: 'blog',
    id: 5,
    slug: 'packing-for-everest',
    title: 'Packing For Everest',
    // "best" is a generic edge word for a *derived* phrase, but an editor typing it is trusted.
    keywords: ['best trekking boots'],
    href: '/blog/packing-for-everest',
  },
  {
    collection: 'pages',
    id: 6,
    slug: 'about-us',
    title: 'About Us',
    keywords: null,
    href: '/about-us',
  },
]

/** The index every test below works against, unless it builds its own. */
const INDEX: LinkIndex = compileLinkIndex(buildLinkTargets(DOCS))

const linkerFor = (
  self: InternalLinkSelf | null = null,
  overrides?: InternalLinkConfig,
): InternalLinker => new InternalLinker(INDEX, self, overrides)

/**
 * Renders one or more `<RichText>` components with a linker and returns the HTML.
 *
 * `React.createElement` rather than JSX, because this is a `.ts` test file: children go in as extra
 * arguments, which is what `react/no-children-prop` requires.
 */
const renderWithLinker = async (
  linker: InternalLinker | null,
  ...children: { content: unknown; headingIds?: readonly string[] }[]
): Promise<string> => {
  const React = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { RichText } = await import('../components/content/rich-text')

  return renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      ...children.map((props) => React.createElement(RichText, { ...props, linker })),
    ),
  )
}

const paragraph = (...children: unknown[]) => ({ type: 'paragraph', children })
const text = (value: string, format?: number) => ({ type: 'text', text: value, format })
const content = (...children: unknown[]) => ({ root: { children } })

/** Padding that mentions nothing, used to separate two links by a known character distance. */
const filler = (characters: number): string => 'x'.repeat(characters)

/* -------------------------------------------------------------------------- */
/* Phrase extraction                                                           */
/* -------------------------------------------------------------------------- */

test('humanizeSlug reads a slug back as words', () => {
  assert.equal(humanizeSlug('everest-base-camp-trek'), 'everest base camp trek')
  assert.equal(humanizeSlug('gokyo-lakes_3-passes'), 'gokyo lakes 3 passes')
  // Only the last segment: a slug carrying a path prefix still yields the page's own words.
  assert.equal(humanizeSlug('nested/about-us'), 'about us')
  assert.equal(humanizeSlug(''), '')
})

test('an editor’s keyword list is taken as written', () => {
  const phrases = phrasesForTarget({
    collection: 'blog',
    id: 1,
    slug: 'x',
    href: '/blog/x',
    keywords: ['  Everest   Base Camp TREK ', 'EBC trek', 'best trekking boots'],
  }).map((entry) => entry.phrase)

  // Normalized and lowercased, but not filtered: "best …" survives because a human typed it.
  assert.deepEqual(phrases, ['everest base camp trek', 'ebc trek', 'best trekking boots'])
})

test('a phrase shorter than the floor is never indexed', () => {
  const phrases = phrasesForTarget({
    collection: 'blog',
    id: 1,
    slug: 'x',
    href: '/blog/x',
    keywords: ['ebc', 'trek', null, '   ', 'khumbu valley'],
  }).map((entry) => entry.phrase)

  // "ebc" is 3 characters, under `minPhraseLength`; null and blank are not phrases at all.
  assert.deepEqual(
    phrases,
    ['trek', 'khumbu valley'].filter((p) => p.length >= 4),
  )
  assert.ok(!phrases.includes('ebc'))
})

test('a derived phrase has to be multi-word and free of generic edges', () => {
  const phrasesOf = (title: string, slug: string) =>
    phrasesForTarget({ collection: 'trips', id: 1, slug, title, href: '/trips/x' }).map(
      (entry) => entry.phrase,
    )

  // Title and slug say the same thing → one phrase, not two.
  assert.deepEqual(phrasesOf('Everest Base Camp Trek', 'everest-base-camp-trek'), [
    'everest base camp trek',
  ])

  // One word is where the noise lives: "Nepal", "News", "Trek" would link on every page.
  assert.deepEqual(phrasesOf('Khumbu', 'khumbu'), [])

  // Marketing qualifiers make a title a heading, not an anchor.
  assert.deepEqual(phrasesOf('Best Treks In Nepal', 'best-treks-in-nepal'), [])
  assert.deepEqual(phrasesOf('About Us', 'about-us'), [])

  // A title and a slug that differ both get indexed, title first (it outranks the slug).
  const both = phrasesForTarget({
    collection: 'destinations',
    id: 1,
    slug: 'sagarmatha-national-park',
    title: 'Sagarmatha Park',
    href: '/destinations/sagarmatha-national-park',
  })
  assert.deepEqual(
    both.map((entry) => entry.phrase),
    ['sagarmatha park', 'sagarmatha national park'],
  )
  assert.ok(both[0]!.weight > both[1]!.weight)
})

test('buildLinkTargets drops documents with no slug and no href', () => {
  const targets = buildLinkTargets([
    { collection: 'trips', id: 1, slug: 'a-trek', href: '/trips/a-trek' },
    { collection: 'trips', id: 2, slug: null, href: '/trips/nope' },
    { collection: 'trips', id: 3, slug: '  ', href: '/trips/blank' },
    { collection: 'trips', id: 4, slug: 'b-trek', href: '' },
  ])

  assert.deepEqual(
    targets.map((target) => target.id),
    [1],
  )
})

/* -------------------------------------------------------------------------- */
/* Index compilation                                                           */
/* -------------------------------------------------------------------------- */

test('the index groups phrases with the documents that answer to them', () => {
  const phrases = new Map(INDEX.phrases.map((entry) => [entry.phrase, entry.targets]))

  assert.deepEqual(
    phrases.get('everest base camp trek')?.map((target) => target.href),
    ['/trips/everest-base-camp-trek'],
  )
  assert.deepEqual(
    phrases.get('ebc trek')?.map((target) => target.href),
    ['/trips/everest-base-camp-trek'],
  )
  assert.deepEqual(
    phrases.get('sagarmatha national park')?.map((target) => target.href),
    ['/destinations/sagarmatha-national-park'],
  )
  // Derived from the title, even though the post is about packing.
  assert.deepEqual(
    phrases.get('packing for everest')?.map((target) => target.href),
    ['/blog/packing-for-everest'],
  )
})

test('a one-word document title is not indexed, so "Khumbu" never auto-links', () => {
  assert.equal(
    INDEX.phrases.some((entry) => entry.phrase === 'khumbu'),
    false,
  )
  assert.deepEqual(findLinkCandidates('We fly into Khumbu early.', INDEX), [])
})

test('the phrase list is longest-first and every branch carries its own boundary assertions', () => {
  const lengths = INDEX.phrases.map((entry) => entry.phrase.length)
  assert.deepEqual(
    lengths,
    [...lengths].sort((a, b) => b - a),
  )

  const pattern = INDEX.pattern
  assert.ok(pattern)
  assert.match(pattern.flags, /g/)
  assert.match(pattern.flags, /i/)

  // Every indexed phrase is in the pattern, wrapped in its own boundary assertions. Splitting the
  // source on `|` to check this would be wrong — a phrase may itself contain an escaped pipe — so
  // each branch is asserted on instead.
  for (const { phrase } of INDEX.phrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const opensWithWordChar = /^\w/.test(phrase)
    const closesWithWordChar = /\w$/.test(phrase)

    const branch = [
      opensWithWordChar ? '\\b' : '(?<!\\w)',
      escaped,
      closesWithWordChar ? '\\b' : '(?!\\w)',
    ].join('')

    assert.ok(
      pattern.source.includes(branch),
      `expected the pattern to contain the branch for "${phrase}"`,
    )
  }
})

test('a phrase made of regex metacharacters is escaped, not compiled as a pattern', () => {
  const index = compileLinkIndex(
    buildLinkTargets([
      {
        collection: 'blog',
        id: 1,
        slug: 'costs',
        title: 'Trek Costs (2026)',
        // A keyword with parentheses, a dot and a pipe — each would break a naive alternation.
        keywords: ['everest permits (2026)', 'cost . per . day', 'tea|house'],
        href: '/blog/costs',
      },
    ]),
  )

  // Four phrases: the three keywords, plus the title "Trek Costs (2026)" derived from the document
  // (the slug `costs` is one word and contributes nothing). The point is that all four compiled
  // without the parentheses, dot or pipe being read as regex syntax.
  assert.deepEqual(index.phrases.map((entry) => entry.phrase).sort(), [
    'cost . per . day',
    'everest permits (2026)',
    'tea|house',
    'trek costs (2026)',
  ])

  const found = findLinkCandidates('Ask about everest permits (2026) before you book.', index)
  assert.equal(found.length, 1)
  assert.equal(found[0]!.phrase, 'everest permits (2026)')
  assert.equal(found[0]!.href, '/blog/costs')
})

test('compiling an empty document set yields an index that matches nothing', () => {
  const empty = compileLinkIndex([])
  assert.equal(empty.pattern, null)
  assert.deepEqual(empty.phrases, [])
  assert.deepEqual(findLinkCandidates('Everest Base Camp Trek', empty), [])
  assert.equal(new InternalLinker(empty).isEmpty, true)
})

test('the phrase cap drops the tail rather than shipping an unbounded pattern', () => {
  const many = Array.from({ length: 40 }, (_, i) => ({
    collection: 'blog' as InternalLinkCollection,
    id: i,
    slug: `post-${i}`,
    title: `Trekking Post Number ${i}`,
    keywords: null,
    href: `/blog/post-${i}`,
  }))

  const capped = compileLinkIndex(buildLinkTargets(many), { maxPhrases: 5 })
  assert.equal(capped.phrases.length, 5)
  // Longest first, so what survives is the most specific phrases.
  assert.deepEqual(
    capped.phrases.map((entry) => entry.phrase.length),
    [...capped.phrases.map((entry) => entry.phrase.length)].sort((a, b) => b - a),
  )
})

test('two documents claiming one phrase are ordered by what the site earns from', () => {
  const index = compileLinkIndex(
    buildLinkTargets([
      {
        collection: 'blog',
        id: 1,
        slug: 'everest-base-camp-trek-guide',
        title: 'Everest Base Camp Trek',
        keywords: null,
        href: '/blog/everest-base-camp-trek-guide',
      },
      {
        collection: 'trips',
        id: 2,
        slug: 'everest-base-camp-trek',
        title: 'Everest Base Camp Trek',
        keywords: null,
        href: '/trips/everest-base-camp-trek',
      },
    ]),
  )

  const targets = index.phrases.find((entry) => entry.phrase === 'everest base camp trek')?.targets
  // The blog post was listed first, but the trip outranks it — the money page takes the anchor.
  assert.deepEqual(
    targets?.map((target) => target.href),
    ['/trips/everest-base-camp-trek', '/blog/everest-base-camp-trek-guide'],
  )
  assert.ok(COLLECTION_WEIGHT.trips > COLLECTION_WEIGHT.blog)
})

test('compiling the same documents twice yields the identical index', () => {
  const again = compileLinkIndex(buildLinkTargets(DOCS))
  assert.deepEqual(
    again.phrases.map((entry) => entry.phrase),
    INDEX.phrases.map((entry) => entry.phrase),
  )
  assert.equal(again.pattern?.source, INDEX.pattern?.source)
})

/* -------------------------------------------------------------------------- */
/* Matching                                                                    */
/* -------------------------------------------------------------------------- */

test('the longest phrase wins at a position where two overlap', () => {
  const candidates = findLinkCandidates('We run the Everest Base Camp Trek each spring.', INDEX)

  assert.equal(candidates.length, 1)
  assert.equal(candidates[0]!.phrase, 'everest base camp trek')
  assert.equal(candidates[0]!.href, '/trips/everest-base-camp-trek')
})

test('a phrase only matches on word boundaries', () => {
  // "trek" is not a phrase in the index, and must not be found inside "trekking" or "treks".
  assert.deepEqual(findLinkCandidates('Trekking and treks everywhere.', INDEX), [])
  // The exact phrase does match, whatever its casing.
  assert.equal(findLinkCandidates('the EBC TREK route', INDEX).length, 1)
  // A hyphenated spelling is a different token sequence and is not silently matched.
  assert.deepEqual(findLinkCandidates('the EBC-trek route', INDEX), [])
})

test('candidates come back in document order with correct offsets', () => {
  const sentence = 'Book the Annapurna Circuit Trek, then read Packing For Everest.'
  const candidates = findLinkCandidates(sentence, INDEX)

  assert.deepEqual(
    candidates.map((candidate) => candidate.phrase),
    ['annapurna circuit trek', 'packing for everest'],
  )
  for (const candidate of candidates) {
    assert.equal(sentence.slice(candidate.start, candidate.end).toLowerCase(), candidate.phrase)
    assert.equal(candidate.start, sentence.toLowerCase().indexOf(candidate.phrase))
  }
})

test('the shared pattern is stateless across calls', () => {
  const sentence = 'Everest Base Camp Trek and Annapurna Circuit Trek.'
  // A `g` regex keeps `lastIndex` between `exec` calls; if it leaked, the second call would differ.
  assert.deepEqual(findLinkCandidates(sentence, INDEX), findLinkCandidates(sentence, INDEX))
  assert.equal(findLinkCandidates(sentence, INDEX).length, 2)
})

test('an empty string and an empty index produce no candidates', () => {
  assert.deepEqual(findLinkCandidates('', INDEX), [])
  assert.deepEqual(findLinkCandidates('Everest Base Camp Trek', compileLinkIndex([])), [])
})

/* -------------------------------------------------------------------------- */
/* The per-page budget                                                         */
/* -------------------------------------------------------------------------- */

/** Collects one rich text tree and returns the mentions it won, flattened. */
const planOf = (linker: InternalLinker, ...trees: unknown[]) => {
  for (const tree of trees) linker.collect(tree)
  linker.flush()
  return trees
}

/** The hrefs a linker decided on, in document order, for one rich text tree. */
const decidedHrefs = (linker: InternalLinker, tree: unknown): string[] => {
  // Collect first, so a tree the caller never handed to `planOf` is still decided — `planFor` only
  // flushes what has been collected, and `collect` is a no-op for nodes already settled.
  linker.collect(tree)

  const hrefs: string[] = []
  const walk = (node: LexicalNode | null | undefined) => {
    if (!node) return
    if (node.type === 'text') {
      for (const match of linker.planFor(node) ?? []) hrefs.push(match.href)
      return
    }
    for (const child of node.children ?? []) walk(child)
  }
  walk((tree as { root: LexicalNode }).root)
  return hrefs
}

test('only the first mention of a phrase becomes a link', () => {
  const linker = linkerFor()
  const tree = content(
    paragraph(text('The Everest Base Camp Trek starts at Lukla.')),
    paragraph(text(`Later: ${filler(200)}`)),
    paragraph(text('That is why the Everest Base Camp Trek is so popular.')),
  )
  planOf(linker, tree)

  const [first, , third] = tree.root.children as never[] as { children: never[] }[]
  assert.equal(linker.planFor(first.children[0] as never)?.length, 1)
  assert.equal(linker.planFor(third.children[0] as never), null)
})

test('one link per target, even when two phrases point at it', () => {
  const linker = linkerFor()
  const tree = content(
    paragraph(text('Join the Everest Base Camp Trek this spring.')),
    paragraph(text(`Then: ${filler(200)}`)),
    // A different phrase, same trip — the target is already linked on this page.
    paragraph(text('The EBC trek is the classic route.')),
  )
  planOf(linker, tree)

  assert.deepEqual(decidedHrefs(linker, tree), ['/trips/everest-base-camp-trek'])
})

test('a page never links to itself', () => {
  const self: InternalLinkSelf = { collection: 'trips', id: 1 }
  const linker = linkerFor(self)
  const tree = content(
    paragraph(text('This is the Everest Base Camp Trek page, and EBC trek is mentioned too.')),
  )
  planOf(linker, tree)

  assert.deepEqual(decidedHrefs(linker, tree), [])
  // A different document on the same page is still linked.
  const other = linkerFor(self)
  const otherTree = content(paragraph(text('Also see the Annapurna Circuit Trek.')))
  planOf(other, otherTree)
  assert.deepEqual(decidedHrefs(other, otherTree), ['/trips/annapurna-circuit-trek'])
})

test('the per-page cap stops the budget, whatever else matches', () => {
  const linker = linkerFor(null, { maxLinksPerPage: 1, minGapChars: 0 })
  const tree = content(
    paragraph(
      text('Everest Base Camp Trek and Annapurna Circuit Trek and Sagarmatha National Park.'),
    ),
  )
  planOf(linker, tree)

  // Document order decides who gets the single slot.
  assert.deepEqual(decidedHrefs(linker, tree), ['/trips/everest-base-camp-trek'])
})

test('links are kept apart by a minimum character distance', () => {
  const close = linkerFor(null, { minGapChars: 140 })
  const closeTree = content(
    paragraph(text('Everest Base Camp Trek, then Annapurna Circuit Trek, in one breath.')),
  )
  planOf(close, closeTree)
  assert.deepEqual(decidedHrefs(close, closeTree), ['/trips/everest-base-camp-trek'])

  const apart = linkerFor(null, { minGapChars: 140 })
  const apartTree = content(
    paragraph(text('Everest Base Camp Trek, then Annapurna Circuit Trek, in one breath.')),
    paragraph(text(filler(300))),
    paragraph(text('Sagarmatha National Park is where both of them are.')),
  )
  planOf(apart, apartTree)
  assert.deepEqual(decidedHrefs(apart, apartTree), [
    '/trips/everest-base-camp-trek',
    '/destinations/sagarmatha-national-park',
  ])
})

test('the gap counts copy the reader passes, not only copy that can be linked', () => {
  const first = 'Everest Base Camp Trek'
  const second = 'Sagarmatha National Park is the protected area both treks cross.'
  const headingText =
    'Everything you need to know about permits, guides, packing, acclimatisation and the route itself before you travel this season'

  const heading = { type: 'heading', tag: 'h2', children: [text(headingText)] }
  const withHeading = content(paragraph(text(first)), heading, paragraph(text(second)))
  const withoutHeading = content(paragraph(text(first)), paragraph(text(second)))

  // The arithmetic the two cases turn on: without the heading the second mention starts 22
  // characters after the first link ended, with it the heading's own words are read in between.
  const minGapChars = 120
  assert.ok(first.length < minGapChars)
  assert.ok(first.length + headingText.length >= minGapChars)

  const bare = linkerFor(null, { minGapChars })
  planOf(bare, withoutHeading)
  assert.deepEqual(decidedHrefs(bare, withoutHeading), ['/trips/everest-base-camp-trek'])

  const counted = linkerFor(null, { minGapChars })
  planOf(counted, withHeading)
  assert.deepEqual(decidedHrefs(counted, withHeading), [
    '/trips/everest-base-camp-trek',
    '/destinations/sagarmatha-national-park',
  ])

  // …and the heading itself was never a candidate, only a distance.
  assert.equal(counted.planFor(heading.children[0] as never), null)
})

test('a heading, list, quote, table and existing link are never linked inside', () => {
  const linker = linkerFor(null, { minGapChars: 0 })
  const linked = {
    type: 'link',
    fields: { linkType: 'custom', url: 'https://example.com' },
    children: [text('Everest Base Camp Trek')],
  }
  const tree = content(
    { type: 'heading', tag: 'h2', children: [text('Everest Base Camp Trek')] },
    {
      type: 'list',
      listType: 'bullet',
      children: [{ type: 'listitem', children: [text('Annapurna Circuit Trek')] }],
    },
    { type: 'quote', children: [text('Sagarmatha National Park')] },
    {
      type: 'table',
      children: [
        {
          type: 'tablerow',
          children: [
            { type: 'tablecell', headerState: 0, children: [text('Packing For Everest')] },
          ],
        },
      ],
    },
    paragraph(linked),
  )
  planOf(linker, tree)

  assert.deepEqual(decidedHrefs(linker, tree), [])
  assert.equal(linker.planFor(linked.children[0] as never), null)
})

test('a budget is shared across every block on the page', () => {
  const linker = linkerFor(null, { maxLinksPerPage: 2, minGapChars: 0 })
  const overview = content(paragraph(text('Everest Base Camp Trek and Annapurna Circuit Trek.')))
  const later = content(paragraph(text('Sagarmatha National Park and Packing For Everest.')))

  // Both blocks are collected before either is rendered — the shape `<RichText>` uses.
  linker.collect(overview)
  linker.collect(later)
  linker.flush()

  // The cap is per page, not per block: the first block's two mentions take both slots.
  assert.deepEqual(decidedHrefs(linker, overview), [
    '/trips/everest-base-camp-trek',
    '/trips/annapurna-circuit-trek',
  ])
  assert.deepEqual(decidedHrefs(linker, later), [])
})

test('an empty linker leaves every node undecided', () => {
  const linker = new InternalLinker(compileLinkIndex([]))
  const tree = content(paragraph(text('Everest Base Camp Trek.')))
  linker.collect(tree)
  linker.flush()

  assert.equal(linker.isEmpty, true)
  const node = (tree.root.children[0] as { children: never[] }).children[0]
  assert.equal(linker.planFor(node as never), null)
})

test('collecting twice does not double-spend the budget', () => {
  const linker = linkerFor(null, { minGapChars: 0 })
  const tree = content(paragraph(text('Everest Base Camp Trek and Annapurna Circuit Trek.')))

  linker.collect(tree)
  linker.flush()
  linker.collect(tree)
  linker.flush()

  assert.deepEqual(decidedHrefs(linker, tree), [
    '/trips/everest-base-camp-trek',
    '/trips/annapurna-circuit-trek',
  ])
})

/* -------------------------------------------------------------------------- */
/* Splitting a text node                                                       */
/* -------------------------------------------------------------------------- */

test('splitAutoLinkedText keeps the copy verbatim and the anchors exact', () => {
  const source = 'Book the Everest Base Camp Trek in spring.'
  const plan = findLinkCandidates(source, INDEX)

  assert.deepEqual(splitAutoLinkedText(source, plan), [
    { kind: 'text', text: 'Book the ' },
    { kind: 'link', text: 'Everest Base Camp Trek', href: '/trips/everest-base-camp-trek' },
    { kind: 'text', text: ' in spring.' },
  ])
  // Reassembling the segments reproduces the input exactly — nothing was rewritten or dropped.
  assert.equal(
    splitAutoLinkedText(source, plan)
      .map((segment) => segment.text)
      .join(''),
    source,
  )
})

test('splitAutoLinkedText handles two mentions, a leading mention and a trailing one', () => {
  const source = 'Everest Base Camp Trek, then more copy, then Annapurna Circuit Trek'
  const segments = splitAutoLinkedText(source, findLinkCandidates(source, INDEX))

  assert.deepEqual(
    segments.map((segment) => segment.kind),
    ['link', 'text', 'link'],
  )
  assert.equal(segments.map((segment) => segment.text).join(''), source)
})

test('splitAutoLinkedText ignores a malformed span instead of corrupting the string', () => {
  const source = 'Everest Base Camp Trek today.'
  const good = findLinkCandidates(source, INDEX)

  const outOfOrder = [{ ...good[0]!, start: 5, end: 2 }, ...good]
  assert.deepEqual(splitAutoLinkedText(source, outOfOrder), splitAutoLinkedText(source, good))

  const pastTheEnd = [{ ...good[0]!, end: source.length + 10 }]
  assert.deepEqual(splitAutoLinkedText(source, pastTheEnd), [{ kind: 'text', text: source }])
  assert.deepEqual(splitAutoLinkedText(source, []), [{ kind: 'text', text: source }])
})

/* -------------------------------------------------------------------------- */
/* Rendering — the engine and the renderer agreeing                            */
/* -------------------------------------------------------------------------- */

test('rich text renders an auto-link, with the anchor text as written', async () => {
  const tree = content(
    paragraph(text('Book the Everest Base Camp Trek before the season fills up.')),
  )
  const linker = linkerFor(null, { minGapChars: 0 })
  linker.collect(tree)
  linker.flush()

  const html = await renderWithLinker(linker, { content: tree })

  // React emits props in the order they are written, so `data-auto-link` precedes `href`.
  assert.match(
    html,
    /<a data-auto-link="true" href="\/trips\/everest-base-camp-trek">Everest Base Camp Trek<\/a>/,
  )
  // The sentence around it is untouched.
  assert.match(html, /Book the .*before the season fills up\./)
  assert.equal(html.match(/<a /g)?.length, 1)
})

test('the anchor keeps the copy\u2019s casing and the formatting around it', async () => {
  const tree = content(
    // A bold text node whose whole content is the phrase: the `<a>` must sit inside the `<strong>`.
    paragraph({ type: 'text', text: 'everest base camp trek', format: 1 }),
  )
  const linker = linkerFor(null, { minGapChars: 0 })
  linker.collect(tree)
  linker.flush()

  const html = await renderWithLinker(linker, { content: tree })

  // Lowercase in the copy, lowercase in the anchor — the phrase key is folded, the text is not.
  assert.match(
    html,
    /<strong><a data-auto-link="true" href="\/trips\/everest-base-camp-trek">everest base camp trek<\/a><\/strong>/,
  )
})

test('a heading keeps its text and its outline id when auto-linking is on', async () => {
  const tree = content(
    { type: 'heading', tag: 'h2', children: [text('The Everest Base Camp Trek')] },
    paragraph(text('Book the Everest Base Camp Trek with us.')),
  )
  const linker = linkerFor(null, { minGapChars: 0 })
  linker.collect(tree)
  linker.flush()

  const html = await renderWithLinker(linker, {
    content: tree,
    headingIds: ['the-everest-base-camp-trek'],
  })

  // The heading the table of contents is built from stays plain text (the renderer wraps a text
  // node in a `<span>`, which is what the outline reads)…
  assert.match(
    html,
    /<h2 id="the-everest-base-camp-trek"[^>]*><span>The Everest Base Camp Trek<\/span><\/h2>/,
  )
  // …while the paragraph below it gets the link.
  assert.equal(html.match(/<a /g)?.length, 1)
})

test('a link an editor inserted is left exactly as it was', async () => {
  const tree = content(
    paragraph(
      {
        type: 'link',
        fields: {
          linkType: 'internal',
          doc: { relationTo: 'trips', value: { id: 2, slug: 'annapurna-circuit-trek' } },
        },
        children: [text('Annapurna Circuit Trek')],
      },
      text(' is the classic. So is the Annapurna Circuit Trek, mentioned again in plain copy.'),
    ),
  )
  const linker = linkerFor(null, { minGapChars: 0 })
  linker.collect(tree)
  linker.flush()

  const html = await renderWithLinker(linker, { content: tree })

  // One link: the editor's. The second, plain-text mention of the same trip is left alone because
  // `collect` reserved the target the editor already linked — and no nested anchor, no
  // `data-auto-link` anywhere.
  assert.equal(html.match(/<a /g)?.length, 1)
  assert.equal(html.includes('data-auto-link'), false)
  assert.match(html, /href="\/trips\/annapurna-circuit-trek"/)
})

test('without a provider the renderer emits exactly what it did before', async () => {
  const React = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { RichText } = await import('../components/content/rich-text')

  const tree = content(paragraph(text('Book the Everest Base Camp Trek in spring.')))

  const plain = renderToStaticMarkup(React.createElement(RichText, { content: tree }))
  const scoped = await renderWithLinker(null, { content: tree })
  const empty = await renderWithLinker(new InternalLinker(compileLinkIndex([])), {
    content: tree,
  })

  assert.equal(plain, scoped)
  assert.equal(plain, empty)
  assert.equal(plain.includes('<a '), false)
  assert.match(plain, /<span>Book the Everest Base Camp Trek in spring\.<\/span>/)
})

test('the same page renders the same HTML every time', async () => {
  const render = async () => {
    const tree = content(
      paragraph(text('Everest Base Camp Trek, Annapurna Circuit Trek, Sagarmatha National Park.')),
    )
    const linker = linkerFor(null, { minGapChars: 0, maxLinksPerPage: 2 })
    linker.collect(tree)
    linker.flush()
    return renderWithLinker(linker, { content: tree })
  }

  const [first, second, third] = await Promise.all([render(), render(), render()])
  assert.equal(first, second)
  assert.equal(second, third)
  assert.equal(first.match(/<a /g)?.length, 2)
})

test('with no database the linker comes back empty and the feature degrades to off', async () => {
  // A build or test run with no Postgres must still render every page, so the data layer returns an
  // *empty* linker rather than throwing — and an empty linker matches nothing, which the
  // "without a provider" case above already proves renders byte-for-byte as before.
  const { createInternalLinker } = await import('./data')

  const linker = await createInternalLinker({ collection: 'blog', id: 1 })
  assert.equal(linker.isEmpty, true)

  const tree = content(paragraph(text('Book the Everest Base Camp Trek in spring.')))
  linker.collect(tree)
  linker.flush()
  assert.deepEqual(decidedHrefs(linker, tree), [])
})
