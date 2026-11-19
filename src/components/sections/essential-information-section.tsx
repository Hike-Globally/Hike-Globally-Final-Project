import { RichText } from '@/components/content/rich-text'
import { Reveal } from '@/components/motion/reveal'
import type { InternalLinker } from '@/lib/internal-links'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { surface } from '@/components/ui/surface'
import { cn } from '@/lib/utils'
import type { Trip } from '@/payload-types'

type ContentSections = NonNullable<Trip['contentSections']>
type HotelSections = NonNullable<Trip['hotelsNearDestination']>
type AccordionSection = ContentSections[number] | HotelSections[number]

type TripAccordionSectionProps = {
  id: string
  title: string
  sections: AccordionSection[]
  copyClassName: string
  linker?: InternalLinker | null
}

/**
 * Shared accordion presentation for CMS-authored Trip sections.
 *
 * `defaultValue` (not `value`) keeps Radix uncontrolled: each accordion starts open, its entries
 * toggle independently, and the open state is not persisted between visits.
 */
export function TripAccordionSection({
  id,
  title,
  sections,
  copyClassName,
  linker,
}: TripAccordionSectionProps) {
  if (!sections.length) return null

  const values = sections.map((section, index) => `section-${section.id ?? index}`)

  return (
    <section id={id} className="scroll-mt-24 py-16 md:py-24">
      <Reveal>
        <div className="mb-10">
          <h2 className="heading-lg">{title}</h2>
        </div>

        <Accordion type="multiple" defaultValue={values} className="space-y-4">
          {sections.map((section, index) => (
            <AccordionItem
              key={section.id ?? index}
              value={values[index]}
              className={cn(surface, 'overflow-hidden px-4 sm:px-6 md:px-8')}
            >
              {/* Radix renders the <button> with aria-expanded and native Enter/Space support. */}
              <AccordionTrigger
                indicator="plus-minus"
                headingLevel="h2"
                textRole="section"
                className="items-center py-6 hover:no-underline md:py-7"
              >
                <span className="min-w-0 break-words text-left">{section.heading}</span>
              </AccordionTrigger>
              <AccordionContent>
                <RichText
                  content={section.content}
                  headingTag="h3"
                  className={cn(copyClassName, 'w-full min-w-0 break-words text-lead')}
                  linker={linker}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  )
}

/**
 * Essential Information — the trip's CMS "Essential Information" panel.
 *
 * The section title is an H2, every CMS Heading field is an H2, and every subheading written in
 * the Description editor is a real H3. Sizes come from the global H2/H3 roles; nothing here sets
 * a font size of its own.
 */
export function EssentialInformationSection({
  title,
  sections,
  linker,
}: {
  title: string
  sections: ContentSections
  linker?: InternalLinker | null
}) {
  return (
    <TripAccordionSection
      id="essential-information"
      title={title}
      sections={sections}
      copyClassName="essential-information-copy"
      linker={linker}
    />
  )
}

/** Hotels use the same open-on-load, independently toggleable accordion design as Essential Info. */
export function HotelsNearDestinationSection({
  title,
  sections,
  linker,
}: {
  title: string
  sections: HotelSections
  linker?: InternalLinker | null
}) {
  return (
    <TripAccordionSection
      id="hotels-near-destination"
      title={title}
      sections={sections}
      copyClassName="hotels-near-destination-copy"
      linker={linker}
    />
  )
}
