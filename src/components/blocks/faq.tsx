import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { JsonLd } from '@/components/seo/json-ld'
import { SectionHeading } from '@/components/sections/section-heading'
import { faqJsonLd } from '@/lib/seo'
import type { FaqBlock } from '@/payload-types'

/**
 * FAQ block — the only block that ships real interactivity (Radix accordion, ~4KB).
 * It also emits FAQPage structured data, which is what makes the questions eligible to
 * appear directly under your result in Google.
 */
export function Faq({ block }: { block: FaqBlock }) {
  const items = (block.items ?? []).filter((item) => Boolean(item?.question))

  if (items.length === 0) return null

  return (
    <section className="py-16 md:py-24">
      <div className="container-content">
        <SectionHeading title={block.heading} description={block.subheading} />

        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div className="hidden lg:block">
            <div className="sticky top-28 bg-sage-20 p-7">
              <p className="eyebrow mb-3 text-deep">{block.heading}</p>
              <p className="text-[0.9375rem] leading-relaxed text-ink-70">
                {block.subheading ??
                  'Still unsure about something? Send us a message — we answer every question ourselves.'}
              </p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
              <AccordionItem key={item.id ?? index} value={`item-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <JsonLd
        data={faqJsonLd(
          items.map((item) => ({ question: item.question ?? '', answer: item.answer ?? '' })),
        )}
      />
    </section>
  )
}
