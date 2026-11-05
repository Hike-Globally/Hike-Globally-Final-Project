import { Reveal } from '@/components/motion/reveal'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { surface } from '@/components/ui/surface'
import type { getTripFaqGroups } from '@/lib/trip-faqs'
import { cn } from '@/lib/utils'

export type FaqGroup = ReturnType<typeof getTripFaqGroups>[number]

/**
 * The "Frequently Asked Questions" section of trip and blog pages: an H2, then one H3 per
 * non-empty FAQ category with its questions as an accordion of cards (questions are H4s).
 *
 * Both views render this one component so the two pages cannot drift apart. Only the outer
 * spacing differs — pass `className` to replace the default vertical padding. Renders nothing
 * when there are no questions. `id="faqs"` is the in-page anchor.
 */
export function FaqSection({
  title,
  groups,
  className = 'py-16 md:py-24',
}: {
  title: string
  groups: FaqGroup[]
  className?: string
}) {
  if (!groups.length) return null

  return (
    <section id="faqs" className={cn('scroll-mt-24', className)}>
      <Reveal>
        <div className="mb-10">
          <h2 className="heading-lg">{title}</h2>
        </div>

        <div className="space-y-10">
          {groups.map(({ field, heading, faqs }) => (
            <div key={field}>
              <h3 className="heading-md mb-4">{heading}</h3>
              <Accordion type="multiple" className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.id ?? index}
                    value={`${field}-${faq.id ?? index}`}
                    className={cn(surface, 'overflow-hidden px-6 md:px-8')}
                  >
                    <AccordionTrigger
                      headingLevel="h4"
                      className="items-center py-6 hover:no-underline md:py-7"
                    >
                      <span className="min-w-0 text-left font-heading text-subhead font-semibold text-ink">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="max-w-3xl text-lead leading-relaxed whitespace-pre-line text-ink-70">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
