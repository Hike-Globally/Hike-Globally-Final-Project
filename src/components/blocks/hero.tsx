import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PayloadImageFill } from '@/components/ui/payload-image'
import type { HeroBlock } from '@/payload-types'
import { resolveLink } from '@/lib/links'
import { cn } from '@/lib/utils'

import { HomepageHeroBackground } from './hero-background'

const heights: Record<string, string> = {
  full: 'min-h-[100svh]',
  tall: 'min-h-[88svh]',
  compact: 'min-h-[62svh]',
}

const overlays: Record<string, string> = {
  strong: 'bg-ink/68',
  medium: 'bg-ink/45',
  none: 'bg-transparent',
}

export function Hero({
  block,
  homepage = false,
  opening = false,
}: {
  block: HeroBlock
  homepage?: boolean
  /**
   * This hero is the page's first block, so it *is* the hero region: the global
   * header stays pinned over it. The homepage's hero is covered by
   * `HeroScrollCover`'s own marker instead (see header-frame.tsx).
   */
  opening?: boolean
}) {
  const primary = resolveLink(block.primaryLink)
  const secondary = resolveLink(block.secondaryLink)
  const hasImage = homepage || Boolean(block.backgroundImage)
  const height = homepage
    ? 'h-full min-h-[100svh]'
    : (heights[block.height ?? 'tall'] ?? heights.tall!)
  const overlay = overlays[block.overlay ?? 'medium'] ?? overlays.medium!

  return (
    <section
      data-header-hero={opening ? 'true' : undefined}
      className={cn(
        'relative isolate flex items-end overflow-hidden',
        height,
        hasImage ? 'bg-ink text-mist' : 'bg-mist text-ink',
      )}
    >
      {homepage ? (
        <HomepageHeroBackground />
      ) : block.backgroundImage ? (
        <>
          <PayloadImageFill
            media={block.backgroundImage}
            size="hero"
            sizes="100vw"
            priority
            className="-z-10"
            imageClassName="object-cover"
          />
          <div className={cn('absolute inset-0 -z-10', overlay)} />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
        </>
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10%] -z-10 size-[35rem] rounded-full bg-sage-20 blur-3xl"
        />
      )}

      <div
        className={cn(
          'container-content',
          homepage ? 'pt-24 pb-12 md:pt-28 md:pb-16' : 'py-24 md:py-28',
        )}
      >
        <div className="max-w-3xl">
          {block.eyebrow ? (
            <p className={cn('eyebrow mb-5', hasImage ? 'text-sage' : 'text-slate')}>
              {block.eyebrow}
            </p>
          ) : null}

          <h1 className={cn('heading-display', hasImage ? 'text-white' : 'text-ink')}>
            {block.heading}
          </h1>

          {block.subheading ? (
            <p className={cn('lead mt-6 max-w-2xl', hasImage ? 'text-mist/85' : 'text-ink-60')}>
              {block.subheading}
            </p>
          ) : null}

          {primary || secondary ? (
            <div className="mt-10 flex flex-wrap items-center gap-3">
              {primary ? (
                <Button asChild size="lg" variant={hasImage ? 'sage' : 'default'}>
                  <Link href={primary.href}>{primary.label}</Link>
                </Button>
              ) : null}
              {secondary ? (
                <Button asChild size="lg" variant={hasImage ? 'outline-light' : 'outline'}>
                  <Link href={secondary.href}>{secondary.label}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
