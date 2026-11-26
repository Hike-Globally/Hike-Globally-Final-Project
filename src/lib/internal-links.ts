/**
 * ============================================================================
 * Automated internal keyword linking — the matching engine.
 * ============================================================================
 *
 * WHAT IT DOES
 *
 * Turns the phrases an editor nominated in a document's **Keyword For Internal Linking** panel
 * into real `<a href>` links inside *other* pages' rich text, at render time. A trip whose panel
 * says "Everest Base Camp Trek" is linked by that phrase wherever a post or another page happens
 * to mention it — without an editor having to remember to do it, which is the whole point:
 * internal links are the one ranking lever that decays silently, because nobody goes back to a
 * 2023 article to wire up a trip published in 2026.
 *
 * The list is the ONLY source of phrases. A document's title, slug and SEO `keywords` are no
 * longer inferred into anchors, and an empty list means the document is never linked to. That is
 * a deliberate trade: full editorial control over which words become links, in exchange for the
 * automation no longer guessing. The panel is defined in `src/fields/internal-link-keywords.ts`,
 * and the migration that introduced it copied every trip's and post's existing SEO keywords into
 * the new list so no page went dark on deploy.
 *
 * WHY AT RENDER TIME, NOT AT SAVE TIME
 *
 * The alternative is a `beforeChange` hook that writes Lexical `link` nodes into the document's
 * `content` JSON. That is rejected here, deliberately:
 *
 *  - It mutates copy nobody typed, so an editor's diff shows links they cannot account for.
 *  - A renamed slug or a deleted trip leaves dead links behind until every document is re-saved.
 *  - Undoing it means a rewrite pass over the whole collection.
 *
 * Linking in the renderer means the CMS content stays exactly as written, the href is always
 * current (it is resolved from the same published set the sitemap lists), and switching the
 * feature off is removing one wrapper component.
 *
 * THE SHAPE
 *
 * Two halves, both pure, both tested without a database:
 *
 *  1. `buildLinkTargets()` + `compileLinkIndex()` — documents in, phrase → target index out.
 *  2. `InternalLinker` — a per-page object the rich text renderer feeds its text nodes to. It
 *     decides which mentions become links under the budget rules below.
 *
 * The database read lives in `src/lib/data.ts` (`createInternalLinker()`) and each route passes the
 * linker down to the rich text it renders, so nothing here imports Next.js, Payload or the
 * environment — which is what makes it unit-testable in isolation.
 *
 * THE BUDGET RULES (the part that keeps this from looking like spam)
 *
 * Every rule exists because the opposite is a documented over-optimization pattern:
 *
 *  | Rule                                    | Why                                                        |
 *  | --------------------------------------- | ---------------------------------------------------------- |
 *  | Longest phrase wins at any position     | "Everest Base Camp Trek" is a better anchor than "Everest". |
 *  | First mention only, per phrase, per page| Repeating one anchor is the classic tell.                   |
 *  | One link per target per page            | A second link to the same URL passes nothing extra.         |
 *  | Never a link to the page itself         | Self-links are noise and inflate the page's own anchor set. |
 *  | Hard cap per page                       | Beyond ~8 links the value per link drops and copy suffers.  |
 *  | Minimum characters between two links    | Clusters of adjacent links read as a link farm.             |
 *  | Money pages outrank posts on a tie      | Trip and destination pages are what the site earns from.    |
 *  | Only phrases an editor nominated        | Nothing is inferred from a title, a slug or an SEO keyword. |
 *  | Headings, lists, quotes, tables, code   | Verbatim or structural copy is not prose to link inside.    |
 *     and existing links are never touched  |                                                            |
 *
 * The output is deterministic: the same document and the same index always produce the same HTML.
 * No randomness, no clock, no request state — otherwise the rendered markup could differ between
 * the prerender and a later request, and snapshot assertions would be flaky.
 *
 * KNOWN LIMITATION
 *
 * A phrase split across two Lexical text nodes ("the **Everest Base Camp** Trek", where the bold
 * makes three nodes) is not matched. Lexical stores formatting as node boundaries, so matching
 * across them means re-merging the tree before rendering and re-splitting it after — a real cost
 * for mentions that are already emphasised, and therefore already the ones an editor is most
 * likely to have linked by hand. Single-node mentions are the common case and are covered.
 */

