import type { ReactNode } from 'react'

import type { Page } from '@/payload-types'
import type { InternalLinker } from '@/lib/internal-links'
import { HeroScrollCover } from '@/components/motion/hero-scroll-cover'
import { AboutHikeGlobally } from '@/components/sections/about-hike-globally'
import { DifficultyLevels } from '@/components/sections/difficulty-levels'
import { BrowsePlaces } from '@/components/sections/browse-places'
import { LatestBlogsSection } from '@/components/sections/latest-blogs-section'
import { LatestNewsSection } from '@/components/sections/latest-news-section'

import { Cta } from './cta'
import { Faq } from './faq'
import { FeaturedDestinations } from './featured-destinations'
import { HomepageDestinations } from './homepage-destinations'
import { FeaturedTrips } from './featured-trips'
import { Gallery } from './gallery'
import { Hero } from './hero'
import { InquirySection } from './inquiry-block'
import { LatestPosts } from './latest-posts'
import { RichTextSection } from './rich-text-block'
import { Stats } from './stats'

type Block = NonNullable<Page['blocks']>[number]

/**
 * Homepage section policy:
 *  - the homepage ends at the inquiry ("Plan your trip") section — anything placed after it in
 *    the CMS is not rendered here;
 *  - an editor's `latestPosts` block never renders as itself on the homepage. The journal
 *    section there is the bespoke board (`LatestBlogsSection`), which is injected immediately
 *    *before* the inquiry block — or last, on a page with no inquiry block at all — so the
 *    section can be neither duplicated nor dropped by a drag in the admin. The board is fixed
 *    at one lead plate plus three index rows (see `latest-blogs-limits.ts`), so the block's
 *    `limit` does not size it; that field still drives the tile grid on other pages.
 *  - the news index (`LatestNewsSection`) is likewise not a CMS block: it follows the journal
 *    board in the fixed editorial sequence, so the homepage always closes with wire copy
 *    before "Plan your trip".
 *
 * Enforced at render time so the rules hold regardless of what the CMS page contains.
 */
function homepageBlocks(blocks: Block[]): Block[] {
  const withoutBlog = blocks.filter((block) => block.blockType !== 'latestPosts')
  const inquiryIndex = withoutBlog.findIndex((block) => block.blockType === 'inquiry')
  return inquiryIndex === -1 ? withoutBlog : withoutBlog.slice(0, inquiryIndex + 1)
}

function renderBlock(
  block: Block,
  index: number,
  homepage: boolean,
  singlePage = false,
  opening = false,
  linker?: InternalLinker | null,
) {
  const key = `${block.blockType}-${index}`

  switch (block.blockType) {
    case 'hero':
      return <Hero key={key} block={block} homepage={homepage} opening={opening} />
    case 'richText':
      return <RichTextSection key={key} block={block} singlePage={singlePage} linker={linker} />
    case 'featuredTrips':
      return <FeaturedTrips key={key} block={block} opening={opening} />
    case 'featuredDestinations':
      return <FeaturedDestinations key={key} block={block} opening={opening} />
    case 'latestPosts':
      return <LatestPosts key={key} block={block} opening={opening} />
    case 'stats':
      return <Stats key={key} block={block} />
    case 'gallery':
      return <Gallery key={key} block={block} />
    case 'faq':
      return <Faq key={key} block={block} />
    case 'inquiry':
      return <InquirySection key={key} block={block} />
    case 'cta':
      return <Cta key={key} block={block} />
    default:
      return null
  }
}

/**
 * Maps a Payload block to its React component.
 *
 * The `blockType` discriminant comes straight from the generated Payload types, so adding a new
 * block to the CMS produces a TypeScript error here until it has a component — new blocks can
 * never silently render as nothing.
 */
export async function BlockRenderer({
  blocks,
  homepage = false,
  singlePage = false,
  linker,
}: {
  blocks: Block[] | null | undefined
  homepage?: boolean
  /** `/slug` pages pass `true` so their body copy uses the single-page type style. */
  singlePage?: boolean
  /**
   * The page's automated internal linking, created by the route and passed to every `richText`
   * block so they share one budget (see `src/lib/internal-links.ts`).
   */
  linker?: InternalLinker | null
}) {
  if (!blocks?.length) return null

  if (homepage) {
    blocks = homepageBlocks(blocks)
    if (!blocks.length) return null

    const heroIndex = blocks.findIndex((b) => b.blockType === 'hero')
    if (heroIndex !== -1) {
      const heroBlock = blocks[heroIndex]!
      const otherBlocks = blocks.filter((_, i) => i !== heroIndex)

      if (heroBlock.blockType === 'hero') {
        const heroElement = <Hero block={heroBlock} homepage={true} />

        // Homepage sections follow an intentional editorial sequence, regardless of
        // the order in which their CMS blocks happen to be arranged.
        const tripsBlock = otherBlocks.find((block) => block.blockType === 'featuredTrips')
        const inquiryBlock = otherBlocks.find((block) => block.blockType === 'inquiry')
        const firstSectionElement = (
          <>
            <DifficultyLevels />
            <BrowsePlaces />
            {tripsBlock ? renderBlock(tripsBlock, 0, false, false, false, linker) : null}
          </>
        )
        const subsequentElements = (
          <>
            <AboutHikeGlobally />
            <HomepageDestinations />
            <LatestBlogsSection />
            <LatestNewsSection />
            {inquiryBlock ? renderBlock(inquiryBlock, 0, false, false, false, linker) : null}
          </>
        )

        return (
          <HeroScrollCover
            hero={heroElement}
            firstSection={firstSectionElement}
            subsequentSections={subsequentElements}
          />
        )
      }
    }
  }

  // Only ever a page's *first* block: a hero further down the page must not re-pin the
  // header while the visitor scrolls through it (see header-frame.tsx).
  return (
    <>
      {blocks.map((block, index) =>
        renderBlock(block, index, homepage, singlePage, !homepage && index === 0, linker),
      )}
    </>
  )
}
