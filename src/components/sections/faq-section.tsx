import { Reveal } from '@/components/motion/reveal'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { TripSectionHeading } from '@/components/trip/trip-section-heading'
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
  eyebrow,
  headingVariant = 'default',
  className = 'py-16 md:py-24',
}: {
  title: string
  groups: FaqGroup[]
  /** Small line above the heading (trip pages pass one; blog posts do not). */
  eyebrow?: string
  /**
   * `trip` opts into the trip page's chapter heading (gradient rule, eyebrow,
   * fluid size) and its section ids. The blog keeps `default`, which is the
   * plain `heading-lg` block it has always rendered.
   */
  headingVariant?: 'default' | 'trip'
  className?: string
}) {
  const isTrip = headingVariant === 'trip'
  if (!groups.length) return null

  return (
    <section
      id="faqs"
      aria-labelledby="faqs-heading"
      className={cn(isTrip ? 'trip-section' : 'scroll-mt-24', className)}
    >
      <Reveal>
        {isTrip ? (
          <TripSectionHeading id="faqs-heading" eyebrow={eyebrow} title={title} />
        ) : (
          <div className="mb-10">
            <h2 id="faqs-heading" className="heading-lg">
              {title}
            </h2>
          </div>
        )}

        <div className="space-y-8">
          {groups.map(({ field, heading, faqs }) => (
            <div key={field}>
              <h3
                className={cn(
                  'mb-4 flex items-center gap-2.5',
                  isTrip
                    ? 'font-heading text-[0.9375rem] font-semibold text-deep'
                    : 'heading-md text-ink',
                )}
              >
                {isTrip ? <span aria-hidden className="h-3.5 w-1 bg-sage" /> : null}
                {heading}
              </h3>
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
                      <span className="min-w-0 text-left font-heading text-base font-semibold text-ink md:text-lg">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="max-w-3xl text-[1.0625rem] leading-relaxed whitespace-pre-line text-ink-70">
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
