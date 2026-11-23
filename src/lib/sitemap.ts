import type { MetadataRoute } from 'next'

import { routes, sitePath } from '@/i18n/config'
import { PAGE_SIZE } from './catalog'
import { canonicalUrl } from './seo'
import { isReservedPageSlug } from './site-routes'
import { sitemapAssetUrl, sitemapMediaXml, type SitemapMedia } from './sitemap-media'
import { HOME_HERO_IMAGE_URL } from './site-assets'
import { PLACE_INDEX_PATH, placeCategories, placeCategoryPath } from './place-categories'

/**
 * ============================================================================
 * sitemap.xml — the list of URLs the site wants crawled
 * ============================================================================
 *
 * `src/app/sitemap.ts` is the route (Next's file convention, served at
 * `/sitemap.xml`); this module is the list it returns. Keeping the rules here means they can be
 * tested directly, without a database or a Next.js request scope — see
 * `src/lib/sitemap.test.ts`.
 *
 * Four rules make the file worth submitting in Search Console:
 *
 *  1. EVERY PUBLIC URL APPEARS EXACTLY ONCE — the homepage, the listing pages, the inquiry page,
 *     each published trip, destination, post and CMS page, and every page of a paginated archive
 *     (`/trips?page=2`, …). No query strings except that pagination, no trailing slashes, no
 *     duplicates this sitemap puts there itself. Filtered archive URLs (`/trips?difficulty=easy`)
 *     are not here on purpose: they are `noindex,follow`, and rule 4 applies to them too.
 *
 *  2. URLS COME FROM `canonicalUrl()` — the same helper that renders each page's
 *     `<link rel="canonical">`, so a sitemap entry and the canonical of the page it points at are
 *     always the identical string.
 *
 *  3. `<lastmod>` IS THE DOCUMENT'S OWN DATE — never "the moment this was generated". A lastmod
 *     that is always now is noise (crawlers learn to ignore the field altogether), whereas a real
 *     edit date is a scheduling signal: Google uses it to decide what to recrawl first.
 *
 *  4. NOTHING NOINDEX IS ADVERTISED — a document whose SEO panel is set to noindex is skipped, and
 *     so is a CMS page whose slug a real route owns (which has no URL of its own). Submitting a
 *     URL the page itself tells crawlers to skip is the one contradiction Search Console reports
 *     as an error.
 *
 * There are no `alternates` blocks: the site is English-only, so there is nothing to translate
 * between and each page's canonical is all a crawler needs.
 */

/** One document that has a public URL, as much of it as the sitemap needs. */
export type SitemapDocument = SitemapMedia & {
  slug?: string | null
  /** The document's `updatedAt` — the honest `<lastmod>` for its URL. */
  updatedAt?: string | null
  /** The document's SEO panel asks search engines to skip it (`meta.noIndex`). */
  noIndex?: boolean | null
}

/** Everything the sitemap lists, exactly as `getSitemapSources()` reads it from Payload. */
export type SitemapSources = {
  trips: SitemapDocument[]
  destinations: SitemapDocument[]
  posts: SitemapDocument[]
  pages: SitemapDocument[]
  /**
   * Author profile pages. `noIndex` is set on a bare account (no bio, no published work), which
   * `published()` then filters out — the same rule the profile page applies to its own
   * `<meta name="robots">`, so the sitemap can never advertise a page that hides itself.
   */
  authors: SitemapDocument[]
}

/** What the sitemap is on a database-less build: the static routes and nothing else. */
export const EMPTY_SITEMAP_SOURCES: SitemapSources = {
  trips: [],
  destinations: [],
  posts: [],
  pages: [],
  authors: [],
}

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

/**
 * The pages that exist without a CMS document behind them.
 *
 * `feeds` names the collections whose newest edit is a real change to the page: `/trips` changes
 * when a trip is added or rewritten, the homepage when anything it renders does. That is where the
 * listing pages get their `<lastmod>` from.
 */
