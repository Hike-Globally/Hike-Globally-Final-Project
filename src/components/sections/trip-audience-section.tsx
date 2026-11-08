import { UserRoundCheck, UserRoundX, type LucideIcon } from 'lucide-react'

import { RichText } from '@/components/content/rich-text'
import { Reveal } from '@/components/motion/reveal'
import { dictionary } from '@/i18n/dictionaries'
import type { InternalLinker } from '@/lib/internal-links'
import { resolveTripAudience, type TripAudienceKind } from '@/lib/trip-audience'
import type { Trip } from '@/payload-types'

import './trip-audience.css'

const cardChrome: Record<TripAudienceKind, { icon: LucideIcon; eyebrow: string; id: string }> = {
  for: {
    icon: UserRoundCheck,
    eyebrow: dictionary.trip.audienceForEyebrow,
    id: 'who-is-this-trip-for',
  },
  'not-for': {
    icon: UserRoundX,
    eyebrow: dictionary.trip.audienceNotForEyebrow,
    id: 'who-is-this-trip-not-for',
  },
}

/**
 * Who Is This Trip For / Who Is This Trip Not For — a matched pair of editorial cards.
 *
 * Shared by the public page and the draft preview. The pair sits side by side whenever *its own*
 * column is wide enough (a container query, not a viewport breakpoint — so it behaves the same
 * beside the sticky booking card as it does without it) and stacks otherwise. A side with no
 * description is omitted; with only one side filled in, that card takes the full width.
 */
export function TripAudienceSection({
  trip,
  linker,
}: {
  trip: Trip
  /** The page's automated internal linking (see `src/lib/internal-links.ts`). */
  linker?: InternalLinker | null
}) {
  const cards = resolveTripAudience(trip)
  if (!cards.length) return null

  return (
    <section
      id="trip-audience"
      aria-label={cards.map(({ heading }) => heading).join(' / ')}
      className="trip-audience scroll-mt-24 pb-16 md:pb-24"
    >
      <div className="trip-audience-grid">
        {cards.map(({ kind, heading, description }, index) => {
          const { icon: Icon, eyebrow, id } = cardChrome[kind]
          return (
            <Reveal key={kind} delay={index * 90} className="trip-audience-cell">
              <article
                id={id}
                aria-labelledby={`${id}-heading`}
                className={`trip-audience-card trip-audience-card--${kind} scroll-mt-24`}
              >
                <header className="trip-audience-card-header">
                  <span className="trip-audience-card-icon" aria-hidden="true">
                    <Icon className="size-[1.125rem]" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0">
                    <p className="trip-audience-card-eyebrow">{eyebrow}</p>
                    <h2 id={`${id}-heading`} className="heading-md trip-audience-card-title">
                      {heading}
                    </h2>
                  </div>
                </header>
                <RichText
                  content={description}
                  headingTag="h3"
                  className="trip-audience-copy"
                  linker={linker}
                />
              </article>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
