import { unstable_cache } from 'next/cache'
import type { TypedLocale, Where } from 'payload'

import { CACHE_TAG, REVALIDATE_SECONDS } from '@/lib/cache-tags'
import { defaultLocale } from '@/i18n/config'
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
import { pickAutomaticTrips } from './trip-selection'

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

/** The site's single locale, as Payload's Local API expects it. */
const SITE_LOCALE = defaultLocale as TypedLocale

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

type PreviewableCollection = 'blog' | 'destinations' | 'pages' | 'trips'

/** Uncached Local API lookup used only after the authenticated preview route enables Draft Mode. */
async function findDocumentBySlug<T>(
  collection: PreviewableCollection,
  slug: string,
  depth: number,
  includeDraft: boolean,
): Promise<T | null> {
  const payload = await getPayloadClient()
  const where: Where = includeDraft
    ? { slug: { equals: slug } }
    : { and: [{ _status: { equals: 'published' } }, { slug: { equals: slug } }] }

  const result = await payload.find({
    collection,
    locale: SITE_LOCALE,
    depth,
    limit: 1,
    where,
    ...(includeDraft ? { draft: true, overrideAccess: true } : {}),
  })

  return (result.docs[0] as T | undefined) ?? null
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

export const defaultFeaturedTrips: TripCard[] = [
  {
    id: 1,
    title: 'Everest Base Camp Trek',
    slug: 'everest-base-camp',
    summary:
      'The classic Himalayan journey through the Khumbu valley to the foot of the world’s highest peak.',
    heroImage: {
      id: 101,
      url: '/images/admin/himalaya-01.jpg',
      alt: 'Everest Base Camp trail with towering snowy peaks',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as Media,
    tripType: 'trekking',
    durationDays: 14,
    groupSizeMax: 12,
    maxAltitude: 5364,
    difficulty: 'challenging',
    priceFrom: 1850,
    priceCurrency: 'USD',
    featured: true,
    destination: { id: 1, name: 'Khumbu', slug: 'khumbu' },
  },
  {
    id: 2,
    title: 'Annapurna Base Camp Trek',
    slug: 'annapurna-base-camp',
    summary:
      'Hike into a natural mountain amphitheatre surrounded by ten peaks over 7,000 metres.',
    heroImage: {
      id: 102,
      url: '/images/admin/himalaya-02.jpg',
      alt: 'Annapurna range sunrise view from base camp',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as Media,
    tripType: 'trekking',
    durationDays: 11,
    groupSizeMax: 10,
    maxAltitude: 4130,
    difficulty: 'moderate',
    priceFrom: 1350,
    priceCurrency: 'USD',
    featured: true,
    destination: { id: 2, name: 'Annapurna', slug: 'annapurna' },
  },
  {
    id: 3,
    title: 'Langtang Valley & Kyanjin Ri',
    slug: 'langtang-valley',
    summary:
      'A quieter valley trek close to Kathmandu with sweeping views of the Tibetan border peaks.',
    heroImage: {
      id: 103,
      url: '/images/admin/himalaya-03.jpg',
      alt: 'Langtang valley trail winding through alpine meadows',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as Media,
    tripType: 'trekking',
    durationDays: 8,
    groupSizeMax: 10,
    maxAltitude: 4773,
    difficulty: 'moderate',
    priceFrom: 980,
    priceCurrency: 'USD',
    featured: true,
    destination: { id: 3, name: 'Langtang', slug: 'langtang' },
  },
]

export const defaultFeaturedDestinations: DestinationCard[] = [
  {
    id: 1,
    name: 'Khumbu',
    slug: 'khumbu',
    country: 'Nepal',
    tagline: 'Home of Everest, sherpa culture and ancient high monasteries.',
    heroImage: {
      id: 201,
      url: '/images/admin/himalaya-01.jpg',
      alt: 'Khumbu region with snowcapped peaks',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as Media,
    region: 'khumbu',
    featured: true,
  },
  {
    id: 2,
    name: 'Annapurna',
    slug: 'annapurna',
    country: 'Nepal',
    tagline: 'Lush subtropical foothills leading to soaring glaciated peaks.',
    heroImage: {
      id: 202,
      url: '/images/admin/himalaya-02.jpg',
      alt: 'Annapurna range massif',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as Media,
    region: 'annapurna',
    featured: true,
  },
  {
    id: 3,
    name: 'Langtang',
    slug: 'langtang',
    country: 'Nepal',
    tagline: 'Quiet pine forests, yak pastures and rugged border terrain.',
    heroImage: {
      id: 203,
      url: '/images/admin/himalaya-03.jpg',
      alt: 'Langtang valley alpine trail',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as Media,
    region: 'langtang',
    featured: true,
  },
  {
    id: 4,
    name: 'Mustang',
    slug: 'mustang',
    country: 'Nepal',
    tagline: 'A Tibetan kingdom behind the rain shadow — ochre cliffs and cave monasteries.',
    heroImage: {
      id: 204,
      url: '/images/admin/himalaya-01.jpg',
      alt: 'Mustang desert cliffs above the Kali Gandaki',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as Media,
    region: 'mustang',
    featured: true,
  },
  {
    id: 5,
    name: 'Manaslu',
    slug: 'manaslu',
    country: 'Nepal',
    tagline: 'The quiet circuit — 8,163 m of mountain and a trail that still feels remote.',
    heroImage: {
      id: 205,
      url: '/images/admin/himalaya-02.jpg',
      alt: 'Manaslu massif above the Budhi Gandaki valley',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as Media,
    region: 'manaslu',
    featured: true,
  },
]

export const defaultPosts: PostCard[] = [
  {
    id: 1,
    title: 'How to train for a 5,500 m trek (without a gym membership)',
    slug: 'training-for-altitude',
    excerpt:
      'Cardio, stair climbs and the real secret to altitude stamina: eccentric quad strength and zone 2 pacing.',
    featuredImage: {
      id: 301,
      url: '/images/admin/himalaya-01.jpg',
      alt: 'Trekker ascending a rocky trail with trekking poles',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as Media,
    author: { id: 1, name: 'Dawa Sherpa' },
    categories: ['trekking-guides'],
    publishedAt: '2026-01-15T00:00:00.000Z',
    createdAt: '2026-01-15T00:00:00.000Z',
    featured: true,
  },
  {
    id: 2,
    title: 'The honest packing list for the Khumbu in autumn',
    slug: 'khumbu-packing-list',
    excerpt:
      'What you actually need, what the lodge rentals provide, and what you will regret carrying up the Namche hill.',
    featuredImage: {
      id: 302,
      url: '/images/admin/himalaya-02.jpg',
      alt: 'Backpack and trekking boots laid out on a lodge floor',
      updatedAt: '2026-02-01T00:00:00.000Z',
      createdAt: '2026-02-01T00:00:00.000Z',
    } as Media,
    author: { id: 2, name: 'Pasang Lhamu' },
    categories: ['gear'],
    publishedAt: '2026-02-01T00:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    featured: true,
  },
  {
    id: 3,
    title: 'Altitude sickness: what the guide is watching for',
    slug: 'altitude-sickness-guide',
    excerpt:
      'The subtle early symptoms most trekkers try to hide, when to rest, and when descending is non-negotiable.',
    featuredImage: {
      id: 303,
      url: '/images/admin/himalaya-03.jpg',
      alt: 'Trekking group resting at high altitude viewing peaks',
      updatedAt: '2026-02-18T00:00:00.000Z',
      createdAt: '2026-02-18T00:00:00.000Z',
    } as Media,
    author: { id: 1, name: 'Dawa Sherpa' },
    categories: ['health-safety'],
    publishedAt: '2026-02-18T00:00:00.000Z',
    createdAt: '2026-02-18T00:00:00.000Z',
    featured: true,
  },
]

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

export const getTrips = (limit = 100): Promise<TripCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'trips',
          locale: SITE_LOCALE,
          depth: 1,
          limit,
          sort: '-featured',
          where: { _status: { equals: 'published' } },
          select: tripCardSelect,
        })
        return result.docs as unknown as TripCard[]
      },
      ['trips', String(limit)],
      { tags: [CACHE_TAG.trips], revalidate: REVALIDATE_SECONDS },
    ),
    defaultFeaturedTrips.slice(0, limit),
  )

export const getFeaturedTrips = (limit = 3): Promise<TripCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'trips',
          locale: SITE_LOCALE,
          depth: 1,
          limit,
          sort: '-featured',
          where: { and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }] },
          select: tripCardSelect,
        })
        return result.docs as unknown as TripCard[]
      },
      ['trips', 'featured', String(limit)],
      { tags: [CACHE_TAG.trips], revalidate: REVALIDATE_SECONDS },
    ),
    defaultFeaturedTrips.slice(0, limit),
  )

