import type { ReactNode } from 'react'

import type { LatestPostsBlock, Page } from '@/payload-types'
import { HeroScrollCover } from '@/components/motion/hero-scroll-cover'
import { AboutHikeGlobally } from '@/components/sections/about-hike-globally'
import { DifficultyLevels } from '@/components/sections/difficulty-levels'
import { LatestBlogsSection } from '@/components/sections/latest-blogs-section'

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
 *  - the homepage ends at the inquiry ("Plan your trip") section — anything placed after it in
 *    the CMS is not rendered here;
 *  - an editor's `latestPosts` block never renders as itself on the homepage. The journal
 *    section there is the bespoke board (`LatestBlogsSection`), which is injected immediately
 *    *before* the inquiry block — or last, on a page with no inquiry block at all — so the
 *    section can be neither duplicated nor dropped by a drag in the admin. The block's `limit`
 *    is still read and honoured by the board.
 *
 * Enforced at render time so the rules hold regardless of what the CMS page contains.
 */
function homepageBlocks(blocks: Block[]): Block[] {
  const withoutBlog = blocks.filter((block) => block.blockType !== 'latestPosts')
  const inquiryIndex = withoutBlog.findIndex((block) => block.blockType === 'inquiry')
  return inquiryIndex === -1 ? withoutBlog : withoutBlog.slice(0, inquiryIndex + 1)
}

/** How many stories the homepage journal board shows — the editor's `limit` wins. */
function homepagePostLimit(blocks: Block[]): number | undefined {
  const journalBlock = blocks.find(
    (block): block is LatestPostsBlock => block.blockType === 'latestPosts',
  )
  return journalBlock?.limit ?? undefined
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
    // Read before `homepageBlocks` drops the block itself — the editor's chosen story
    // count still drives the board that replaces it.
    const postLimit = homepagePostLimit(blocks)

    blocks = homepageBlocks(blocks)
    if (!blocks.length) return null

    const heroIndex = blocks.findIndex((b) => b.blockType === 'hero')
    if (heroIndex !== -1) {
      const heroBlock = blocks[heroIndex]!
      const otherBlocks = blocks.filter((_, i) => i !== heroIndex)

      if (heroBlock.blockType === 'hero') {
        const heroElement = <Hero block={heroBlock} homepage={true} />

        // "About Hike Globally" always follows the Curated Travel Packages section
        // (the `featuredTrips` block), wherever an editor has placed it on the page.
        const aboutElement = <AboutHikeGlobally key="about-hike-globally" />

        // "Latest Blogs and Stories" always precedes the inquiry ("Plan your trip") section,
        // which is where the homepage ends.
        const journalElement = (
          <LatestBlogsSection key="latest-blogs-and-stories" limit={postLimit} />
        )

        // One CMS block → the nodes it renders on the homepage, policy sections included.
        const nodesFor = (block: Block, index: number): ReactNode[] => [
          ...(block.blockType === 'inquiry' ? [journalElement] : []),
          renderBlock(block, index, false),
          ...(block.blockType === 'featuredTrips' ? [aboutElement] : []),
        ]

        const groups = otherBlocks.map((block, index) => nodesFor(block, index))
        const [firstGroup, ...restGroups] = groups
        // A page with no inquiry block still gets the journal board — as its last section.
        const hasInquiry = otherBlocks.some((block) => block.blockType === 'inquiry')

        const firstSectionElement = (
          <>
            <DifficultyLevels />
            {firstGroup}
            {restGroups.length === 0 && !hasInquiry ? journalElement : null}
          </>
        )
        const subsequentElements = [
          ...restGroups.flat(),
          ...(restGroups.length > 0 && !hasInquiry ? [journalElement] : []),
        ]

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
