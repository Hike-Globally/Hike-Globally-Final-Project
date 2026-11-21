import { useId } from 'react'

import { PayloadImageFill } from '@/components/ui/payload-image'
import type { Media } from '@/payload-types'

type HeadingTag = 'h2' | 'h3'

/**
 * A Boxed Content node from the shared Trip / Blog Lexical editor.
 *
 * The block is deliberately rendered as a self-contained editorial plate: image first in the DOM
 * (and therefore on the left at desktop sizes), then the heading and description. Incomplete draft
 * blocks degrade gracefully rather than leaving an empty image well on the public page.
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

  return (
    <section
      className="boxed-content"
      aria-labelledby={heading ? resolvedHeadingId : undefined}
      aria-label={heading ? undefined : 'Featured content'}
      data-boxed-content
    >
      <div className="boxed-content__frame">
        {hasImage && media ? (
          <div className="boxed-content__media photo-plate">
            <PayloadImageFill
              media={media}
              sizes="(min-width: 1024px) 30rem, (min-width: 768px) 50vw, 100vw"
              className="boxed-content__photo"
            />
          </div>
        ) : null}

        <div className="boxed-content__copy">
          <span className="boxed-content__accent" aria-hidden="true" />
          {heading ? (
            <Heading
              id={resolvedHeadingId}
              className={`boxed-content__title${headingTag === 'h3' ? ' boxed-content__title--subheading' : ''}`}
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
