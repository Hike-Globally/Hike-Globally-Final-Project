import { sitePath } from '@/i18n/config'
import type { Page, Trip, Destination, Blog } from '@/payload-types'

/**
 * Payload's reusable `link` field stores either an internal relationship
 * (`reference`) or a raw URL (`custom`). This resolves it to an href on this site —
 * so a link stored in the CMS can never point at a route that does not exist.
 */
export type LinkValue = {
  label?: string | null
  type?: 'reference' | 'custom' | null
  reference?:
    | {
        relationTo: 'pages'
        value: number | Page
      }
    | {
        relationTo: 'trips'
        value: number | Trip
      }
    | {
        relationTo: 'destinations'
        value: number | Destination
      }
    | {
        relationTo: 'blog'
        value: number | Blog
      }
    | null
  url?: string | null
  newTab?: boolean | null
}

export type ResolvedLink = {
  href: string
  label: string
  newTab: boolean
}

/** Narrows a relationship value to its populated document form (Payload returns an id when the
 *  referenced document is unpublished, deleted, or requested with `depth: 0`). */
const isPopulated = (
  value: unknown,
): value is { id: number; slug?: string | null; title?: string | null; name?: string | null } =>
  typeof value === 'object' && value !== null && 'slug' in value

/**
 * Returns `null` when the link can't be resolved (empty, or pointing at an unpublished
 * document that was deleted), so callers can simply skip rendering it.
 */
export const resolveLink = (link: LinkValue | null | undefined): ResolvedLink | null => {
  if (!link) return null

  const label = link.label ?? ''

  if (link.type === 'custom') {
    if (!link.url) return null
    // Existing CMS links to the retired inquiry route should lead directly to contact.
    const href = link.url.replace(/^\/inquiry(?=\?|#|$)/, '/contact')
    return { href, label, newTab: Boolean(link.newTab) }
  }

  const reference = link.reference
  if (!reference || typeof reference.value === 'number') return null

  const doc: unknown = reference.value

  switch (reference.relationTo) {
    case 'pages':
      if (!isPopulated(doc) || !doc.slug) return null
      return {
        href: doc.slug === 'home' ? sitePath('/') : sitePath(`/${doc.slug}`),
        label: label || doc.title || '',
        newTab: Boolean(link.newTab),
      }
    case 'trips':
      if (!isPopulated(doc) || !doc.slug) return null
      return {
        href: sitePath(`/trips/${doc.slug}`),
        label: label || doc.title || '',
        newTab: Boolean(link.newTab),
      }
    case 'destinations':
      if (!isPopulated(doc) || !doc.slug) return null
      return {
        href: sitePath(`/destinations/${doc.slug}`),
        label: label || doc.name || '',
        newTab: Boolean(link.newTab),
      }
    case 'blog':
      if (!isPopulated(doc) || !doc.slug) return null
      return {
        href: sitePath(`/blog/${doc.slug}`),
        label: label || doc.title || '',
        newTab: Boolean(link.newTab),
      }
    default:
      return null
  }
}

export const isExternal = (href: string): boolean =>
  /^https?:\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
