'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { PlusIcon } from 'lucide-react'

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
      className={cn('border-b border-black/8 last:border-b-0', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-lg py-5 text-left font-heading text-base font-semibold text-ink transition-all outline-none hover:text-deep focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 md:text-lg',
          className,
        )}
        {...props}
      >
        {children}
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-ink/10 text-deep transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [&>svg]:size-3.5 [[data-state=open]>span>&]:rotate-45">
          <PlusIcon className="transition-transform duration-300" />
        </span>
      </AccordionPrimitive.Trigger>
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
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn('pt-0 pb-5 text-[0.9375rem] leading-[1.75] text-ink-60', className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
