type LivePreviewURLArgs = {
  collectionConfig?: { slug: string }
  data: Record<string, unknown>
  globalConfig?: { slug: string }
  locale?: { code: string }
}

/**
 * Build an internal preview-entry URL instead of sending the iframe straight to the public page.
 * The entry route verifies the editor's Payload session, enables Next's Draft Mode, and then
 * redirects to the actual page.
 */
export const buildLivePreviewURL = (path: string): string =>
  `/api/live-preview?path=${encodeURIComponent(path)}`

/**
 * Resolve the storefront route for every entity that has a meaningful public representation.
 *
 * The site is English-only, so URLs carry no language prefix: a trip previews at `/trips/<slug>`.
 * Payload still hands the callback a `locale` object; it is unused.
 */
export const resolveLivePreviewPath = ({
  collectionConfig,
  data,
  globalConfig,
}: LivePreviewURLArgs): string | null => {
  const slug = typeof data.slug === 'string' ? data.slug.trim() : ''
  const encodedSlug = slug ? encodeURIComponent(slug) : ''

  if (globalConfig) return '/'

  switch (collectionConfig?.slug) {
    case 'blog':
      return `/blog${encodedSlug ? `/${encodedSlug}` : ''}`
    case 'trips':
      return `/trips${encodedSlug ? `/${encodedSlug}` : ''}`
    case 'destinations':
      return `/destinations${encodedSlug ? `/${encodedSlug}` : ''}`
    case 'pages':
      return !slug || slug === 'home' ? '/' : `/${encodedSlug}`
    default:
      return null
  }
}

/** Payload's shared Live Preview URL callback, used by content collections and site globals. */
export const siteLivePreviewURL = (args: LivePreviewURLArgs): string | null => {
  const path = resolveLivePreviewPath(args)
  return path ? buildLivePreviewURL(path) : null
}

/**
 * The path of one document's own page, or null when the document has no public page yet.
 *
 * Two cases return null, and both mean "there is nothing to open":
 *  - the collection has no public pages at all (Media, Users);
 *  - the document has no slug yet, so it can only be reached through its listing page — a link
 *    there would look like it belongs to the row but would really just open `/trips`.
 *
 * `resolveLivePreviewPath` is reused on purpose: the live-preview pane and the "View live" links
 * must never disagree about where a document lives on the site.
 */
export const resolveDocumentPath = (
  collectionSlug: string,
  data: Record<string, unknown> | null | undefined,
): string | null => {
  const slug = typeof data?.slug === 'string' ? data.slug.trim() : ''
  if (!slug) return null

  return resolveLivePreviewPath({ collectionConfig: { slug: collectionSlug }, data: data ?? {} })
}
