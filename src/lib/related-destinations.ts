import type { DestinationCard } from '@/lib/data'
import { isContinentDestination } from '@/lib/destination-groups'

/**
 * Related destinations — the "More …" rail at the foot of `/destinations/[slug]`.
 *
 * The rail used to be `allDestinations.filter((item) => item.id !== destination.id).slice(0, 3)`,
 * which reads "everything that is not me, in listing order". Listing order is `-featured`, and
 * the featured destinations are Nepal's five regions — so Europe, Australia, Asia, Africa and
 * both Americas all ended their page with three Nepali regions under the heading "More trekking
 * regions". A visitor on the Europe page was offered Kanchenjunga, and a crawler was told the
 * site's own idea of "related to Europe" is Nepal.
 *
 * Two rules fix that, and the second only exists because of the first:
 *
 *   1. A destination only recommends destinations of its own kind. A continent recommends
 *      continents; a region recommends regions. The two groups answer different questions
 *      ("where in the world?" vs "which valley next?") and never belong in one rail.
 *   2. Within a group, score by what the two actually share — country first, then the CMS
 *      `region` bucket — and keep the caller's order for ties. Listing order is still
 *      featured-first, so a tie resolves the way the rest of the site already sorts.
 */

/** Everything the scorer needs; callers may pass a fuller card. */
export type RelatedDestination = Pick<DestinationCard, 'id' | 'country' | 'region' | 'featured'> & {
  /** A CMS document's slug is nullable; the route only renders documents that have one. */
  slug?: string | null
}

const normalize = (value: string | null | undefined): string => value?.trim().toLowerCase() ?? ''

const score = (current: RelatedDestination, candidate: RelatedDestination): number => {
  let points = 0
  if (normalize(candidate.country) && normalize(candidate.country) === normalize(current.country)) {
    points += 8
  }
  if (candidate.region && candidate.region === current.region) points += 4
  if (candidate.featured) points += 1
  return points
}

/**
 * Up to `limit` destinations worth recommending after `current`, or fewer when the group is
 * small. Never returns `current`, and never mixes a continent with a region.
 */
export function relatedDestinations<T extends RelatedDestination>(
  current: RelatedDestination,
  all: readonly T[],
  limit = 3,
): T[] {
  const continent = isContinentDestination(current)

  return all
    .filter((item) => item.id !== current.id && isContinentDestination(item) === continent)
    .map((item) => ({ item, points: score(current, item) }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map(({ item }) => item)
}

/**
 * The rail's heading. "More trekking regions" is simply untrue on a continent page — the cards
 * below it are continents — so the heading follows the group the rail is actually showing.
 */
export function relatedDestinationsHeading(current: {
  slug?: string | null
  name?: string | null
}): string {
  return isContinentDestination(current) ? 'More trekking destinations' : 'More trekking regions'
}
