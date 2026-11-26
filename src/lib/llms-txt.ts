import { sitePath } from '@/i18n/config'
import { DIFFICULTY_LEVELS } from './difficulty'
import { truncate } from './format'
import { PLACE_INDEX_PATH, placeCategories, placeCategoryPath } from './place-categories'
import { canonicalUrl } from './seo'
import { isReservedPageSlug } from './site-routes'

/**
 * ============================================================================
 * llms.txt — the site described to a language model
 * ============================================================================
 *
 * `src/app/llms.txt/route.ts` is the route (served at `/llms.txt`); this module is the document it
 * returns. Same split as `/sitemap.xml` (`src/app/sitemap.ts` → `src/lib/sitemap.ts`), for the same
 * reason: the rules can be tested directly, without a database or a Next.js request scope — see
 * `src/lib/llms-txt.test.ts`.
 *
 * WHAT llms.txt IS. The proposal at https://llmstxt.org is deliberately small: a single Markdown
 * file at the site root, starting with an H1 naming the site, then a blockquote summary, a few
 * paragraphs of detail, and H2 sections of links (`- [title](url): note`) that an assistant can
 * read instead of crawling the whole site. An `## Optional` section holds the links that can be
 * dropped when only a short context fits.
 *
 * WHY IT IS GENERATED, NOT HAND-WRITTEN. Two thirds of this file is a list of published trips,
 * destinations, posts, pages and the fixed Browse Places collections. A checked-in
 * `public/llms.txt` would go stale the moment an editor publishes a trip — the exact failure mode
 * the sitemap avoids by being a route. So the data comes from the same cached Payload readers as
 * `/sitemap.xml`, the same `canonicalUrl()` spelling, and the same exclusion rules:
 *
 *  1. ONLY PUBLISHED, INDEXABLE DOCUMENTS — no drafts, and nothing whose SEO panel asks search
 *     engines to skip it. If a page is `noindex`, this file must not advertise it either;
 *     otherwise it becomes a list of URLs the site itself disavows.
 *  2. URLS COME FROM `canonicalUrl()` — byte for byte the string in the page's
 *     `<link rel="canonical">` and in `/sitemap.xml`, so no list ever contradicts another.
 *  3. NOTHING APPEARS TWICE — a CMS page whose slug a route owns (`home` → `/`, `trips` →
 *     `/trips`, …) has no URL of its own and is skipped, exactly as in the sitemap.
 *
 * The one thing it does *not* share with the sitemap is `<lastmod>`-style noise: an llms.txt is
 * prose, and a date per line would only bury the facts a model is trying to read.
 */

/** `/llms.txt`, spelled once so the route, the revalidation hooks and the tests agree. */
export const LLMS_TXT_PATH = '/llms.txt'

/** The site as the file names it when the CMS settings are unavailable (a build with no database). */
const DEFAULT_SITE_NAME = 'Hike Globally'
const DEFAULT_TAGLINE = 'Trekking & expeditions in Nepal'

/**
 * One collection document, reduced to what this file prints.
 *
 * The shape is deliberately flat and field-name-agnostic: a trip contributes `title`/`summary`,
 * a destination contributes its `name`/`tagline` mapped onto the same two fields by
 * `getLlmsTxtSources()`, a post its `excerpt`, a page its meta description.
 */
export type LlmsTxtDocument = {
  /** The page title — a trip, post or page `title`, or a destination's `name`. */
  title?: string | null
  slug?: string | null
  /** One line of description: summary, tagline, excerpt or meta description. */
  summary?: string | null
  /** The document's SEO panel asks search engines to skip it (`meta.noIndex`). */
  noIndex?: boolean | null
  /** Trip-only facts, printed as the short spec line before the summary. */
  tripType?: string | null
  durationDays?: number | null
  difficulty?: string | null
  maxAltitude?: number | null
  priceFrom?: number | null
  priceCurrency?: string | null
}

/** Everything the file lists, exactly as `getLlmsTxtSources()` reads it from Payload. */
export type LlmsTxtSources = {
  trips: LlmsTxtDocument[]
  destinations: LlmsTxtDocument[]
  posts: LlmsTxtDocument[]
  news: LlmsTxtDocument[]
  pages: LlmsTxtDocument[]
}

/** What the file is on a database-less build: the static pages and nothing else. */
export const EMPTY_LLMS_TXT_SOURCES: LlmsTxtSources = {
  trips: [],
  destinations: [],
  posts: [],
  news: [],
  pages: [],
}

