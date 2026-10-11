import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { PayloadImageFill } from '@/components/ui/payload-image'
import { sitePath } from '@/i18n/config'
import type { DestinationCard } from '@/lib/data'
import { cn } from '@/lib/utils'

/**
 * Destination card — photo card with the caption laid over the bottom of the image.
 *
 * The whole card is one link: the anchor is stretched over the card with `absolute inset-0`
 * AND sits above the caption layer (`z-10`), so every click lands on it — the photo, the
 * caption, the empty space between them. Previously the caption layer was painted on top of
 * the anchor and swallowed those clicks, which is why the cards on the homepage did nothing
 * when tapped. The caption layer is marked `pointer-events-none` for the same reason.
 *
 * The caption is pushed to the bottom with `mt-auto` inside a flex column rather than
 * `h-full`, so it stays pinned to the bottom of `min-h-[30rem]` / `min-h-[39rem]`
 * regardless of how tall the card grows (or of the browser's percentage-height rules).
 */
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
        'group relative isolate flex flex-col overflow-hidden bg-ink',
        // Heights are the previous values ×1.5 (26rem → 39rem, 32rem → 48rem, 20rem → 30rem).
        size === 'large'
          ? 'min-h-[min(28rem,75svh)] sm:min-h-[min(39rem,80svh)] lg:min-h-[min(48rem,85svh)]'
          : 'min-h-[min(22rem,70svh)] sm:min-h-[min(30rem,75svh)]',
        className,
      )}
    >
      <Link
        href={href}
        aria-label={`Explore ${destination.name}`}
        className="absolute inset-0 z-10 focus-visible:outline-offset-[-5px]"
      />
      <PayloadImageFill
        media={destination.heroImage}
        size={size === 'large' ? 'hero' : 'tablet'}
        sizes={
          size === 'large'
            ? '(min-width: 1024px) 60vw, 92vw'
            : '(min-width: 1280px) 33vw, (min-width: 768px) 45vw, 92vw'
        }
        priority={priority}
        imageClassName="scale-100 transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
      />
      {/* Flat black wash over the whole photo, then the bottom-up gradient on top of it,
          so the caption text stays legible no matter how bright the image is. */}
      <div className="pointer-events-none absolute inset-0 bg-black/35" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
        aria-hidden="true"
      />

      <div className="pointer-events-none relative mt-auto flex w-full flex-col items-start p-4 text-left">
        <p className="text-[0.75rem] font-medium tracking-[0.16em] text-sage uppercase">
          {destination.country}
        </p>
        <h3
          className={cn(
            'destination-card-title mt-2 font-heading font-semibold break-words text-white',
            size === 'large' ? 'text-3xl md:text-4xl' : 'text-2xl',
          )}
        >
          {destination.name}
        </h3>
        {destination.tagline ? (
          <p
            className="destination-card-description mt-2 max-w-md card-description-copy leading-relaxed text-white/80"
          >
            {destination.tagline}
          </p>
        ) : null}

        <span className="mt-5 inline-flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-[0.16em] text-white/90 uppercase">
          Explore region
          <ArrowUpRight
            className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </article>
  )
}
