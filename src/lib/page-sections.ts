/** Shared by the CMS and public/preview renderers. Order is document-specific. */
export const tripSectionOptions = [
  { label: 'Hero & trip facts', value: 'hero' },
  { label: 'Key Takeaways', value: 'keyTakeaways' },
  { label: 'Overview', value: 'overview' },
  { label: 'Why Choose This Trek', value: 'whyChoose' },
  // Added after Why Choose This Trek shipped: migration 20261104_155601_trip_who_for_sections
  // inserts these rows right after it in every layout saved before they existed (or at the end
  // when that row was removed), so older trips get them too.
  { label: 'Who Is This Trek For', value: 'whoFor' },
  { label: 'Who Is This Trek Not For', value: 'whoNotFor' },
  { label: 'Highlights', value: 'highlights' },
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
