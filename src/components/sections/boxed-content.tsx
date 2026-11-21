import { useId } from 'react'

import { PayloadImageFill } from '@/components/ui/payload-image'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

type HeadingTag = 'h2' | 'h3'

/**
 * A Boxed Content node from the shared Trip / Blog Lexical editor.
 *
 * The block is deliberately rendered as a self-contained editorial plate: image first in the DOM
 * (and therefore on the left when its container is wide enough), then the heading and description.
 * Incomplete draft blocks degrade gracefully to a single full-width copy column rather than leaving
 * an empty image well or half-empty grid on the public page.
 */
export function BoxedContent({
  source,
  headingId,
  headingTag = 'h2',
}: {
  source: unknown
  headingId?: string
  headingTag?: HeadingTag
}) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const fields = source && typeof source === 'object' ? (source as Record<string, unknown>) : {}
  const heading = typeof fields.heading === 'string' ? fields.heading.trim() : ''
  const description = typeof fields.description === 'string' ? fields.description.trim() : ''
  const media = fields.image && typeof fields.image === 'object' ? (fields.image as Media) : null
  const hasImage = Boolean(
    media?.url && (!media.mimeType || media.mimeType.toLowerCase().startsWith('image/')),
  )

  if (!heading && !description) return null

  const Heading = headingTag
  const resolvedHeadingId = headingId ?? `boxed-content-${generatedId}`
  const showMedia = Boolean(hasImage && media)

  return (
    <section
      className="boxed-content"
      aria-labelledby={heading ? resolvedHeadingId : undefined}
      aria-label={heading ? undefined : 'Featured content'}
      data-boxed-content
    >
      <div className={cn('boxed-content__frame', showMedia && 'boxed-content__frame--with-media')}>
        {showMedia && media ? (
          <div className="boxed-content__media photo-plate">
            <PayloadImageFill media={media} unoptimized className="boxed-content__photo" />
          </div>
        ) : null}

        <div className="boxed-content__copy">
          <span className="boxed-content__accent" aria-hidden="true" />
          {heading ? (
            <Heading
              id={resolvedHeadingId}
              className={cn(
                'boxed-content__title',
                headingTag === 'h3' && 'boxed-content__title--subheading',
              )}
            >
              {heading}
            </Heading>
          ) : null}
          {description ? <p className="boxed-content__description">{description}</p> : null}
        </div>
      </div>
    </section>
  )
}
