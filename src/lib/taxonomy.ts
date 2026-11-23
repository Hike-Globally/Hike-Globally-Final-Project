import { placeCategories, type PlaceCategory } from './place-categories'

/**
 * The two "where to go" taxonomies and how they relate.
 *
 * `/destinations/<region>` and `/places/<landscape>` are parallel ways into the same trips: a
 * region is *where* a journey happens, a landscape is *what you walk through*. Both are genuine,
 * neither replaces the other — but two hubs that never reference each other read to a search
 * engine as two pages competing for the same "where should I go" queries.
 *
 * These helpers derive the relationship from the trips the pages already render, so the hierarchy
 * is data, not copy an editor has to keep in sync:
 *
 *  - a destination page links to the landscapes its trips walk through (`landscapesOf`);
 *  - a landscape page links to the regions its trips run in (`regionsOf`).
 */

/** The landscapes a set of trips touches, in the canonical category order, each once. */
export const landscapesOf = (
  trips: readonly { placeCategories?: readonly (string | null)[] | null | undefined }[],
): PlaceCategory[] =>
  placeCategories.filter((category) =>
    trips.some((trip) => (trip.placeCategories ?? []).includes(category.value)),
  )

export type RegionLink = { name: string; slug: string }

/**
 * The regions a set of trips runs through, in the order the trips are listed, each once.
 *
 * A trip's `destination` may still be a bare id (a card read at depth 0), in which case there is
 * nothing to link to and the trip is skipped rather than guessed at.
 */
export const regionsOf = (trips: readonly { destination?: unknown }[]): RegionLink[] => {
  const seen = new Set<string>()
  const regions: RegionLink[] = []

  for (const trip of trips) {
    const destination = trip.destination
    if (!destination || typeof destination !== 'object') continue
    const { name, slug } = destination as { name?: unknown; slug?: unknown }
    if (typeof name !== 'string' || !name) continue
    if (typeof slug !== 'string' || !slug || seen.has(slug)) continue
    seen.add(slug)
    regions.push({ name, slug })
  }

  return regions
}
