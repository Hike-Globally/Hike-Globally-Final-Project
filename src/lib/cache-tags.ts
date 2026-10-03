/**
 * Central cache-tag vocabulary.
 *
 * Every frontend read is wrapped in `unstable_cache(..., { tags })` (see `src/lib/data.ts`), and
 * every write in Payload invalidates the matching tags (see `src/hooks/revalidate.ts`).
 * One shared vocabulary = no "why didn't my page update?" bugs.
 *
 * HOW IT WORKS (2 sentences): Next.js stores the result of a cached function in the Data Cache
 * under one or more tags. `revalidateTag('trips')` throws away every entry carrying that tag, so
 * the next visitor re-runs the query against Postgres and sees the new content — no redeploy,
 * no waiting for a time-based revalidation window.
 */

export const CACHE_TAG = {
  trips: 'trips',
  trip: (slug: string) => `trip:${slug}`,
  destinations: 'destinations',
  destination: (slug: string) => `destination:${slug}`,
  posts: 'posts',
  post: (slug: string) => `post:${slug}`,
  pages: 'pages',
  page: (slug: string) => `page:${slug}`,
  header: 'global:header',
  footer: 'global:footer',
  settings: 'global:settings',
} as const

/** Safety net: even if a webhook is missed, content is refreshed at most this often. */
export const REVALIDATE_SECONDS = 3600

/** Revalidation is skipped during seeding / CLI work (there is no Next.js request scope). */
export const revalidationDisabled = (): boolean =>
  process.env.DISABLE_REVALIDATION === 'true' || process.env.NODE_ENV === 'test'
