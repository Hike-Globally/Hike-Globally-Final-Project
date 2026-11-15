import { CustomHtml } from '@/components/content/custom-html'
import { KeyPointsCard } from '@/components/sections/key-points-card'
import type { PageSection } from '@/lib/page-sections'
import { cn } from '@/lib/utils'

/**
 * A Custom HTML row from Page sections. The editor's code is published as written — scripts,
 * styles, iframes, forms and all — and `CustomHtml` is what makes those scripts actually execute
 * (see `src/lib/custom-html.ts`). Only the optional heading is treated as plain text.
 */
export function CustomHtmlSection({
  section,
  variant,
}: {
  section: PageSection
  /** Blog embeds need their own content-width wrapper; trip embeds already sit in the body column. */
  variant: 'trip' | 'blog'
}) {
  const html = section.html ?? ''
  const heading = section.heading?.trim() ? section.heading : undefined
  if (!html.trim() && !heading) return null

  return (
    <section className="key-points-section custom-html-section py-12 md:py-16">
      <div className={cn(variant === 'blog' && 'container-content')}>
        <KeyPointsCard title={heading} className="custom-html-section__card">
          <div className="custom-html-section__content">
            <CustomHtml
              html={html}
              className="custom-html-section__embed max-w-none overflow-x-auto break-words [&_img]:max-w-full"
            />
          </div>
        </KeyPointsCard>
      </div>
    </section>
  )
}
