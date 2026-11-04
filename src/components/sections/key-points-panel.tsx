import { Sparkles } from 'lucide-react'

import { KeyPointsList, type KeyPointItem } from './key-points-list'

/** The shared, framed presentation for trip takeaways and highlights. */
export function KeyPointsPanel({
  title,
  titleId,
  items,
}: {
  title: string
  titleId: string
  items: KeyPointItem[]
}) {
  return (
    <div className="key-points-card">
      <header className="key-points-card-header">
        <span className="key-points-card-icon" aria-hidden="true">
          <Sparkles className="size-4" strokeWidth={1.7} />
        </span>
        <div className="min-w-0">
          <p className="key-points-card-eyebrow">Field notes</p>
          <h2 id={titleId} className="heading-md key-points-card-title">
            {title}
          </h2>
        </div>
        <span className="key-points-card-rule" aria-hidden="true" />
      </header>
      <KeyPointsList items={items} />
    </div>
  )
}
