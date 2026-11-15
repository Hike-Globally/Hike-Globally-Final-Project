import { lookup } from 'node:dns/promises'

import { type NextRequest } from 'next/server'

import {
  isAllowedImageType,
  isPrivateHost,
  MAX_IMAGE_BYTES,
  parseImageProxyUrl,
} from '@/lib/link-preview-image'
import { LINK_PREVIEW_USER_AGENT } from '@/lib/link-preview'

/**
 * `GET /api/link-preview-image?url=https://…` — the link card's picture, fetched once here and
 * served from this origin (see `src/lib/link-preview-image.ts` for why).
 *
 * Only a public `http(s)` address that answers with a raster image is ever fetched or returned;
 * everything else is a 404. Redirects are followed by hand so each hop is checked the same way, and
 * the body is capped while it streams.
 */

/** Needs Node's DNS resolver (`node:dns/promises`) to re-check where a host points. */
export const runtime = 'nodejs'
/** Redirects and a slow host can add up; the function gets room, the reader does not wait it out. */
export const maxDuration = 30

/** Browsers may keep the picture for a day; the CDN, for a week. */
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'
const MAX_REDIRECTS = 3
/** One budget for the whole chain — a redirect must not buy the fetch another timeout. */
const TOTAL_TIMEOUT_MS = 8_000

/**
 * The request pretends to be the host's own page asking for its own picture: a `Referer` on the
 * image's own origin is what the hotlink protection on most CDNs checks, so this is the difference
 * between a card that shows a photograph and one that shows the site's icon.
 */
const headersFor = (target: URL) => ({
  'user-agent': LINK_PREVIEW_USER_AGENT,
  accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  referer: `${target.origin}/`,
})

const notFound = () => new Response('Not found', { status: 404 })

/** A private or loopback address is refused even when a public name resolved to one. */
const resolvesToPrivateAddress = async (url: URL): Promise<boolean> => {
  try {
    const { address } = await lookup(url.hostname)
    return isPrivateHost(address)
  } catch {
    return true
  }
}

/**
 * Fetches the image, following redirects by hand: every hop has to survive the same
 * public-address check as the first request, so a redirect cannot walk into a private network.
 */
const fetchImage = async (start: URL): Promise<Response | null> => {
  const deadline = Date.now() + TOTAL_TIMEOUT_MS
  let target = start

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) return null
    if (await resolvesToPrivateAddress(target)) return null

    const response = await fetch(target, {
      method: 'GET',
      headers: headersFor(target),
      redirect: 'manual',
      signal: AbortSignal.timeout(remaining),
      cache: 'no-store',
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      await response.body?.cancel().catch(() => undefined)
      const next = location ? parseImageProxyUrl(new URL(location, target).toString()) : null
      if (!next) return null
      target = next
      continue
    }

    return response.ok ? response : null
  }

  return null
}

/** Streams the body and gives up the moment it grows past the cap. */
const readCapped = async (response: Response): Promise<ArrayBuffer | null> => {
  if (!response.body) return null

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_IMAGE_BYTES) return null
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => undefined)
  }

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes.buffer as ArrayBuffer
}

export async function GET(request: NextRequest) {
  const target = parseImageProxyUrl(request.nextUrl.searchParams.get('url'))
  if (!target) return notFound()

  try {
    const response = await fetchImage(target)
    if (!response) return notFound()

    const contentType = response.headers.get('content-type')
    if (!isAllowedImageType(contentType)) {
      await response.body?.cancel().catch(() => undefined)
      return notFound()
    }

    const declaredLength = Number(response.headers.get('content-length') ?? '0')
    if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
      await response.body?.cancel().catch(() => undefined)
      return new Response('Too large', { status: 413 })
    }

    const body = await readCapped(response)
    if (!body) return new Response('Too large', { status: 413 })

    return new Response(body, {
      headers: {
        'content-type': contentType!.split(';')[0]!.trim().toLowerCase(),
        'content-length': String(body.byteLength),
        'cache-control': CACHE_CONTROL,
        'x-content-type-options': 'nosniff',
      },
    })
  } catch {
    return notFound()
  }
}
