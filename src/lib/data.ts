import { unstable_cache } from 'next/cache'
import type { TypedLocale } from 'payload'

import { CACHE_TAG, REVALIDATE_SECONDS } from '@/lib/cache-tags'
import type { Locale } from '@/i18n/config'
import type {
  Blog,
  Destination,
  Footer,
  Header,
  Media,
  Page,
  Setting,
  Trip,
  User,
} from '@/payload-types'
import { getPayloadClient, isDatabaseConfigured } from './payload'

/**
 * ============================================================================
 * Data access layer — every read the frontend performs goes through this file.
 * ============================================================================
 *
 * Three ideas make it fast:
 *
 * 1. PAYLOAD LOCAL API — queries run straight against Postgres inside the server
 *    component. No HTTP call to your own REST/GraphQL endpoint, no double serialization.
 *
 * 2. `unstable_cache` — results are stored in Next's Data Cache under the tags declared
 *    in `src/lib/cache-tags.ts`. A page is rendered once, then served from cache until
 *    someone publishes something (Payload's hooks call `revalidateTag`). Cache misses are
 *    therefore rare and always cheap.
 *
 * 3. `select` — listings only pull the fields they render, which keeps rows small and
 *    Postgres fast. Rich text and itineraries are only fetched on detail pages.
 *
 * None of these functions read cookies or headers, so every route that uses them stays
 * statically renderable (the single biggest Core Web Vitals win available).
 */

const toTypedLocale = (locale: Locale): TypedLocale => locale as TypedLocale

let hasLoggedFallbackWarning = false

/**
 * Runs a cached Payload query when a database is configured and reachable, or returns
 * `fallback` so builds (e.g. initial Vercel deploy before env vars/DB are attached) and
 * unseeded environments never crash.
 */
async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  if (!isDatabaseConfigured()) {
    return fallback
  }

  try {
    return await query()
  } catch (error) {
    if (!hasLoggedFallbackWarning) {
      hasLoggedFallbackWarning = true
      console.warn(
        '[data] Falling back due to database query error:',
        error instanceof Error ? error.message : error,
      )
    }
    return fallback
  }
}

const defaultHeader: Header = {
  id: 0,
  announcement: null,
  navItems: [],
  actions: [],
}

const defaultFooter: Footer = {
  id: 0,
  introduction: null,
  columns: [],
  legalLinks: [],
  copyright: null,
}

const defaultSettings: Setting = {
  id: 0,
  siteName: 'Hike Globally',
  tagline: 'Trekking & expeditions in Nepal',
  email: process.env.NEXT_PUBLIC_FORMSUBMIT_EMAIL || 'hello@hikeglobally.com',
  responseTimeNote: 'We reply to every enquiry within 24 hours.',
}

/* -------------------------------------------------------------------------- */
/* Types describing the *shape* of each query result                            */
/* -------------------------------------------------------------------------- */

export type TripCard = {
  id: number
  title: string
  slug: string
  summary: string
  heroImage: Media
  tripType: Trip['tripType']
  durationDays: number
  durationNights?: number | null
  groupSizeMax?: number | null
  maxAltitude?: number | null
  difficulty: Trip['difficulty']
  bestSeasons?: Trip['bestSeasons']
  priceFrom: number
  priceCurrency: Trip['priceCurrency']
  priceUnit?: Trip['priceUnit']
  featured?: boolean | null
  destination: number | ({ id: number; name: string; slug: string } | null)
}

export type DestinationCard = {
  id: number
  name: string
  slug: string
  tagline?: string | null
  heroImage: Media
  country: string
  region: Destination['region']
  featured?: boolean | null
}

export type PostCard = {
  id: number
  title: string
  slug: string
  excerpt: string
  featuredImage: Media
  publishedAt?: string | null
  createdAt: string
  categories?: Blog['categories']
  featured?: boolean | null
  author?: number | ({ id: number; name: string; avatar?: number | Media | null } | null)
}

/* -------------------------------------------------------------------------- */
/* Trips                                                                       */
/* -------------------------------------------------------------------------- */

const tripCardSelect = {
  title: true,
  slug: true,
  summary: true,
  heroImage: true,
  tripType: true,
  durationDays: true,
  durationNights: true,
  groupSizeMax: true,
  maxAltitude: true,
  difficulty: true,
  bestSeasons: true,
  priceFrom: true,
  priceCurrency: true,
  priceUnit: true,
  featured: true,
  destination: true,
} as const

