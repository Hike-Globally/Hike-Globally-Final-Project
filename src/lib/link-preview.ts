import { resolveSiteUrl } from './site-url'

/**
 * The "Link preview" section on trips and blog posts: an admin pastes a URL and the public page
 * shows a compact card for it (thumbnail, title, description, rating, prices).
 *
 * Only the URL is required. Title, description and image come from the page's own metadata, so the
 * card looks the same whether the address is another page on this site or somebody else's — the
 * reader should not have to know which. Read, in order of preference:
 *
 *   title        `og:title` → `twitter:title` → JSON-LD `headline`/`name` → `<title>` → `og:site_name`
 *   description  `og:description` → `twitter:description` → `<meta name="description">` → JSON-LD
 *   image        `og:image` (and its `:url` / `:secure_url` forms) → `twitter:image` → `image_src`
 *                link → JSON-LD `image` → `apple-touch-icon` → the first usable `<img>` in the page
 *
 * Rating, review count and prices are typed in, since no page's metadata carries them. Editors can
 * override the title and description from the admin panel; the image is always the linked page's.
 *
 * Two things make that work on other people's sites rather than only on our own:
 *
 *   · **A real browser is the client.** Many hosts answer a bot-looking User-Agent with a 403, a
 *     consent wall or an empty page, so the request carries a current desktop Chrome UA and the
 *     usual `Accept` / `Accept-Language` headers.
 *   · **The head is not the whole story.** Open Graph tags win when they exist, but plenty of pages
 *     ship only JSON-LD, only a `rel="image_src"` link, or nothing but a first content image. When
 *     the head declares no image, a little of the body is read too, which is where that image is.
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

/**
 * What this site's own CMS knows about a page, for a link that points at this site. Read by
 * `link-preview-internal.ts`: the document's title, its one-line summary, and — the part that
 * matters most — the image the document is actually illustrated with, i.e. a trip's hero image or
 * a post's featured image.
 */
export type InternalLinkPreview = {
  title: string | null
  description: string | null
  image: string | null
}

/**
 * The two places a card's details can come from. Both are injectable so the merge rules can be
 * tested without a network or a database.
 */
export type LinkPreviewResolvers = {
  /** Reads the linked page over the network (`og:` tags, JSON-LD, …). */
  metadata?: (url: string) => Promise<LinkPreviewMetadata | null>
  /** Reads our own CMS when the link points at a page on this site. */
  internal?: (url: string) => Promise<InternalLinkPreview | null>
}

/**
 * Desktop Chrome, which is what most hosts expect to serve a preview card to. Shared with the
 * image proxy, so the card is read and its picture fetched as the same client.
 */
export const LINK_PREVIEW_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
/** Long enough for a slow host to answer, short enough not to hold a page render hostage. */
const FETCH_TIMEOUT_MS = 8000
/** Metadata sits in the document head; there is no reason to download a whole page. */
const MAX_HEAD_BYTES = 256 * 1024
/** Read past `</head>` for a content image only when the head declared none at all. */
const MAX_BODY_BYTES_FOR_IMAGE = 64 * 1024

/** Anything here means the head already says (or implies) what the card's image is. */
const IMAGE_HINT =
  /(?:og:image|twitter:image|image_src|apple-touch-icon|application\/ld\+json|itemprop=["']image)/i

/** Images that are never a card thumbnail: tracking pixels, spacers, sprites, inline data. */
const UNUSABLE_IMAGE =
  /(?:^data:|sprite|spacer|pixel|blank\.(?:gif|png)|\.svg(?:[?#]|$)|logo|icon)/i

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

/** `<meta>` values keyed by `property`, `name` or `itemprop`, all lower-cased; first one wins. */
function readMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {}
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = readAttributes(tag)
    const key = (attributes.property ?? attributes.name ?? attributes.itemprop ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
    const content = attributes.content?.replace(/\s+/g, ' ').trim()
    if (key && content && !(key in meta)) meta[key] = content
  }
  return meta
}

/** `<link>` targets keyed by each rel token (`image_src`, `apple-touch-icon`, …); first one wins. */
function readLinkHrefs(html: string): Record<string, string> {
  const hrefs: Record<string, string> = {}
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attributes = readAttributes(tag)
    const href = attributes.href?.trim()
    if (!href) continue
    for (const rel of (attributes.rel ?? '').toLowerCase().split(/\s+/)) {
      if (rel && !(rel in hrefs)) hrefs[rel] = href
    }
  }
  return hrefs
}

/** A non-empty, single-line string, or `undefined`. */
function textOf(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = decodeHtmlEntities(value).replace(/\s+/g, ' ').trim()
  return text || undefined
}

/** The first value that carries text. */
function firstText(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const text = textOf(value)
    if (text) return text
  }
  return undefined
}

/** A JSON-LD `image` may be a string, an array, or an object with `url` / `contentUrl`. */
function jsonLdImage(value: unknown): string | undefined {
  if (typeof value === 'string') return textOf(value)
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = jsonLdImage(item)
      if (found) return found
    }
    return undefined
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return jsonLdImage(record.url ?? record.contentUrl ?? record['@id'])
  }
  return undefined
}