import { resolveRichTextLink } from './rich-text-links'

/* -------------------------------------------------------------------------- */
/* Vocabulary                                                                  */
/* -------------------------------------------------------------------------- */

/** The collections the index is built from, in descending linking priority. */
export type InternalLinkCollection = 'trips' | 'destinations' | 'blog' | 'news' | 'pages'

/**
 * One document that can be linked *to*, reduced to what the index needs.
 *
 * `href` arrives pre-built by the caller (from `sitePath()` and the same route map
 * `src/lib/rich-text-links.ts` uses), so this module never has to know how URLs are spelled —
 * an auto-link and an editor-made link to the same document are therefore always identical.
 */
export type InternalLinkTarget = {
  collection: InternalLinkCollection
  id: number
  slug: string
  href: string
  /**
   * The phrases an editor typed into the document's **Keyword For Internal Linking** panel.
   *
   * The only source of anchors. Absent, `null` or empty means this document is never linked to
   * automatically — there is no title/slug fallback.
   */
  internalLinkKeywords?: (string | null | undefined)[] | null
}

/** A phrase the matcher knows, with everything that answers to it. */
export type LinkPhrase = {
  phrase: string
  targets: InternalLinkTarget[]
}

export type LinkIndex = {
  /** Longest phrase first — the order the regex alternation is built in. */
  phrases: LinkPhrase[]
  /** The compiled matcher, or `null` when the index is empty. */
  pattern: RegExp | null
}

/** The document being rendered, so the linker can refuse to link a page to itself. */
export type InternalLinkSelf = { collection: InternalLinkCollection; id: number }

/** A mention the matcher found in one text node. */
export type LinkCandidate = {
  phrase: string
  href: string
  collection: InternalLinkCollection
  start: number
  end: number
}

/** What a text node ends up with: the mentions that survived the budget, in order. */
export type NodeLinkPlan = LinkCandidate[]

/* -------------------------------------------------------------------------- */
/* Tuning                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The site's linking policy, in one place.
 *
 * These are constants rather than CMS fields on purpose: they are an SEO decision, not an
 * editorial one, and a per-document field means 400 documents with 400 different settings.
 * Change them here; `npm test` pins the behaviour they describe.
 */
export const INTERNAL_LINK_DEFAULTS = {
  /** Ceiling on auto-links in one page's rich text. */
  maxLinksPerPage: 8,
  /**
   * Plain characters required between the end of one auto-link and the start of the next. Two
   * links in the same sentence read as a link farm; roughly a sentence and a half does not.
   */
  minGapChars: 140,
  /**
   * Shortest phrase the matcher will consider at all.
   *
   * Two characters, not four: the phrases are chosen by an editor now, and a short acronym like
   * "EBC" is a legitimate anchor. A single character is still refused, because "a" or "i" would
   * match almost every paragraph on the site.
   */
  minPhraseLength: 2,
  /**
   * Safety valve on the compiled regex: past this many phrases the tail is dropped (lowest
   * priority first) rather than shipping a megabyte pattern to every render. The site has tens of
   * documents, so this never fires today — it exists for the day it has thousands.
   */
  maxPhrases: 1200,
} as const

/**
 * Overrides for the policy above.
 *
 * Spelled out as `number` rather than `Partial<typeof INTERNAL_LINK_DEFAULTS>`: that type would
 * inherit the `as const` literals, so a caller could only ever "override" a setting with its own
 * default value.
 */
export type InternalLinkConfig = {
  maxLinksPerPage?: number
  minGapChars?: number
  minPhraseLength?: number
  maxPhrases?: number
}

/** The policy with every override resolved — no optional keys past this point. */
export type ResolvedInternalLinkConfig = {
  [K in keyof typeof INTERNAL_LINK_DEFAULTS]: number
}

