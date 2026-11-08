import { RichText } from '@/components/content/rich-text'
import type { RichTextBlock } from '@/payload-types'
import type { InternalLinker } from '@/lib/internal-links'
import { cn } from '@/lib/utils'

/**
 * Rich text section.
 *
 * `singlePage` is set by `/slug` pages only: it opts the copy into the single-page body
 * style (17px pure black — see `.single-page-body`), while the homepage keeps the
 * multi-purpose default.
 *
 * `linker` is the page's automated internal linking, threaded down from the route (see
 * `src/lib/internal-links.ts`).
 */
export function RichTextSection({
  block,
  singlePage = false,
  linker,
}: {
  block: RichTextBlock
  singlePage?: boolean
  linker?: InternalLinker | null
}) {
  const narrow = block.width === 'narrow'

  return (
    <section className="py-16 md:py-24">
      <div
        className={cn(
          narrow ? 'container-prose' : 'container-content',
          singlePage && 'single-page-body',
          block.align === 'center' ? 'text-center' : '',
        )}
      >
        {block.heading ? <h2 className="heading-lg mb-6">{block.heading}</h2> : null}
        <RichText content={block.content} linker={linker} />
      </div>
    </section>
  )
}
