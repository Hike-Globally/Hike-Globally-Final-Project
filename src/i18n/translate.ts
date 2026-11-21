import type { FrontendLocale } from './config'

export type TranslationMap = Record<string, string>

/** Attributes whose human-readable values are safe to translate from the frontend dictionary. */
export const TRANSLATABLE_ATTRIBUTES = [
  'aria-label',
  'aria-description',
  'aria-valuetext',
  'title',
  'alt',
  'placeholder',
  'label',
] as const

/** Dictionary keys and rendered text are compared with whitespace collapsed. */
export const normalizeTranslationKey = (value: string): string => value.replace(/\s+/g, ' ').trim()

const exact = (value: string, translations: TranslationMap): string | undefined =>
  translations[normalizeTranslationKey(value)]

const exactOrOriginal = (value: string, translations: TranslationMap): string =>
  exact(value, translations) ?? value

/** Translate composite browser/page titles such as `Read more · Hike Globally`. */
function translateComposite(value: string, translations: TranslationMap): string | undefined {
  for (const separator of [' · ', ' — ', ' – ']) {
    if (!value.includes(separator)) continue
    const parts = value.split(separator)
    const translated = parts.map((part) => exactOrOriginal(part, translations))
    if (translated.some((part, index) => part !== parts[index])) return translated.join(separator)
  }
  return undefined
}

/**
 * Templates whose values are filled in at runtime (`plural()`, `t()`, dates,
 * counts) cannot be matched by an exact dictionary key. These rules keep the
 * same English fallback contract while making the dynamic copy change language.
 */
function translateDynamic(
  value: string,
  locale: FrontendLocale,
  translations: TranslationMap,
): string | undefined {
  const text = normalizeTranslationKey(value)
  const isGerman = locale === 'de'
  const isFrench = locale === 'fr'
  if (!isGerman && !isFrench) return undefined

  let match = /^(\d+)\s+trip(s)?$/.exec(text)
  if (match) {
    const plural = Boolean(match[2])
    return isGerman
      ? `${match[1]} ${plural ? 'Reisen' : 'Reise'}`
      : `${match[1]} ${plural ? 'voyages' : 'voyage'}`
  }

  match = /^(\d+)\s+min read$/.exec(text)
  if (match) return isGerman ? `${match[1]} Min. Lesezeit` : `${match[1]} min de lecture`

  match = /^©\s*(\d{4})\s+(.+)\.\s+All rights reserved\.$/.exec(text)
  if (match) {
    return isGerman
      ? `© ${match[1]} ${match[2]}. Alle Rechte vorbehalten.`
      : `© ${match[1]} ${match[2]}. Tous droits réservés.`
  }

  match = /^Day\s+(\d+)$/.exec(text)
  if (match) return isGerman ? `Tag ${match[1]}` : `Jour ${match[1]}`

  match = /^(\d+)\s+days$/.exec(text)
  if (match) return isGerman ? `${match[1]} Tage` : `${match[1]} jours`

  match = /^(\d+)\s+nights$/.exec(text)
  if (match) return isGerman ? `${match[1]} Nächte` : `${match[1]} nuits`

  match = /^(\d+)\s+departure(s)?$/.exec(text)
  if (match) {
    const plural = Boolean(match[2])
    return isGerman
      ? `${match[1]} ${plural ? 'Abreisen' : 'Abreise'}`
      : `${match[1]} ${plural ? 'départs' : 'départ'}`
  }

  match = /^(\d+)\s+spot(s)? left$/.exec(text)
  if (match) return isGerman ? `${match[1]} Plätze frei` : `${match[1]} places restantes`

  match = /^Back to (.+)$/.exec(text)
  if (match) {
    const target = exactOrOriginal(match[1]!, translations)
    return isGerman ? `Zurück zu ${target}` : `Retour à ${target}`
  }

  match = /^Trips in (.+)$/.exec(text)
  if (match) {
    const target = exactOrOriginal(match[1]!, translations)
    return isGerman ? `Reisen in ${target}` : `Voyages à ${target}`
  }

  match = /^By (.+)$/.exec(text)
  if (match) {
    const author = exactOrOriginal(match[1]!, translations)
    return isGerman ? `Von ${author}` : `Par ${author}`
  }

  match = /^Featured · (.+)$/.exec(text)
  if (match) {
    const label = exactOrOriginal(match[1]!, translations)
    return isGerman ? `Empfohlen · ${label}` : `En vedette · ${label}`
  }

  match = /^From (.+)$/.exec(text)
  if (match) {
    const price = exactOrOriginal(match[1]!, translations)
    return isGerman ? `Ab ${price}` : `À partir de ${price}`
  }

  match = /^Updated (.+)$/.exec(text)
  if (match) {
    const date = exactOrOriginal(match[1]!, translations)
    return isGerman ? `Aktualisiert ${date}` : `Mis à jour ${date}`
  }

  match = /^Published (.+)$/.exec(text)
  if (match) {
    const date = exactOrOriginal(match[1]!, translations)
    return isGerman ? `Veröffentlicht ${date}` : `Publié ${date}`
  }

  match = /^(Expand|Collapse) (.+) submenu$/.exec(text)
  if (match) {
    const verb = isGerman
      ? match[1] === 'Expand'
        ? 'Erweitern'
        : 'Schließen'
      : match[1] === 'Expand'
        ? 'Développer'
        : 'Réduire'
    const target = exactOrOriginal(match[2]!, translations)
    return isGerman ? `${verb} ${target}-Untermenü` : `${verb} le sous-menu ${target}`
  }

  return undefined
}

/**
 * Translate one human-readable string, preserving its leading/trailing whitespace.
 * English is the source language; unknown CMS strings fall back to English.
 */
export function translateString(
  text: string,
  locale: FrontendLocale,
  translations: TranslationMap,
): string {
  if (!text || locale === 'en') return text

  const leading = text.match(/^\s*/)?.[0] ?? ''
  const trailing = text.match(/\s*$/)?.[0] ?? ''
  const core = text.slice(leading.length, text.length - trailing.length)
  if (!core) return text

  const translated =
    exact(core, translations) ??
    translateComposite(core, translations) ??
    translateDynamic(core, locale, translations)

  if (!translated || translated === core) return text
  return leading + translated + trailing
}

export const createTranslator = (locale: FrontendLocale, translations: TranslationMap) =>
  (text: string): string => translateString(text, locale, translations)
