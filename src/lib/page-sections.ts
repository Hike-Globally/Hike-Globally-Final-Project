import type { ReactNode } from 'react'

import { MULTI_URL_PREVIEW_NAME, type MultiUrlPreviewSource } from './multi-url-preview'

/** Shared by the CMS and public/preview renderers. Order is document-specific. */
export const tripSectionOptions = [
  { label: 'Hero & trip facts', value: 'hero' },
  // The primary trip-story sequence, also used by the sticky section navigation.
  { label: 'Overview', value: 'overview' },
  { label: 'Highlights', value: 'highlights' },
  { label: 'Itinerary', value: 'itinerary' },
  { label: 'Essential information', value: 'information' },
  { label: 'Hotels Near Destination', value: 'hotelsNearDestination' },
  { label: 'Departures', value: 'departures' },
  { label: 'FAQs', value: 'faqs' },
  // Optional supporting sections follow the primary sequence. Existing saved layouts are
  // normalized to this primary order at render time while these supporting rows keep their order.
  { label: 'Key Takeaways', value: 'keyTakeaways' },
  { label: 'Why Choose This Trek', value: 'whyChoose' },
  { label: 'Who is this trip for / not for', value: 'audience' },
  { label: 'Link preview', value: 'linkPreview' },
  { label: MULTI_URL_PREVIEW_NAME, value: 'multiUrlPreview' },
  { label: 'Original route map and altitude chart', value: 'routeMap' },
  { label: 'Included / not included', value: 'inclusions' },
  { label: 'Packing list', value: 'packing' },
  { label: 'Gallery', value: 'gallery' },
  { label: 'Inquiry form', value: 'inquiry' },
  { label: 'Related trips', value: 'related' },
]

export const blogSectionOptions = [
  { label: 'Hero & post details', value: 'hero' },
  { label: 'Article body & table of contents', value: 'content' },
  // Added with the link preview card: migration 20261115_180000_link_preview inserts this row
  // straight after the article body in every layout saved before it.
  { label: 'Link preview', value: 'linkPreview' },
  { label: MULTI_URL_PREVIEW_NAME, value: 'multiUrlPreview' },
  // Added after page layouts shipped: migration 20261019_045205_blog_faqs inserts this row
  // after the article body in every layout saved before it existed, so older posts get it too.
  { label: 'FAQs', value: 'faqs' },
  { label: 'About the author', value: 'author' },
  { label: 'Back to journal', value: 'navigation' },
  { label: 'Planning call to action', value: 'planning' },
  { label: 'Related posts', value: 'related' },
]

export type PageSection = MultiUrlPreviewSource & {
  id?: string | null
  kind: string
  heading?: string | null
  html?: string | null
  /* A Link preview row carries the card's own content (src/fields/link-preview.ts). The page
     sections array is localized, so each language keeps its own copy of the row. */
  linkPreviewUrl?: string | null
  linkPreviewTitle?: string | null
  linkPreviewDescription?: string | null
  linkPreviewRating?: number | null
  linkPreviewReviewCount?: number | null
  linkPreviewPrice?: string | null
  linkPreviewOriginalPrice?: string | null
}

/**
 * The sections a page may hold more than one of.
 *
 * Custom HTML rows were always repeatable — a page can carry several snippets. **Link preview**
 * rows are repeatable too: a trip or post often points at more than one place (the operator, a
 * partner's booking page, a related guide), and each row keeps its own URL and card details, so
 * the cards can sit at different points in the layout. Multi-URL Preview rows similarly keep
 * their own ordered links and presentation settings, so several collections can be placed.
 *
 * Every other built-in section reads the document itself (`itinerary`, `faqs`, `hero`, …) and can
 * only be placed once; adding it a second time would show the same content twice.
 */
export const REPEATABLE_SECTION_KINDS: ReadonlySet<string> = new Set([
  'html',
  'linkPreview',
  'multiUrlPreview',
])

export function defaultPageSections(options: { value: string }[]): PageSection[] {
  // A new collection is opt-in. Do not insert even an empty row into existing/default layouts.
  return options
    .filter(({ value }) => value !== 'multiUrlPreview')
    .map(({ value }) => ({ kind: value }))
}

