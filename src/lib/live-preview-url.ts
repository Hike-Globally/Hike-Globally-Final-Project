import { defaultLocale, isLocale, type Locale } from '@/i18n/config'

type LivePreviewURLArgs = {
  collectionConfig?: { slug: string }
  data: Record<string, unknown>
  globalConfig?: { slug: string }
  locale: { code: string }
}

/**
 * Build an internal preview-entry URL instead of sending the iframe straight to the public page.
 * The entry route verifies the editor's Payload session, enables Next's Draft Mode, and then
 * redirects to the actual localized page.
 */
export const buildLivePreviewURL = (path: string): string =>
  `/api/live-preview?path=${encodeURIComponent(path)}`

/**
 * Resolve the storefront route for every entity that has a meaningful public representation.
 * Payload supplies `locale` as an object (`{ code, label }`), not a locale string.
 */
export const resolveLivePreviewPath = ({
  collectionConfig,
  data,
  globalConfig,
  locale,
}: LivePreviewURLArgs): string | null => {
  const language: Locale = isLocale(locale?.code) ? locale.code : defaultLocale
  const slug = typeof data.slug === 'string' ? data.slug.trim() : ''
  const encodedSlug = slug ? encodeURIComponent(slug) : ''

  if (globalConfig) return `/${language}`

  switch (collectionConfig?.slug) {
    case 'blog':
      return `/${language}/blog${encodedSlug ? `/${encodedSlug}` : ''}`
    case 'trips':
      return `/${language}/trips${encodedSlug ? `/${encodedSlug}` : ''}`
    case 'destinations':
      return `/${language}/destinations${encodedSlug ? `/${encodedSlug}` : ''}`
    case 'pages':
      return !slug || slug === 'home' ? `/${language}` : `/${language}/${encodedSlug}`
    default:
      return null
  }
}

/** Payload's shared Live Preview URL callback, used by content collections and site globals. */
export const siteLivePreviewURL = (args: LivePreviewURLArgs): string | null => {
  const path = resolveLivePreviewPath(args)
  return path ? buildLivePreviewURL(path) : null
}
