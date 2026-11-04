import { ArrowUpRight, Check, Compass } from 'lucide-react'

import type { Trip } from '@/payload-types'

import './key-takeaways.css'

/** Shared by the public page and draft preview; uses the original CMS row order. */
export function KeyTakeawaysSection({ items }: { items: Trip['keyTakeaways'] }) {
  const points = items?.filter(({ text }) => text?.trim())
  if (!points?.length) return null

  return (
    <section
      id="key-takeaways"
      aria-labelledby="key-takeaways-heading"
      className="scroll-mt-24 pt-12 md:pt-16"
    >
      {/* Tinted glass box: translucent amber wash + 2px sage border. The animated
          border beam and breathing glow live in key-takeaways.css. */}
      <div className="key-takeaways-box relative isolate overflow-hidden border-2 border-sage/35 bg-gradient-to-br from-sage-20/70 via-white/45 to-sage-20/35 backdrop-blur-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 -z-10 size-96 rounded-full bg-sage/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -bottom-16 -z-10 text-sage/10"
        >
          <Compass className="size-72" strokeWidth={0.6} />
        </div>

        <div className="relative p-6 sm:p-9 lg:p-10">
          <div className="flex items-center justify-between gap-5">
            <h2
              id="key-takeaways-heading"
              className="font-heading text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl"
            >
              Key Takeaways<span className="text-sage">.</span>
            </h2>
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-full bg-sage text-ink sm:size-13"
            >
              <ArrowUpRight className="size-5" strokeWidth={1.5} />
            </span>
          </div>

          <div aria-hidden className="my-7 h-px bg-sage/30 sm:my-8" />

          {/* Always one single vertical column — every point stacks
              vertically at every screen size, icon above the copy. */}
          <ul className="flex flex-col items-start gap-3 sm:gap-6 md:gap-7">
            {points.map((point, index) => (
              <li
                key={point.id ?? index}
                className="flex min-w-0 flex-1 flex-col items-start gap-3 sm:gap-4"
              >
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-sage text-ink"
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <p className="min-w-0 text-[0.8125rem] leading-relaxed break-words whitespace-pre-line text-ink-80 sm:text-[0.9375rem] md:text-base">
                  {point.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
