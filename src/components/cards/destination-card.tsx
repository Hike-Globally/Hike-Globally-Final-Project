import Link from 'next/link'

import { PayloadImageFill } from '@/components/ui/payload-image'
import { sitePath } from '@/i18n/config'
import type { DestinationCard } from '@/lib/data'
import { cn } from '@/lib/utils'

export function DestinationCard({
  destination,
  size = 'default',
  priority = false,
  className,
}: {
  destination: DestinationCard
  size?: 'default' | 'large'
  priority?: boolean
  className?: string
}) {
  const href = sitePath(`/destinations/${destination.slug}`)

  return (
    <article
      className={cn(
        'group relative isolate overflow-hidden bg-ink',
        size === 'large' ? 'min-h-[26rem] lg:min-h-[32rem]' : 'min-h-[20rem]',
        className,
      )}
    >
      <Link href={href} className="absolute inset-0" aria-label={destination.name} />
      <PayloadImageFill
        media={destination.heroImage}
        size={size === 'large' ? 'tablet' : 'card'}
        sizes={
          size === 'large'
            ? '(min-width: 1024px) 60vw, 92vw'
            : '(min-width: 1280px) 33vw, (min-width: 768px) 45vw, 92vw'
        }
        priority={priority}
        imageClassName="scale-100 transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />

      <div className="relative flex h-full flex-col justify-end p-6">
        <p className="text-[0.75rem] font-medium tracking-[0.16em] text-sage uppercase">
          {destination.country}
        </p>
        <h3
          className={cn(
            'mt-2 font-heading font-semibold text-white',
            size === 'large' ? 'text-3xl md:text-4xl' : 'text-2xl',
          )}
        >
          {destination.name}
        </h3>
        {destination.tagline ? (
          <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-white/80">
            {destination.tagline}
          </p>
        ) : null}
      </div>
    </article>
  )
}
