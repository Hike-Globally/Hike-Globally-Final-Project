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

type ViewLiveArgs = {
  collectionSlug?: string
  globalSlug?: string
  /** The saved slug of the document (ignored for globals). */
  slug?: unknown
  /** Whether a published version exists, i.e. whether the public page is actually reachable. */
  published?: boolean
}

/**
 * The "View live page" target for the admin. Returns the public storefront URL when the document
 * is published (or is a global, which always renders), the authenticated draft-preview route when
 * the document has never been published (the public URL would 404), and `null` for entities that
 * have no storefront page (users, media) or no slug yet.
 */
export const resolveViewLiveHref = ({
  collectionSlug,
  globalSlug,
  slug,
  published = true,
}: ViewLiveArgs): { href: string; isDraftPreview: boolean } | null => {
  if (globalSlug) return { href: '/', isDraftPreview: false }

  const cleanSlug = typeof slug === 'string' ? slug.trim() : ''
  if (!collectionSlug || !cleanSlug) return null

  const path = resolveLivePreviewPath({ collectionConfig: { slug: collectionSlug }, data: { slug: cleanSlug } })
  if (!path) return null

  return published
    ? { href: path, isDraftPreview: false }
    : { href: buildLivePreviewURL(path), isDraftPreview: true }
}