/** The CMS settings the file quotes: its own name, its one-line tagline and the contact address. */
export type LlmsTxtOptions = {
  siteName?: string | null
  tagline?: string | null
  email?: string | null
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/** Collapses editor whitespace so one document can never break the list it sits in. */
const clean = (value?: string | null): string => (value ?? '').replace(/\s+/g, ' ').trim()

/** Longest note printed per link. Enough for a summary's first sentence, never a paragraph. */
const MAX_NOTE_LENGTH = 220

/**
 * Escapes the characters that would end a link title early. A title containing `[` or `]` is
 * otherwise enough to turn the rest of the line into text outside the link.
 */
const escapeLinkText = (value: string): string => value.replace(/([\\[\]])/g, '\\$1')

/** `- [Title](url): note` — the one line shape every section uses. */
const entry = (title: string, path: string, note = ''): string => {
  const line = `- [${escapeLinkText(clean(title))}](${canonicalUrl(path)})`
  const trimmed = truncate(clean(note), MAX_NOTE_LENGTH)
  return trimmed ? `${line}: ${trimmed}` : line
}

/** `1,850` — thousands separators, so an altitude or a price reads as a number, not a digit run. */
const count = (value: number): string => new Intl.NumberFormat('en-US').format(value)

/** The labels of the trip-type select in `src/collections/Trips.ts`, keyed by stored value. */
const TRIP_TYPE_LABELS: Record<string, string> = {
  trekking: 'Trekking',
  expedition: 'Expedition',
  'peak-climbing': 'Peak climbing',
  cultural: 'Cultural tour',
  heli: 'Helicopter tour',
  'multi-sport': 'Multi-sport',
}

/**
 * The short spec line above a trip's summary — `14 days · Trekking · Challenging · max 5,364 m ·
 * from 1,850 USD`. Every part is optional: a document missing a field simply prints one fact less
 * rather than an empty slot, so a half-filled draft never produces ` ·  · `.
 */
const tripFacts = (document: LlmsTxtDocument): string => {
  const facts: string[] = []

  if (document.tripType) {
    facts.push(TRIP_TYPE_LABELS[document.tripType] ?? clean(document.tripType))
  }
  if (typeof document.durationDays === 'number' && document.durationDays > 0) {
    facts.push(`${document.durationDays} days`)
  }
  if (document.difficulty) {
    const label =
      DIFFICULTY_LEVELS.find((level) => level.value === document.difficulty)?.label ??
      clean(document.difficulty)
    facts.push(label)
  }
  if (typeof document.maxAltitude === 'number' && document.maxAltitude > 0) {
    facts.push(`max ${count(document.maxAltitude)} m`)
  }
  if (typeof document.priceFrom === 'number' && document.priceFrom > 0) {
    // The currency is part of the number: "$1,850" without a code is a guess on a Nepali site.
    facts.push(`from ${count(document.priceFrom)} ${clean(document.priceCurrency) || 'USD'}`)
  }

  return facts.join(' · ')
}

/** The summary after the spec line, if the document has one. */
const withSummary = (facts: string, summary?: string | null): string =>
  [facts, truncate(clean(summary), MAX_NOTE_LENGTH)].filter(Boolean).join(' — ')

/* -------------------------------------------------------------------------- */
/* Documents                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The documents that earn a line: a slug (so there is a URL), a title (so the link has a label),
 * not `noindex` (so the list never advertises a page the site hides), sorted by title so the file
 * does not reshuffle when the database returns rows in another order.
 */
const listed = (documents: LlmsTxtDocument[]): LlmsTxtDocument[] =>
  documents
    .filter(
      (document) =>
        typeof document.slug === 'string' &&
        document.slug.length > 0 &&
        !document.noIndex &&
        clean(document.title).length > 0,
    )
    .sort((a, b) => clean(a.title).toLowerCase().localeCompare(clean(b.title).toLowerCase(), 'en'))

/** A section of the file: an H2 and the links under it. Omitted entirely when it is empty. */
const section = (heading: string, entries: string[]): string =>
  entries.length === 0 ? '' : `## ${heading}\n\n${entries.join('\n')}`

/* -------------------------------------------------------------------------- */
/* The document                                                                */
/* -------------------------------------------------------------------------- */

/** The pages that exist without a CMS document behind them, with the note each one prints. */
const staticEntries = (): string[] => [
  entry('About Hike Globally', sitePath('/about'), 'Who is behind the trips and how they are run.'),
  entry(
    'Contact',
    sitePath('/contact'),
    'Enquiry form, email address and the promised reply time.',
  ),
  entry(
    'Sitemap',
    sitePath('/sitemap'),
    'The human-readable index of every public page, layer by layer.',
  ),
]

/** The fixed Browse Places index and its nine landscape-specific collections. */
const placeEntries = (): string[] => [
  entry(
    'Browse places',
    PLACE_INDEX_PATH,
    'Nine curated landscape collections linking trips and field notes by the feature that defines a place.',
  ),
  ...placeCategories.map((category) =>
    entry(category.label, placeCategoryPath(category.value), category.description),
  ),
]

/**
 * Builds the whole file: heading, summary, the prose that explains what each kind of page holds,
 * then the link lists. `sources` is everything `getLlmsTxtSources()` found; the defaults mean a
 * build without a database still yields a truthful (if short) file.
 */
export const buildLlmsTxt = (
  sources: LlmsTxtSources = EMPTY_LLMS_TXT_SOURCES,
  options: LlmsTxtOptions = {},
): string => {
  const siteName = clean(options.siteName) || DEFAULT_SITE_NAME
  const tagline = clean(options.tagline) || DEFAULT_TAGLINE
  const email = clean(options.email)
  const homepage = canonicalUrl('/')

  const trips = listed(sources.trips).map((document) =>
    entry(
      clean(document.title),
      sitePath(`/trips/${document.slug}`),
      withSummary(tripFacts(document), document.summary),
    ),
  )

  const destinations = listed(sources.destinations).map((document) =>
    entry(
      clean(document.title),
      sitePath(`/destinations/${document.slug}`),
      document.summary ?? '',
    ),
  )

  const posts = listed(sources.posts).map((document) =>
    entry(clean(document.title), sitePath(`/blog/${document.slug}`), document.summary ?? ''),
  )

  const news = listed(sources.news).map((document) =>
    entry(clean(document.title), sitePath(`/news/${document.slug}`), document.summary ?? ''),
  )

  // `home`, `trips`, `blog` and the rest have a route of their own, so a page document with one of
  // those slugs has no URL to print — the same rule `/sitemap.xml` applies.
  const pages = listed(sources.pages)
    .filter((document) => !isReservedPageSlug(document.slug ?? ''))
    .map((document) =>
      entry(clean(document.title), sitePath(`/${document.slug}`), document.summary ?? ''),
    )

  const pageEntries = [...staticEntries(), ...pages]

  const optionalEntries = [
    entry(
      'Sitemap',
      sitePath('/sitemap.xml'),
      'Machine-readable list of every public URL and its last modification date.',
    ),
    entry('Privacy policy', sitePath('/privacy'), 'What this site collects and why.'),
    entry('Terms', sitePath('/terms'), 'The terms that apply to bookings and use of the site.'),
  ]

  const contact = email
    ? `For questions or a booking enquiry, use the form at ${canonicalUrl('/contact')} or write to ${email}.`
    : `For questions or a booking enquiry, use the form at ${canonicalUrl('/contact')}.`

  return [
    `# ${siteName}`,
    '',
    `> ${tagline}`,
    '',
    `Everything ${siteName} publishes lives at ${homepage}: trekking, expedition, peak-climbing, cultural and helicopter itineraries in the Nepal Himalaya, guides to the regions those trips cross, and a journal of long-form trail writing. The site is in English at plain URLs (no locale prefixes), and every page has exactly one canonical URL.`,
    '',
    `A trip page carries the full plan: an overview, highlights, a day-by-day itinerary, what is and is not included, a packing list, the best seasons, group size, maximum altitude, a difficulty rating with ${DIFFICULTY_LEVELS.length} levels (${DIFFICULTY_LEVELS[0].label} to ${DIFFICULTY_LEVELS[DIFFICULTY_LEVELS.length - 1].label}), departure dates and prices, and a downloadable PDF brochure. Prices are per person in USD, EUR or NPR as stated on the page.`,
    '',
    contact,
    '',
    section('Trips', trips),
    section('Destinations', destinations),
    section('Journal', posts),
    section('News', news),
    section('Places', placeEntries()),
    section('Pages', pageEntries),
    section('Optional', optionalEntries),
  ]
    .filter((block) => block !== '')
    .join('\n\n')
    .concat('\n')
}
