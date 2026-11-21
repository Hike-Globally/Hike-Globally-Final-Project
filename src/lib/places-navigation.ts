import { sitePath } from '@/i18n/config'
import type { ResolvedLink } from './links'

const placesHref = sitePath('/places')

/** Recognize a CMS link to the index, including a trailing slash or query. */
const isPlacesIndex = (href: string): boolean =>
  href.split(/[?#]/, 1)[0]?.replace(/\/+$/, '') === placesHref

/** Add Places to the top-level header links without duplicating a CMS entry. */
export function withPlacesHeaderLink<T extends ResolvedLink>(links: T[], placesLink: T): T[] {
  if (links.some((link) => isPlacesIndex(link.href))) return links
  const destinationIndex = links.findIndex((link) => link.href.replace(/\/+$/, '') === sitePath('/destinations'))
  const insertAt = destinationIndex >= 0 ? destinationIndex + 1 : links.length
  return [...links.slice(0, insertAt), placesLink, ...links.slice(insertAt)]
}

/** Add Places to one footer column, preferring the column with trips or destinations. */
export function withPlacesFooterLink<C extends { links: ResolvedLink[] }>(
  columns: C[],
  placesLink: ResolvedLink,
): C[] {
  if (columns.some((column) => column.links.some((link) => isPlacesIndex(link.href)))) return columns
  if (!columns.length) return columns
  const travelIndex = columns.findIndex((column) =>
    column.links.some((link) => /^\/(?:trips|destinations)(?:[/?#]|$)/.test(link.href)),
  )
  const index = travelIndex < 0 ? 0 : travelIndex
  return columns.map((column, columnIndex) =>
    columnIndex === index ? { ...column, links: [...column.links, placesLink] } : column,
  )
}