/**
 * Structured data, which is the only metadata some pages carry: `schema.org` blocks are walked
 * breadth-first for the first node that names an image, falling back to the first that carries a
 * name or description.
 */
function readJsonLd(html: string): LinkPreviewMetadata {
  let fallback: LinkPreviewMetadata | null = null

  for (const block of html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    let parsed: unknown
    try {
      parsed = JSON.parse(block[1]!.trim())
    } catch {
      continue
    }

    const queue: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed]
    while (queue.length) {
      const node = queue.shift()
      if (Array.isArray(node)) {
        queue.push(...node)
        continue
      }
      if (!node || typeof node !== 'object') continue

      const record = node as Record<string, unknown>
      if (Array.isArray(record['@graph'])) queue.push(...record['@graph'])

      const image = jsonLdImage(record.image ?? record.thumbnailUrl)
      const title = textOf(record.headline ?? record.name)
      const description = textOf(record.description)
      if (image) return { title, description, image }
      if (!fallback && (title || description)) fallback = { title, description }

      for (const value of Object.values(record)) {
        if (value && typeof value === 'object') queue.push(value)
      }
    }
  }

  return fallback ?? {}
}

/** Resolves an image address against the page it was found on; `undefined` if it is unusable. */
function resolveImageUrl(raw: string | undefined, pageUrl: string): string | undefined {
  const value = raw?.trim()
  if (!value || /^data:/i.test(value)) return undefined
  try {
    const url = new URL(value, pageUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

/**
 * The first `<img>` that could stand in for a thumbnail. Only reached when the page declares no
 * image of its own, so it is a last resort: tracking pixels, spacers, sprites, icons and inline data
 * are skipped, and relative addresses are resolved against the page.
 */
function firstContentImage(html: string, pageUrl: string): string | undefined {
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const attributes = readAttributes(tag)
    const raw = attributes.src ?? attributes['data-src'] ?? attributes['data-lazy-src']
    if (!raw || UNUSABLE_IMAGE.test(raw)) continue
    if (attributes.width === '1' || attributes.height === '1') continue
    const image = resolveImageUrl(raw, pageUrl)
    if (image) return image
  }
  return undefined
}

/**
 * Reads title, description and image from an HTML document, however the page chose to declare them
 * (see the header for the order). Relative image addresses are resolved against the page's own
 * address, and empty or broken values are dropped rather than shown.
 */
export function parseLinkPreviewMetadata(html: string, pageUrl: string): LinkPreviewMetadata {
  const head = html.slice(0, MAX_HEAD_BYTES)
  const meta = readMetaTags(head)
  const links = readLinkHrefs(head)
  const structured = readJsonLd(head)

  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  const title = firstText(
    meta['og:title'],
    meta['twitter:title'],
    structured.title,
    titleTag,
    meta['og:site_name'],
    meta['application-name'],
  )
  const description = firstText(
    meta['og:description'],
    meta['twitter:description'],
    meta.description,
    structured.description,
  )
  const rawImage = firstText(
    meta['og:image'],
    meta['og:image:url'],
    meta['og:image:secure_url'],
    meta['twitter:image'],
    meta['twitter:image:src'],
    meta['thumbnail'],
    meta['image'],
    links['image_src'],
    structured.image,
    links['apple-touch-icon'],
    links['apple-touch-icon-precomposed'],
    // Last: an image in the body, which is only in `html` when the head named none.
    firstContentImage(html, pageUrl),
  )

  return { title, description, image: resolveImageUrl(rawImage, pageUrl) }
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

/** `charset` from a `Content-Type`, when the server bothered to send one. */
function charsetOf(contentType: string): string | undefined {
  return contentType.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]
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
      headers: {
        'user-agent': LINK_PREVIEW_USER_AGENT,
        accept: ACCEPT,
        'accept-language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 3600 },
    })
    if (!response.ok) return null

    // A server that sends no `Content-Type` at all is rare but real; only reject what is clearly
    // not a page (an image, a PDF, JSON from an API endpoint).
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType && !/html|xml/i.test(contentType)) return null

    const html = await readHtml(response, charsetOf(contentType))
    return parseLinkPreviewMetadata(html, response.url || absoluteUrl)
  } catch {
    return null
  }
}

