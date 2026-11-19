import {
  absoluteLinkPreviewUrl,
  resolveLinkPreview,
  type InternalLinkPreview,
  type LinkPreviewMetadata,
  type LinkPreviewResolvers,
  type ResolvedLinkPreview,
} from './link-preview'
import { fetchPublicLinkPreviewMetadata } from './link-preview-public-fetch'
import { normalizeMultiUrlPreview, type MultiUrlPreviewSource } from './multi-url-preview'
import { resolveSiteUrl } from './site-url'

/**
 * A bounded batch, not one blocking fetch per row. Four workers share an eight-second section
 * budget, retain the editor's order and memoize duplicate URLs. A failed / slow page still gets
 * the same finished host/override card as a single Link preview; it never leaves an empty slot.
 */
export async function resolveMultiUrlPreview(
  source: MultiUrlPreviewSource,
  resolvers: LinkPreviewResolvers = {},
  { budgetMs = 8_000 }: { budgetMs?: number } = {},
) {
  const normalized = normalizeMultiUrlPreview(source)
  if (!normalized.links.length) return null

  const deadline = Date.now() + Math.max(0, budgetMs)
  const metadataCache = new Map<string, Promise<LinkPreviewMetadata | null>>()
  const internalCache = new Map<string, Promise<InternalLinkPreview | null>>()
  const siteHost = new URL(resolveSiteUrl()).host.replace(/^www\./, '')
  const pending = new AbortController()
  const lookupMetadata =
    resolvers.metadata ?? ((url: string) => fetchPublicLinkPreviewMetadata(url, pending.signal))
  const shared: LinkPreviewResolvers = {
    metadata: (url) => {
      // This site's content comes from the Local API: never issue a recursive HTTP self-request.
      if (new URL(url).host.replace(/^www\./, '') === siteHost) return Promise.resolve(null)
      if (!metadataCache.has(url)) {
        metadataCache.set(
          url,
          Promise.resolve()
            .then(() => lookupMetadata(url))
            .catch(() => null),
        )
      }
      return metadataCache.get(url)!
    },
    internal: (url) => {
      if (!internalCache.has(url)) {
        internalCache.set(
          url,
          Promise.resolve()
            .then(() => resolvers.internal?.(url) ?? null)
            .catch(() => null),
        )
      }
      return internalCache.get(url)!
    },
  }
  const fallback: LinkPreviewResolvers = { metadata: async () => null, internal: async () => null }
  const cards: ResolvedLinkPreview[] = new Array(normalized.links.length)
  let cursor = 0

  async function worker() {
    while (cursor < normalized.links.length) {
      const index = cursor++
      const link = normalized.links[index]
      const remaining = deadline - Date.now()
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        const card =
          remaining > 0
            ? await Promise.race([
                resolveLinkPreview(link, shared),
                new Promise<null>((resolve) => {
                  timer = setTimeout(() => resolve(null), remaining)
                }),
              ])
            : null
        cards[index] = card ?? (await resolveLinkPreview(link, fallback))!
      } catch {
        cards[index] = (await resolveLinkPreview(link, fallback))!
      } finally {
        if (timer) clearTimeout(timer)
      }
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(4, normalized.links.length) }, worker))
  } finally {
    // Timed-out network work must not keep running after the finished fallback cards are returned.
    pending.abort()
  }
  return {
    heading: normalized.heading,
    description: normalized.description,
    layout: normalized.layout,
    animation: normalized.animation,
    // Normalization has already rejected bad addresses; this is a final defensive guard.
    cards: cards.filter((card) => card && absoluteLinkPreviewUrl(card.href)),
  }
}
