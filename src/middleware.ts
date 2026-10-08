import { NextResponse, type NextRequest } from 'next/server'

import { trustedOrigins } from '@/lib/trusted-origins'

/**
 * Language prefixes the site used to serve: `/en`, `/de` and `/fr`.
 *
 * The site is English-only now, so those URLs no longer exist. They are 308-redirected to the
 * same page without the prefix (`/de/trips` → `/trips`) instead of 404-ing, which keeps old
 * links, bookmarks and search results working after the switch.
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
 * Payload accepts a cookie-authenticated request only when the browser's `Origin` header is in
 * its `csrf` allowlist (see `payload/dist/auth/extractJWT.js`). That list is static, so any host
 * the admin is served from that isn't in it — a Vercel preview URL, a tunnel, a `*.e2b.app`
 * sandbox, sticky-IP host, `www.` vs apex — makes every cookie-authenticated call fail:
 * `POST /users/logout` returns 400 without clearing the session, and the admin's own log-out
 * helper swallows the error and redirects to the login screen, so signing out *looks* like it
 * worked while the session cookie (and the next page load) says otherwise.
 *
 * Requests from an allowlisted origin are left completely alone — Payload keeps making that
 * decision. For everything else, a request the browser itself marks as same-origin is passed on
 * without the redundant `Origin` header, which lets Payload's own same-origin branch authenticate
 * it. Two browser-controlled signals qualify, so this keeps working behind proxies that drop one
 * of them: `Sec-Fetch-Site: same-origin` (page scripts cannot forge it) and an `Origin` whose host
 * equals the `Host` being requested (page scripts cannot set `Host` either).
 *
 * Cross-site requests keep their `Origin` and are validated against the allowlist exactly as
 * before — this only ever relaxes the check for requests that are genuinely same-origin.
 */
const trustSameOrigin = (request: NextRequest): NextResponse => {
  const origin = request.headers.get('origin')

  // Already trusted by Payload: leave the request untouched.
  if (origin && trustedOrigins().includes(origin)) return NextResponse.next()

  // `Sec-Fetch-Site` is set by the browser (page scripts cannot forge it), so an explicit
  // same-origin value is enough on its own.
  const sameOriginByFetchMetadata = request.headers.get('sec-fetch-site') === 'same-origin'

  // Fallback for proxies that strip `Sec-Fetch-*`: compare the claimed `Origin` with the host
  // actually being requested. Only browser-controlled headers are consulted — a page cannot set
  // `Host`, and a cross-site `Origin` never matches the host it is asking for.
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
  // Dropping the redundant `Origin` is what lets Payload authenticate the cookie; it then falls
  // back to `Sec-Fetch-Site` to confirm the request is same-origin, so make that explicit for the
  // case where the header was missing (a proxy stripped it) rather than sent.
  headers.delete('origin')
  headers.set('sec-fetch-site', 'same-origin')
  return NextResponse.next({ request: { headers } })
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Payload's REST API and admin server functions authenticate with the `payload-token` cookie.
  if (pathname === '/api' || pathname.startsWith('/api/')) return trustSameOrigin(request)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return trustSameOrigin(request)

  // Retire the old language prefixes: /de/trips → /trips (search params are preserved).
  //
  // Trailing slashes need no handling here: Next's router 308s `/trips/` → `/trips` before the
  // proxy runs, so the URL a crawler lands on is already the same string as the page's canonical.
  const stripped = stripLocalePrefix(pathname)
  if (stripped !== null) {
    const url = request.nextUrl.clone()
    url.pathname = stripped
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  // Everything except Next internals and static files. The Payload API and admin panel are
  // included so `trustSameOrigin()` can normalise their authentication headers.
  matcher: ['/((?!_next/static|_next/image|media|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
}
