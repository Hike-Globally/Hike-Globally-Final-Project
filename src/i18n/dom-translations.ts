import { frontendHtmlLang, frontendOgLocale, type FrontendLocale } from './config'
import { TRANSLATABLE_ATTRIBUTES, translateString, type TranslationMap } from './translate'

type TextRecord = { original: string; translated: string }
type AttributeRecord = { original: string; translated: string }

const textRecords = new WeakMap<Text, TextRecord>()
const attributeRecords = new WeakMap<Element, Map<string, AttributeRecord>>()
let titleRecord: TextRecord | null = null

const SKIP_SELECTOR =
  '[data-no-i18n], script, style, noscript, textarea, svg, math, template'

const HEAD_META_SELECTORS = [
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
] as const

function isSkipped(element: Element | null): boolean {
  if (!element) return false
  return Boolean(element.closest(SKIP_SELECTOR))
}

function translateTextNode(node: Text, locale: FrontendLocale, translations: TranslationMap): void {
  if (isSkipped(node.parentElement)) return

  const current = node.data
  let record = textRecords.get(node)
  if (!record || current !== record.translated) {
    record = { original: current, translated: current }
    textRecords.set(node, record)
  }

  const next = translateString(record.original, locale, translations)
  if (next === current) return
  node.data = next
  record.translated = next
}

function setTranslatedAttribute(
  element: Element,
  attribute: string,
  locale: FrontendLocale,
  translations: TranslationMap,
): void {
  const current = element.getAttribute(attribute)
  if (current === null) return

  let records = attributeRecords.get(element)
  if (!records) {
    records = new Map<string, AttributeRecord>()
    attributeRecords.set(element, records)
  }

  let record = records.get(attribute)
  if (!record || current !== record.translated) {
    record = { original: current, translated: current }
    records.set(attribute, record)
  }

  const next = translateString(record.original, locale, translations)
  if (next === current) return
  element.setAttribute(attribute, next)
  record.translated = next
}

function translateElementAttributes(
  element: Element,
  locale: FrontendLocale,
  translations: TranslationMap,
): void {
  if (isSkipped(element)) return
  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    setTranslatedAttribute(element, attribute, locale, translations)
  }
}

function translateDocumentTitle(locale: FrontendLocale, translations: TranslationMap): void {
  const current = document.title
  if (!titleRecord || current !== titleRecord.translated) {
    titleRecord = { original: current, translated: current }
  }

  const next = translateString(titleRecord.original, locale, translations)
  if (next === current) return
  document.title = next
  titleRecord.translated = next
}

function translateHead(locale: FrontendLocale, translations: TranslationMap): void {
  if (!document.head) return

  translateDocumentTitle(locale, translations)

  for (const selector of HEAD_META_SELECTORS) {
    const element = document.head.querySelector(selector)
    if (element) setTranslatedAttribute(element, 'content', locale, translations)
  }

  const ogLocale = document.head.querySelector('meta[property="og:locale"]')
  if (ogLocale) ogLocale.setAttribute('content', frontendOgLocale(locale))
}

function setDocumentLocale(locale: FrontendLocale): void {
  const root = document.documentElement
  root.lang = frontendHtmlLang(locale)
  root.dataset.frontendLocale = locale
  root.dataset.frontendLocaleReady = 'true'
}

/**
 * Translate every human-readable text node and whitelisted attribute in the
 * current document. The originals are remembered so switching DE -> FR -> EN
 * never re-translates an already-translated string, and so React's subsequent
 * DOM updates can be re-translated from their English source.
 */
export function applyFrontendTranslations(
  locale: FrontendLocale,
  translations: TranslationMap,
): void {
  if (typeof document === 'undefined' || !document.body) return

  setDocumentLocale(locale)
  translateHead(locale, translations)

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  )

  let node: Node | null = walker.nextNode()
  while (node) {
    if (node.nodeType === 3) {
      translateTextNode(node as Text, locale, translations)
    } else if (node.nodeType === 1) {
      translateElementAttributes(node as Element, locale, translations)
    }
    node = walker.nextNode()
  }
}

/** Re-apply the current language when React inserts or updates page content. */
export function observeFrontendTranslations(
  locale: FrontendLocale,
  translations: TranslationMap,
): () => void {
  if (
    typeof document === 'undefined' ||
    typeof MutationObserver === 'undefined' ||
    !document.body
  ) {
    return () => {}
  }

  const observer = new MutationObserver(() => {
    applyFrontendTranslations(locale, translations)
  })

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
  })

  return () => observer.disconnect()
}
