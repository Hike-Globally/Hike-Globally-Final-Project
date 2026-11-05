import Link from 'next/link'

import Image from 'next/image'
import { sitePath } from '@/i18n/config'
import { cn } from '@/lib/utils'

/** Shared project logo and wordmark, used across the site. */
export function Logo({
  name = 'Hike Globally',
  tagline,
  className,
  variant = 'dark',
}: {
  name?: string
  tagline?: string | null
  className?: string
  variant?: 'dark' | 'light'
}) {
  return (
    <Link
      href={sitePath('/')}
      className={cn('group inline-flex max-w-full min-w-0 items-center gap-3', className)}
      aria-label={name}
    >
      <Image
        src="/images/logo.svg"
        alt=""
        width={1297}
        height={1212}
        // The mark is an SVG, which Next's image optimizer refuses to serve unless
        // `dangerouslyAllowSVG` is on — serve it straight from `public/` instead.
        unoptimized
        // The mark ships as brand ink; `brightness-0 invert` flattens it to
        // paper white where it sits on navy.
        className={cn(
          'h-10 w-auto shrink-0 object-contain',
          variant === 'light' && 'brightness-0 invert',
        )}
        priority
      />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            'font-heading text-subhead font-semibold tracking-[-0.01em]',
            variant === 'dark' ? 'text-ink' : 'text-white',
          )}
        >
          {name}
        </span>
        {tagline ? (
          <span
            className={cn(
              'mt-1 text-label tracking-[0.14em] uppercase',
              variant === 'dark' ? 'text-slate-80' : 'text-mist',
            )}
          >
            {tagline}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
