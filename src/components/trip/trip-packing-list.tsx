import { Backpack, Check } from 'lucide-react'

import { dictionary, t } from '@/i18n/dictionaries'
import type { Trip } from '@/payload-types'

import { TripSectionHeading } from './trip-section-heading'

/**
 * ============================================================================
 * PACKING LIST
 * ============================================================================
 * A dense, three-column checklist. Packing lists are reference material — read
 * once, scanned often — so the layout optimises for scanning: short rows, a
 * deep tick mark and no card chrome per item, which would have added 3,000
 * pixels to a page that is already long.
 */
export function TripPackingList({
  items,
  className,
}: {
  items: NonNullable<Trip['packingList']>
  className?: string
}) {
  const list = items.filter((item) => item.item?.trim())
  if (!list.length) return null

  return (
    <section id="packing-list" aria-labelledby="packing-heading" className={className}>
      <TripSectionHeading
        id="packing-heading"
        eyebrow={dictionary.trip.sectionIncludes}
        title={dictionary.trip.packingHeading}
        action={
          <span className="inline-flex items-center gap-2 font-heading text-[0.75rem] font-semibold tracking-[0.1em] text-ink-60 uppercase">
            <Backpack className="size-4 text-sage" aria-hidden />
            {t(
              list.length === 1
                ? dictionary.trip.packingCountOne
                : dictionary.trip.packingCountOther,
              { count: list.length },
            )}
          </span>
        }
      />

      <ul className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((item, index) => (
          <li
            key={item.id ?? `${item.item}-${index}`}
            className="flex items-start gap-3 border-b border-ink/[0.07] py-3"
          >
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-sage/30 text-ink">
              <Check className="size-2.5" strokeWidth={4} aria-hidden />
            </span>
            <span className="text-[0.9375rem] leading-relaxed text-ink-80">{item.item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
