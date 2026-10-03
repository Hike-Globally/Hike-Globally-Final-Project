import type { MetadataRoute } from 'next'

import { locales, localizedPath } from '@/i18n/config'
import {
  getAllDestinationSlugs,
  getAllPageSlugs,
  getAllPostSlugs,
  getAllTripSlugs,
  getSettings,
} from '@/lib/data'
import { absoluteUrl } from '@/lib/seo'

export const revalidate = 3600

type SlugEntry = { id: number; locale: string; slug: string }

const groupById = (entries: SlugEntry[]) => {
  const groups = new Map<number, Record<string, string>>()
  for (const entry of entries) {
    const group = groups.get(entry.id) ?? {}
    group[entry.locale] = entry.slug
    groups.set(entry.id, group)
  }
  return Array.from(groups.values())
}

/**
 * Multilingual sitemap with hreflang alternates.
 *
 * Each document appears once per language, and every entry lists its translations via
 * `alternates.languages` — that is how Google serves the German URL to German users instead
 * of deciding your English page is a duplicate.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trips, destinations, posts, pages, settings] = await Promise.all([
    getAllTripSlugs(),
    getAllDestinationSlugs(),
    getAllPostSlugs(),
    getAllPageSlugs(),
    getSettings('en'),
  ])

  const lastModified = new Date()

  const staticPaths = ['', '/trips', '/destinations', '/blog', '/inquiry']

  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: absoluteUrl(localizedPath(locale, path)),
      lastModified,
      changeFrequency: (path === '' ? 'weekly' : 'daily') as 'weekly' | 'daily',
      priority: path === '' ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((code) => [code, absoluteUrl(localizedPath(code, path))]),
        ),
      },
    })),
  )

  const build = (
    entries: SlugEntry[],
    segment: string,
    priority: number,
  ): MetadataRoute.Sitemap =>
    groupById(entries).flatMap((group) =>
      Object.entries(group).map(([locale, slug]) => ({
        url: absoluteUrl(localizedPath(locale as (typeof locales)[number], `/${segment}/${slug}`)),
        lastModified,
        changeFrequency: 'weekly' as const,
        priority,
        alternates: {
          languages: Object.fromEntries(
            Object.entries(group).map(([code, value]) => [
              code,
              absoluteUrl(localizedPath(code as (typeof locales)[number], `/${segment}/${value}`)),
            ]),
          ),
        },
      })),
    )

  return [
    ...staticEntries,
    ...build(trips, 'trips', 0.9),
    ...build(destinations, 'destinations', 0.8),
    ...build(posts, 'blog', 0.7),
    ...build(pages, '', 0.6),
    // The site name is not needed here; it is referenced to keep the settings read meaningful.
    ...(settings.siteName ? [] : []),
  ]
}