export const getTrips = (locale: Locale, limit = 100): Promise<TripCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'trips',
          locale: toTypedLocale(locale),
          depth: 1,
          limit,
          sort: '-featured',
          where: { _status: { equals: 'published' } },
          select: tripCardSelect,
        })
        return result.docs as unknown as TripCard[]
      },
      ['trips', locale, String(limit)],
      { tags: [CACHE_TAG.trips], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

export const getFeaturedTrips = (locale: Locale, limit = 3): Promise<TripCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'trips',
          locale: toTypedLocale(locale),
          depth: 1,
          limit,
          sort: '-featured',
          where: { and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }] },
          select: tripCardSelect,
        })
        return result.docs as unknown as TripCard[]
      },
      ['trips', 'featured', locale, String(limit)],
      { tags: [CACHE_TAG.trips], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

export const getTrip = (locale: Locale, slug: string): Promise<Trip | null> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'trips',
          locale: toTypedLocale(locale),
          depth: 2,
          limit: 1,
          where: { and: [{ _status: { equals: 'published' } }, { slug: { equals: slug } }] },
        })
        return (result.docs[0] as Trip | undefined) ?? null
      },
      ['trip', locale, slug],
      { tags: [CACHE_TAG.trips, CACHE_TAG.trip(slug)], revalidate: REVALIDATE_SECONDS },
    ),
    null,
  )

/** Related trips: explicit picks first, otherwise other trips in the same destination. */
export const getRelatedTrips = (locale: Locale, trip: Trip, limit = 3): Promise<TripCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const manual = Array.isArray(trip.relatedTrips) ? trip.relatedTrips : []
        const manualIds = manual
          .map((item) => (typeof item === 'number' ? item : item?.id))
          .filter((id): id is number => typeof id === 'number' && id !== trip.id)

        if (manualIds.length > 0) {
          const result = await payload.find({
            collection: 'trips',
            locale: toTypedLocale(locale),
            depth: 1,
            limit,
            where: {
              and: [{ _status: { equals: 'published' } }, { id: { in: manualIds } }],
            },
            select: tripCardSelect,
          })
          if (result.docs.length > 0) return result.docs as unknown as TripCard[]
        }

        const destinationId =
          typeof trip.destination === 'number' ? trip.destination : trip.destination?.id

        const result = await payload.find({
          collection: 'trips',
          locale: toTypedLocale(locale),
          depth: 1,
          limit,
          where: {
            and: [
              { _status: { equals: 'published' } },
              { id: { not_equals: trip.id } },
              ...(destinationId ? [{ destination: { equals: destinationId } }] : []),
            ],
          },
          select: tripCardSelect,
        })
        return result.docs as unknown as TripCard[]
      },
      ['trips', 'related', locale, String(trip.id)],
      { tags: [CACHE_TAG.trips], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/** Every published slug, per language — feeds generateStaticParams(). */
export const getAllTripSlugs = (): Promise<{ id: number; locale: Locale; slug: string }[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result: { id: number; locale: Locale; slug: string }[] = []
        for (const locale of ['en', 'de', 'fr'] as Locale[]) {
          const response = await payload.find({
            collection: 'trips',
            locale: toTypedLocale(locale),
            depth: 0,
            limit: 1000,
            select: { slug: true },
            where: { _status: { equals: 'published' } },
          })
          for (const doc of response.docs) {
            const slug = (doc as { slug?: string | null }).slug
            if (slug) result.push({ id: doc.id, locale, slug })
          }
        }
        return result
      },
      ['trip-slugs'],
      { tags: [CACHE_TAG.trips], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/** Lightweight list used to populate the inquiry form's "trip of interest" dropdown. */
export const getTripOptions = (
  locale: Locale,
): Promise<{ id: number; title: string; slug: string }[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'trips',
          locale: toTypedLocale(locale),
          depth: 0,
          limit: 200,
          sort: 'title',
          select: { title: true, slug: true },
          where: { _status: { equals: 'published' } },
        })
        return result.docs as unknown as { id: number; title: string; slug: string }[]
      },
      ['trip-options', locale],
      { tags: [CACHE_TAG.trips], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/* -------------------------------------------------------------------------- */
/* Destinations                                                                */
/* -------------------------------------------------------------------------- */

const destinationCardSelect = {
  name: true,
  slug: true,
  tagline: true,
  heroImage: true,
  country: true,
  region: true,
  featured: true,
} as const

export const getDestinations = (locale: Locale, limit = 100): Promise<DestinationCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'destinations',
          locale: toTypedLocale(locale),
          depth: 1,
          limit,
          sort: '-featured',
          where: { _status: { equals: 'published' } },
          select: destinationCardSelect,
        })
        return result.docs as unknown as DestinationCard[]
      },
      ['destinations', locale],
      { tags: [CACHE_TAG.destinations], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

export const getFeaturedDestinations = (locale: Locale, limit = 3): Promise<DestinationCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'destinations',
          locale: toTypedLocale(locale),
          depth: 1,
          limit,
          sort: '-featured',
          where: { and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }] },
          select: destinationCardSelect,
        })
        return result.docs as unknown as DestinationCard[]
      },
      ['destinations', 'featured', locale, String(limit)],
      { tags: [CACHE_TAG.destinations], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

export const getDestination = (locale: Locale, slug: string): Promise<Destination | null> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'destinations',
          locale: toTypedLocale(locale),
          depth: 1,
          limit: 1,
          // `joins` resolves the `trips` join field in the same round trip as the document,
          // so the destination page needs exactly ONE database query.
          joins: { trips: { limit: 50, sort: '-featured' } },
          where: { and: [{ _status: { equals: 'published' } }, { slug: { equals: slug } }] },
        })
        return (result.docs[0] as Destination | undefined) ?? null
      },
      ['destination', locale, slug],
      {
        tags: [CACHE_TAG.destinations, CACHE_TAG.destination(slug), CACHE_TAG.trips],
        revalidate: REVALIDATE_SECONDS,
      },
    ),
    null,
  )