/** Older documents have no layout: keep their original sections and order. */
export function resolvePageSections(
  sections: PageSection[] | null | undefined,
  options: { value: string }[],
): PageSection[] {
  const allowed = new Set(options.map(({ value }) => value))
  const seen = new Set<string>()
  return (sections?.length ? sections : defaultPageSections(options)).filter(({ kind }) => {
    if (kind === 'html') return true
    if (!allowed.has(kind)) return false
    // Repeatable rows are kept in the order they were saved, however many there are.
    if (REPEATABLE_SECTION_KINDS.has(kind)) return true
    if (seen.has(kind)) return false
    seen.add(kind)
    return true
  })
}

/**
 * Keep the trip's main content sections in the same predictable sequence on every trip page.
 * The CMS can still hide sections; optional/supporting rows retain their saved order and are
 * rendered after this primary sequence. The hero remains first, with inquiry/related bands last.
 */
export function orderTripPageSections(sections: PageSection[]): PageSection[] {
  const primaryOrder = [
    'overview',
    'highlights',
    'audience',
    'itinerary',
    'hotelsNearDestination',
    'information',
    'routeMap',
    'departures',
    'faqs',
  ]
  const primary = new Set(primaryOrder)
  const edgeSections = new Set(['hero', 'inquiry', 'related'])
  const take = (kind: string) => sections.filter((section) => section.kind === kind)
  const hero = take('hero')
  const body = primaryOrder.flatMap(take)
  const supporting = sections.filter(({ kind }) => !primary.has(kind) && !edgeSections.has(kind))
  const closing = sections.filter(({ kind }) => kind === 'inquiry' || kind === 'related')

  return [...hero, ...body, ...supporting, ...closing]
}

/**
 * A page section's rendered node. Usually the node itself, because most sections read the document
 * (a trip's itinerary, a post's body); `linkPreview` is a function because its content belongs to
 * the row — the URL and card details an editor typed into that page section.
 */
export type PageSectionContent = ReactNode | ((section: PageSection) => ReactNode)

/** The node for `section`, calling the entry when that section needs the row it came from. */
export function resolveSectionContent(
  content: Record<string, PageSectionContent>,
  section: PageSection,
): ReactNode {
  const entry = content[section.kind]
  return typeof entry === 'function' ? entry(section) : entry
}

/**
 * The address a Link preview row points at, shortened for the admin's row label:
 * `https://www.booking.com/hotel/np/…` → `booking.com`, while a site path stays as it is. `null`
 * until the editor has typed a URL, so two empty rows still read the same.
 */
export function linkPreviewAddress(url: string | null | undefined): string | null {
  const value = url?.trim()
  if (!value) return null
  if (value.startsWith('/')) return value
  try {
    return new URL(value).host.replace(/^www\./, '')
  } catch {
    return value
  }
}

/**
 * The admin-side rule: a built-in section may only be placed once, because it renders the document
 * itself and a second copy would repeat that content. Custom HTML, Link preview and Multi-URL Preview rows are
 * repeatable (see `REPEATABLE_SECTION_KINDS`) — each one carries its own content, so several of
 * them are several different sections.
 */
export function validatePageSections(value: unknown): true | string {
  if (!Array.isArray(value)) return true
  const seen = new Set<string>()
  for (const section of value as PageSection[]) {
    if (!section.kind || REPEATABLE_SECTION_KINDS.has(section.kind)) continue
    if (seen.has(section.kind)) {
      return 'This section can only be added once. Custom HTML, Link preview and Multi-URL Preview rows can be repeated.'
    }
    seen.add(section.kind)
  }
  return true
}

/** Keep adjacent body sections together so sticky sidebars still work. Full-width bands
 * can be moved anywhere without trapping them in the content column. */
export function groupPageSections(sections: PageSection[], fullWidthKinds: string[]) {
  const groups: { fullWidth: boolean; sections: PageSection[] }[] = []
  for (const section of sections) {
    const fullWidth = fullWidthKinds.includes(section.kind)
    const previous = groups.at(-1)
    if (!fullWidth && previous && !previous.fullWidth) previous.sections.push(section)
    else groups.push({ fullWidth, sections: [section] })
  }
  return groups
}
