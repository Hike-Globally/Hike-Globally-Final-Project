import type { Payload } from 'payload'

import { defaultLocale } from '@/i18n/config'
import type { Media } from '@/payload-types'
import { destinationNoIndexReason } from './destination-indexing'
import type { SitemapDocument } from './sitemap'
import { blogSectionOptions, resolvePageSections, tripSectionOptions, type PageSection } from './page-sections'
import { sitemapAssetUrl, sitemapMedia } from './sitemap-media'
import { HOME_HERO_IMAGE_URL } from './site-assets'

export type SitemapCollection = 'trips' | 'destinations' | 'blog' | 'pages'
type Upload = number | Media | null

type SitemapRecord = {
  id?: number
  slug?: string | null
  updatedAt?: string | null
  meta?: { noIndex?: boolean | null } | null
  heroImage?: Upload
  featuredImage?: Upload
  gallery?: { image?: Upload }[] | null
  pageSections?: PageSection[] | null
  description?: unknown
  blocks?: {
    blockType: string
    backgroundImage?: Upload
    images?: { image?: Upload }[] | null
  }[] | null
}

/**
 * What a destination's indexability depends on beyond its own SEO panel: how many published
 * trips point at it. Only the `destinations` collection needs this, and only because of the
 * continent-hub rule in `src/lib/destination-indexing.ts`.
 */
export type SitemapContext = {
  tripCounts?: Record<number, number>
}

/**
 * Why this record is kept out of the sitemap, or null. A destination can be excluded by the
 * continent-hub rule even when its SEO panel does not ask for it — the same verdict the page
 * applies to its own robots meta, so the file never advertises a page that hides itself.
 */
function noIndexReason(
  record: SitemapRecord,
  collection: SitemapCollection,
  context: SitemapContext,
): string | null {
  if (record.meta?.noIndex) return 'the SEO panel asks search engines to skip this page'
  if (collection !== 'destinations' || !record.slug) return null
  return destinationNoIndexReason({
    slug: record.slug,
    tripCount: typeof record.id === 'number' ? (context.tripCounts?.[record.id] ?? 0) : 0,
    description: record.description,
  })
}

/** Keep this aligned with the actual hero/gallery renderers, not arbitrary media in the library. */
export function sitemapDocument(
  record: SitemapRecord,
  collection: SitemapCollection,
  context: SitemapContext = {},
): SitemapDocument {
  const uploads: (Upload | undefined)[] = []
  let usesBundledHero = false
  const kinds = (options: { value: string }[]) => new Set(
    resolvePageSections(record.pageSections, options).map(({ kind }) => kind),
  )
  if (collection === 'trips') {
    const visible = kinds(tripSectionOptions)
    if (visible.has('hero')) uploads.push(record.heroImage)
    if (visible.has('gallery')) uploads.push(...(record.gallery ?? []).map(({ image }) => image))
  } else if (collection === 'destinations') {
    uploads.push(record.heroImage, ...(record.gallery ?? []).slice(0, 4).map(({ image }) => image))
  } else if (collection === 'blog') {
    if (kinds(blogSectionOptions).has('hero')) uploads.push(record.featuredImage)
  } else {
    // The homepage's first hero uses a bundled photograph instead of the CMS background.
    let firstHero = true
    for (const block of record.blocks ?? []) {
      if (block.blockType === 'hero') {
        if (record.slug === 'home' && firstHero) usesBundledHero = true
        else uploads.push(block.backgroundImage)
        firstHero = false
      }
      if (block.blockType === 'gallery') {
        uploads.push(...(block.images ?? []).map(({ image }) => image))
      }
      // BlockRenderer ends the homepage at its inquiry block.
      if (record.slug === 'home' && block.blockType === 'inquiry') break
    }
  }
  const media = sitemapMedia(uploads)
  const bundledHero = usesBundledHero ? sitemapAssetUrl(HOME_HERO_IMAGE_URL) : undefined
  if (bundledHero) media.images = [bundledHero, ...(media.images ?? [])]
  return {
    slug: record.slug,
    updatedAt: record.updatedAt,
    noIndex: noIndexReason(record, collection, context) !== null,
    ...media,
  }
}

const base = { id: true, slug: true, updatedAt: true, meta: { noIndex: true } } as const
const select = {
  trips: { ...base, heroImage: true, gallery: { image: true }, pageSections: { kind: true } },
  destinations: { ...base, heroImage: true, gallery: { image: true }, description: true },
  blog: { ...base, featuredImage: true, pageSections: { kind: true } },
  pages: {
    ...base,
    blocks: {
      hero: { backgroundImage: true },
      gallery: { images: { image: true } },
      inquiry: true,
    },
  },
} as const

/**
 * Published trips per destination id — the input to the continent-hub indexability rule.
 *
 * Counted from the trips side rather than from the destinations' `trips` join field: the join's
 * `maxDepth` is tuned for cards, not for counting, and a plain relationship read is both cheaper
 * and independent of how the admin panel is configured.
 */
async function readTripCountsPerDestination(
  payload: Pick<Payload, 'find'>,
): Promise<Record<number, number>> {
  const counts: Record<number, number> = {}
  let page = 1
  for (;;) {
    const response = await payload.find({
      collection: 'trips',
      depth: 0,
      limit: 500,
      page,
      sort: 'id',
      overrideAccess: false,
      select: { destination: true },
      where: { _status: { equals: 'published' } },
    })
    for (const doc of response.docs as { destination?: unknown }[]) {
      const destination = doc.destination
      const id =
        typeof destination === 'object' && destination !== null
          ? (destination as { id?: unknown }).id
          : destination
      if (typeof id === 'number') counts[id] = (counts[id] ?? 0) + 1
    }
    if (!response.hasNextPage) break
    page++
  }
  return counts
}

/** Separate from slug readers: populate media + its thumbnail, without making every slug lookup heavy. */
export async function readSitemapDocuments(
  payload: Pick<Payload, 'find'>,
  collection: SitemapCollection,
): Promise<SitemapDocument[]> {
  const documents: SitemapDocument[] = []
  const context: SitemapContext =
    collection === 'destinations' ? { tripCounts: await readTripCountsPerDestination(payload) } : {}
  let page = 1
  for (;;) {
    const response = await payload.find({
      collection,
      locale: defaultLocale,
      depth: 2,
      limit: 200,
      page,
      sort: 'id',
      overrideAccess: false,
      where: { _status: { equals: 'published' } },
      select: select[collection],
      populate: {
        // URL hooks need filename + storage location even though only the final URL is emitted.
        media: {
          url: true, filename: true, prefix: true, _objectKey: true,
          mimeType: true, alt: true, caption: true, videoThumbnail: true,
        },
      },
    })
    documents.push(
      ...response.docs.map((doc) => sitemapDocument(doc as SitemapRecord, collection, context)),
    )
    if (!response.hasNextPage) break
    page++
  }
  return documents
}
