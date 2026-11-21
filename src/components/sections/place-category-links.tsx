import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { placeCategoryPath, resolvePlaceCategories } from '@/lib/place-categories'
import { cn } from '@/lib/utils'

/**
 * Visible mapping of a trip or post's CMS Browse Places selection.
 *
 * Editors choose categories in the admin; this component turns those stored
 * values into links to the dedicated place pages. Unknown legacy values are
 * ignored, so a document with no selection renders no empty strip.
 */
export function PlaceCategoryLinks({
  values,
  className,
}: {
  values: readonly unknown[] | null | undefined
  className?: string
}) {
  const categories = resolvePlaceCategories(values)
  if (categories.length === 0) return null

  return (
    <section
      aria-labelledby="place-category-links-heading"
      className={cn('border-y border-slate-20 bg-mist py-8 md:py-10', className)}
    >
      <div className="container-content">
        <p className="eyebrow mb-3">Browse places</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2
            id="place-category-links-heading"
            className="heading-md max-w-2xl text-ink"
          >
            Explore related places
          </h2>
          <p className="max-w-md text-small leading-relaxed text-ink-60">
            Follow this story into the landscapes it belongs to.
          </p>
        </div>

        <ul className="mt-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category.value}>
              <Link
                href={placeCategoryPath(category.value)}
                className="group inline-flex items-center gap-2 border border-slate-40 bg-paper px-3 py-2 text-ui font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-mist focus-visible:outline-offset-4"
              >
                {category.label}
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
