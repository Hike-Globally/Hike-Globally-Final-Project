import { sitePath } from '@/i18n/config'
import type { ResolvedLink } from './links'

const newsHref = sitePath('/news')

/** Recognize a CMS link to the news index, including a trailing slash or query. */
const isNewsIndex = (href: string): boolean =>
  href.split(/[?#]/, 1)[0]?.replace(/\/+$/, '') === newsHref

/** Add News to the top-level header links without duplicating a CMS entry (placed after Journal). */
export function withNewsHeaderLink<T extends ResolvedLink>(links: T[], newsLink: T): T[] {
  if (links.some((link) => isNewsIndex(link.href))) return links
  const blogIndex = links.findIndex((link) => link.href.replace(/\/+$/, '') === sitePath('/blog'))
  const insertAt = blogIndex >= 0 ? blogIndex + 1 : links.length
  return [...links.slice(0, insertAt), newsLink, ...links.slice(insertAt)]
}

/** Add News to one footer column, preferring the column that already links to Journal. */
export function withNewsFooterLink<C extends { links: ResolvedLink[] }>(
  columns: C[],
  newsLink: ResolvedLink,
): C[] {
  if (columns.some((column) => column.links.some((link) => isNewsIndex(link.href)))) return columns
  if (!columns.length) return columns
  const journalColumn = columns.findIndex((column) =>
    column.links.some((link) => link.href.replace(/\/+$/, '') === sitePath('/blog')),
  )
  const index = journalColumn < 0 ? 0 : journalColumn
  return columns.map((column, columnIndex) =>
    columnIndex === index ? { ...column, links: [...column.links, newsLink] } : column,
  )
}
