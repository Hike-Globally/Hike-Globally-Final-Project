import type { Locale } from '@/i18n/config'
import type { Page } from '@/payload-types'

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
 * Maps a Payload block to its React component.
 *
 * The `blockType` discriminant comes straight from the generated Payload types, so adding a new
 * block to the CMS produces a TypeScript error here until it has a component — new blocks can
 * never silently render as nothing.
 */
export async function BlockRenderer({
  blocks,
  locale,
}: {
  blocks: Block[] | null | undefined
  locale: Locale
}) {
  if (!blocks?.length) return null

  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.blockType}-${index}`

        switch (block.blockType) {
          case 'hero':
            return <Hero key={key} block={block} locale={locale} />
          case 'richText':
            return <RichTextSection key={key} block={block} locale={locale} />
          case 'featuredTrips':
            return <FeaturedTrips key={key} block={block} locale={locale} />
          case 'featuredDestinations':
            return <FeaturedDestinations key={key} block={block} locale={locale} />
          case 'latestPosts':
            return <LatestPosts key={key} block={block} locale={locale} />
          case 'stats':
            return <Stats key={key} block={block} locale={locale} />
          case 'gallery':
            return <Gallery key={key} block={block} locale={locale} />
          case 'testimonials':
            return <Testimonials key={key} block={block} locale={locale} />
          case 'faq':
            return <Faq key={key} block={block} locale={locale} />
          case 'inquiry':
            return <InquirySection key={key} block={block} locale={locale} />
          case 'cta':
            return <Cta key={key} block={block} locale={locale} />
          default:
            return null
        }
      })}
    </>
  )
}
