import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import type { RegionLink } from '@/lib/taxonomy'
import { sitePath } from '@/i18n/config'
import { cn } from '@/lib/utils'

/**
 * The region counterpart of `PlaceCategoryLinks`: a landscape page naming the regions its trips
 * run through, as links.
 *
 * `/destinations/<region>` and `/places/<landscape>` are parallel ways into the same trips, and a
 * visitor who arrived by landscape often wants the region next — the same trailhead, the maps,
 * the getting-there copy. Linking the two taxonomies in both directions is also what tells a
 * search engine they are a hierarchy rather than two pages fighting over one query (see
 * `src/lib/taxonomy.ts`).
 */
export function DestinationLinks({
  regions,
  className,
  eyebrow = 'Browse by region',
  heading = 'Regions these trips run through',
  intro = 'The same journeys, seen from the region they start in.',
}: {
  regions: readonly RegionLink[]
  className?: string
  eyebrow?: string
  heading?: string
  intro?: string
}) {
  if (regions.length === 0) return null

  return (
    <section
      aria-labelledby="destination-links-heading"
      className={cn('border-y border-slate-20 bg-mist py-8 md:py-10', className)}
    >
      <div className="container-content">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="destination-links-heading" className="heading-md max-w-2xl text-ink">
            {heading}
          </h2>
          <p className="max-w-md text-small leading-relaxed text-ink-60">{intro}</p>
        </div>

        <ul className="mt-6 flex flex-wrap gap-2">
          {regions.map((region) => (
            <li key={region.slug}>
              <Link
                href={sitePath(`/destinations/${region.slug}`)}
                className="group inline-flex items-center gap-2 border border-slate-40 bg-paper px-3 py-2 text-ui font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-mist focus-visible:outline-offset-4"
              >
                {region.name}
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
