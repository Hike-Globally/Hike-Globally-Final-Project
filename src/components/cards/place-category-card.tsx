import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import Image from '@/components/ui/next-image'
import { placeCategoryPath, type PlaceCategory } from '@/lib/place-categories'
import { cn } from '@/lib/utils'

/**
 * One premium portrait category card.
 *
 * The same component is used by the homepage marquee and the `/places` index.
 * The photograph is decorative (`alt=""`) because the visible title is the
 * accessible name of the link; the frontend language runtime translates the
 * visible title and description in place.
 */
export function PlaceCategoryCard({
  category,
  index,
  priority = false,
  showImage = true,
  decorative = false,
  className,
}: {
  category: PlaceCategory
  index: number
  priority?: boolean
  /** The homepage carousel can use a solid background instead of a photograph. */
  showImage?: boolean
  /** Duplicated marquee cards are hidden from assistive tech and tab order. */
  decorative?: boolean
  className?: string
}) {
  const number = String(index + 1).padStart(3, '0')

  return (
    <Link
      href={placeCategoryPath(category.value)}
      data-place-category-card={category.value}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? -1 : undefined}
      className={cn('browse-places__card group', className)}
    >
      {showImage && (
        <>
          <Image
            src={category.image}
            alt=""
            fill
            sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 42vw, 82vw"
            priority={priority}
            draggable={false}
            aria-hidden="true"
            className="browse-places__image"
          />
          <span className="browse-places__scrim" aria-hidden="true" />
        </>
      )}

      <div className="browse-places__card-top" aria-hidden="true">
        <span className="browse-places__number">{number}</span>
        <span className="browse-places__coordinate">HG / {number}</span>
      </div>

      <div className="browse-places__card-content">
        <p className="browse-places__eyebrow">Explore category</p>
        <h3 className="browse-places__title">{category.label}</h3>
        <p className="browse-places__description">{category.description}</p>
        <span className="browse-places__action">
          View category
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}