/**
 * Reads just enough of the response to describe it: the head, plus — when the head declares no
 * image — a short stretch of the body, where a content image usually is.
 */
async function readHtml(response: Response, charset: string | undefined): Promise<string> {
  if (!response.body) return ''

  let decoder: TextDecoder
  try {
    decoder = new TextDecoder(charset ?? 'utf-8')
  } catch {
    decoder = new TextDecoder('utf-8')
  }

  const reader = response.body.getReader()
  let received = 0
  let headEnd = -1
  let text = ''

  try {
    while (received < MAX_HEAD_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      text += decoder.decode(value, { stream: true })

      if (headEnd < 0) {
        const close = text.search(/<\/head>/i)
        if (close >= 0) {
          headEnd = received
          // Nothing after the head can beat what the head already declared.
          if (IMAGE_HINT.test(text.slice(0, close))) break
        }
      } else if (received - headEnd > MAX_BODY_BYTES_FOR_IMAGE) {
        break
      }
    }
    text += decoder.decode()
  } finally {
    await reader.cancel().catch(() => undefined)
  }

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
 * An image that lives on this site — our own media, which is what a featured image is — is handed
 * to the card as a path. The card then loads it directly instead of through the image proxy: there
 * is no hotlink protection to dodge on our own origin, the extra function call disappears, and a
 * relative address keeps working on preview hosts and custom domains.
 */
function firstPartyPath(image: string | null): string | null {
  if (!image) return null
  const origin = resolveSiteUrl().replace(/\/+$/, '')
  return image.startsWith(`${origin}/`) ? image.slice(origin.length) : image
}

/**
 * Builds the card for a page. Returns `null` when no URL is set, which hides the section.
 *
 * A link to a page on **this** site is answered from the CMS, not from the network: the card then
 * carries the document's own featured image (a trip's hero image, a post's featured image) rather
 * than whatever a scrape of our own page happened to return — and the render makes no self-request
 * at all. Every other site is read over the network as before, and the CMS is only asked when the
 * scrape has no picture to offer.
 */
export async function resolveLinkPreview(
  source: LinkPreviewSource,
  resolvers: LinkPreviewResolvers = {},
): Promise<ResolvedLinkPreview | null> {
  const rawUrl = cleanText(source.linkPreviewUrl)
  if (!rawUrl || validateLinkPreviewUrl(rawUrl) !== true) return null

  const absolute = absoluteLinkPreviewUrl(rawUrl)
  if (!absolute) return null

  const host = hostOf(absolute)
  const siteHost = hostOf(resolveSiteUrl())

  const own = host === siteHost && resolvers.internal ? await resolvers.internal(absolute) : null
  // Nothing left to learn from the network when the CMS already knows the page's picture.
  const fetched = own?.image
    ? null
    : await (resolvers.metadata ?? fetchLinkPreviewMetadata)(absolute)

  return {
    href: rawUrl.startsWith('/') ? rawUrl : absolute,
    external: host !== siteHost,
    host,
    title: cleanText(source.linkPreviewTitle) ?? own?.title ?? fetched?.title ?? host,
    description:
      cleanText(source.linkPreviewDescription) ?? own?.description ?? fetched?.description ?? '',
    image: firstPartyPath(own?.image ?? fetched?.image ?? null),
    rating: cleanNumber(source.linkPreviewRating, 5),
    reviewCount: cleanNumber(source.linkPreviewReviewCount),
    price: cleanText(source.linkPreviewPrice),
    originalPrice: cleanText(source.linkPreviewOriginalPrice),
  }
}
