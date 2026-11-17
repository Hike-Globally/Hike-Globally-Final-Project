import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SectionHeading } from '@/components/sections/section-heading'
import type { FaqBlock } from '@/payload-types'

/**
 * FAQ block — the only block that ships real interactivity (Radix accordion, ~4KB).
 *
 * It emits no JSON-LD. `FAQPage` used to be what made these questions eligible for an
 * expandable result; Google restricted that to government/health sites in August 2023 and
 * removed the display entirely in 2026, so the markup earned nothing and cost a second copy of
 * every answer in the HTML. The accordion itself stays — that is what readers and AI answers
 * read (see `src/lib/seo.ts`).
 */
export function Faq({ block }: { block: FaqBlock }) {
  const items = (block.items ?? []).filter((item) => Boolean(item?.question))

  if (items.length === 0) return null

  return (
    <section className="py-16 md:py-24">
      <div className="container-content">
        <SectionHeading title={block.heading} description={block.subheading} titleLevel="h3" />

        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div className="hidden lg:block">
            <div className="sticky top-28 border-l-2 border-sage bg-mist p-7">
              <p className="eyebrow mb-3 text-slate-80">{block.heading}</p>
              <p className="description-copy leading-relaxed text-ink-70">
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
    </section>
  )
}
