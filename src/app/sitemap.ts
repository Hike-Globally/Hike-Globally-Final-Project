import type { MetadataRoute } from 'next'

import { getSitemapSources, getPlaceCategoryContent } from '@/lib/data'
import { placeCategories, placeCategoryPath } from '@/lib/place-categories'
import { canonicalUrl } from '@/lib/seo'
import { hasHubContent } from '@/lib/hub-indexing'
import { buildSitemap } from '@/lib/sitemap'

/**
 * /sitemap.xml — Next's sitemap file convention, so this route is the file crawlers fetch.
 *
 * It reads the published content and hands it to `buildSitemap()`
 * (`src/lib/sitemap.ts`), which owns the rules: every public URL exactly once, built with the
 * same `canonicalUrl()` helper as each page's `<link rel="canonical">`, `<lastmod>` from the
 * document's own `updatedAt`, and no noindex document ever listed. The homepage, the three
 * listing pages (`/trips`, `/destinations`, `/blog`) and `/inquiry` come from the route table
 * there; trips, destinations, posts and CMS pages come from the database. Original image URLs
 * and fully described videos are included on their actual landing-page entries (image/video
 * namespaces are emitted by Next); sitemap media never points at optimizer derivatives.
 *
 * Refreshed on a schedule (`revalidate` below) and immediately on every publish: Payload's
 * revalidation hooks purge `/sitemap.xml` alongside the page they changed (see
 * `src/hooks/revalidate.ts`), so a new trip is in the sitemap the same second it goes live.
 */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sources, content] = await Promise.all([
    getSitemapSources(),
    Promise.all(placeCategories.map((category) => getPlaceCategoryContent(category.value, 1))),
  ])
  const emptyPlaces = new Set(placeCategories.filter((_, index) =>
    !hasHubContent(content[index]!),
  ).map((category) => canonicalUrl(placeCategoryPath(category.value))))
  return buildSitemap(sources).filter((entry) => !emptyPlaces.has(entry.url))
}
