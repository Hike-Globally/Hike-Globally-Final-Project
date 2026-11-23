import { lexicalToPlainText } from './format'

/**
 * Dedupe guard for the three blocks of copy a destination page can carry.
 *
 * `tagline` (hero lead), `description` ("About …" body) and `gettingThere` are three separate
 * CMS fields, and nothing stops an editor from pasting the same sentence into all of them —
 * which is exactly what the live Eastern Nepal page does: one sentence, rendered three times,
 * under three headings. That is the worst kind of thin content, because the page looks full
 * while saying almost nothing, and the repeated block under "Getting there" is a promise the
 * page then breaks.
 *
 * Rather than trust the field, the page asks this helper what is actually worth rendering:
 * the *earliest* copy wins (the hero lead is the page's introduction, the About body is its
 * substance) and anything after it that repeats an earlier block is dropped. Well-written
 * pages are untouched — a short tagline and a long essay are never equal — so this only ever
 * fires on the pathological case, and it fixes itself the moment the copy is rewritten.
 */
export type DestinationCopy = {
  tagline?: string | null
  description?: unknown
  gettingThere?: unknown
}

export type DestinationCopyVisibility = {
  /** Show the hero lead. Hidden only when it is the same sentence as the About body. */
  showTagline: boolean
  /** Show the "About {name}" heading and body. */
  showDescription: boolean
  /** Show the "Getting there" block. */
  showGettingThere: boolean
}

/** Case-, punctuation- and whitespace-insensitive, so a re-typed sentence still counts as a repeat. */
const normalizeCopy = (value: string | null | undefined): string =>
  (value ?? '')
    .toLowerCase()
    // Letters and digits only: "Kanchenjunga, the world's third-highest peak" and the same
    // sentence with a different apostrophe or comma are the same copy.
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const descriptionText = (description: unknown): string => normalizeCopy(lexicalToPlainText(description))

export function destinationCopyVisibility({
  tagline,
  description,
  gettingThere,
}: DestinationCopy): DestinationCopyVisibility {
  const taglineKey = normalizeCopy(tagline)
  const descriptionKey = descriptionText(description)
  const gettingThereKey = descriptionText(gettingThere)

  // The hero lead introduces the page; when it is word-for-word the About body, the body is
  // the better place for it (it keeps the "About {name}" heading, so the copy keeps an H2).
  const showTagline = taglineKey.length > 0 && taglineKey !== descriptionKey
  const showDescription = descriptionKey.length > 0
  const showGettingThere =
    gettingThereKey.length > 0 && gettingThereKey !== taglineKey && gettingThereKey !== descriptionKey

  return { showTagline, showDescription, showGettingThere }
}