const STATIC_ROUTES: {
  path: string
  priority: number
  changeFrequency: ChangeFrequency
  feeds: (keyof SitemapSources)[]
  /**
   * A listing whose cards are paginated. Every page from the second on is a URL of its own with a
   * different set of cards, and `rel=prev/next` was retired in 2019 — so unless the sitemap hands a
   * crawler those URLs, page 3 is reachable only by following two pagination links in a row.
   */
  archive?: keyof SitemapSources
}[] = [
  {
    path: '/',
    priority: 1,
    changeFrequency: 'weekly',
    feeds: ['trips', 'destinations', 'posts', 'pages'],
  },
  {
    path: sitePath(routes.trips),
    priority: 0.8,
    changeFrequency: 'daily',
    feeds: ['trips'],
    archive: 'trips',
  },
  {
    path: sitePath(routes.destinations),
    priority: 0.8,
    changeFrequency: 'daily',
    feeds: ['destinations'],
    archive: 'destinations',
  },
  {
    path: sitePath(routes.blog),
    priority: 0.8,
    changeFrequency: 'daily',
    feeds: ['posts'],
    archive: 'posts',
  },
  // Nothing but the copy an editor writes on the inquiry page itself, so no `<lastmod>` is claimed.
  { path: sitePath(routes.contact), priority: 0.8, changeFrequency: 'daily', feeds: [] },
  { path: sitePath(routes.about), priority: 0.6, changeFrequency: 'monthly', feeds: [] },
  { path: sitePath(routes.privacy), priority: 0.3, changeFrequency: 'yearly', feeds: [] },
  { path: sitePath(routes.terms), priority: 0.3, changeFrequency: 'yearly', feeds: [] },
  // The /sitemap chart lists the collections, so it follows them like a listing page.
  {
    path: sitePath(routes.sitemap),
    priority: 0.5,
    changeFrequency: 'monthly',
    feeds: ['trips', 'destinations', 'posts', 'pages'],
  },
  // The authors index: one hub page linking to every profile, so a crawler can reach an author
  // without first finding one of their posts.
  {
    path: sitePath(routes.authors),
    priority: 0.5,
    changeFrequency: 'weekly',
    feeds: ['authors'],
  },
  // Browse Places has one index and nine dedicated category pages. Their lastmod follows the
  // trips and posts an editor maps into them through `placeCategories`.
  { path: PLACE_INDEX_PATH, priority: 0.7, changeFrequency: 'weekly', feeds: ['trips', 'posts'] },
  ...placeCategories.map((category) => ({
    path: placeCategoryPath(category.value),
    priority: 0.7,
    changeFrequency: 'weekly' as const,
    feeds: ['trips', 'posts'] as (keyof SitemapSources)[],
  })),
]

