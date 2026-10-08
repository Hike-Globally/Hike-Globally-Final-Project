/**
 * Single source of truth for the site's language.
 *
 * The site is English-only, so this file describes exactly one language:
 *  - URLs carry no locale prefix (`/trips`, not `/en/trips`).
 *  - The UI has no language switcher.
 *  - Payload stores one locale, so the admin shows no language selector either.
 *
 * The `Locale` type, `locales` array and `localeMeta` map exist because Payload's localization
 * layer and the typed data layer expect a locale list — it simply contains one entry. Adding a
 * language back is a one-line change here plus translating content in the CMS.
 */

export const locales = ['en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

type LocaleMeta = {
  /** Label shown in Payload's admin (keyed by locale code). */
  label: string
  /** <html lang> value. */
  htmlLang: string
  /** Open Graph locale (og:locale). */
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

/** `<html lang>` value. */
export const htmlLang = localeMeta[defaultLocale].htmlLang

/** Open Graph `og:locale` value. */
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
  inquiry: 'inquiry',
} as const
