import { RichText } from '@/components/content/rich-text'
import type { Locale } from '@/i18n/config'
import type { RichTextBlock } from '@/payload-types'
import { cn } from '@/lib/utils'

export function RichTextSection({ block, locale }: { block: RichTextBlock; locale: Locale }) {
  const narrow = block.width === 'narrow'

  return (
    <section className="py-16 md:py-24">
      <div className={cn(narrow ? 'container-prose' : 'container-content', block.align === 'center' ? 'text-center' : '')}>
        {block.heading ? <h2 className="heading-lg mb-6">{block.heading}</h2> : null}
        <RichText content={block.content} locale={locale} />
      </div>
    </section>
  )
}
