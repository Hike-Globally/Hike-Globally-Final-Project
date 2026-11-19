/**
 * Image proxy safety checks and the ordered candidates for link-preview thumbnails. External
 * images use the proxy first, with a direct browser retry when the proxy cannot serve the image.
 * The public proxy rejects private addresses and unsafe types; this shared module stays browser-safe.
 */

/**
 * A card thumbnail never needs to be bigger than this; anything larger is refused. 4 MiB rather
 * than a rounder 5 because that is the response-body limit a serverless function is allowed to
 * return — a larger cap would let the proxy read an image it could never hand back.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

/**
 * Types the proxy is willing to serve back.
 *
 * A whitelist, not `image/*`: SVG can carry script, and the proxy serves from our own origin, so
 * opening such a URL directly would run that script here. (Raster formats cannot.)
 */
const ALLOWED_IMAGE_TYPES =
  /^image\/(?:png|jpe?g|gif|webp|avif|bmp|x-icon|vnd\.microsoft\.icon|tiff|heic|heif)$/i

export function isAllowedImageType(contentType: string | null | undefined): boolean {
  if (!contentType) return false
  return ALLOWED_IMAGE_TYPES.test(contentType.split(';')[0]!.trim())
}

/** `1.2.3.4`-shaped, and inside a range that must never be reachable from the public internet. */
function isPrivateAddress(address: string): boolean {
  const ipv4 = address.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number)
    if (octets.some((octet) => octet > 255)) return true
    const [a, b] = octets as [number, number, number, number]
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true // link-local, clouds' metadata services
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
    if (a === 198 && (b === 18 || b === 19)) return true
    if (a >= 224) return true // multicast and reserved
    return false
  }

  const v6 = address.toLowerCase().replace(/^\[|\]$/g, '')
  if (!v6.includes(':')) return true // not an address at all: refuse rather than guess
  if (v6 === '::' || v6 === '::1') return true
  if (/^f[cd][0-9a-f]{2}:/.test(v6)) return true // fc00::/7 unique-local
  if (/^fe[89ab][0-9a-f]:/.test(v6)) return true // fe80::/10 link-local
  if (v6.startsWith('::ffff:')) {
    // IPv4-mapped: `::ffff:127.0.0.1`, which a URL rewrites to the hex form `::ffff:7f00:1`.
    const mapped = v6.slice('::ffff:'.length)
    if (mapped.includes('.')) return isPrivateAddress(mapped)
    const groups = mapped.split(':').filter(Boolean)
    if (groups.length !== 2 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return true
    const [high, low] = groups.map((group) => parseInt(group, 16)) as [number, number]
    return isPrivateAddress([high >> 8, high & 0xff, low >> 8, low & 0xff].join('.'))
  }
  return false
}

/**
 * Hostnames that must never be fetched: loopback, cloud metadata, private networks, and the
 * suffixes that resolve inside a machine or a cluster (`.local`, `.internal`, `.localhost`).
 */
export function isPrivateHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '')
  if (!host) return true
  if (host === 'localhost' || host.endsWith('.localhost')) return true
  if (host.endsWith('.local') || host.endsWith('.internal')) return true
  if (host === 'metadata.google.internal') return true
  if (host.includes(':')) return isPrivateAddress(host)
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return isPrivateAddress(host)
  return false
}

/**
 * The target of a proxy request, or `null` when it is not a plain public web address: only
 * `http`/`https`, no credentials in the URL, no exotic port, no private host.
 */
export function parseImageProxyUrl(raw: string | null | undefined): URL | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  if (url.port && url.port !== '80' && url.port !== '443') return null
  if (isPrivateHost(url.hostname)) return null
  // Never proxy ourselves: a crafted target could otherwise point this route at itself.
  if (url.pathname.replace(/\/+$/, '') === '/api/link-preview-image') return null
  return url
}

/** The proxy address for an image. Relative, so it works on any host the site is served from. */
export function imageProxyUrl(url: string, pageUrl?: string): string {
  const page = parseImageProxyUrl(pageUrl)
  return `/api/link-preview-image?url=${encodeURIComponent(url)}${page ? `&page=${encodeURIComponent(page.href)}` : ''}`
}

/** A reliable generic travel photograph, used only when the linked page has no usable image. */
export const LINK_PREVIEW_FALLBACK_IMAGE = '/images/trips/hero.jpg'

export type LinkPreviewImageCandidate = { src: string; icon: boolean }

/**
 * Try the page's featured image first, then any other photographs found on the page. External
 * images use the proxy first; the direct URL is a second chance for large images or CDNs that
 * reject server-side requests. The final bundled photograph works without a third-party service.
 */
export function linkPreviewImageCandidates(
  image: string | null,
  _host: string,
  alternatives: readonly string[] = [],
  pageUrl?: string,
): LinkPreviewImageCandidate[] {
  const candidates: LinkPreviewImageCandidate[] = []
  const seen = new Set<string>()
  const add = (src: string) => {
    if (!seen.has(src)) {
      seen.add(src)
      candidates.push({ src, icon: false })
    }
  }

  for (const raw of [image, ...alternatives]) {
    if (!raw) continue
    if (raw.startsWith('/') && !raw.startsWith('//')) {
      add(raw)
      continue
    }
    const normalized = raw.startsWith('//') ? `https:${raw}` : raw
    // Apply the same public URL restrictions to both the proxy and direct browser fallback.
    const parsed = parseImageProxyUrl(normalized)
    if (!parsed) continue
    add(imageProxyUrl(parsed.href, pageUrl))
    add(parsed.href)
  }
  add(LINK_PREVIEW_FALLBACK_IMAGE)
  return candidates
}
