import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type Crumb = { label: string; href?: string }

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      {/* Colours come from `currentColor`, so the trail reads on both the
          photographic header (paper) and the light one (ink). */}
      <ol className="flex flex-wrap items-center gap-1.5 text-small">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="opacity-75 transition-opacity hover:opacity-100">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight className="size-3.5 opacity-45" aria-hidden />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
