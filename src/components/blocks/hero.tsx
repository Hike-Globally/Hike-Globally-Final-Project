import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PayloadImageFill } from '@/components/ui/payload-image'
import type { HeroBlock } from '@/payload-types'
import { resolveLink } from '@/lib/links'
import { splitInlineEmphasis } from '@/lib/inline-emphasis'
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
  const eyebrow = block.eyebrow?.trim()
  const showEyebrow = Boolean(eyebrow && (!homepage || eyebrow.toLowerCase() !== 'home'))

  /* The heading is a plain-text field, but an editor may wrap part of it in
     `<i>…</i>` to have it set in the accent face — on the homepage that is the
     90px Instrument Serif italic line under the 120px first line. Anything
     else in the string stays literal text (see lib/inline-emphasis.ts). */
  const headingSegments = splitInlineEmphasis(block.heading)

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
          homepage
            ? 'pt-24 pb-20 md:pt-28 md:pb-20 [@media(max-height:500px)]:py-8'
            : 'py-20 sm:py-24 md:py-28 [@media(max-height:500px)]:py-12',
        )}
      >
        {/* The homepage hero's copy column spans the full content width: its
            headline is set at 120px (90px on the italic second line), and the
            768px measure every other hero uses would wrap "Walk Where The"
            mid-phrase. Individual elements below cap their own width. */}
        <div className={cn('min-w-0', homepage ? 'max-w-none' : 'max-w-3xl 3xl:max-w-4xl')}>
          {showEyebrow ? (
            <p className={cn('eyebrow mb-5', hasImage ? 'text-sage' : 'text-slate')}>{eyebrow}</p>
          ) : null}

          <h1
            className={cn(
              'heading-display',
              homepage ? 'home-hero-title' : '',
              hasImage ? 'text-white' : 'text-ink',
            )}
          >
            {headingSegments.length
              ? headingSegments.map((segment, index) =>
                  segment.emphasized ? <i key={index}>{segment.text}</i> : segment.text,
                )
              : block.heading}
          </h1>

          {block.subheading ? (
            <p
              className={cn(
                'lead mt-6',
                homepage ? 'home-hero-lead' : '',
                /* 36rem keeps the standfirst on the same ~576px measure it had
                   when the column itself was 768px wide and this was `w-3/4`. */
                homepage ? 'max-w-[36rem]' : 'max-w-2xl',
                hasImage ? 'text-mist/85' : 'text-ink-60',
              )}
            >
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
