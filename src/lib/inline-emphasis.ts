/**
 * ============================================================================
 * INLINE EMPHASIS FOR PLAIN-TEXT CMS FIELDS
 * ============================================================================
 * Payload `text` fields are rendered by React as *text*, so any markup an
 * editor types shows up literally — `<i>` and all. Some headings nevertheless
 * need one part set in the accent face: the homepage hero reads
 *
 *     Walk Where The            ← heading font, 120px
 *     Map Runs Out of Names     ← Instrument Serif italic, 90px
 *
 * and both lines live in the single `hero.heading` field, written as
 * `Walk Where The <i>Map Runs Out of Names</i>`.
 *
 * `splitInlineEmphasis()` is the bridge: it turns such a string into an ordered
 * list of plain / emphasized segments that a component maps to real elements.
 * It is deliberately a *parser*, not an HTML sanitizer — `<i>` and `<em>` are
 * the only two tag names it understands, everything else stays text, and no
 * string from the database is ever handed to `dangerouslySetInnerHTML`.
 * ==========================================================================*/

export type EmphasisSegment = {
  /** The copy itself, exactly as written (surrounding whitespace included). */
  text: string
  /** `true` when the segment came from inside `<i>…</i>` / `<em>…</em>`. */
  emphasized: boolean
}

/** A balanced `<i>…</i>` or `<em>…</em>` pair — case-insensitive, across newlines. */
const EMPHASIS_PAIR = /<(i|em)\s*>([\s\S]*?)<\/\1\s*>/gi

/**
 * Any *leftover* tag of those same two names, i.e. one half of an unbalanced
 * pair. Stripped from the surrounding text so a typo shows up as clean copy
 * rather than as a literal `<i>` on the page.
 */
const STRAY_EMPHASIS_TAG = /<\/?(?:i|em)\s*>/gi

const pushSegment = (segments: EmphasisSegment[], text: string, emphasized: boolean): void => {
  // Whitespace-only segments carry no copy — dropping them keeps the rendered
  // heading free of empty text nodes between its two lines.
  if (!text.trim()) return
  segments.push({ text, emphasized })
}

/**
 * Splits a plain-text field into ordered plain / emphasized segments.
 *
 * - `<i>` and `<em>` are synonyms; matching is case-insensitive.
 * - Pairs may not nest — an inner tag is treated as stray and removed.
 * - Unbalanced tags are removed rather than rendered.
 * - An empty, `null` or `undefined` value yields no segments at all, so callers
 *   can tell "nothing to render" apart from "render this text".
 */
export function splitInlineEmphasis(value: string | null | undefined): EmphasisSegment[] {
  if (!value) return []

  const segments: EmphasisSegment[] = []
  let cursor = 0

  for (const match of value.matchAll(EMPHASIS_PAIR)) {
    const start = match.index ?? 0
    const emphasized = match[2] ?? ''

    pushSegment(segments, value.slice(cursor, start).replace(STRAY_EMPHASIS_TAG, ''), false)
    pushSegment(segments, emphasized.replace(STRAY_EMPHASIS_TAG, ''), true)

    cursor = start + match[0].length
  }

  pushSegment(segments, value.slice(cursor).replace(STRAY_EMPHASIS_TAG, ''), false)

  return segments
}
