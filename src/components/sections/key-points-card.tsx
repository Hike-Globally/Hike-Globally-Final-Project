import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

/** The shared card frame for Key Highlights, Key Takeaways, and custom content. */
export function KeyPointsCard({
  title,
  titleId,
  children,
  className,
}: {
  title?: string
  titleId?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('key-points-card', className)}>
      <header className="key-points-card-header">
        <span className="key-points-card-icon" aria-hidden="true">
          <Sparkles className="size-4" strokeWidth={1.7} />
        </span>
        <div className="min-w-0">
          <p className="key-points-card-eyebrow">Field notes</p>
          {title ? (
            <h2 id={titleId} className="heading-md key-points-card-title">
              {title}
            </h2>
          ) : null}
        </div>
        <span className="key-points-card-rule" aria-hidden="true" />
      </header>
      {children}
    </div>
  )
}
