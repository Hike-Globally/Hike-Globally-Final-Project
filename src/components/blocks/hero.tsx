import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PayloadImageFill } from '@/components/ui/payload-image'
import type { HeroBlock } from '@/payload-types'
import { resolveLink } from '@/lib/links'
import { splitInlineEmphasis } from '@/lib/inline-emphasis'
import { cn } from '@/lib/utils'

import { HomepageHeroBackground } from './hero-background'

const overlays: Record<string, string> = {
  strong: 'bg-ink/70',
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
  const overlay = overlays[block.overlay ?? 'medium'] ?? overlays.medium!
  const eyebrow = block.eyebrow?.trim()
  const showEyebrow = Boolean(eyebrow && (!homepage || eyebrow.toLowerCase() !== 'home'))

  /* The heading is a plain-text field, but an editor may wrap part of it in
     `<i>…</i>` to have it set in the accent face — on every hero that is the
     Instrument Serif italic line under the headline (see
     lib/inline-emphasis.ts). Anything else in the string stays literal text. */
  const headingSegments = splitInlineEmphasis(block.heading)

  /* One hero, everywhere: every hero block is a full-screen band and carries
     the homepage hero's type (`.hero-region`, `.hero-title`,
     `.hero-description` — see `globals.css`). An editor cannot shorten it, so
     the page rhythm is identical wherever a hero is placed.

     `h-full` is only meaningful on the homepage, where `HeroScrollCover` pins
     the band inside a `100svh` sticky stage. */
  return (
    <section
      data-header-hero={opening ? 'true' : undefined}
      className={cn(
        'hero-region relative isolate flex items-end overflow-hidden',
        homepage && 'h-full',
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
          <div className="photo-scrim absolute inset-x-0 bottom-0 -z-10 h-2/3" />
        </>
      ) : null}

      <div className="container-content pt-24 pb-20 md:pt-28 md:pb-20 [@media(max-height:500px)]:py-8">
        {/* The copy column spans the full content width — the headline is set
            at hero size (up to 72px) and every hero's copy is bottom-aligned,
            so the band reads the same whether one line or three fit. Elements
            below cap their own measure. */}
        <div className="min-w-0 max-w-none">
          {showEyebrow ? (
            <p className={cn('eyebrow mb-5', hasImage ? 'text-mist/85' : 'text-slate-80')}>
              {eyebrow}
            </p>
          ) : null}

          <h1
            className={cn(
              'heading-display hero-title max-w-4xl 3xl:max-w-5xl',
              // The homepage hero's first line is Cal Sans; its `<i>` accent line
              // stays Instrument Serif (see `.hero-title--cal` in globals.css).
              homepage && 'hero-title--cal',
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
                'lead hero-description mt-6 max-w-[36rem]',
                hasImage ? 'text-mist/90' : 'text-ink-60',
              )}
            >
              {block.subheading}
            </p>
          ) : null}

          {primary || secondary ? (
            <div className="mt-10 flex flex-wrap items-center gap-3">
              {primary ? (
                <Button asChild size="lg" variant={hasImage ? 'paper' : 'default'}>
                  <Link href={primary.href}>{primary.label}</Link>
                </Button>
              ) : null}
              {secondary ? (
                <Button
                  asChild
                  size="lg"
                  variant={homepage ? 'haze' : hasImage ? 'outline-light' : 'outline'}
                >
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
