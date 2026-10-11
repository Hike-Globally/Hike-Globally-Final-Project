import { Fragment } from 'react'

import type { Page } from '@/payload-types'
import { HeroScrollCover } from '@/components/motion/hero-scroll-cover'
import { AboutHikeGlobally } from '@/components/sections/about-hike-globally'
import { DifficultyLevels } from '@/components/sections/difficulty-levels'

import { Cta } from './cta'
import { Faq } from './faq'
import { FeaturedDestinations } from './featured-destinations'
import { FeaturedTrips } from './featured-trips'
import { Gallery } from './gallery'
import { Hero } from './hero'
import { InquirySection } from './inquiry-block'
import { LatestPosts } from './latest-posts'
import { RichTextSection } from './rich-text-block'
import { Stats } from './stats'
import { Testimonials } from './testimonials'

type Block = NonNullable<Page['blocks']>[number]

/**
 * Homepage section policy:
 *  - the blog/journal section (`latestPosts`) never renders on the homepage,
 *  - the "About Hike Globally" band always follows the curated travel packages section, and
 *  - the homepage ends at the inquiry ("Plan your trip") section — anything placed after it in
 *    the CMS is not rendered here.
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
) {
  const key = `${block.blockType}-${index}`

  switch (block.blockType) {
    case 'hero':
      return <Hero key={key} block={block} homepage={homepage} opening={opening} />
    case 'richText':
      return <RichTextSection key={key} block={block} singlePage={singlePage} />
    case 'featuredTrips':
      return <FeaturedTrips key={key} block={block} />
    case 'featuredDestinations':
      return <FeaturedDestinations key={key} block={block} />
    case 'latestPosts':
      return <LatestPosts key={key} block={block} />
    case 'stats':
      return <Stats key={key} block={block} />
    case 'gallery':
      return <Gallery key={key} block={block} />
    case 'testimonials':
      return <Testimonials key={key} block={block} />
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
 * Renders a homepage block together with the "About Hike Globally" band, which always follows
 * the curated travel packages section (see the homepage section policy above).
 */
function renderHomepageBlock(block: Block, index: number) {
  return (
    <Fragment key={`${block.blockType}-${index}`}>
      {renderBlock(block, index, false)}
      {block.blockType === 'featuredTrips' ? <AboutHikeGlobally /> : null}
    </Fragment>
  )
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
}: {
  blocks: Block[] | null | undefined
  homepage?: boolean
  /** `/slug` pages pass `true` so their body copy uses the single-page type style. */
  singlePage?: boolean
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
        const [firstOtherBlock, ...subsequentBlocks] = otherBlocks
        // On a homepage whose CMS page has no curated-trips block at all, the band keeps the top
        // slot instead of disappearing.
        const hasCuratedTrips = otherBlocks.some((block) => block.blockType === 'featuredTrips')

        const heroElement = <Hero block={heroBlock} homepage={true} />
        const firstSectionElement = (
          <>
            <DifficultyLevels />
            {firstOtherBlock ? renderHomepageBlock(firstOtherBlock, 0) : null}
            {hasCuratedTrips ? null : <AboutHikeGlobally />}
          </>
        )
        const subsequentElements = subsequentBlocks.map((block, index) =>
          renderHomepageBlock(block, index + 1),
        )

        return (
          <HeroScrollCover
            hero={heroElement}
            firstSection={firstSectionElement}
            subsequentSections={<>{subsequentElements}</>}
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
        renderBlock(block, index, homepage, singlePage, !homepage && index === 0),
      )}
    </>
  )
}
