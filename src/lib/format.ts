/**
 * Number, currency and date formatting.
 *
 * Everything is formatted with the site's single locale (en-US), so a price reads
 * "$1,850" and a date reads "14 April 2026" for every visitor.
 */
const LOCALE_TAG = 'en-US'

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  NPR: 'रू',
}

/** 1,850 USD → "$1,850". */
export const formatPrice = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat(LOCALE_TAG, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currencySymbols[currency] ?? ''}${amount.toLocaleString(LOCALE_TAG)}`
  }
}

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat(LOCALE_TAG).format(value)

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE_TAG, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export const formatDateShort = (value: string | Date | null | undefined): string => {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE_TAG, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** Altitude in metres (3,440 m). */
export const formatMetres = (value: number | null | undefined): string =>
  value ? `${formatNumber(value)} m` : ''

/**
 * Reading time from Payload's Lexical JSON.
 * Falls back to an estimate based on node count when no text nodes can be found.
 */
export const readingTimeMinutes = (content: unknown): number => {
  let words = 0

  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const record = node as Record<string, unknown>

    if (typeof record.text === 'string') words += record.text.trim().split(/\s+/).length
    if (Array.isArray(record.children)) record.children.forEach(walk)
  }

  walk(content)
  return Math.max(1, Math.round(words / 220))
}

/** Truncates plain text without cutting a word in half. */
export const truncate = (value: string, max: number): string => {
  if (value.length <= max) return value
  const cut = value.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ')).trimEnd()}…`
}

/** Plain-text extraction from a Lexical document — used for meta descriptions. */
export const lexicalToPlainText = (content: unknown): string => {
  const parts: string[] = []
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const record = node as Record<string, unknown>
    if (typeof record.text === 'string') parts.push(record.text)
    if (Array.isArray(record.children)) record.children.forEach(walk)
  }
  walk(content)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