export const getAllDestinationSlugs = (): Promise<{ id: number; locale: Locale; slug: string }[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result: { id: number; locale: Locale; slug: string }[] = []
        for (const locale of ['en', 'de', 'fr'] as Locale[]) {
          const response = await payload.find({
            collection: 'destinations',
            locale: toTypedLocale(locale),
            depth: 0,
            limit: 1000,
            select: { slug: true },
            where: { _status: { equals: 'published' } },
          })
          for (const doc of response.docs) {
            const slug = (doc as { slug?: string | null }).slug
            if (slug) result.push({ id: doc.id, locale, slug })
          }
        }
        return result
      },
      ['destination-slugs'],
      { tags: [CACHE_TAG.destinations], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/* -------------------------------------------------------------------------- */
/* Blog                                                                        */
/* -------------------------------------------------------------------------- */

const postCardSelect = {
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  publishedAt: true,
  createdAt: true,
  categories: true,
  featured: true,
  author: true,
} as const

export const getPosts = (locale: Locale, limit = 100): Promise<PostCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'blog',
          locale: toTypedLocale(locale),
          depth: 1,
          limit,
          sort: '-publishedAt',
          where: { _status: { equals: 'published' } },
          select: postCardSelect,
        })
        return result.docs as unknown as PostCard[]
      },
      ['posts', locale],
      { tags: [CACHE_TAG.posts], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

export const getFeaturedPosts = (locale: Locale, limit = 3): Promise<PostCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'blog',
          locale: toTypedLocale(locale),
          depth: 1,
          limit,
          sort: '-publishedAt',
          where: { and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }] },
          select: postCardSelect,
        })
        return result.docs as unknown as PostCard[]
      },
      ['posts', 'featured', locale, String(limit)],
      { tags: [CACHE_TAG.posts], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

export const getPost = (locale: Locale, slug: string): Promise<Blog | null> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'blog',
          locale: toTypedLocale(locale),
          depth: 2,
          limit: 1,
          where: { and: [{ _status: { equals: 'published' } }, { slug: { equals: slug } }] },
        })
        return (result.docs[0] as Blog | undefined) ?? null
      },
      ['post', locale, slug],
      { tags: [CACHE_TAG.posts, CACHE_TAG.post(slug)], revalidate: REVALIDATE_SECONDS },
    ),
    null,
  )

