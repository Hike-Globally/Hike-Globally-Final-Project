import type { Payload, Where } from 'payload'
import { defaultLocale } from '@/i18n/config'
import { readDifficultyFromSearch } from './difficulty'
import {
  readDestinationFromSearch,
  readSeasonFromSearch,
  readTripTypeFromSearch,
} from './trip-filters'

export const PAGE_SIZE = 24
export type Archive = 'trips' | 'destinations' | 'blog'
export type Search = Record<string, string | string[] | undefined>
export type ArchiveProps = { searchParams: Promise<Search> }
export type CatalogPage<T> = { docs: T[]; totalPages: number; totalDocs: number }

export function parsePage(value: Search[string]): number | null {
  if (value === undefined) return 1
  return typeof value === 'string' &&
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value) * PAGE_SIZE)
    ? Number(value)
    : null
}

export function archiveHref(archive: Archive, page: number, filters = '') {
  const params = new URLSearchParams(filters)
  if (page > 1) params.set('page', String(page))
  else params.delete('page')
  return `/${archive}${params.size ? `?${params}` : ''}`
}

export function searchString(search: Search) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search))
    if (typeof value === 'string') params.set(key, value)
  return params.toString()
}

export const tripSorts = {
  featured: '-featured',
  'price-asc': 'priceFrom',
  'price-desc': '-priceFrom',
  'duration-asc': 'durationDays',
  'duration-desc': '-durationDays',
} as const
export function tripFilters(search: string, destinations: { slug: string }[]) {
  const sort = new URLSearchParams(search).get('sort') ?? ''
  return {
    difficulty: readDifficultyFromSearch(search),
    destination: readDestinationFromSearch(
      search,
      new Set(destinations.map((d) => d.slug.toLowerCase())),
    ),
    season: readSeasonFromSearch(search),
    type: readTripTypeFromSearch(search),
    sort: Object.hasOwn(tripSorts, sort) ? (sort as keyof typeof tripSorts) : ('featured' as const),
  }
}
export type TripFilters = ReturnType<typeof tripFilters>
export function filterQuery(filters: Record<string, string>) {
  return new URLSearchParams(
    Object.entries(filters).filter(
      ([key, v]) => v !== 'all' && !(key === 'sort' && v === 'featured'),
    ),
  ).toString()
}

export function tripConditions(filters: TripFilters, destinationId?: number): Where[] {
  return [
    ...(filters.difficulty !== 'all' ? [{ difficulty: { equals: filters.difficulty } }] : []),
    ...(filters.season !== 'all' ? [{ bestSeasons: { in: [filters.season] } }] : []),
    ...(filters.type !== 'all' ? [{ tripType: { equals: filters.type } }] : []),
    ...(destinationId !== undefined ? [{ destination: { equals: destinationId } }] : []),
  ]
}

export async function collectPages<T>(
  read: (page: number) => Promise<{ docs: T[]; hasNextPage: boolean }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let page = 1; ; page++) {
    const result = await read(page)
    rows.push(...result.docs)
    if (!result.hasNextPage) return rows
  }
}

/** Detail-route guards and static params use the same complete published inventory. */
export async function readPublishedSlugs(
  payload: Pick<Payload, 'find'>,
  collection: Archive | 'pages',
) {
  const rows = await collectPages((page) =>
    payload.find({
      collection,
      page,
      limit: 500,
      sort: 'id',
      locale: defaultLocale,
      depth: 0,
      select: { slug: true },
      where: { _status: { equals: 'published' } },
    }),
  )
  return rows.flatMap((row) => (row.slug ? [row.slug] : []))
}
