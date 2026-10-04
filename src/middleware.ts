import { NextResponse, type NextRequest } from 'next/server'

import { defaultLocale, isLocale, locales } from '@/i18n/config'
import { trustedOrigins } from '@/lib/trusted-origins'

const LOCALE_COOKIE = 'NEXT_LOCALE'

/**
 * Negotiates the language for URLs that have no locale prefix yet.
 *
 * Priority: explicit cookie (set by the language switcher) → browser Accept-Language → default.
 * The redirect is a 308 (permanent), so search engines remember the canonical localized URL.
 */
const preferredLocale = (request: NextRequest): string => {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (cookie && isLocale(cookie)) return cookie

  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const ranked = acceptLanguage
      .split(',')
      .map((part) => {
        const [tag = '', ...params] = part.split(';')
        const q = params.find((param) => param.trim().startsWith('q='))
        return {
          tag: tag.trim().toLowerCase(),
          quality: q ? Number.parseFloat(q.split('=')[1] ?? '1') || 0 : 1,
        }
      })
      .sort((a, b) => b.quality - a.quality)

    for (const { tag } of ranked) {
      const match = locales.find((locale) => tag === locale || tag.startsWith(`${locale}-`))
      if (match) return match
    }
  }

  return defaultLocale
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

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )

  if (hasLocale) return NextResponse.next()

  const locale = preferredLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`

  return NextResponse.redirect(url, 308)
}

export const config = {
  // Everything except Next internals and static files. The Payload API and admin panel are
  // included so `trustSameOrigin()` can normalise their authentication headers.
  matcher: [
    '/((?!_next/static|_next/image|media|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
}
