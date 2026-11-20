import type { Payload } from 'payload'

import { defaultLocale } from '@/i18n/config'
import type { Media } from '@/payload-types'
import type { SitemapDocument } from './sitemap'
import { blogSectionOptions, resolvePageSections, tripSectionOptions, type PageSection } from './page-sections'
import { sitemapAssetUrl, sitemapMedia } from './sitemap-media'
import { HOME_HERO_IMAGE_URL } from './site-assets'

export type SitemapCollection = 'trips' | 'destinations' | 'blog' | 'pages'
type Upload = number | Media | null

type SitemapRecord = {
  slug?: string | null
  updatedAt?: string | null
  meta?: { noIndex?: boolean | null } | null
  heroImage?: Upload
  featuredImage?: Upload
  gallery?: { image?: Upload }[] | null
  pageSections?: PageSection[] | null
  blocks?: {
    blockType: string
    backgroundImage?: Upload
    images?: { image?: Upload }[] | null
  }[] | null
}

/** Keep this aligned with the actual hero/gallery renderers, not arbitrary media in the library. */
export function sitemapDocument(record: SitemapRecord, collection: SitemapCollection): SitemapDocument {
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
    noIndex: record.meta?.noIndex ?? false,
    ...media,
  }
}

const base = { slug: true, updatedAt: true, meta: { noIndex: true } } as const
const select = {
  trips: { ...base, heroImage: true, gallery: { image: true }, pageSections: { kind: true } },
  destinations: { ...base, heroImage: true, gallery: { image: true } },
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

/** Separate from slug readers: populate media + its thumbnail, without making every slug lookup heavy. */
export async function readSitemapDocuments(
  payload: Pick<Payload, 'find'>,
  collection: SitemapCollection,
): Promise<SitemapDocument[]> {
  const documents: SitemapDocument[] = []
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
    documents.push(...response.docs.map((doc) => sitemapDocument(doc as SitemapRecord, collection)))
    if (!response.hasNextPage) break
    page++
  }
  return documents
}
