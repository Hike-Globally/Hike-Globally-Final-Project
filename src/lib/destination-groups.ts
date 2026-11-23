import type { DestinationCard } from '@/lib/data'

// These published continent entries have historically had "Nepal" in their country field.
// Identify them by slug first; all other records follow their actual country field.
const CONTINENTS = new Set(['asia', 'africa', 'europe', 'australia', 'north-america', 'south-america'])

/**
 * The six continent entries in the Destinations collection.
 *
 * Continents are hubs, not trekking regions: they have no country of their own, they group
 * trips (and, later, countries) rather than describing a single trail area, and — at the
 * moment — several of them host one trip and a generic essay. Anything that decides how a
 * destination is *presented or indexed* starts from this predicate, because a continent that
 * is treated like a region gets a region's title, a region's related links and a region's
 * place in the index.
 */
export function isContinentDestination(destination: { slug?: string | null }): boolean {
  return CONTINENTS.has(String(destination.slug ?? '').trim().toLowerCase())
}

export function isWorldDestination(destination: Pick<DestinationCard, 'slug' | 'country'>): boolean {
  return isContinentDestination(destination) || destination.country.trim().toLowerCase() !== 'nepal'
}

export function destinationLocationLabel(destination: Pick<DestinationCard, 'slug' | 'country'>): string {
  return isContinentDestination(destination) ? 'Continent' : destination.country
}
