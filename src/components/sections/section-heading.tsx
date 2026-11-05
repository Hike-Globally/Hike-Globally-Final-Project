import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  titleId,
  description,
  action,
  controls,
  align = 'left',
  variant = 'dark',
  className,
  titleClassName,
  titleLevel = 'h2',
  descriptionClassName,
}: {
  eyebrow?: string | null
  title: string
  /** `id` for the heading — lets a section wire itself up with `aria-labelledby`. */
  titleId?: string
  description?: string | null
  action?: { href: string; label: string } | null
  /** Extra controls rendered next to the "view all" link — e.g. carousel arrows. */
  controls?: ReactNode
  align?: 'left' | 'center'
  variant?: 'dark' | 'light'
  className?: string
  /** Extra classes for the heading — lets a section retune the title without forking it. */
  titleClassName?: string
  /** Semantic heading level. Defaults to h2; FAQ sections use h3. */
  titleLevel?: 'h2' | 'h3'
  /** Extra classes for the description paragraph. */
  descriptionClassName?: string
}) {
  const Title = titleLevel

  return (
    <div
      className={cn(
        'mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        align === 'center' ? 'items-center text-center md:flex-col md:items-center' : '',
        className,
      )}
    >
      <div className={align === 'center' ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow ? (
          <p className={cn('eyebrow mb-3', variant === 'light' ? 'text-mist' : 'text-slate-80')}>
            {eyebrow}
          </p>
        ) : null}
        <Title
          id={titleId}
          className={cn(
            'heading-lg',
            variant === 'light' ? 'text-white' : 'text-ink',
            titleClassName,
          )}
        >
          {title}
        </Title>
        {description ? (
          <p
            className={cn(
              'lead mt-4',
              variant === 'light' ? 'text-mist' : 'text-ink-60',
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action || controls ? (
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-4 sm:gap-5">
          {controls}
          {action ? (
            <Link
              href={action.href}
              className={cn(
                'group inline-flex shrink-0 items-center gap-2 text-[0.9375rem] font-medium transition-colors',
                variant === 'light'
                  ? 'text-white hover:text-sage-light'
                  : 'text-deep hover:text-deep-80',
              )}
            >
              {action.label}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
