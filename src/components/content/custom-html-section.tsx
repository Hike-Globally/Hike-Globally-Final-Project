import { CustomHtml } from '@/components/content/custom-html'
import type { PageSection } from '@/lib/page-sections'
import { cn } from '@/lib/utils'

/**
 * A Custom HTML row from Page sections. The editor's code is published as written — scripts,
 * styles, iframes, forms and all — and `CustomHtml` is what makes those scripts actually execute
 * (see `src/lib/custom-html.ts`). Only the optional heading is treated as plain text.
 */
export function CustomHtmlSection({
  section,
  variant = 'default',
}: {
  section: PageSection
  /** Trip and blog embeds get a category tag and paper card without changing their saved HTML. */
  variant?: 'default' | 'trip' | 'blog'
}) {
  const html = section.html ?? ''
  if (!html.trim() && !section.heading?.trim()) return null

  const hasEditorialFrame = variant !== 'default'
  const label = variant === 'trip' ? 'TRIP' : variant === 'blog' ? 'BLOG' : null
  const heading = section.heading ? (
    hasEditorialFrame ? (
      <header className="custom-html-section__heading">
        <h2 className="heading-lg custom-html-section__title">{section.heading}</h2>
      </header>
    ) : (
      <h2 className="heading-lg mb-8">{section.heading}</h2>
    )
  ) : null
  const embed = (
    <CustomHtml
      html={html}
      className={cn(
        'max-w-none overflow-x-auto break-words [&_img]:max-w-full',
        hasEditorialFrame ? 'custom-html-section__embed' : 'prose-hg',
      )}
    />
  )

  return (
    <section
      className={cn(
        'custom-html-section',
        hasEditorialFrame ? 'custom-html-section--editorial' : 'py-12 md:py-16',
      )}
    >
      {hasEditorialFrame ? (
        <div className="container-content custom-html-section__inner">
          {label ? <span className="custom-html-section__label">{label}</span> : null}
          <div className="custom-html-section__card">
            {heading}
            {embed}
          </div>
        </div>
      ) : (
        <>
          {heading}
          {embed}
        </>
      )}
    </section>
  )
}
