import { lookup } from 'node:dns/promises'

import { fetchLinkPreviewMetadata } from './link-preview'
import { isPrivateHost, parseImageProxyUrl } from './link-preview-image'
import { resolveSiteUrl } from './site-url'

/** Server-only transport for a batch's external pages. Every redirect is checked before fetching. */
export function publicPreviewFetch({
  request = fetch,
  addresses = async (host: string) =>
    (await lookup(host, { all: true })).map(({ address }) => address),
  signal,
}: {
  request?: typeof fetch
  addresses?: (host: string) => Promise<string[]>
  signal?: AbortSignal
} = {}): typeof fetch {
  const ownHost = new URL(resolveSiteUrl()).hostname.replace(/^www\./, '')
  return async (input, init) => {
    let target = parseImageProxyUrl(input instanceof Request ? input.url : String(input))
    const requestSignal =
      signal && init?.signal ? AbortSignal.any([signal, init.signal]) : (signal ?? init?.signal)
    for (let hop = 0; target && hop <= 3; hop += 1) {
      requestSignal?.throwIfAborted()
      // An external redirect back to a page containing this collection must not recurse either.
      if (target.hostname.replace(/^www\./, '') === ownHost) break
      const resolved = await addresses(target.hostname.replace(/^\[|\]$/g, ''))
      requestSignal?.throwIfAborted()
      if (!resolved.length || resolved.some(isPrivateHost)) break
      const response = await request(target.href, {
        ...init,
        signal: requestSignal,
        redirect: 'manual',
      })
      if (response.status < 300 || response.status >= 400) return response
      const location = response.headers.get('location')
      await response.body?.cancel().catch(() => undefined)
      target = location ? parseImageProxyUrl(new URL(location, target).href) : null
    }
    throw new Error('Link preview target is not a public page.')
  }
}

export const fetchPublicLinkPreviewMetadata = (url: string, signal?: AbortSignal) =>
  fetchLinkPreviewMetadata(url, publicPreviewFetch({ signal }))
