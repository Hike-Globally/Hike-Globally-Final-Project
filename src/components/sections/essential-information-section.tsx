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

/**
 * Essential Information — the trip's CMS "Content sections" array.
 *
 * Outline: the section title is an H2, every CMS Heading field is an H2, and every subheading
 * written in the Description editor is a real H3. Sizes come from the global H2/H3 roles;
 * nothing here sets a font size of its own.
 *
 * `defaultValue` (not `value`) keeps Radix uncontrolled: all sections start open on every page
 * load, each one toggles independently, and the open state is never persisted between visits.
 * The shared AccordionContent supplies the site's existing accordion height animation.
 */
export function EssentialInformationSection({
  title,
  sections,
  linker,
}: {
  title: string
  sections: ContentSections
  /** The page's automated internal linking (see `src/lib/internal-links.ts`). */
  linker?: InternalLinker | null
}) {
  if (!sections.length) return null

  const values = sections.map((section, index) => `section-${section.id ?? index}`)

  return (
    <section id="essential-information" className="scroll-mt-24 py-16 md:py-24">
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
                  className="essential-information-copy w-full min-w-0 break-words text-lead"
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
