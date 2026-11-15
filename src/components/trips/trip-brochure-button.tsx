import { Download } from 'lucide-react'

import type { TripBrochure } from '@/lib/trip-brochure'
import { cn } from '@/lib/utils'

/**
 * "Download Trip Brochure" — the one secondary action under the booking CTA.
 *
 * Rendered as a real anchor with `download`, so the file downloads under a readable name
 * ("everest-base-camp-trek-brochure.pdf") instead of navigating to a PDF viewer, and so it keeps
 * working with JavaScript disabled.
 *
 * Design notes (keeping it to the site's one voice, not a second button style):
 *  - It is deliberately *not* a filled button. The booking CTA is the only filled control in the
 *    card; a second one would split the page's single most important decision in two.
 *  - A hairline outline in `mist` at 30% reads as a quiet sibling to the filled booking CTA on
 *    the ink card: same height, same type size, half the volume.
 *  - The label is centred in the well with the icon trailing it as one phrase, so the control reads
 *    the same as the booking CTA above it (which is also a centred label + trailing icon) rather
 *    than looking like a left-aligned list row with the icon pushed to the far edge.
 *  - Nothing else sits inside the button. The file's kind and size — "PDF · 2.3 MB" — go in the
 *    single muted line underneath, so the control itself stays one readable phrase.
 *  - The arrow slides down on hover; it is the only motion in the card besides the icon colours.
 *  - The note is `mist/65`, which measures 6.2:1 on the ink card — the muted look without
 *    dropping 14px body text under the AA threshold.
 */
export function TripBrochureButton({
  brochure,
  className,
}: {
  brochure: TripBrochure
  className?: string
}) {
  return (
    <div className={cn('mt-3', className)}>
      <a
        href={brochure.url}
        download={brochure.filename}
        className={cn(
          'group flex h-13 w-full items-center justify-center gap-2.5 rounded-[7px] border border-white/30 bg-white/[0.06] px-5',
          'font-heading text-ui font-medium tracking-[0.01em] text-mist',
          'transition-[background-color,border-color,color,transform] duration-250 ease-[var(--ease-brand)] hover:border-white/80 hover:bg-paper hover:text-ink active:translate-y-px',
          'focus-visible:border-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-haze/40',
        )}
      >
        <span className="min-w-0 truncate">{brochure.label}</span>
        <Download
          aria-hidden
          className="size-4 shrink-0 text-mist/75 transition-[transform,color] duration-250 ease-[var(--ease-brand)] group-hover:translate-y-0.5 group-hover:text-ink"
        />
      </a>

      {brochure.note ? (
        <p className="mt-2.5 text-center text-small leading-snug text-mist/65">{brochure.note}</p>
      ) : null}
    </div>
  )
}
