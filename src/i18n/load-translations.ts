import type { FrontendLocale } from './config'
import type { TranslationMap } from './translate'

/**
 * Frontend translation dictionaries are split by language so the English bundle
 * does not ship German and French copy. `en` is the source language and needs no
 * map; other locales are loaded on demand from editable TypeScript dictionaries.
 */
const cache: Partial<Record<FrontendLocale, TranslationMap>> = { en: {} }

export async function loadTranslations(locale: FrontendLocale): Promise<TranslationMap> {
  const cached = cache[locale]
  if (cached) return cached

  let translations: TranslationMap
  if (locale === 'de') {
    translations = (await import('./translations/de')).translations
  } else if (locale === 'fr') {
    translations = (await import('./translations/fr')).translations
  } else {
    translations = {}
  }

  cache[locale] = translations
  return translations
}

/** Test helper — forget a lazily loaded dictionary. */
export function clearTranslationCache(): void {
  delete cache.de
  delete cache.fr
}
