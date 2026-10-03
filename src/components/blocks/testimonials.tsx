import { Quote, Star } from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from '@/components/sections/section-heading'
import type { Locale } from '@/i18n/config'
import { localizedPath } from '@/i18n/config'
import type { TestimonialsBlock } from '@/payload-types'
import { cn } from '@/lib/utils'

export function Testimonials({ block, locale }: { block: TestimonialsBlock; locale: Locale }) {
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const rating = Number(item.rating ?? 5)
            const tripSlug =
              item.trip && typeof item.trip !== 'number' && 'slug' in item.trip ? item.trip.slug : null

            return (
              <Reveal key={item.id ?? index} delay={index * 80}>
                <figure
                  className={cn(
                    'flex h-full flex-col rounded-2xl border p-7',
                    dark ? 'border-white/10 bg-white/[0.04]' : 'border-black/[0.06] bg-card',
                  )}
                >
                  <Quote
                    className={cn('size-7', dark ? 'text-sage' : 'text-sage')}
                    aria-hidden
                  />

                  <div className="mt-5 flex gap-0.5" aria-label={`${rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star
                        key={star}
                        className={cn(
                          'size-4',
                          star < rating
                            ? 'fill-sage text-sage'
                            : dark
                              ? 'text-white/20'
                              : 'text-ink/15',
                        )}
                        aria-hidden
                      />
                    ))}
                  </div>

                  <blockquote
                    className={cn(
                      'mt-5 flex-1 text-[1.0625rem] leading-relaxed',
                      dark ? 'text-mist/90' : 'text-ink-80',
                    )}
                  >
                    {item.quote}
                  </blockquote>

                  <figcaption className="mt-7 flex items-center gap-3">
                    {item.avatar && typeof item.avatar !== 'number' ? (
                      <PayloadImage
                        media={item.avatar}
                        size="thumbnail"
                        sizes="44px"
                        className="size-11 shrink-0 rounded-full"
                      />
                    ) : (
                      <span
                        className={cn(
                          'grid size-11 shrink-0 place-items-center rounded-full font-heading text-sm font-semibold',
                          dark ? 'bg-sage/20 text-sage' : 'bg-sage-40 text-ink',
                        )}
                        aria-hidden
                      >
                        {item.name.slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <p className="text-[0.9375rem] font-medium">{item.name}</p>
                      {item.role ? (
                        <p className={cn('text-[0.8125rem]', dark ? 'text-mist/60' : 'text-slate')}>
                          {item.role}
                        </p>
                      ) : null}
                    </div>
                  </figcaption>

                  {tripSlug ? (
                    <a
                      href={localizedPath(locale, `/trips/${tripSlug}`)}
                      className={cn(
                        'mt-5 inline-flex text-[0.8125rem] underline underline-offset-4',
                        dark ? 'text-sage hover:text-white' : 'text-deep hover:text-ink',
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