/**
 * The trips the homepage "Featured trips" section renders: featured ones, or — when nothing is
 * flagged — the newest published ones.
 *
 * Why the second read exists: a block whose list comes back empty renders `null`, so a featured-only
 * query silently deletes the section from the homepage the moment an editor publishes trips without
 * ticking the "Featured" checkbox (and `safeQuery`'s fallback list cannot help, because a query that
 * succeeds with zero rows is not an error). Falling back to published trips keeps the section on the
 * page without inventing content; if the site has no published trip at all the list stays empty and
 * the section correctly hides. Precedence lives in `src/lib/trip-selection.ts`, which `npm test`
 * covers.
 */
export const getHomepageTrips = (limit = 3): Promise<TripCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const publishedOnly: Where = { _status: { equals: 'published' } }
        const read = { collection: 'trips', locale: SITE_LOCALE, depth: 1, limit } as const

        // Both tiers are read at once instead of falling back after the first one comes back
        // empty: the extra query is parallel, so a cache miss costs no more latency, and the
        // fallback is part of the contract rather than an error path.
        const [featured, latest] = await Promise.all([
          payload.find({
            ...read,
            sort: '-featured',
            where: { and: [publishedOnly, { featured: { equals: true } }] },
            select: tripCardSelect,
          }),
          payload.find({
            ...read,
            sort: '-createdAt',
            where: publishedOnly,
            select: tripCardSelect,
          }),
        ])

        return pickAutomaticTrips(
          featured.docs as unknown as TripCard[],
          latest.docs as unknown as TripCard[],
        )
      },
      ['trips', 'homepage', String(limit)],
      { tags: [CACHE_TAG.trips], revalidate: REVALIDATE_SECONDS },
    ),
    defaultFeaturedTrips.slice(0, limit),
  )

