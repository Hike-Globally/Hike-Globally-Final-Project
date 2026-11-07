import { hasRichTextContent } from './rich-text-content'

/**
 * "Who Is This Trip For" / "Who Is This Trip Not For".
 *
 * Shared by the Trips collection (placeholders and help text) and the trip page renderer, so the
 * heading an editor sees greyed out in an empty field is exactly the one visitors get.
 */
export const tripAudienceDefaults = {
  forHeading: 'Who Is This Trip For',
  notForHeading: 'Who Is This Trip Not For',
} as const

export type TripAudienceKind = 'for' | 'not-for'

export type TripAudienceCard = {
  kind: TripAudienceKind
  heading: string
  description: unknown
}

type TripAudienceSource = {
  tripForHeading?: string | null
  tripForDescription?: unknown
  tripNotForHeading?: string | null
  tripNotForDescription?: unknown
}

/**
 * The cards to render, in reading order ("for" first). A side is only included when its
 * description has real content — Lexical saves an empty paragraph even when nothing was typed, and
 * a heading on its own would be a promise with nothing behind it. A blank heading falls back to the
 * default wording.
 */
export function resolveTripAudience(trip: TripAudienceSource): TripAudienceCard[] {
  const cards: TripAudienceCard[] = []

  if (hasRichTextContent(trip.tripForDescription)) {
    cards.push({
      kind: 'for',
      heading: trip.tripForHeading?.trim() || tripAudienceDefaults.forHeading,
      description: trip.tripForDescription,
    })
  }

  if (hasRichTextContent(trip.tripNotForDescription)) {
    cards.push({
      kind: 'not-for',
      heading: trip.tripNotForHeading?.trim() || tripAudienceDefaults.notForHeading,
      description: trip.tripNotForDescription,
    })
  }

  return cards
}
