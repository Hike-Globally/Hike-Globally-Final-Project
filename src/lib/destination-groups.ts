import type { DestinationCard } from '@/lib/data'

// These published continent entries have historically had "Nepal" in their country field.
// Identify them by slug first; all other records follow their actual country field.
const CONTINENTS = new Set(['asia', 'africa', 'europe', 'australia', 'north-america', 'south-america'])

export function isWorldDestination(destination: Pick<DestinationCard, 'slug' | 'country'>): boolean {
  return CONTINENTS.has(destination.slug.toLowerCase()) || destination.country.trim().toLowerCase() !== 'nepal'
}

export function destinationLocationLabel(destination: Pick<DestinationCard, 'slug' | 'country'>): string {
  return CONTINENTS.has(destination.slug.toLowerCase()) ? 'Continent' : destination.country
}
