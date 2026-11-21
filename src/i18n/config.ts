/**
 * Language configuration.
 *
 * There are deliberately two different locale lists in this file:
 *
 *  - `locales` is the Payload CMS locale list. It stays English-only, so the admin
 *    has no language selector, the database stores one locale, and every Local API
 *    read keeps using `defaultLocale` as before.
 *  - `frontendLocales` is the public site's cookie-driven UI language list. It is
 *    frontend-only: URLs stay exactly as they are (`/trips`, not `/de/trips`), no
 *    locale-prefixed routes or hreflang pages are generated, and CMS content that
 *    has no frontend dictionary entry falls back to English.
 *
 * The frontend switcher stores the visitor's choice in `FRONTEND_LOCALE_COOKIE`.
 * A tiny client runtime translates rendered UI/static/CMS strings from editable
 * frontend dictionaries after hydration; Payload and its schema are untouched.
 */

/** Payload CMS locales — unchanged, single-locale backend. */
export const locales = ['en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

type LocaleMeta = {
  /** Label shown in Payload's admin (keyed by locale code). */
  label: string
  /** <html lang> value for the CMS's default locale. */
  htmlLang: string
  /** Open Graph locale (og:locale) for the CMS's default locale. */
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

/** `<html lang>` value emitted by the server before the frontend locale cookie is read. */
export const htmlLang = localeMeta[defaultLocale].htmlLang

/** Open Graph `og:locale` value emitted by the server. */
export const ogLocale = localeMeta[defaultLocale].ogLocale

/** Frontend-only UI languages. These are not Payload locales and never appear in URLs. */
export const frontendLocales = ['en', 'de', 'fr'] as const

export type FrontendLocale = (typeof frontendLocales)[number]

export const defaultFrontendLocale: FrontendLocale = 'en'

/** Cookie that remembers the visitor's frontend language on the same URLs. */
export const FRONTEND_LOCALE_COOKIE = 'hg_frontend_locale'

type FrontendLocaleMeta = LocaleMeta & {
  /** Native language name, used in the switcher tooltip. */
  label: string
  /** Uppercase code shown in the switcher. */
  shortLabel: string
  /** Accessible label for the language group, in that language. */
  languageLabel: string
}

export const frontendLocaleMeta: Record<FrontendLocale, FrontendLocaleMeta> = {
  en: {
    label: 'English',
    htmlLang: 'en',
    ogLocale: 'en_US',
    shortLabel: 'EN',
    languageLabel: 'Language',
  },
  de: {
    label: 'Deutsch',
    htmlLang: 'de',
    ogLocale: 'de_DE',
    shortLabel: 'DE',
    languageLabel: 'Sprache',
  },
  fr: {
    label: 'Français',
    htmlLang: 'fr',
    ogLocale: 'fr_FR',
    shortLabel: 'FR',
    languageLabel: 'Langue',
  },
}

export const isFrontendLocale = (value: unknown): value is FrontendLocale =>
  typeof value === 'string' && (frontendLocales as readonly string[]).includes(value)

/** `<html lang>` value for a frontend UI language. */
export const frontendHtmlLang = (locale: FrontendLocale): string =>
  frontendLocaleMeta[locale].htmlLang

/** Open Graph `og:locale` value for a frontend UI language. */
export const frontendOgLocale = (locale: FrontendLocale): string =>
  frontendLocaleMeta[locale].ogLocale

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
