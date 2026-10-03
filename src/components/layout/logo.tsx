import Link from 'next/link'

import { PayloadImage } from '@/components/ui/payload-image'
import type { Locale } from '@/i18n/config'
import { localizedPath } from '@/i18n/config'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'

/** Wordmark + peak glyph. Falls back to typography when no logo has been uploaded. */
export function Logo({
  locale,
  name = 'Hike Globally',
  logo,
  tagline,
  className,
  variant = 'dark',
}: {
  locale: Locale
  name?: string
  logo?: number | Media | null
  tagline?: string | null
  className?: string
  variant?: 'dark' | 'light'
}) {
  return (
    <Link
      href={localizedPath(locale, '/')}
      className={cn('group inline-flex items-center gap-3', className)}
      aria-label={name}
    >
      {logo ? (
        <PayloadImage
          media={logo}
          size="thumbnail"
          sizes="140px"
          alt={name}
          className="h-9 w-auto"
          imageClassName="h-9 w-auto object-contain"
        />
      ) : (
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-xl transition-colors',
            variant === 'dark' ? 'bg-deep text-mist' : 'bg-sage text-ink',
          )}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M2 19h20L14 6l-3.2 5.6L9 9.5 2 19Z" strokeLinejoin="round" />
            <path d="M14 6l1.6 2.8" strokeLinecap="round" />
          </svg>
        </span>
      )}
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-heading text-[1.0625rem] font-semibold tracking-tight',
            variant === 'dark' ? 'text-ink' : 'text-white',
          )}
        >
          {name}
        </span>
        {tagline ? (
          <span
            className={cn(
              'mt-1 text-[0.6875rem] tracking-[0.14em] uppercase',
              variant === 'dark' ? 'text-slate' : 'text-white/60',
            )}
          >
            {tagline}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
