import type { ReactNode } from 'react'

/** Shared by the CMS and public/preview renderers. Order is document-specific. */
export const tripSectionOptions = [
  { label: 'Hero & trip facts', value: 'hero' },
  { label: 'Key Takeaways', value: 'keyTakeaways' },
  { label: 'Overview', value: 'overview' },
  { label: 'Why Choose This Trek', value: 'whyChoose' },
  { label: 'Highlights', value: 'highlights' },
  // Added after page layouts shipped: migration 20261107_120000_trip_audience inserts this row
  // right after Highlights in every layout saved before it existed.
  { label: 'Who is this trip for / not for', value: 'audience' },
  // Added with the link preview card: migration 20261115_180000_link_preview inserts this row
  // after the audience pair (or after Highlights / Overview) in every layout saved before it.
  { label: 'Link preview', value: 'linkPreview' },
  { label: 'Original route map and altitude chart', value: 'routeMap' },
  { label: 'Itinerary', value: 'itinerary' },
  { label: 'Departures', value: 'departures' },
  { label: 'Essential information', value: 'information' },
  { label: 'Included / not included', value: 'inclusions' },
  { label: 'Packing list', value: 'packing' },
  { label: 'FAQs', value: 'faqs' },
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
  // Added after page layouts shipped: migration 20261019_045205_blog_faqs inserts this row
  // after the article body in every layout saved before it existed, so older posts get it too.
  { label: 'FAQs', value: 'faqs' },
  { label: 'About the author', value: 'author' },
  { label: 'Back to journal', value: 'navigation' },
  { label: 'Planning call to action', value: 'planning' },
  { label: 'Related posts', value: 'related' },
]

export type PageSection = {
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

export function defaultPageSections(options: { value: string }[]): PageSection[] {
  return options.map(({ value }) => ({ kind: value }))
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
    if (!allowed.has(kind) || seen.has(kind)) return false
    seen.add(kind)
    return true
  })
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

export function validatePageSections(value: unknown): true | string {
  if (!Array.isArray(value)) return true
  const seen = new Set<string>()
  for (const section of value as PageSection[]) {
    if (!section.kind || section.kind === 'html') continue
    if (seen.has(section.kind)) return 'Each existing page section can only be added once.'
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
