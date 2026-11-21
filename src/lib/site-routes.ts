import { routes } from '@/i18n/config'

/**
 * Route slugs that belong to a dedicated route instead of the CMS.
 *
 * A page in the Pages collection with one of these slugs never gets its own URL: the static route
 * wins, so `/[slug]` returns 404 for it. Three places have to agree on that list —
 *
 *  - `src/app/(frontend)/[slug]/page.tsx` refuses to render them,
 *  - `src/lib/sitemap.ts` refuses to list them (the same URL would otherwise appear twice:
 *    once as `/trips`, the listing page, and once as `/trips`, the shadowed page), and
 *  - `src/lib/llms-txt.ts` refuses to advertise a shadowed page document.
 *
 * — which is why it lives here rather than in either file.
 */
const RESERVED_PAGE_SLUGS = new Set<string>([
  // Listing/inquiry routes, from the shared route vocabulary.
  ...Object.values(routes),
  // The homepage's page document — it is served at `/`, not `/${slug}`.
  'home',
  // Generated subscription endpoint, never a CMS landing page.
  'feed.xml',
  // Preview entry point, Payload admin and the REST/GraphQL API.
  'preview',
  'admin',
  'api',
])

/** True when a Pages document with this slug is shadowed by a route of its own. */
export const isReservedPageSlug = (slug: string): boolean => RESERVED_PAGE_SLUGS.has(slug)
