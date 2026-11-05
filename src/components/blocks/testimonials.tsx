import { Quote, Star } from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from '@/components/sections/section-heading'
import { sitePath } from '@/i18n/config'
import type { TestimonialsBlock } from '@/payload-types'
import { cn } from '@/lib/utils'

export function Testimonials({ block }: { block: TestimonialsBlock }) {
  const items = block.items ?? []
  if (items.length === 0) return null

  const dark = block.variant === 'dark'

  return (
    <section className={cn('py-16 md:py-24', dark ? 'bg-ink text-mist' : 'bg-mist text-ink')}>
      <div className="container-content">
        <SectionHeading
          title={block.heading}
          description={block.subheading}
          variant={dark ? 'light' : 'dark'}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
          {items.map((item, index) => {
            const rating = Number(item.rating ?? 5)
            const tripSlug =
              item.trip && typeof item.trip !== 'number' && 'slug' in item.trip
                ? item.trip.slug
                : null

            return (
              <Reveal key={item.id ?? index} delay={index * 80}>
                <figure
                  className={cn(
                    'flex h-full flex-col border p-7',
                    dark ? 'border-white/10 bg-ink-80' : 'border-slate-20 bg-white',
                  )}
                >
                  <Quote
                    className={cn('size-7', dark ? 'text-sage-light' : 'text-sage')}
                    aria-hidden
                  />

                  <div className="mt-5 flex gap-0.5" aria-label={`${rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star
                        key={star}
                        className={cn(
                          'size-4',
                          star < rating
                            ? dark
                              ? 'fill-sage-light text-sage-light'
                              : 'fill-sage text-sage'
                            : dark
                              ? 'text-mist/30'
                              : 'text-slate-20',
                        )}
                        aria-hidden
                      />
                    ))}
                  </div>

                  <blockquote
                    className={cn(
                      'mt-5 flex-1 text-lead leading-relaxed',
                      dark ? 'text-mist' : 'text-ink-80',
                    )}
                  >
                    {item.quote}
                  </blockquote>

                  <figcaption className="mt-7 flex items-center gap-3">
                    {item.avatar && typeof item.avatar !== 'number' ? (
                      <PayloadImage
                        media={item.avatar}
                        sizes="44px"
                        className="size-11 shrink-0 rounded-full"
                      />
                    ) : (
                      <span
                        className={cn(
                          'grid size-11 shrink-0 place-items-center rounded-full font-heading text-small font-semibold',
                          dark ? 'bg-ink-70 text-mist' : 'bg-mist text-ink',
                        )}
                        aria-hidden
                      >
                        {item.name.slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <p className="text-ui font-medium">{item.name}</p>
                      {item.role ? (
                        <p className={cn('text-small', dark ? 'text-mist/80' : 'text-slate-80')}>
                          {item.role}
                        </p>
                      ) : null}
                    </div>
                  </figcaption>

                  {tripSlug ? (
                    <a
                      href={sitePath(`/trips/${tripSlug}`)}
                      className={cn(
                        'mt-5 inline-flex text-small underline underline-offset-4',
                        dark ? 'text-sage-light hover:text-white' : 'text-deep hover:text-deep-80',
                      )}
                    >
                      {item.trip && typeof item.trip !== 'number' && 'title' in item.trip
                        ? item.trip.title
                        : tripSlug}
                    </a>
                  ) : null}
                </figure>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
