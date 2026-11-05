import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // `/api/media/file/` must stay fetchable: when uploads are stored in Postgres (see
        // src/lib/media-storage.ts) every image and video the site renders, and every image in its
        // JSON-LD, is served from that path. Blocking all of `/api/` would hide the whole library
        // from image search and from rich results.
        allow: ['/', '/api/media/file/'],
        disallow: ['/admin', '/api/', '/preview/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
