/**
 * Single source of truth for languages.
 *
 * This file is imported by BOTH:
 *  - `src/payload.config.ts` (Payload localization)
 *  - the Next.js frontend (routing, metadata, language switcher)
 *
 * That means adding a language is a one-line change here + translating content in the CMS.
 *
 * TRADE-OFF: URL *segments* (/trips, /destinations, /blog) stay in English in every language,
 * while content slugs (/trips/everest-base-camp-trek vs /de/trips/everest-basislager-trekking)
 * are translated per locale. Translating route segments too would require a rewrite map and
 * makes internal linking + middleware considerably more fragile for very little SEO gain.
 */

export const locales = ['en', 'de', 'fr'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

type LocaleMeta = {
  /** Label shown in the language switcher (always in its own language). */
  label: string
  /** Compact label for tight spaces (mobile nav). */
  shortLabel: string
  /** <html lang> value. */
  htmlLang: string
  /** Open Graph locale (og:locale). */
  ogLocale: string
  /** hreflang alternates — regional variants help Google pick the right version. */
  hreflang: string
  /** Payload admin label, keyed by locale code. */
  adminLabel: Record<Locale, string>
}

export const localeMeta: Record<Locale, LocaleMeta> = {
  en: {
    label: 'English',
    shortLabel: 'EN',
    htmlLang: 'en',
    ogLocale: 'en_US',
    hreflang: 'en',
    adminLabel: { en: 'English', de: 'Englisch', fr: 'Anglais' },
  },
  de: {
    label: 'Deutsch',
    shortLabel: 'DE',
    htmlLang: 'de',
    ogLocale: 'de_DE',
    hreflang: 'de',
    adminLabel: { en: 'German', de: 'Deutsch', fr: 'Allemand' },
  },
  fr: {
    label: 'Français',
    shortLabel: 'FR',
    htmlLang: 'fr',
    ogLocale: 'fr_FR',
    hreflang: 'fr',
    adminLabel: { en: 'French', de: 'Französisch', fr: 'Français' },
  },
}

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (locales as readonly string[]).includes(value)

/** Build a locale-prefixed internal path: localizedPath('de', 'trips') -> '/de/trips' */
export const localizedPath = (locale: Locale, path: string = '/'): string => {
  const clean = path === '/' || path === '' ? '' : path.startsWith('/') ? path : `/${path}`
  return `/${locale}${clean}`
}

/** Route segments for the listing pages (identical in every language — see trade-off above). */
export const routes = {
  trips: 'trips',
  destinations: 'destinations',
  blog: 'blog',
  inquiry: 'inquiry',
} as const
