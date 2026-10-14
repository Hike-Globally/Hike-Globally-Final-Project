import { sanitizeCustomHtml } from '@/lib/custom-html'
import type { PageSection } from '@/lib/page-sections'

export function CustomHtmlSection({ section }: { section: PageSection }) {
  const html = sanitizeCustomHtml(section.html ?? '')
  if (!html.trim() && !section.heading?.trim()) return null

  return (
    <section className="py-12 md:py-16">
      {section.heading ? <h2 className="heading-lg mb-8">{section.heading}</h2> : null}
      <div
        className="prose-hg max-w-none overflow-x-auto break-words [&_img]:max-w-full"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  )
}