const config = (overrides?: InternalLinkConfig): ResolvedInternalLinkConfig =>
  ({
    ...INTERNAL_LINK_DEFAULTS,
    ...overrides,
  }) as ResolvedInternalLinkConfig

/**
 * How much a collection is worth linking to.
 *
 * Trips and destinations are what the operator sells, so when the per-page budget runs out they
 * take it and posts do not. Blog posts still link to each other — they are the pages with the most
 * prose — they just lose the tie.
 */
export const COLLECTION_WEIGHT: Record<InternalLinkCollection, number> = {
  trips: 3,
  destinations: 2,
  blog: 1,
  news: 1,
  pages: 0,
}

/* -------------------------------------------------------------------------- */
/* Phrase extraction                                                           */
/* -------------------------------------------------------------------------- */

/** Collapse whitespace, trim, and drop characters that cannot appear in a URL-safe phrase. */
const normalizePhrase = (raw: string): string =>
  raw
    .replace(/\s+/g, ' ')
    .trim()
    // Quotes an editor typed around a phrase, and an opening bracket the copy started inside.
    .replace(/^["'“”‘’(\[]+/, '')
    // Trailing sentence punctuation, closing quotes and stray brackets. Deliberately *not* a
    // closing parenthesis: "everest permits (2026)" is a phrase whose last character is part of it,
    // and stripping the `)` would leave a phrase that can never match the copy it came from.
    .replace(/["'“”‘’\].,;:!?]+$/, '')
    .trim()

/**
 * The phrases one document should be linked by.
 *
 * One source, and only one: the `internalLinkKeywords` list an editor filled in under
 * **Keyword For Internal Linking**. The phrases are trusted as written — no word-count floor, no
 * "generic word" filter, no derivation from the title or slug — because a human chose them. Only
 * the mechanical cleanup applies: whitespace collapsed, wrapping quotes and trailing punctuation
 * removed, case folded, duplicates dropped, and a two-character floor (see `minPhraseLength`) so a
 * stray single letter cannot be indexed.
 *
 * An empty or missing list yields no phrases, which is the switch that turns automated linking
 * *to* this document off.
 */
export function phrasesForTarget(
  target: InternalLinkTarget,
  overrides?: InternalLinkConfig,
): string[] {
  const settings = config(overrides)
  const out: string[] = []
  const seen = new Set<string>()

  for (const keyword of target.internalLinkKeywords ?? []) {
    if (typeof keyword !== 'string') continue
    const phrase = normalizePhrase(keyword).toLowerCase()
    if (phrase.length < settings.minPhraseLength) continue
    if (seen.has(phrase)) continue
    seen.add(phrase)
    out.push(phrase)
  }

  return out
}

/* -------------------------------------------------------------------------- */
/* Index                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Documents → the phrase list the matcher runs against.
 *
 * Filters out anything that must never be linked *to*, mirroring the rules `src/lib/sitemap.ts`
 * applies so the index and the sitemap advertise the same set of URLs: no document without a slug,
 * no `noIndex` document, and no CMS page whose slug a real route owns (`home`, `trips`, …). Those
 * checks are done by the caller in `src/lib/data.ts`, which is where the documents are read.
 */
export function buildLinkTargets(
  documents: Iterable<{
    collection: InternalLinkCollection
    id: number
    slug?: string | null
    internalLinkKeywords?: (string | null | undefined)[] | null
    href: string
  }>,
): InternalLinkTarget[] {
  const targets: InternalLinkTarget[] = []

  for (const doc of documents) {
    const slug = typeof doc.slug === 'string' ? doc.slug.trim() : ''
    if (!slug || !doc.href) continue

    targets.push({
      collection: doc.collection,
      id: doc.id,
      slug,
      href: doc.href,
      internalLinkKeywords: doc.internalLinkKeywords ?? null,
    })
  }

  return targets
}

/** Escape a phrase for use inside a regex alternation. */
const escapeForRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The boundary assertion one end of a phrase needs.
 *
 * `\b` is right for a word character — it is what stops "trek" matching inside "trekking". It is
 * wrong for punctuation: there is no word boundary between `(` and the space before it, so a phrase
 * like "everest permits (2026)" would compile into a pattern that can never fire. At a punctuation
 * edge the requirement is weaker and stated directly: whatever sits outside the phrase must not be
 * a word character, so the phrase cannot be embedded inside a longer token.
 */
const edgeBoundary = (character: string, side: 'start' | 'end'): string => {
  if (/\w/.test(character)) return '\\b'
  return side === 'start' ? '(?<!\\w)' : '(?!\\w)'
}

/**
 * Compile the index: group every phrase with the documents that answer to it, then build one
 * regex whose alternation is ordered longest-first.
 *
 * Two properties of JS regexes do the work here:
 *
 *  - a scan is leftmost-first, so the *earliest* mention in a text node wins;
 *  - an alternation tries its branches in order, so at any position the *longest* phrase wins.
 *
 * Together that is exactly the "first and longest mention" rule, in one pass over the copy.
 *
 * Each branch carries its own boundary assertions (see `edgeBoundary`), so "trek" does not match
 * inside "trekking" unless "trekking" is itself a target, while a phrase that ends on a bracket —
 * "everest permits (2026)" — still matches the copy it came from.
 */
export function compileLinkIndex(
  targets: InternalLinkTarget[],
  overrides?: InternalLinkConfig,
): LinkIndex {
  const settings = config(overrides)
  const byPhrase = new Map<string, InternalLinkTarget[]>()

  for (const target of targets) {
    for (const phrase of phrasesForTarget(target, settings)) {
      const bucket = byPhrase.get(phrase)
      if (bucket) bucket.push(target)
      else byPhrase.set(phrase, [target])
    }
  }

  const phrases: LinkPhrase[] = []
  for (const [phrase, entries] of byPhrase) {
    const sorted = entries
      .slice()
      // Highest-priority target first: money pages over posts, then document order. `sort` is
      // stable, so equal collections keep the order they arrived in and the result never depends
      // on Map iteration luck.
      .sort((a, b) => COLLECTION_WEIGHT[b.collection] - COLLECTION_WEIGHT[a.collection])

    phrases.push({ phrase, targets: sorted })
  }

  phrases.sort((a, b) => b.phrase.length - a.phrase.length || a.phrase.localeCompare(b.phrase))

  const capped = phrases.slice(0, settings.maxPhrases)
  if (!capped.length) return { phrases: [], pattern: null }

  const alternation = capped
    .map(
      (entry) =>
        `${edgeBoundary(entry.phrase[0]!, 'start')}${escapeForRegExp(entry.phrase)}${edgeBoundary(
          entry.phrase[entry.phrase.length - 1]!,
          'end',
        )}`,
    )
    .join('|')

  return {
    phrases: capped,
    pattern: new RegExp(`(?:${alternation})`, 'gi'),
  }
}

/**
 * Every mention of every indexed phrase in one string, longest-first at each position.
 *
 * Returns candidates, not decisions: `InternalLinker.flush()` applies the budget. Overlapping
 * matches cannot occur (a global regex scan consumes what it matched), so what comes back is a
 * list of disjoint spans in document order.
 */
export function findLinkCandidates(text: string, index: LinkIndex): LinkCandidate[] {
  const { pattern } = index
  if (!pattern || !text) return []

  const phraseToTargets = new Map(index.phrases.map((entry) => [entry.phrase, entry.targets]))
  const candidates: LinkCandidate[] = []

  // The pattern is shared and stateful (`g` keeps `lastIndex`), so it is reset per call — and a
  // phrase matched in the source's own casing is looked up by its lowercase form.
  pattern.lastIndex = 0
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    const raw = match[0]
    const phrase = raw.toLowerCase()
    const target = phraseToTargets.get(phrase)?.[0]
    // Guard against a case-folding mismatch (e.g. a Turkish dotless i) rather than linking nowhere.
    if (!target) continue

    candidates.push({
      phrase,
      href: target.href,
      collection: target.collection,
      start: match.index,
      end: match.index + raw.length,
    })
  }

  return candidates
}

/* -------------------------------------------------------------------------- */
/* The linker                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Node types whose text is never auto-linked.
 *
 *  - `heading` — the article outline (`src/lib/article-headings.ts`) is built from heading text,
 *    and injected markup would leak into the table of contents.
 *  - `link` / `autolink` / `relationship` — an editor already put a link there. Nesting `<a>`
 *    inside `<a>` is invalid HTML, and second-guessing a deliberate link is not this feature's job.
 *  - `quote` — quoted speech or a cited source is verbatim.
 *  - `list` / `listitem` — in this site's copy these are fact rows and packing lists, i.e. data,
 *    not prose.
 *  - `table*` — same: a grid of altitudes and prices is data.
 *  - `upload` — its only text is the figure's caption.
 *
 * Anything not listed is walked into, so `paragraph` text (the bulk of the copy) is linkable, as
 * is text in a node type added to the editor later.
 */
const NEVER_LINK_NODE_TYPES: ReadonlySet<string> = new Set([
  'heading',
  'link',
  'autolink',
  'relationship',
  'quote',
  'list',
  'listitem',
  'table',
  'tablerow',
  'tablecell',
  'upload',
])

/** The structural shape of a Lexical node this module walks. */
export type LexicalNode = {
  type?: string
  text?: string
  format?: number | string
  children?: LexicalNode[]
  value?: unknown
  relationTo?: string
  fields?: Record<string, unknown> | null
  url?: string
  newTab?: boolean
  linkType?: string
  doc?: unknown
}

/**
 * The public URL of an internal `relationship` node.
 *
 * Mirrors the renderer's own `docHref()` in `src/components/content/rich-text.tsx` — a relationship
 * node carries a collection and a slug rather than a resolved link field, so it needs the same
 * route map to become an href.
 */
const docHref = (relationTo: string, slug: string): string | null => {
  if (!slug) return null
  if (relationTo === 'trips') return `/trips/${slug}`
  if (relationTo === 'destinations') return `/destinations/${slug}`
  if (relationTo === 'blog') return `/blog/${slug}`
  if (relationTo === 'pages') return slug === 'home' ? '/' : `/${slug}`
  return null
}

/**
 * A text node the matcher may link inside, plus where it sits in the page.
 *
 * `base` is the count of characters that precede this node in the page's copy, which is what makes
 * the "keep links apart" rule meaningful across paragraphs — two offsets measured inside different
 * strings are not comparable, and without a shared origin a link at the end of one paragraph and a
 * link at the start of the next would look 0 characters apart or 900, depending on nothing.
 */
type ObservedNode = { node: LexicalNode; text: string; base: number }

/**
 * One page's worth of linking decisions.
 *
 * Created per request by `createInternalLinker()` and handed down through React context, so every
 * rich text block on the page shares one budget — that is what makes "eight links per page" mean
 * per page rather than per paragraph.
 *
 * The renderer talks to it in three steps, because a decision made on the first paragraph cannot
 * know that the third paragraph has a better candidate:
 *
 *  1. `collect(content)` — walk the Lexical tree and note every linkable text node. Cheap, and it
 *     happens before any rendering.
 *  2. `flush()` — run the matcher over what was collected, apply the budget across the whole page,
 *     and store the surviving mentions per node.
 *  3. `planFor(node)` — during the render, ask what a given text node won.
 *
 * `flush()` is idempotent and is called by both step 1's owner and step 3, so a block that renders
 * before a later block has been collected still gets the full-page picture by the time the page is
 * done: nodes are assigned in document order, and every render flushes whatever is still pending.
 */
export class InternalLinker {
  private readonly index: LinkIndex
  private readonly settings: ResolvedInternalLinkConfig
  private readonly selfHref: string | null
  private readonly selfKey: string | null

  /** Text nodes seen by `collect()` that have not been through selection yet. */
  private readonly pending: ObservedNode[] = []
  /** Roots already walked by `collect()` so nested rich-text blocks are never double-counted. */
  private readonly collectedRoots = new WeakSet<object>()
  /** The decided plan, keyed by node identity (the same object the renderer holds). */
  private readonly plans = new Map<LexicalNode, NodeLinkPlan>()

  private readonly usedHrefs = new Set<string>()
  private readonly usedPhrases = new Set<string>()
  /**
   * How many characters of copy have already been walked, and where the last accepted link ended
   * within that running total. Together they give every mention a page-wide character offset, so
   * the minimum-gap rule compares like with like across paragraphs and blocks.
   */
  private charCursor = 0
  private lastAcceptedEnd: number | null = null
  private accepted = 0

  constructor(index: LinkIndex, self?: InternalLinkSelf | null, overrides?: InternalLinkConfig) {
    this.index = index
    this.settings = config(overrides)
    this.selfKey = self ? `${self.collection}:${self.id}` : null

    // The page's own URL, so a mention of its own title does not produce a self-link. Resolved
    // from the index rather than passed in, because the caller only knows the document.
    this.selfHref = self
      ? (index.phrases
          .flatMap((entry) => entry.targets)
          .find((target) => `${target.collection}:${target.id}` === this.selfKey)?.href ?? null)
      : null
  }

  /** True when there is nothing to match — the renderer can then skip the whole machinery. */
  get isEmpty(): boolean {
    return this.index.pattern === null
  }

  /**
   * Note that the page already links to this URL, so the auto-linker will not add a second one.
   *
   * Called by the renderer for every link an editor put there by hand. This is what makes "one link
   * per target per page" mean one link *including* the manual ones: a paragraph that already says
   * [Annapurna Circuit Trek](/trips/annapurna-circuit-trek) and then mentions it again in plain
   * copy gets no automated second link, because the human already made the connection and a
   * duplicate passes nothing extra.
   */
  reserve(href: string | null | undefined): void {
    if (typeof href === 'string' && href) this.usedHrefs.add(href)
  }

  /**
   * Note every linkable text node in a Lexical document, in document order.
   *
   * Takes the same `{ root }` shape the renderer is given, and walks children of any node type
   * that is not on the never-link list.
   */
  collect(content: unknown): void {
    if (this.isEmpty) return
    const root = (content as { root?: LexicalNode } | null | undefined)?.root
    if (!root || typeof root !== 'object' || this.collectedRoots.has(root)) return
    this.collectedRoots.add(root)
    this.walk(root, true)
  }

  /**
   * Walk a Lexical tree in document order.
   *
   * `linkable` is false once inside a never-link subtree, and it only ever turns off: a heading,
   * list, quote, table or editor-authored link makes everything below it off-limits. Text in those
   * subtrees is still *counted*, because the gap rule measures how much copy the reader travels
   * between two links, and a heading between two paragraphs is copy they travel through.
   */
  private walk(node: LexicalNode | undefined | null, linkable: boolean): void {
    if (!node) return

    const type = node.type ?? ''
    const neverLink = NEVER_LINK_NODE_TYPES.has(type)

    // A link the editor inserted spends its target for the whole page, so the walk resolves it
    // here — through the same helper the renderer uses, so the two can never disagree about where
    // a link node points.
    if (node.type === 'link' || node.type === 'autolink') {
      this.reserve(resolveRichTextLink(node as never)?.href)
    } else if (node.type === 'relationship') {
      const value = node.value
      if (value && typeof value === 'object') {
        const slug = (value as { slug?: unknown }).slug
        const relationTo = node.relationTo
        if (typeof slug === 'string' && typeof relationTo === 'string') {
          this.reserve(docHref(relationTo, slug))
        }
      }
    } else if (
      node.type === 'block' &&
      node.fields?.blockType === 'boxedContent' &&
      node.fields.description &&
      typeof node.fields.description === 'object'
    ) {
      const descriptionRoot = (node.fields.description as { root?: LexicalNode }).root
      if (
        descriptionRoot &&
        typeof descriptionRoot === 'object' &&
        !this.collectedRoots.has(descriptionRoot)
      ) {
        this.collectedRoots.add(descriptionRoot)
        this.walk(descriptionRoot, linkable && !neverLink)
      }
    }

    // A text node is the only node that carries its own words.
    if (type === 'text') {
      const text = typeof node.text === 'string' ? node.text : ''
      if (text.length > 0) {
        // A node already decided is never re-queued. `<RichText>` calls `collect()` as it renders,
        // so without this guard the render pass would re-submit nodes the pre-pass already settled
        // and `flush()` would overwrite their links with an empty plan — the phrases and targets
        // they won are spent by then, so the second pass can only take away, never give.
        if (linkable && !this.plans.has(node)) {
          this.pending.push({ node, text, base: this.charCursor })
        }
        this.charCursor += text.length
      }
      return
    }

    // Everything else is a container: descend, switching off linkability for a never-link subtree.
    if (Array.isArray(node.children)) {
      for (const child of node.children) this.walk(child, linkable && !neverLink)
    }
  }

  /**
   * Decide what the collected nodes get, across the whole page.
   *
   * Candidates are considered in document order and accepted or dropped by the budget rules; once
   * a phrase or a target has been used on this page it is spent, so the first eligible mention is
   * the one that becomes the link.
   */
  flush(): void {
    if (!this.pending.length) return
    const batch = this.pending.splice(0, this.pending.length)

    for (const observed of batch) {
      const survivors: NodeLinkPlan = []

      for (const candidate of findLinkCandidates(observed.text, this.index)) {
        if (this.accepted >= this.settings.maxLinksPerPage) break
        // One mention per phrase: repeating an anchor is the pattern that reads as manipulation.
        if (this.usedPhrases.has(candidate.phrase)) continue
        // One link per target: a second link to the same URL passes nothing extra.
        if (this.usedHrefs.has(candidate.href)) continue
        // Never link a page to itself.
        if (this.selfHref && candidate.href === this.selfHref) continue

        const start = observed.base + candidate.start
        // Too close to the previous link — two anchors in one sentence read as a link farm.
        if (
          this.lastAcceptedEnd !== null &&
          start - this.lastAcceptedEnd < this.settings.minGapChars
        ) {
          continue
        }

        this.usedPhrases.add(candidate.phrase)
        this.usedHrefs.add(candidate.href)
        this.lastAcceptedEnd = observed.base + candidate.end
        this.accepted += 1
        survivors.push(candidate)
      }

      // Store an entry even when empty, so a node is only ever decided once.
      this.plans.set(observed.node, survivors)
    }
  }

  /** The mentions a given text node won, or `null` when it won none. */
  planFor(node: LexicalNode): NodeLinkPlan | null {
    this.flush()
    const plan = this.plans.get(node)
    return plan && plan.length ? plan : null
  }
}

/* -------------------------------------------------------------------------- */
/* Rendering helper                                                            */
/* -------------------------------------------------------------------------- */

/** One run of characters: either plain text or a mention that became a link. */
export type AutoLinkSegment =
  { kind: 'text'; text: string } | { kind: 'link'; text: string; href: string }

/**
 * Cut a text node's string into plain runs and linked runs.
 *
 * The anchor text is the copy **exactly as written** — same words, same casing. Rewriting it to
 * the target's title would be the manipulative-anchor-text pattern Google's spam policy targets,
 * and it would also change what the reader sees mid-sentence.
 *
 * Spans are already disjoint and ordered (a regex scan guarantees it), so this is a single
 * forward pass. A malformed span is skipped rather than allowed to corrupt the string.
 */
export function splitAutoLinkedText(text: string, plan: NodeLinkPlan): AutoLinkSegment[] {
  const segments: AutoLinkSegment[] = []
  let cursor = 0

  for (const match of plan) {
    if (match.start < cursor || match.end > text.length || match.end <= match.start) continue

    if (match.start > cursor) segments.push({ kind: 'text', text: text.slice(cursor, match.start) })
    segments.push({ kind: 'link', text: text.slice(match.start, match.end), href: match.href })
    cursor = match.end
  }

  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) })

  return segments
}
