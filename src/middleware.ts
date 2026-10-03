import { NextResponse, type NextRequest } from 'next/server'

import { defaultLocale, isLocale, locales } from '@/i18n/config'

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  // Everything except the Payload admin, the API, Next internals and static files.
  matcher: [
    '/((?!api|admin|_next/static|_next/image|media|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
}
