import { NextResponse, type NextRequest } from 'next/server'

import { resolveRedirection, shouldCheckRedirection } from '@/lib/redirections'
import { legacyMediaRedirect } from '@/lib/legacy-media-redirect'
import { redirectionRuntime } from '@/lib/redirections-runtime'
import { trustedOrigins } from '@/lib/trusted-origins'

/**
 * The request proxy (Next.js 16's successor to `middleware.ts` — same matcher, same NextResponse
 * API, no deprecation warning on the build).
 *
 * It does two jobs:
 *
 * 1. **Payload's admin and API.** Payload accepts a cookie-authenticated request only when the
 *    browser's `Origin` header is in its `csrf` allowlist (see `payload/dist/auth/extractJWT.js`).
 *    That list is static, so any host the admin is served from that isn't in it — a Vercel preview
 *    URL, a tunnel, a `*.e2b.app` sandbox, sticky-IP host, `www.` vs apex — makes every
 *    cookie-authenticated call fail: `POST /users/logout` returns 400 without clearing the session,
 *    and the admin's own log-out helper swallows the error and redirects to the login screen, so
 *    signing out *looks* like it worked while the session cookie says otherwise.
 *
 * 2. **SEO → Redirections.** A visitor requesting a source path is sent to the rule's destination
 *    with the stored status code. Matching is a `Map` lookup against an in-memory snapshot of the
 *    active rules (`/api/redirections/rules`, refreshed once per TTL per warm instance) — no
 *    database, no per-request network call. The query string is preserved, and admin, API, static
 *    assets and the homepage are never candidates.
 *
 * Legacy `/en`, `/de` and `/fr` prefixes are still 308-redirected here as a fallback; the primary
 * redirect lives in `next.config.mjs` so it is answered by the CDN rather than by this function.
 */

const LEGACY_LOCALE_PREFIX = /^\/(?:en|de|fr)(?=\/|$)/i

/** `/de/trips` → `/trips`, `/en` → `/`. Returns null when there is no language prefix. */
const stripLocalePrefix = (pathname: string): string | null => {
  const match = LEGACY_LOCALE_PREFIX.exec(pathname)
  if (!match) return null

  const rest = pathname.slice(match[0].length)
  return rest === '' ? '/' : rest
}

/**
 * Requests from an allowlisted origin are left completely alone — Payload keeps making that
 * decision. For everything else, a request the browser itself marks as same-origin is passed on
 * without the redundant `Origin` header, which lets Payload's own same-origin branch authenticate
 * it. Two browser-controlled signals qualify, so this keeps working behind proxies that drop one
 * of them: `Sec-Fetch-Site: same-origin` (page scripts cannot forge it) and an `Origin` whose host
 * equals the `Host` being requested (page scripts cannot set `Host` either).
 */
const trustSameOrigin = (request: NextRequest): NextResponse => {
  const origin = request.headers.get('origin')

  // Already trusted by Payload: leave the request untouched.
  if (origin && trustedOrigins().includes(origin)) return NextResponse.next()

  // `Sec-Fetch-Site` is set by the browser (page scripts cannot forge it), so an explicit
  // same-origin value is enough on its own.
  const sameOriginByFetchMetadata = request.headers.get('sec-fetch-site') === 'same-origin'

  // Fallback for proxies that strip `Sec-Fetch-*`: compare the claimed `Origin` with the host
  // actually being requested.
  const host = request.headers.get('host')
  let sameOriginByHost = false
  if (origin && host) {
    try {
      sameOriginByHost = new URL(origin).host === host
    } catch {
      sameOriginByHost = false
    }
  }

  if (!sameOriginByFetchMetadata && !sameOriginByHost) return NextResponse.next()

  const headers = new Headers(request.headers)
  headers.delete('origin')
  headers.set('sec-fetch-site', 'same-origin')
  return NextResponse.next({ request: { headers } })
}

/** Applies a matched rule, counting the hit without delaying the redirect. */
const serveRedirect = async (
  request: NextRequest,
  match: NonNullable<ReturnType<typeof resolveRedirection>>,
): Promise<NextResponse> => {
  let destination: URL
  try {
    destination = new URL(match.location, request.nextUrl)
  } catch {
    return NextResponse.next()
  }

  // Defence in depth: only ever emit an http(s) Location, whatever is in the table.
  if (destination.protocol !== 'http:' && destination.protocol !== 'https:') {
    return NextResponse.next()
  }

  // Counter first (in memory, synchronous), then a batched flush only when one is due. The flush is
  // intentionally not awaited: the visitor's redirect must not wait on a write.
  redirectionRuntime.recordHit(match.rule.id)
  if (redirectionRuntime.hitsDue()) void redirectionRuntime.flushHits()

  return NextResponse.redirect(destination, match.statusCode)
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Old public media URLs predate the Blob migration. Only redirect in Blob mode; all other
  // requests continue to Payload unchanged, including uploads and database/local media.
  const mediaDestination = legacyMediaRedirect(request.url, request.method)
  if (mediaDestination) {
    const response = NextResponse.redirect(mediaDestination, 307)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  // Payload's REST API and admin server functions authenticate with the `payload-token` cookie.
  if (pathname === '/api' || pathname.startsWith('/api/')) return trustSameOrigin(request)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return trustSameOrigin(request)

  // Legacy locale prefixes — the CDN answers these first (next.config.mjs); this is the fallback.
  const stripped = stripLocalePrefix(pathname)
  if (stripped !== null) {
    const url = request.nextUrl.clone()
    url.pathname = stripped
    return NextResponse.redirect(url, 308)
  }

  // Only page requests: a POST, an asset, the homepage and any system route skip the lookup.
  if (request.method !== 'GET' && request.method !== 'HEAD') return NextResponse.next()
  if (!shouldCheckRedirection(pathname)) return NextResponse.next()

  redirectionRuntime.rememberOrigin(request.nextUrl.origin)

  const compiled = await redirectionRuntime.getRules()
  const match = resolveRedirection(compiled, pathname, search)

  return match ? serveRedirect(request, match) : NextResponse.next()
}

export const config = {
  // Two groups, both deliberate:
  //
  //  - `/admin` and `/api` handle Payload's same-origin authentication. Legacy media GET/HEAD
  //    requests also enter the proxy so Blob mode can redirect them to the public store.
  //  - everything else *except* API, admin, Next.js internals, static asset directories, the
  //    generated routes and any file with an extension — the only requests a redirect rule can
  //    answer. The storefront now pays one Map lookup per request and nothing else.
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api',
    '/api/((?!media/file/).*)',
    '/api/media/file/:path*',
    '/((?!api(?:/|$)|admin(?:/|$)|_next(?:/|$)|images(?:/|$)|media(?:/|$)|preview(?:/|$)|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$|ads\\.txt$|.*\\.[a-zA-Z0-9]+$).*)',
  ],
}
