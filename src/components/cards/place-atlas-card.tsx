import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import Image from '@/components/ui/next-image'
import { placeCategoryPath, type PlaceCategory } from '@/lib/place-categories'

/**
 * One landscape in the `/places` atlas gallery.
 *
 * The index counterpart to the homepage carousel card, deliberately quieter:
 * the photograph sits alone on its framed plate and the label lives BELOW it
 * like a museum caption — ember numeral, name, one line — instead of stacking
 * coordinates, an eyebrow and two calls to action over the image. The whole
 * card is a single link; the photo is decorative because the visible caption
 * is its accessible name.
 */
export function PlaceAtlasCard({
  category,
  index,
  priority = false,
}: {
  category: PlaceCategory
  index: number
  priority?: boolean
}) {
  const number = String(index + 1).padStart(2, '0')

  return (
    <Link
      href={placeCategoryPath(category.value)}
      data-place-atlas-card={category.value}
      className="atlas-card group"
    >
      <span className="atlas-card__photo photo-plate">
        <Image
          src={category.image}
          alt=""
          fill
          sizes="(min-width: 64rem) 30vw, (min-width: 40rem) 46vw, 92vw"
          priority={priority}
          aria-hidden="true"
          className="atlas-card__image"
        />
      </span>

      <div className="atlas-card__caption">
        <div className="atlas-card__meta">
          <span className="atlas-card__num" aria-hidden="true">
            {number}
          </span>
          <h3 className="atlas-card__title">{category.label}</h3>
          <ArrowUpRight className="atlas-card__arrow size-4" aria-hidden="true" />
        </div>
        <p className="atlas-card__desc">{category.description}</p>
      </div>
    </Link>
  )
}
