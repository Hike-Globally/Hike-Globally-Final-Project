import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/seo'

/**
 * `/cdn-cgi/` is Cloudflare's own namespace, not part of this app. When Email Address Obfuscation
 * rewrites a `mailto:` link it points it at `/cdn-cgi/l/email-protection`, a path with nothing
 * behind it: search engines and SEO crawlers follow it, get no document, and file it as a broken
 * internal link (Semrush reported exactly that) or a soft 404 (Google Search Console).
 *
 * `src/lib/public-email.ts` stops us *emitting* those links in the markup we own. This keeps
 * crawlers away from any that a CMS editor's pasted rich text still produces, and from the rest of
 * the `/cdn-cgi/` endpoints (email-decode script, challenge pages, trace) which are no-ops for a
 * crawler and only ever show up as errors in a site audit.
 *
 * Payload's admin and REST/GraphQL API are excluded for the same reason as before: they are not
 * content, and crawling them wastes a crawl budget that belongs to trip pages.
 */
const disallow = ['/admin', '/api/', '/preview/', '/cdn-cgi/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
