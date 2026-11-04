import { Check, Sparkles } from 'lucide-react'

type HighlightItem = { id?: string | null; text: string }

/**
 * Splits a plain-text highlight on **double asterisks** into bold runs.
 *
 * The CMS stores highlights as plain text (see the field description in
 * `src/collections/Trips.ts`), so emphasis has to be parsed rather than trusted
 * as markup — no string from the database ever reaches
 * `dangerouslySetInnerHTML`.
 */
function withEmphasis(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  )
}

/**
 * ============================================================================
 * HIGHLIGHTS / KEY TAKEAWAYS
 * ============================================================================
 * The two "why this trip" lists — `keyTakeaways` (a summary an editor writes
 * before the Overview) and `highlights` (the itinerary's selling points) — used
 * to be two different bullet styles a few hundred pixels apart. They now share
 * one tile grid, so the page states its case once, clearly: numbered, hairline
 * separated tiles that tint amber on hover.
 *
 * Renders nothing when there is no content, which keeps the section nav honest
 * (see `tripAnchors`).
 */
export function TripHighlights({
  id,
  title,
  eyebrow,
  kicker,
  items,
  className,
}: {
  id: string
  title: string
  eyebrow?: string
  /** Small label beside the sparkle icon on the card's header, e.g. "Field notes". */
  kicker?: string
  items: HighlightItem[] | null | undefined
  className?: string
}) {
  const points = (items ?? []).filter((item) => item.text?.trim())
  if (!points.length) return null

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={className}>
      {/* The framed card is the trip page's version of the shared
          `KeyPointsPanel`: one hairline frame, a champagne rule at the top-left,
          and the list inset inside it. */}
      <div className="trip-points-card">
        <div className="trip-points-card__header">
          <span className="trip-points-card__icon" aria-hidden>
            <Sparkles className="size-4" strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            {kicker ? <p className="trip-points-card__kicker">{kicker}</p> : null}
            <h2 id={`${id}-heading`} className="trip-points-card__title">
              {title}
            </h2>
          </div>
          {eyebrow ? <p className="trip-points-card__eyebrow">{eyebrow}</p> : null}
        </div>

        <ol className="trip-tiles">
          {points.map((item, index) => (
            <li key={item.id ?? `${id}-${index}`} className="trip-tile">
              <span className="trip-tile__index" aria-hidden>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="trip-tile__text">{withEmphasis(item.text)}</span>
              <Check className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
