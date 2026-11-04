import { ArrowUpRight, Check, Compass } from 'lucide-react'

import type { Trip } from '@/payload-types'

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
      <div className="relative isolate overflow-hidden rounded-2xl bg-ink text-mist shadow-[0_24px_64px_-32px_rgba(4,21,31,0.55)] ring-1 ring-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sage/80 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 -z-10 size-96 rounded-full bg-sage/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -bottom-16 -z-10 text-sage/[0.04]"
        >
          <Compass className="size-72" strokeWidth={0.6} />
        </div>

        <div className="relative p-6 sm:p-9 lg:p-10">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="mb-3 font-heading text-[0.6875rem] font-semibold tracking-[0.22em] text-sage uppercase">
                Your trek, at a glance
              </p>
              <h2
                id="key-takeaways-heading"
                className="font-heading text-3xl leading-tight font-semibold tracking-tight text-white sm:text-4xl"
              >
                Key Takeaways<span className="text-sage">.</span>
              </h2>
            </div>
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-full border border-sage/25 bg-sage/10 text-sage sm:size-13"
            >
              <ArrowUpRight className="size-5" strokeWidth={1.5} />
            </span>
          </div>

          <div aria-hidden className="my-7 h-px bg-white/15 sm:my-8" />

          <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {points.map((point, index) => (
              <li key={point.id ?? index} className="flex min-w-0 items-start gap-3.5">
                <span
                  aria-hidden
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-sage/30 bg-sage/10 text-sage"
                >
                  <Check className="size-3.5" strokeWidth={2} />
                </span>
                <p className="min-w-0 text-[0.9375rem] leading-relaxed break-words whitespace-pre-line text-mist/90 sm:text-base">
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
