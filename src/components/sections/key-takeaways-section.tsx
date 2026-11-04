import type { Trip } from '@/payload-types'
import { KeyPointsList } from './key-points-list'

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
      <h2 id="key-takeaways-heading" className="heading-md mb-6">
        Key Takeaways
      </h2>
      <KeyPointsList items={points} />
    </section>
  )
}
