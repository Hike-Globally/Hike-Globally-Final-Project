'use client'

import { useMemo, useState } from 'react'
import { BedDouble, Mountain, Utensils, type LucideIcon } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { surface } from '@/components/ui/surface'
import { dictionary } from '@/i18n/dictionaries'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Trip } from '@/payload-types'

/** One entry in the CMS `itinerary` array — a single day of the trek. */
type ItineraryDay = NonNullable<Trip['itinerary']>[number]

/**
 * Splits plain textarea content into paragraphs. A blank line (two or more
 * line breaks, optionally with spaces) starts a new paragraph; single line
 * breaks are kept inside the paragraph.
 */
function splitParagraphs(text: string | null | undefined): string[] {
  if (!text) return []
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n\s*/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/* ----------------------------------------------------------------------------
   Day meta chip (accommodation / altitude / food)
   ---------------------------------------------------------------------------- */

function DayChip({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: LucideIcon
  label: string
  value: string
  tone?: 'default' | 'positive' | 'muted'
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 bg-mist px-4 py-3">
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center',
          tone === 'positive' ? 'bg-sage-90 text-white' : 'bg-white text-deep',
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-label tracking-[0.14em] text-slate-80 uppercase">{label}</p>
        <p
          className={cn(
            'truncate font-heading text-ui font-semibold',
            tone === 'muted' ? 'text-ink-60' : 'text-ink',
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
   "Expand all" switch
   ---------------------------------------------------------------------------- */

/**
 * On/off switch that sits beside the itinerary heading.
 *
 * It is a real `role="switch"` rather than a styled checkbox, so Space/Enter and assistive
 * tech both read it as on/off; the state always mirrors the accordion, which means closing
 * every day by hand folds the switch back to off with no extra bookkeeping.
 */
function ExpandAllSwitch({
  checked,
  onCheckedChange,
  className,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'group focus-visible:ring-ring/50 inline-flex shrink-0 cursor-pointer items-center gap-3 focus-visible:ring-[3px] focus-visible:outline-none',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex h-6 w-11 shrink-0 items-center border p-0.5 transition-colors duration-300 ease-brand motion-reduce:transition-none',
          checked ? 'border-deep bg-deep' : 'border-slate-40 bg-mist',
        )}
      >
        <span
          className={cn(
            'block size-4 transition-transform duration-300 ease-brand motion-reduce:transition-none',
            checked ? 'translate-x-[1.375rem] bg-white' : 'translate-x-0 bg-slate',
          )}
        />
      </span>
      <span
        className={cn(
          'font-heading text-small font-semibold tracking-[0.06em] transition-colors duration-300 ease-brand',
          checked ? 'text-deep' : 'text-ink-60',
          'group-hover:text-deep',
        )}
      >
        {dictionary.trip.expandAll}
      </span>
    </button>
  )
}

/* ----------------------------------------------------------------------------
   Section
   ---------------------------------------------------------------------------- */

/**
 * Detailed itinerary — one card per day, each headed by its CMS day number ("Day 1", "Day 2"…).
 *
 * The first day starts open so the top of the itinerary reads as a real entry rather than a
 * stack of closed headings; every other day starts collapsed.
 *
 * The heading row carries an "Expand all" switch: off shows just the open first day, on opens
 * every day at once. Days stay individually collapsible in between, because the switch is wired
 * to the accordion's own state rather than replacing it.
 */
export function ItinerarySection({ days }: { days: ItineraryDay[] }) {
  const dict = dictionary

  /**
   * Accordion values are derived from the day entries (falling back to the index for drafts
   * that have no row id yet) so both the accordion and the switch address days the same way.
   */
  const dayValues = useMemo(() => days.map((day, index) => `day-${day.id ?? index}`), [days])

  /** Day 1 is open on first paint; the remaining days stay collapsed until opened. */
  const [openDays, setOpenDays] = useState<string[]>(() => dayValues.slice(0, 1))
  const allExpanded = dayValues.length > 0 && dayValues.every((value) => openDays.includes(value))

  return (
    <section id="itinerary" className="scroll-mt-24 py-16 md:py-24">
      <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-4">
        <h2 className="heading-lg">{dict.trip.itinerary}</h2>
        <ExpandAllSwitch
          className="ml-auto"
          checked={allExpanded}
          onCheckedChange={(checked) => setOpenDays(checked ? dayValues : [])}
        />
      </div>

      <Accordion
        type="multiple"
        value={openDays}
        onValueChange={setOpenDays}
        className="w-full min-w-0 space-y-4"
      >
        {days.map((day, index) => {
          const dayNumber = day.day ?? index + 1
          const food = day.food === 'included' || day.food === 'not-included' ? day.food : null

          return (
            <AccordionItem
              key={day.id ?? index}
              value={`day-${day.id ?? index}`}
              className="w-full min-w-0 border-b-0"
            >
              <div
                className={cn(
                  surface,
                  'w-full min-w-0 overflow-hidden px-4 sm:px-6 md:px-8 [&_[data-slot=accordion-trigger]]:motion-reduce:transition-none [&_[data-slot=accordion-trigger]_span]:motion-reduce:transition-none [&_[data-slot=accordion-content]]:motion-reduce:animate-none',
                )}
              >
                <AccordionTrigger className="min-w-0 items-center gap-4 py-6 hover:no-underline md:py-7">
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
                    {/* Day number from the CMS — the label the itinerary was missing. */}
                    <span className="inline-flex shrink-0 items-center border border-sage-40 bg-sage-20 px-2.5 py-1 font-heading text-label font-semibold tracking-[0.14em] whitespace-nowrap text-sage-80 uppercase">
                      {dict.trip.day} {dayNumber}
                    </span>
                    <span className="min-w-0 break-words text-left font-heading text-subhead font-semibold text-ink">
                      {day.title}
                    </span>
                  </span>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="w-full min-w-0 space-y-4">
                    {splitParagraphs(day.description).map((paragraph, pIndex) => (
                      <p
                        key={pIndex}
                        className="w-full break-words whitespace-pre-line text-lead leading-relaxed text-ink-70"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {day.accommodation || typeof day.altitude === 'number' || food ? (
                    <div className="mt-6 grid gap-3 border-t border-slate-20 pt-6 sm:grid-cols-2 2xl:grid-cols-3">
                      {day.accommodation ? (
                        <DayChip
                          icon={BedDouble}
                          label={dict.trip.accommodation}
                          value={day.accommodation}
                        />
                      ) : null}
                      {typeof day.altitude === 'number' ? (
                        <DayChip
                          icon={Mountain}
                          label={dict.trip.altitude}
                          value={`${formatNumber(day.altitude)} m`}
                        />
                      ) : null}
                      {food ? (
                        <DayChip
                          icon={Utensils}
                          label={dict.trip.food}
                          value={
                            food === 'included' ? dict.trip.foodIncluded : dict.trip.foodNotIncluded
                          }
                          tone={food === 'included' ? 'positive' : 'muted'}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </AccordionContent>
              </div>
            </AccordionItem>
          )
        })}
      </Accordion>
    </section>
  )
}
