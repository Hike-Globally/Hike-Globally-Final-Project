'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDownIcon, MinusIcon, PlusIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('border-b border-slate-20 last:border-b-0', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  indicator = 'plus',
  headingLevel = 'h3',
  textRole = 'subhead',
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  /**
   * Right-hand control. `plus` is the site-wide badge (rotates to an × when open);
   * `chevron` is the optional circular chevron badge; `plus-minus` is that same circular badge
   * showing a real − while open and + while closed (Essential Information sections).
   */
  indicator?: 'plus' | 'chevron' | 'plus-minus'
  /** Semantic heading tag for the accordion question. */
  headingLevel?: 'h2' | 'h3' | 'h4'
  /**
   * Type role for the title. `section` reads the global H2 role (`heading-lg`) instead of the
   * compact `text-subhead` used by FAQ questions and itinerary days.
   */
  textRole?: 'subhead' | 'section'
}) {
  const Heading = headingLevel
  const typography = textRole === 'section' ? 'heading-lg' : 'font-heading text-subhead font-medium'

  return (
    <AccordionPrimitive.Header asChild>
      <Heading className={cn('flex', textRole === 'section' && 'heading-lg')}>
        <AccordionPrimitive.Trigger
          data-slot="accordion-trigger"
          className={cn(
            // `group/accordion` is what the indicator badges below react to. The previous
            // variants (`[[data-state=open]>span>&]`) pointed at a wrapper <span> that does not
            // exist — the state attribute sits on the trigger itself — so the chevron and the
            // plus/× never changed when a row opened.
            'group/accordion focus-visible:ring-deep/35 flex flex-1 items-start justify-between gap-4 py-5 text-left text-ink transition-colors outline-none hover:text-deep-90 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
            typography,
            className,
          )}
          {...props}
        >
          {children}
          {indicator === 'plus-minus' ? (
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-40 bg-white text-slate-80 [&>svg]:col-start-1 [&>svg]:row-start-1 [&>svg]:size-4">
              <PlusIcon
                className="transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=open]/accordion:opacity-0"
                aria-hidden
              />
              <MinusIcon
                className="opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=open]/accordion:opacity-100"
                aria-hidden
              />
            </span>
          ) : indicator === 'chevron' ? (
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-40 bg-white text-slate-80 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=open]/accordion:rotate-180 [&>svg]:size-4">
              <ChevronDownIcon aria-hidden />
            </span>
          ) : (
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-slate-40 text-deep-90 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=open]/accordion:rotate-45 [&>svg]:size-3.5">
              <PlusIcon className="transition-transform duration-300" aria-hidden />
            </span>
          )}
        </AccordionPrimitive.Trigger>
      </Heading>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-small"
      {...props}
    >
      <div className={cn('pt-0 pb-5 text-ui leading-[1.78] text-ink-80', className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
