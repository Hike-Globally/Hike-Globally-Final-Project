import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  controls,
  align = 'left',
  variant = 'dark',
  className,
}: {
  eyebrow?: string | null
  title: string
  description?: string | null
  action?: { href: string; label: string } | null
  /** Extra controls rendered next to the "view all" link — e.g. carousel arrows. */
  controls?: ReactNode
  align?: 'left' | 'center'
  variant?: 'dark' | 'light'
  className?: string
}) {
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
          <p className={cn('eyebrow mb-3', variant === 'light' ? 'text-sage' : 'text-slate')}>{eyebrow}</p>
        ) : null}
        <h2 className={cn('heading-lg', variant === 'light' ? 'text-white' : 'text-ink')}>{title}</h2>
        {description ? (
          <p className={cn('lead mt-4', variant === 'light' ? 'text-mist/75' : 'text-ink-60')}>
            {description}
          </p>
        ) : null}
      </div>

      {action || controls ? (
        <div className="flex shrink-0 items-center gap-5">
          {controls}
          {action ? (
            <Link
              href={action.href}
              className={cn(
                'group inline-flex shrink-0 items-center gap-2 text-[0.9375rem] font-medium transition-colors',
                variant === 'light' ? 'text-white hover:text-sage' : 'text-deep hover:text-ink',
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