export const getTrip = (slug: string, includeDraft = false): Promise<Trip | null> =>
  safeQuery(
    includeDraft
      ? () => findDocumentBySlug<Trip>('trips', slug, 2, true)
      : unstable_cache(() => findDocumentBySlug<Trip>('trips', slug, 2, false), ['trip', slug], {
          tags: [CACHE_TAG.trips, CACHE_TAG.trip(slug)],
          revalidate: REVALIDATE_SECONDS,
        }),
    null,
  )

/** Related trips: explicit picks first, otherwise other trips in the same destination. */
export const getRelatedTrips = (trip: Trip, limit = 3): Promise<TripCard[]> =>
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
            locale: SITE_LOCALE,
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
          locale: SITE_LOCALE,
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
      ['trips', 'related', String(trip.id)],
      { tags: [CACHE_TAG.trips], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/** Every published slug — feeds generateStaticParams(). */
/** Every published trip slug — feeds generateStaticParams(). */
export const getAllTripSlugs = (): Promise<string[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const response = await payload.find({
          collection: 'trips',
          locale: SITE_LOCALE,
          depth: 0,
          limit: 1000,
          select: { slug: true },
          where: { _status: { equals: 'published' } },
        })

        return response.docs
          .map((doc) => (doc as { slug?: string | null }).slug)
          .filter((slug): slug is string => Boolean(slug))
      },
      ['trip-slugs'],
      { tags: [CACHE_TAG.trips], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/** Lightweight list used to populate the inquiry form's "trip of interest" dropdown. */
export const getTripOptions = (): Promise<{ id: number; title: string; slug: string }[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'trips',
          locale: SITE_LOCALE,
          depth: 0,
          limit: 200,
          sort: 'title',
          select: { title: true, slug: true },
          where: { _status: { equals: 'published' } },
        })
        return result.docs as unknown as { id: number; title: string; slug: string }[]
      },
      ['trip-options'],
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

