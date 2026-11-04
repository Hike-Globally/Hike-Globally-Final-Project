import type { Trip } from '@/payload-types'
import { KeyPointsPanel } from './key-points-panel'

/** Shared by the public page and draft preview; uses the original CMS row order. */
export function KeyTakeawaysSection({ items }: { items: Trip['keyTakeaways'] }) {
  const points = items?.filter(({ text }) => text?.trim())
  if (!points?.length) return null

  return (
    <section
      id="key-takeaways"
      aria-labelledby="key-takeaways-heading"
      className="key-points-section scroll-mt-24 pt-12 md:pt-16"
    >
      <KeyPointsPanel title="Key Takeaways" titleId="key-takeaways-heading" items={points} />
    </section>
  )
}
