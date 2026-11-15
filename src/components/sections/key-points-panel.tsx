import { KeyPointsList, type KeyPointItem } from './key-points-list'
import { KeyPointsCard } from './key-points-card'

/** Shared content wrapper for the trip takeaways and highlights. */
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
    <KeyPointsCard title={title} titleId={titleId}>
      <KeyPointsList items={items} />
    </KeyPointsCard>
  )
}
