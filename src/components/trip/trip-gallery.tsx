import { Images } from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import { dictionary, t } from '@/i18n/dictionaries'
import { cn } from '@/lib/utils'
import type { Trip } from '@/payload-types'

import { TripSectionHeading } from './trip-section-heading'

/**
 * ============================================================================
 * GALLERY
 * ============================================================================
 * A mosaic rather than an even two-column grid: the first photograph runs
 * double width and double height on desktop, and every fourth tile widens, so
 * the strip has a lead image and a rhythm instead of four identical frames.
 *
 * Images come from the trip's `gallery` array and are served at their original
 * size (see `PayloadImage`), so the mosaic never softens a photograph that the
 * photographer uploaded sharp.
 */
export function TripGallery({
  gallery,
  className,
}: {
  gallery: NonNullable<Trip['gallery']>
  className?: string
}) {
  const items = gallery.filter((item) => item.image && typeof item.image !== 'number')
  if (!items.length) return null

  return (
    <section id="gallery" aria-labelledby="gallery-heading" className={className}>
      <TripSectionHeading
        id="gallery-heading"
        eyebrow={dictionary.trip.sectionGallery}
        title={dictionary.trip.gallery}
        action={
          <span className="inline-flex items-center gap-2 border border-ink/10 bg-white px-3 py-1.5 font-heading text-[0.75rem] font-semibold tracking-[0.08em] text-ink-70 uppercase">
            <Images className="size-3.5 text-sage" aria-hidden />
            {t(
              items.length === 1
                ? dictionary.trip.galleryCountOne
                : dictionary.trip.galleryCountOther,
              { count: items.length },
            )}
          </span>
        }
      />

      <div className="trip-gallery">
        {items.map((item, index) => (
          <figure key={item.id ?? index} className={cn('trip-gallery__item')}>
            <PayloadImage
              media={item.image}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw"
              className="h-full w-full"
              imageClassName="h-full w-full object-cover"
            />
          </figure>
        ))}
      </div>
    </section>
  )
}