export const getRelatedPosts = (locale: Locale, post: Blog, limit = 3): Promise<PostCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const manual = Array.isArray(post.relatedPosts) ? post.relatedPosts : []
        const manualIds = manual
          .map((item) => (typeof item === 'number' ? item : item?.id))
          .filter((id): id is number => typeof id === 'number' && id !== post.id)

        if (manualIds.length > 0) {
          const result = await payload.find({
            collection: 'blog',
            locale: toTypedLocale(locale),
            depth: 1,
            limit,
            sort: '-publishedAt',
            where: { and: [{ _status: { equals: 'published' } }, { id: { in: manualIds } }] },
            select: postCardSelect,
          })
          if (result.docs.length > 0) return result.docs as unknown as PostCard[]
        }

        const result = await payload.find({
          collection: 'blog',
          locale: toTypedLocale(locale),
          depth: 1,
          limit,
          sort: '-publishedAt',
          where: {
            and: [
              { _status: { equals: 'published' } },
              { id: { not_equals: post.id } },
              ...(post.categories?.length ? [{ categories: { in: post.categories } }] : []),
            ],
          },
          select: postCardSelect,
        })
        return result.docs as unknown as PostCard[]
      },
      ['posts', 'related', locale, String(post.id)],
      { tags: [CACHE_TAG.posts], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

export const getAllPostSlugs = (): Promise<{ id: number; locale: Locale; slug: string }[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result: { id: number; locale: Locale; slug: string }[] = []
        for (const locale of ['en', 'de', 'fr'] as Locale[]) {
          const response = await payload.find({
            collection: 'blog',
            locale: toTypedLocale(locale),
            depth: 0,
            limit: 1000,
            select: { slug: true },
            where: { _status: { equals: 'published' } },
          })
          for (const doc of response.docs) {
            const slug = (doc as { slug?: string | null }).slug
            if (slug) result.push({ id: doc.id, locale, slug })
          }
        }
        return result
      },
      ['post-slugs'],
      { tags: [CACHE_TAG.posts], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/* -------------------------------------------------------------------------- */
/* Flexible pages                                                              */
/* -------------------------------------------------------------------------- */

export const getPage = (locale: Locale, slug: string): Promise<Page | null> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'pages',
          locale: toTypedLocale(locale),
          depth: 2,
          limit: 1,
          where: { and: [{ _status: { equals: 'published' } }, { slug: { equals: slug } }] },
        })
        return (result.docs[0] as Page | undefined) ?? null
      },
      ['page', locale, slug],
      { tags: [CACHE_TAG.pages, CACHE_TAG.page(slug)], revalidate: REVALIDATE_SECONDS },
    ),
    null,
  )

/** Slugs of every published page except the homepage (which lives at /{locale}). */
export const getAllPageSlugs = (): Promise<{ id: number; locale: Locale; slug: string }[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result: { id: number; locale: Locale; slug: string }[] = []
        for (const locale of ['en', 'de', 'fr'] as Locale[]) {
          const response = await payload.find({
            collection: 'pages',
            locale: toTypedLocale(locale),
            depth: 0,
            limit: 1000,
            select: { slug: true },
            where: { _status: { equals: 'published' } },
          })
          for (const doc of response.docs) {
            const slug = (doc as { slug?: string | null }).slug
            if (slug && slug !== 'home') result.push({ id: doc.id, locale, slug })
          }
        }
        return result
      },
      ['page-slugs'],
      { tags: [CACHE_TAG.pages], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/* -------------------------------------------------------------------------- */
/* Globals                                                                     */
/* -------------------------------------------------------------------------- */

export const getHeader = (locale: Locale): Promise<Header> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        return payload.findGlobal({ slug: 'header', locale: toTypedLocale(locale), depth: 2 })
      },
      ['global-header', locale],
      { tags: [CACHE_TAG.header], revalidate: REVALIDATE_SECONDS },
    ),
    defaultHeader,
  )

export const getFooter = (locale: Locale): Promise<Footer> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        return payload.findGlobal({ slug: 'footer', locale: toTypedLocale(locale), depth: 2 })
      },
      ['global-footer', locale],
      { tags: [CACHE_TAG.footer], revalidate: REVALIDATE_SECONDS },
    ),
    defaultFooter,
  )

export const getSettings = async (locale: Locale): Promise<Setting> => {
  const settings = await safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        return payload.findGlobal({ slug: 'settings', locale: toTypedLocale(locale), depth: 1 })
      },
      ['global-settings', locale],
      { tags: [CACHE_TAG.settings], revalidate: REVALIDATE_SECONDS },
    ),
    defaultSettings,
  )

  return {
    ...defaultSettings,
    ...settings,
    siteName: settings?.siteName || defaultSettings.siteName,
    email: settings?.email || defaultSettings.email,
  }
}

export type Author = Pick<User, 'id' | 'name'> & { avatar?: number | Media | null }
