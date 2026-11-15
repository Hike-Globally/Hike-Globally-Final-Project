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
  /** Trip embeds get an editorial, full-width frame without changing their saved HTML. */
  variant?: 'default' | 'trip'
}) {
  const html = section.html ?? ''
  if (!html.trim() && !section.heading?.trim()) return null

  const isTrip = variant === 'trip'
  const heading = section.heading ? (
    isTrip ? (
      <header className="custom-html-section__heading">
        <span className="custom-html-section__accent" aria-hidden="true" />
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
        isTrip ? 'custom-html-section__embed' : 'prose-hg',
      )}
    />
  )

  return (
    <section
      className={cn('custom-html-section', isTrip ? 'custom-html-section--trip' : 'py-12 md:py-16')}
    >
      {isTrip ? (
        <div className="container-content custom-html-section__inner">
          {heading}
          {embed}
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
