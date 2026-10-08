import type { MetadataRoute } from 'next'

import { sitePath } from '@/i18n/config'
import {
  getAllDestinationSlugs,
  getAllPageSlugs,
  getAllPostSlugs,
  getAllTripSlugs,
} from '@/lib/data'
import { absoluteUrl } from '@/lib/seo'

export const revalidate = 3600

/**
 * Sitemap for the English-only site.
 *
 * Every public URL appears exactly once: the homepage, the three listing pages, the inquiry
 * page, and each published trip, destination, post and CMS page. There are no `alternates`
 * blocks — with a single language there is nothing to translate between, and the canonical URL
 * on each page is all a crawler needs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trips, destinations, posts, pages] = await Promise.all([
    getAllTripSlugs(),
    getAllDestinationSlugs(),
    getAllPostSlugs(),
    getAllPageSlugs(),
  ])

  const lastModified = new Date()

  const entry = (
    path: string,
    priority: number,
    changeFrequency: 'daily' | 'weekly',
  ): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  })

  const staticPaths = ['/', '/trips', '/destinations', '/blog', '/inquiry']

  return [
    ...staticPaths.map((path) =>
      entry(path, path === '/' ? 1 : 0.8, path === '/' ? 'weekly' : 'daily'),
    ),
    ...trips.map((slug) => entry(sitePath(`/trips/${slug}`), 0.9, 'weekly')),
    ...destinations.map((slug) => entry(sitePath(`/destinations/${slug}`), 0.8, 'weekly')),
    ...posts.map((slug) => entry(sitePath(`/blog/${slug}`), 0.7, 'weekly')),
    // A CMS page with the reserved `home` slug is the homepage, which is already listed above.
    ...pages
      .filter((slug) => slug !== 'home')
      .map((slug) => entry(sitePath(`/${slug}`), 0.6, 'weekly')),
  ]
}