export const getDestinations = (limit = 100): Promise<DestinationCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'destinations',
          locale: SITE_LOCALE,
          depth: 1,
          limit,
          sort: '-featured',
          where: { _status: { equals: 'published' } },
          select: destinationCardSelect,
        })
        return result.docs as unknown as DestinationCard[]
      },
      ['destinations'],
      { tags: [CACHE_TAG.destinations], revalidate: REVALIDATE_SECONDS },
    ),
    defaultFeaturedDestinations.slice(0, limit),
  )

/**
 * Destinations for the homepage slider.
 *
 * Every published destination goes in, featured ones first and then alphabetically — so the
 * slider always has something to slide to, even when only a couple of regions are flagged as
 * featured. `limit` caps the size of the track; three cards are visible at a time.
 */
export const getDestinationSlider = (limit = 6): Promise<DestinationCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'destinations',
          locale: SITE_LOCALE,
          depth: 1,
          limit,
          sort: ['-featured', 'name'],
          where: { _status: { equals: 'published' } },
          select: destinationCardSelect,
        })
        return result.docs as unknown as DestinationCard[]
      },
      ['destinations', 'slider', String(limit)],
      { tags: [CACHE_TAG.destinations], revalidate: REVALIDATE_SECONDS },
    ),
    defaultFeaturedDestinations.slice(0, limit),
  )

export const getFeaturedDestinations = (limit = 3): Promise<DestinationCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'destinations',
          locale: SITE_LOCALE,
          depth: 1,
          limit,
          sort: '-featured',
          where: { and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }] },
          select: destinationCardSelect,
        })
        return result.docs as unknown as DestinationCard[]
      },
      ['destinations', 'featured', String(limit)],
      { tags: [CACHE_TAG.destinations], revalidate: REVALIDATE_SECONDS },
    ),
    defaultFeaturedDestinations.slice(0, limit),
  )

export const getDestination = (slug: string, includeDraft = false): Promise<Destination | null> =>
  safeQuery(
    includeDraft
      ? async () => {
          const payload = await getPayloadClient()
          const result = await payload.find({
            collection: 'destinations',
            locale: SITE_LOCALE,
            depth: 1,
            limit: 1,
            draft: true,
            overrideAccess: true,
            joins: { trips: { limit: 50, sort: '-featured' } },
            where: { slug: { equals: slug } },
          })
          return (result.docs[0] as Destination | undefined) ?? null
        }
      : unstable_cache(
          async () => {
            const payload = await getPayloadClient()
            const result = await payload.find({
              collection: 'destinations',
              locale: SITE_LOCALE,
              depth: 1,
              limit: 1,
              // `joins` resolves the `trips` join field in the same round trip as the document,
              // so the destination page needs exactly ONE database query.
              joins: { trips: { limit: 50, sort: '-featured' } },
              where: { and: [{ _status: { equals: 'published' } }, { slug: { equals: slug } }] },
            })
            return (result.docs[0] as Destination | undefined) ?? null
          },
          ['destination', slug],
          {
            tags: [CACHE_TAG.destinations, CACHE_TAG.destination(slug), CACHE_TAG.trips],
            revalidate: REVALIDATE_SECONDS,
          },
        ),
    null,
  )

/** Every published destination slug — feeds generateStaticParams(). */
export const getAllDestinationSlugs = (): Promise<string[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const response = await payload.find({
          collection: 'destinations',
          locale: SITE_LOCALE,
          depth: 0,
          limit: 1000,
          select: { slug: true },
          where: { _status: { equals: 'published' } },
        })

        return response.docs
          .map((doc) => (doc as { slug?: string | null }).slug)
          .filter((slug): slug is string => Boolean(slug))
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

export const getPosts = (limit = 100): Promise<PostCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'blog',
          locale: SITE_LOCALE,
          depth: 1,
          limit,
          sort: '-publishedAt',
          where: { _status: { equals: 'published' } },
          select: postCardSelect,
        })
        return result.docs as unknown as PostCard[]
      },
      ['posts'],
      { tags: [CACHE_TAG.posts], revalidate: REVALIDATE_SECONDS },
    ),
    defaultPosts.slice(0, limit),
  )

