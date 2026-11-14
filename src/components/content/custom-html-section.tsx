import { CustomHtml } from '@/components/content/custom-html'
import type { PageSection } from '@/lib/page-sections'

/**
 * A Custom HTML row from Page sections. The editor's code is published as written — scripts,
 * styles, iframes, forms and all — and `CustomHtml` is what makes those scripts actually execute
 * (see `src/lib/custom-html.ts`). Only the optional heading is treated as plain text.
 */
export function CustomHtmlSection({ section }: { section: PageSection }) {
  const html = section.html ?? ''
  if (!html.trim() && !section.heading?.trim()) return null

  return (
    <section className="py-12 md:py-16">
      {section.heading ? <h2 className="heading-lg mb-8">{section.heading}</h2> : null}
      <CustomHtml
        html={html}
        className="prose-hg max-w-none overflow-x-auto break-words [&_img]:max-w-full"
      />
    </section>
  )
}