/** Where each collection's documents live, and how prominently they rank. */
const DOCUMENT_ROUTES: {
  key: keyof SitemapSources
  path: (slug: string) => string
  priority: number
  changeFrequency: ChangeFrequency
  /** Documents a route lists; defaults to all of them. */
  linkable?: (doc: SitemapDocument) => boolean
}[] = [
  {
    key: 'trips',
    path: (slug) => sitePath(`/trips/${slug}`),
    priority: 0.9,
    changeFrequency: 'weekly',
  },
  {
    key: 'destinations',
    path: (slug) => sitePath(`/destinations/${slug}`),
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  {
    key: 'posts',
    path: (slug) => sitePath(`/blog/${slug}`),
    priority: 0.7,
    changeFrequency: 'weekly',
  },
  {
    key: 'pages',
    path: (slug) => sitePath(`/${slug}`),
    priority: 0.6,
    changeFrequency: 'weekly',
    // `home` (served at `/`) and any slug a dedicated route owns (`/trips`, `/blog`, …) has no URL
    // of its own — listing it would print a URL the sitemap already contains.
    linkable: (doc) => !isReservedPageSlug(doc.slug ?? ''),
  },
  {
    key: 'authors',
    path: (slug) => sitePath(`/authors/${slug}`),
    priority: 0.6,
    changeFrequency: 'weekly',
  },
]

/** Documents that have a URL of their own and are not asking to be kept out of the index. */
const published = (documents: SitemapDocument[]): SitemapDocument[] =>
  documents.filter((document) => Boolean(document.slug) && !document.noIndex)

/**
 * The newest usable `updatedAt` among the given documents, normalized to ISO, or `undefined` when
 * none of them carries a parseable date — in which case the entry simply omits `<lastmod>` rather
 * than claiming a modification time that may not be true.
 */
const newestUpdate = (documents: SitemapDocument[]): string | undefined => {
  const timestamps = documents
    .map((document) =>
      typeof document.updatedAt === 'string' ? Date.parse(document.updatedAt) : Number.NaN,
    )
    .filter((timestamp) => Number.isFinite(timestamp))

  if (timestamps.length === 0) return undefined

  return new Date(Math.max(...timestamps)).toISOString()
}

/** Builds the `<urlset>` Next.js serializes into `/sitemap.xml`. */
export const buildSitemap = (
  sources: SitemapSources = EMPTY_SITEMAP_SOURCES,
): MetadataRoute.Sitemap => {
  const collections: Record<keyof SitemapSources, SitemapDocument[]> = {
    trips: published(sources.trips),
    destinations: published(sources.destinations),
    posts: published(sources.posts),
    pages: published(sources.pages),
    authors: published(sources.authors),
  }

  const entries: MetadataRoute.Sitemap = []
  const home = collections.pages.find((doc) => doc.slug === 'home')
  // HomeFallback has a bundled hero; a CMS homepage only advertises the blocks it renders.
  const hasHomeRecord = sources.pages.some((doc) => doc.slug === 'home')
  const homeHero = !hasHomeRecord ? sitemapAssetUrl(HOME_HERO_IMAGE_URL) : undefined
  const homepageMedia = sitemapMediaXml(home ?? { images: homeHero ? [homeHero] : [] })

  for (const { path, priority, changeFrequency, feeds } of STATIC_ROUTES) {
    entries.push({
      url: canonicalUrl(path),
      ...(path === '/' ? homepageMedia : {}),
      lastModified: newestUpdate(feeds.flatMap((feed) => collections[feed])),
      changeFrequency,
      priority,
    })
  }

  // Pages 2..N of each archive — kept in a block of their own so the static routes above stay a
  // contiguous run. One URL per page, spelled exactly as the pagination links render it. Filtered
  // URLs are deliberately absent: the archive routes mark them `noindex,follow`, and a sitemap
  // must never advertise a URL the page itself tells crawlers to skip.
  for (const { path, priority, changeFrequency, feeds, archive } of STATIC_ROUTES) {
    if (!archive) continue
    const pages = Math.ceil(sources[archive].length / PAGE_SIZE)
    for (let page = 2; page <= pages; page++) {
      entries.push({
        url: canonicalUrl(`${path}?page=${page}`),
        lastModified: newestUpdate(feeds.flatMap((feed) => collections[feed])),
        changeFrequency,
        priority,
      })
    }
  }

  for (const { key, path, priority, changeFrequency, linkable } of DOCUMENT_ROUTES) {
    for (const document of collections[key]) {
      if (linkable && !linkable(document)) continue

      entries.push({
        // `slug` is checked by `published()` above.
        url: canonicalUrl(path(document.slug as string)),
        ...sitemapMediaXml(document),
        lastModified: newestUpdate([document]),
        changeFrequency,
        priority,
      })
    }
  }

  // One URL, one entry. Duplicate slugs should not exist (the CMS field is unique per document),
  // but a sitemap is exactly where a duplicate is expensive, so the output is guaranteed clean
  // regardless of what the database holds. First entry wins, i.e. the highest-priority one.
  const seen = new Set<string>()

  return entries.filter(({ url }) => {
    if (seen.has(url)) return false
    seen.add(url)
    return true
  })
}
