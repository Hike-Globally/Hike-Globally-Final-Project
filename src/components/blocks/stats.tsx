import { Reveal } from '@/components/motion/reveal'
import type { StatsBlock } from '@/payload-types'
import { cn } from '@/lib/utils'

export function Stats({ block }: { block: StatsBlock }) {
  const items = block.items ?? []
  if (items.length === 0) return null

  const dark = block.variant === 'dark'

  return (
    <section className={cn('py-14 md:py-16', dark ? 'bg-ink text-mist' : 'bg-sage-20 text-ink')}>
      <div className="container-content">
        {block.heading ? (
          <p className={cn('eyebrow mb-8 text-center', dark ? 'text-sage' : 'text-deep')}>
            {block.heading}
          </p>
        ) : null}

        <dl
          className={cn(
            'grid gap-8 text-center sm:grid-cols-2',
            items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
          )}
        >
          {items.map((item, index) => (
            <Reveal key={item.id ?? index} delay={index * 70}>
              <div>
                <dd
                  className={cn(
                    'font-heading text-4xl font-semibold tracking-tight md:text-5xl 3xl:text-6xl',
                    dark ? 'text-sage' : 'text-deep',
                  )}
                >
                  {item.value}
                </dd>
                <dt className="mt-2 text-[0.9375rem] font-medium">{item.label}</dt>
                {item.description ? (
                  <p className={cn('mt-1 description-copy', dark ? 'text-mist/60' : 'text-ink-60')}>
                    {item.description}
                  </p>
                ) : null}
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}
