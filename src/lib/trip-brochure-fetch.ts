/**
 * Fetching a stored brochure so it can be re-served from the site's own origin.
 *
 * The trip brochure route needs three things that are easy to get subtly wrong, so they live here
 * — pure, dependency-free, and testable without a database or a network:
 *
 *  1. turning a stored media URL (relative on local disk, absolute on Vercel Blob/S3) into
 *     something `fetch` can call;
 *  2. following a *bounded* number of redirects by hand, because a CDN edge hop is normal but an
 *     open-ended chain is a way to make the server hammer an arbitrary host;
 *  3. refusing anything that is not http(s), so a corrupted or hostile stored value can never turn
 *     the route into a local-file read (`file:///…`).
 */

/** How many redirects are followed before giving up. A CDN edge hop is legitimate; a chain is not. */
export const MAX_BROCHURE_REDIRECTS = 3

/** The slice of `fetch` this module needs, so tests can pass a scripted stub. */
export type FetchLike = (input: string, init?: { redirect?: 'manual' }) => Promise<Response>

const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** Absolute http(s) URL, or `null` for anything else (a `file:`, `javascript:` or junk value). */
export const absoluteHttpUrl = (value: string): string | null => {
  try {
    return isHttpUrl(value) ? new URL(value).toString() : null
  } catch {
    return null
  }
}

/** Stored URLs may be root-relative (`/api/media/file/x.pdf`); resolve those against the site. */
export const resolveStoredUrl = (storedUrl: string, siteUrl: string): string | null =>
  absoluteHttpUrl(storedUrl.startsWith('/') ? new URL(storedUrl, siteUrl).toString() : storedUrl)

/**
 * Fetches the file, following up to `MAX_BROCHURE_REDIRECTS` redirects.
 *
 * Returns `null` — never throws — when the file cannot be reached, is not a successful response,
 * or a redirect points somewhere that is not http(s). The caller answers 404: from a visitor's
 * point of view a brochure that cannot be read is the same as one that is not there.
 */
export const fetchStoredFile = async (
  url: string,
  fetchImpl: FetchLike = globalThis.fetch as unknown as FetchLike,
): Promise<Response | null> => {
  let current = absoluteHttpUrl(url)
  if (!current) return null

  for (let hop = 0; hop <= MAX_BROCHURE_REDIRECTS; hop += 1) {
    let response: Response
    try {
      response = await fetchImpl(current, { redirect: 'manual' })
    } catch {
      return null
    }

    const location = response.headers.get('location')

    if (response.status >= 300 && response.status < 400 && location) {
      let next: string | null = null
      try {
        next = absoluteHttpUrl(new URL(location, current).toString())
      } catch {
        next = null
      }
      if (!next) return null
      current = next
      continue
    }

    return response.ok ? response : null
  }

  return null
}
