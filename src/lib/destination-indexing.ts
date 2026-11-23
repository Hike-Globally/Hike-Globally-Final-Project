import { isContinentDestination } from './destination-groups'
import { lexicalToPlainText } from './format'

/**
 * Which destination pages are worth an index entry.
 *
 * Nepal's five regions are the site's topical hubs: each one carries a real trail area, its own
 * trips and its own copy, so every one of them is indexed. The six continent entries are a
 * different kind of page — and right now they are the thinnest URLs on the site: a continent
 * with one trip is a longer way of saying that one trip, plus a general essay about the
 * continent that no trekker searches for. Google either ignores those pages or ranks the trip
 * instead, and in the meantime they sit in the index as near-duplicates.
 *
 * So a continent has to *earn* its entry, and it can do that in either of two ways:
 *
 *   - `CONTINENT_MIN_TRIPS` published trips — the page is genuinely aggregating something; or
 *   - `CONTINENT_MIN_WORDS` words of destination copy — the page stands on its own as a guide.
 *
 * A region never has to qualify. The rule is deliberately about the *page*, not the continent:
 * it clears itself the moment an editor publishes a second trip, with no code change.
 *
 * The verdict is applied in the three places that must agree — the page's own robots meta,
 * `/sitemap.xml` (and `/llms.txt`, which reads the same documents) and the HTML sitemap chart.
 * A page that hides itself but is still advertised in a sitemap is the one inconsistency
 * `src/lib/sitemap.test.ts` exists to prevent.
 */
export const CONTINENT_MIN_TRIPS = 2
export const CONTINENT_MIN_WORDS = 400

export type DestinationIndexabilityInput = {
  slug: string
  /** Published trips whose `destination` relationship points at this document. */
  tripCount: number
  /** The destination's rich-text `description`, as stored (plain object tree is fine). */
  description?: unknown
  /** The SEO panel's own `meta.noIndex` checkbox. */
  editorNoIndex?: boolean | null
}

/** Words in a destination description, counted from its plain-text rendering. */
export const destinationWordCount = (description: unknown): number => {
  const text = lexicalToPlainText(description)
  return text ? text.split(/\s+/).filter(Boolean).length : 0
}

/**
 * Why this destination is kept out of the index, or `null` when it should be indexed.
 * Returning the reason (rather than a bare boolean) keeps it loggable and testable.
 */
export function destinationNoIndexReason({
  slug,
  tripCount,
  description,
  editorNoIndex,
}: DestinationIndexabilityInput): string | null {
  if (editorNoIndex) return 'the SEO panel asks search engines to skip this page'

  // A region is always indexed — it is one of the site's topical hubs.
  if (!isContinentDestination({ slug })) return null

  if (tripCount >= CONTINENT_MIN_TRIPS) return null
  if (destinationWordCount(description) >= CONTINENT_MIN_WORDS) return null

  return (
    `a continent page is only indexed once it is a real hub — ` +
    `${CONTINENT_MIN_TRIPS}+ trips or ${CONTINENT_MIN_WORDS}+ words of destination copy ` +
    `(this one has ${tripCount} and ${destinationWordCount(description)})`
  )
}

export function isIndexableDestination(input: DestinationIndexabilityInput): boolean {
  return destinationNoIndexReason(input) === null
}