export const getFeaturedPosts = (limit = 3): Promise<PostCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'blog',
          locale: SITE_LOCALE,
          depth: 1,
          limit,
          sort: '-publishedAt',
          where: { and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }] },
          select: postCardSelect,
        })
        return result.docs as unknown as PostCard[]
      },
      ['posts', 'featured', String(limit)],
      { tags: [CACHE_TAG.posts], revalidate: REVALIDATE_SECONDS },
    ),
    defaultPosts.slice(0, limit),
  )

export const getPost = (slug: string, includeDraft = false): Promise<Blog | null> =>
  safeQuery(
    includeDraft
      ? () => findDocumentBySlug<Blog>('blog', slug, 2, true)
      : unstable_cache(() => findDocumentBySlug<Blog>('blog', slug, 2, false), ['post', slug], {
          tags: [CACHE_TAG.posts, CACHE_TAG.post(slug)],
          revalidate: REVALIDATE_SECONDS,
        }),
    null,
  )

export const getRelatedPosts = (post: Blog, limit = 3): Promise<PostCard[]> =>
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
            locale: SITE_LOCALE,
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
          locale: SITE_LOCALE,
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
      ['posts', 'related', String(post.id)],
      { tags: [CACHE_TAG.posts], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/** Every published post slug — feeds generateStaticParams(). */
export const getAllPostSlugs = (): Promise<string[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const response = await payload.find({
          collection: 'blog',
          locale: SITE_LOCALE,
          depth: 0,
          limit: 1000,
          select: { slug: true },
          where: { _status: { equals: 'published' } },
        })

        return response.docs
          .map((doc) => (doc as { slug?: string | null }).slug)
          .filter((slug): slug is string => Boolean(slug))
      },
      ['post-slugs'],
      { tags: [CACHE_TAG.posts], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/* -------------------------------------------------------------------------- */
/* Flexible pages                                                              */
/* -------------------------------------------------------------------------- */

export const getPage = (slug: string, includeDraft = false): Promise<Page | null> =>
  safeQuery(
    includeDraft
      ? () => findDocumentBySlug<Page>('pages', slug, 2, true)
      : unstable_cache(() => findDocumentBySlug<Page>('pages', slug, 2, false), ['page', slug], {
          tags: [CACHE_TAG.pages, CACHE_TAG.page(slug)],
          revalidate: REVALIDATE_SECONDS,
        }),
    null,
  )

/** Slugs of every published page except the homepage (which lives at /). */
/** Slugs of every published page except the homepage (which lives at /). */
export const getAllPageSlugs = (): Promise<string[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const response = await payload.find({
          collection: 'pages',
          locale: SITE_LOCALE,
          depth: 0,
          limit: 1000,
          select: { slug: true },
          where: { _status: { equals: 'published' } },
        })

        return response.docs
          .map((doc) => (doc as { slug?: string | null }).slug)
          .filter((slug): slug is string => Boolean(slug))
          .filter((slug): slug is string => slug !== 'home')
      },
      ['page-slugs'],
      { tags: [CACHE_TAG.pages], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/* -------------------------------------------------------------------------- */
/* Globals                                                                     */
/* -------------------------------------------------------------------------- */

export const getHeader = (): Promise<Header> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        return payload.findGlobal({ slug: 'header', locale: SITE_LOCALE, depth: 2 })
      },
      ['global-header'],
      { tags: [CACHE_TAG.header], revalidate: REVALIDATE_SECONDS },
    ),
    defaultHeader,
  )

export const getFooter = (): Promise<Footer> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        return payload.findGlobal({ slug: 'footer', locale: SITE_LOCALE, depth: 2 })
      },
      ['global-footer'],
      { tags: [CACHE_TAG.footer], revalidate: REVALIDATE_SECONDS },
    ),
    defaultFooter,
  )

export const getSettings = async (): Promise<Setting> => {
  const settings = await safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        return payload.findGlobal({ slug: 'settings', locale: SITE_LOCALE, depth: 1 })
      },
      ['global-settings'],
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
