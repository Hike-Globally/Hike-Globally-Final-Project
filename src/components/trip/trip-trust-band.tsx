import { Compass, MapPinned, ShieldCheck, Users } from 'lucide-react'

import { dictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/utils'

const POINTS = [
  { icon: Compass, label: dictionary.trip.trustBandPoint1 },
  { icon: Users, label: dictionary.trip.trustBandPoint2 },
  { icon: ShieldCheck, label: dictionary.trip.trustBandPoint3 },
  { icon: MapPinned, label: dictionary.trip.trustBandPoint4 },
]

/**
 * ============================================================================
 * TRUST BAND
 * ============================================================================
 * A full-bleed dark band that breaks up the white content column roughly
 * two-thirds of the way down the page.
 *
 * Why it matters: the reference trip pages never run a single white column for
 * 10,000 pixels — they punctuate it with a dark, high-contrast strip that
 * restates why the operator is worth booking. This is that strip, and it is
 * also the page's third colour moment (after the hero's sunrise and the booking
 * card's glow).
 *
 * It sits *between* page sections rather than inside the content column, so it
 * is a full-width group in `TripDetail`'s layout.
 */
export function TripTrustBand({
  /**
   * `page` — full-bleed band spanning the viewport (the default; use between
   * full-width page groups). `column` — the same band inset inside the content
   * column, used to break up the long white body run without interrupting the
   * sticky booking rail beside it.
   */
  variant = 'page',
}: {
  variant?: 'page' | 'column'
} = {}) {
  const inset = variant === 'column'

  return (
    <section
      className={cn('trip-band-dark', inset ? 'my-12 md:my-16' : 'mt-16 md:mt-24')}
      aria-labelledby="trip-trust-heading"
    >
      <div className={cn(inset ? 'px-6 py-10 sm:px-10 md:py-14' : 'container-content py-14 md:py-20')}>
        <div
          className={cn(
            'grid gap-8 lg:items-center',
            inset ? 'lg:grid-cols-1 lg:gap-10' : 'lg:grid-cols-2 lg:gap-16',
          )}
        >
          <div>
            <p className="trip-section__eyebrow">{dictionary.trip.sectionInquiry}</p>
            <h2 id="trip-trust-heading" className="trip-section__heading mt-3 text-balance">
              {dictionary.trip.trustBandTitle}
            </h2>
            <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-mist/70">
              {dictionary.trip.trustBandText}
            </p>
          </div>

          <ul className="grid gap-px bg-white/10 sm:grid-cols-2">
            {POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3 bg-ink/80 p-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sage/15 text-sage">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-[0.9375rem] leading-relaxed text-mist/85">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
