import { resolveSiteUrl } from './site-url'

/**
 * The "Link preview" section on trips and blog posts: an admin pastes a URL and the public page
 * shows a compact card for it (thumbnail, title, description, rating, prices).
 *
 * Only the URL is required. Title, description and image come from the page's own metadata
 * (Open Graph / Twitter / <title>) and can be overridden by the editor. Rating, review count and
 * prices are typed in, since they are not part of any page's metadata.
 */

/** The fields an editor fills in on a trip or post (see `src/fields/link-preview.ts`). */
export type LinkPreviewSource = {
  linkPreviewUrl?: string | null
  linkPreviewTitle?: string | null
  linkPreviewDescription?: string | null
  linkPreviewRating?: number | null
  linkPreviewReviewCount?: number | null
  linkPreviewPrice?: string | null
  linkPreviewOriginalPrice?: string | null
}

export type LinkPreviewMetadata = {
  title?: string
  description?: string
  image?: string
}

export type ResolvedLinkPreview = {
  href: string
  /** Pages on another origin open in a new tab; this site's own pages stay in the tab. */
  external: boolean
  host: string
  title: string
  description: string
  image: string | null
  rating: number | null
  reviewCount: number | null
  price: string | null
  originalPrice: string | null
}

const FETCH_TIMEOUT_MS = 5000
/** Metadata sits in the document head; there is no reason to download a whole page. */
const MAX_HEAD_BYTES = 256 * 1024
const USER_AGENT = 'HikeGloballyLinkPreview/1.0 (+https://hikeglobally.com)'

/**
 * Accepts an absolute http(s) URL, or a root-relative path such as `/trips/annapurna-base-camp`.
 * Returns an error message for the admin field, or `true`.
 */
export function validateLinkPreviewUrl(value: unknown): true | string {
  if (value === null || value === undefined || value === '') return true
  if (typeof value !== 'string') return 'Enter a web address.'
  const url = value.trim()
  if (url.startsWith('/') && !url.startsWith('//')) return true
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return true
  } catch {
    // fall through to the message below
  }
  return 'Enter a full address starting with https:// (or a path starting with /).'
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

/** Decodes the entities that show up in meta tag values (`&amp;`, `&#39;`, `&#x2019;`, …). */
export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match
  })
}

function readAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g
  for (const match of tag.matchAll(pattern)) {
    const name = match[1].toLowerCase()
    if (name in attributes) continue
    attributes[name] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? '')
  }
  return attributes
}

/**
 * Reads title, description and image from an HTML document. Open Graph wins over Twitter cards,
 * which win over the plain `<title>` and `description` tags. Relative image URLs are resolved
 * against the page's own address.
 */
export function parseLinkPreviewMetadata(html: string, pageUrl: string): LinkPreviewMetadata {
  const head = html.slice(0, MAX_HEAD_BYTES)
  const meta: Record<string, string> = {}

  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = readAttributes(tag)
    const key = (attributes.property ?? attributes.name ?? '').toLowerCase()
    const content = attributes.content?.trim()
    if (key && content && !(key in meta)) meta[key] = content
  }

  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  const title =
    meta['og:title'] ??
    meta['twitter:title'] ??
    (titleTag ? decodeHtmlEntities(titleTag).replace(/\s+/g, ' ').trim() : undefined)
  const description =
    meta['og:description'] ?? meta['twitter:description'] ?? meta.description ?? undefined
  const rawImage = meta['og:image'] ?? meta['og:image:url'] ?? meta['twitter:image']

  let image: string | undefined
  if (rawImage) {
    try {
      image = new URL(rawImage, pageUrl).toString()
    } catch {
      image = undefined
    }
  }

  return {
    title: title || undefined,
    description: description || undefined,
    image,
  }
}

/** Turns an editor's value into an absolute URL for fetching; `null` when it is not usable. */
export function absoluteLinkPreviewUrl(value: string): string | null {
  const url = value.trim()
  if (!url) return null
  try {
    const base = resolveSiteUrl()
    const parsed = new URL(url, base)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Downloads the page's metadata. Any failure (timeout, non-HTML, network error) resolves to
 * `null`, so the card still renders from the editor's own fields. Cached by Next's Data Cache
 * for an hour, the same as the page that shows it.
 */
export async function fetchLinkPreviewMetadata(
  absoluteUrl: string,
): Promise<LinkPreviewMetadata | null> {
  try {
    const response = await fetch(absoluteUrl, {
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 3600 },
    })
    if (!response.ok) return null
    const type = response.headers.get('content-type') ?? ''
    if (!/text\/html|application\/xhtml/i.test(type)) return null
    const html = await readHead(response)
    return parseLinkPreviewMetadata(html, response.url || absoluteUrl)
  } catch {
    return null
  }
}

async function readHead(response: Response): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let received = 0
  let text = ''
  while (received < MAX_HEAD_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    text += decoder.decode(value, { stream: true })
    // Stop early once the head has closed: nothing useful follows it.
    if (/<\/head>/i.test(text)) break
  }
  await reader.cancel().catch(() => undefined)
  return text
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

function cleanText(value: string | null | undefined): string | null {
  const text = value?.trim()
  return text ? text : null
}

function cleanNumber(value: number | null | undefined, max?: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return max === undefined ? value : Math.min(value, max)
}

/**
 * Builds the card for a page. Returns `null` when no URL is set, which hides the section.
 * `metadata` is injectable so the merge rules can be tested without the network.
 */
export async function resolveLinkPreview(
  source: LinkPreviewSource,
  metadata?: (url: string) => Promise<LinkPreviewMetadata | null>,
): Promise<ResolvedLinkPreview | null> {
  const rawUrl = cleanText(source.linkPreviewUrl)
  if (!rawUrl || validateLinkPreviewUrl(rawUrl) !== true) return null

  const absolute = absoluteLinkPreviewUrl(rawUrl)
  if (!absolute) return null

  const fetched = await (metadata ?? fetchLinkPreviewMetadata)(absolute)
  const host = hostOf(absolute)
  const siteHost = hostOf(resolveSiteUrl())

  return {
    href: rawUrl.startsWith('/') ? rawUrl : absolute,
    external: host !== siteHost,
    host,
    title: cleanText(source.linkPreviewTitle) ?? fetched?.title ?? host,
    description: cleanText(source.linkPreviewDescription) ?? fetched?.description ?? '',
    image: fetched?.image ?? null,
    rating: cleanNumber(source.linkPreviewRating, 5),
    reviewCount: cleanNumber(source.linkPreviewReviewCount),
    price: cleanText(source.linkPreviewPrice),
    originalPrice: cleanText(source.linkPreviewOriginalPrice),
  }
}
