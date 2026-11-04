import { Check, X } from 'lucide-react'

import { dictionary } from '@/i18n/dictionaries'
import { TripSectionHeading } from './trip-section-heading'

type InclusionItem = { id?: string | null; item: string }

/**
 * ============================================================================
 * INCLUDED / NOT INCLUDED
 * ============================================================================
 * Two columns, one warm and one quiet, with the two lists sharing a single
 * hairline rhythm so they can be compared line by line — which is exactly how
 * a traveller uses this section ("does the price cover the flight to Lukla?").
 *
 * The amber column is the "yes" and carries the section; the grey column is the
 * "no" and deliberately recedes, so the first impression of the price is
 * positive without the exclusions being hidden.
 */
export function TripInclusions({
  included,
  notIncluded,
  className,
}: {
  included: InclusionItem[] | null | undefined
  notIncluded: InclusionItem[] | null | undefined
  className?: string
}) {
  const yes = (included ?? []).filter((item) => item.item?.trim())
  const no = (notIncluded ?? []).filter((item) => item.item?.trim())
  if (!yes.length && !no.length) return null

  return (
    <section id="inclusions" aria-labelledby="inclusions-heading" className={className}>
      <TripSectionHeading
        id="inclusions-heading"
        eyebrow={dictionary.trip.sectionIncludes}
        title={dictionary.trip.included}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {yes.length ? (
          <div className="relative overflow-hidden border border-sage/35 bg-sage-20 p-5 sm:p-7">
            {/* A warm corner glow — the section's one decorative flourish. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-sage/20 blur-3xl"
            />
            <h3 className="relative mb-3 font-heading text-lg font-semibold text-ink">
              {dictionary.trip.includedHeading}
            </h3>
            <ul className="trip-include-list relative">
              {yes.map((item) => (
                <li key={item.id ?? item.item}>
                  <span className="trip-include-list__tick">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span>{item.item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {no.length ? (
          <div className="relative overflow-hidden border border-ink/10 bg-mist p-5 sm:p-7">
            <h3 className="relative mb-3 font-heading text-lg font-semibold text-ink">
              {dictionary.trip.notIncludedHeading}
            </h3>
            <ul className="trip-include-list trip-include-list--no relative">
              {no.map((item) => (
                <li key={item.id ?? item.item}>
                  <span className="trip-include-list__cross">
                    <X className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span>{item.item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
