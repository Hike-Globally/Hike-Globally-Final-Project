/**
 * Payload remains single-locale. Public routes use the existing unprefixed URLs.
 */

export const locales = ['en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

type LocaleMeta = {
  /** Label shown in Payload's admin. */
  label: string
  /** <html lang> value for the default locale. */
  htmlLang: string
  /** Open Graph locale for the default locale. */
  ogLocale: string
}

export const localeMeta: Record<Locale, LocaleMeta> = {
  en: {
    label: 'English',
    htmlLang: 'en',
    ogLocale: 'en_US',
  },
}

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (locales as readonly string[]).includes(value)

/** `<html lang>` value emitted by the server. */
export const htmlLang = localeMeta[defaultLocale].htmlLang

/** Open Graph locale emitted by the server. */
export const ogLocale = localeMeta[defaultLocale].ogLocale

/** Build an internal site path: sitePath('trips') -> '/trips', sitePath('/') -> '/' */
export const sitePath = (path: string = '/'): string => {
  if (path === '' || path === '/') return '/'
  return path.startsWith('/') ? path : `/${path}`
}

/** Route segments for the listing pages. */
export const routes = {
  trips: 'trips',
  destinations: 'destinations',
  blog: 'blog',
  places: 'places',
  inquiry: 'inquiry',
  contact: 'contact',
  about: 'about',
  privacy: 'privacy',
  terms: 'terms',
  sitemap: 'sitemap',
} as const
