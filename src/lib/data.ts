import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import type { TypedLocale, Where } from 'payload'

import { isIndexableAuthor } from '@/lib/author-profile'
import { CACHE_TAG, REVALIDATE_SECONDS } from '@/lib/cache-tags'
import { defaultLocale, sitePath } from '@/i18n/config'
import { isIndexableDestination } from '@/lib/destination-indexing'
import {
  buildLinkTargets,
  compileLinkIndex,
  InternalLinker,
  type InternalLinkCollection,
  type InternalLinkConfig,
  type InternalLinkSelf,
} from '@/lib/internal-links'
import type {
  Blog,
  Destination,
  Footer,
  Header,
  Media,
  News,
  Page,
  Setting,
  Trip,
  User,
} from '@/payload-types'
import type { LlmsTxtDocument, LlmsTxtSources } from './llms-txt'
import { getPayloadClient, isDatabaseConfigured } from './payload'
import { isReservedPageSlug } from './site-routes'
import { EMPTY_SITEMAP_SOURCES, type SitemapSources } from './sitemap'
import { readSitemapDocuments } from './sitemap-records'
import { readRssPosts, type RssPost } from './rss'
import {
  PAGE_SIZE,
  collectPages,
  readPublishedSlugs,
  tripConditions,
  tripSorts,
  type Archive,
  type CatalogPage,
  type TripFilters,
} from './catalog'

import type { PlaceCategoryValue } from './place-categories'
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

type PreviewableCollection = 'blog' | 'destinations' | 'pages' | 'trips' | 'news'

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
    placeCategories: ['base-camps', 'mountain-peaks', 'mountain-passes', 'temples'],
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
    placeCategories: ['lakes', 'waterfalls', 'base-camps', 'mountain-peaks'],
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
    placeCategories: ['canyons', 'caves', 'bike-tours', 'mountain-passes', 'waterfalls'],
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
  /* Newest-first, exactly like the `-publishedAt` sort `getPosts()` runs against
     the database — the fallback has to keep that promise, or every "latest
     stories" surface leads with the oldest post when no database is connected.

     The five entries mirror the five journal posts the seed script creates
     (`npm run seed`), so a site with no database connected shows the same
     journal a seeded one does — and the homepage board renders as designed: one
     lead plate plus three index rows. Only three photos ship in
     `public/images/admin`, so the covers cycle. */
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
    publishedAt: '2026-03-24T00:00:00.000Z',
    createdAt: '2026-03-24T00:00:00.000Z',
    featured: true,
    placeCategories: ['mountain-peaks', 'mountain-passes', 'bike-tours'],
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
      updatedAt: '2026-03-06T00:00:00.000Z',
      createdAt: '2026-03-06T00:00:00.000Z',
    } as Media,
    author: { id: 2, name: 'Pasang Lhamu' },
    categories: ['gear'],
    publishedAt: '2026-03-06T00:00:00.000Z',
    createdAt: '2026-03-06T00:00:00.000Z',
    featured: true,
    placeCategories: ['base-camps', 'mountain-peaks', 'caves'],
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
    placeCategories: ['base-camps', 'mountain-passes'],
  },
  {
    id: 4,
    title: 'Langtang, eight years on: a valley that rebuilt itself',
    slug: 'langtang-eight-years-on',
    excerpt:
      'In 2015 the avalanche buried the village. What happened next is the most encouraging story in Nepali tourism.',
    featuredImage: {
      id: 304,
      url: '/images/admin/himalaya-02.jpg',
      alt: 'Langtang valley below a snow-covered ridge',
      updatedAt: '2026-02-01T00:00:00.000Z',
      createdAt: '2026-02-01T00:00:00.000Z',
    } as Media,
    author: { id: 2, name: 'Pasang Lhamu' },
    categories: ['culture', 'trip-reports'],
    publishedAt: '2026-02-01T00:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    featured: false,
    placeCategories: ['lakes', 'waterfalls', 'temples', 'canyons'],
  },
  {
    id: 5,
    title: 'What a porter’s job actually involves',
    slug: 'what-a-porter-does',
    excerpt:
      'Twenty-five kilos, twelve days, one pair of sandals. The people who make trekking possible deserve more than a footnote.',
    featuredImage: {
      id: 305,
      url: '/images/admin/himalaya-01.jpg',
      alt: 'Trekking crew carrying loads up a mountain trail',
      updatedAt: '2026-01-15T00:00:00.000Z',
      createdAt: '2026-01-15T00:00:00.000Z',
    } as Media,
    author: { id: 1, name: 'Dawa Sherpa' },
    categories: ['culture', 'sustainability'],
    publishedAt: '2026-01-15T00:00:00.000Z',
    createdAt: '2026-01-15T00:00:00.000Z',
    featured: false,
    placeCategories: ['base-camps', 'mountain-passes', 'bike-tours'],
  },
]

export const defaultNews: NewsCard[] = [
  /* Newest-first, matching the `-publishedAt` sort `getNews()` runs against the database, so the
     database-less archive shows the same feed a seeded one does. The six entries mirror the six
     articles the seed script creates, and cycle the three shipped photos. */
  {
    id: 1,
    title: 'New permits required for Everest Base Camp trekkers from 2026',
    slug: 'new-permits-required-for-everest-base-camp-trekkers-from-2026',
    excerpt:
      'From 1 January 2026 every Khumbu trekker needs a registered permit and a licensed guide. Here is what changes, and what it costs.',
    featuredImage: {
      id: 401,
      url: '/images/admin/himalaya-01.jpg',
      alt: 'Trekkers on the Everest Base Camp trail with snowy peaks behind',
      updatedAt: '2026-01-05T00:00:00.000Z',
      createdAt: '2026-01-05T00:00:00.000Z',
    } as Media,
    author: { id: 1, name: 'Dawa Sherpa' },
    categories: ['world-news', 'travel'],
    publishedAt: '2026-01-05T00:00:00.000Z',
    createdAt: '2026-01-05T00:00:00.000Z',
    featured: true,
  },
  {
    id: 2,
    title: 'Nepal opens two new tea-house routes in the Annapurna region',
    slug: 'nepal-opens-two-new-tea-house-routes-in-the-annapurna-region',
    excerpt:
      'Two community-run trails now link traditional villages north of Pokhara, cutting crowding on the classic circuit.',
    featuredImage: {
      id: 402,
      url: '/images/admin/himalaya-02.jpg',
      alt: 'Tea-house lodges along a terraced hillside in the Annapurna region',
      updatedAt: '2026-01-04T00:00:00.000Z',
      createdAt: '2026-01-04T00:00:00.000Z',
    } as Media,
    author: { id: 2, name: 'Pasang Lhamu' },
    categories: ['travel', 'adventure'],
    publishedAt: '2026-01-04T00:00:00.000Z',
    createdAt: '2026-01-04T00:00:00.000Z',
    featured: false,
  },
  {
    id: 3,
    title: 'Study finds Himalayan glaciers losing ice faster than predicted',
    slug: 'study-finds-himalayan-glaciers-losing-ice-faster-than-predicted',
    excerpt:
      'A decade-long survey of 150 glaciers shows thinning rates 30% above the previous worst-case model.',
    featuredImage: {
      id: 403,
      url: '/images/admin/himalaya-03.jpg',
      alt: 'A receding glacier flowing between dark mountain walls',
      updatedAt: '2026-01-03T00:00:00.000Z',
      createdAt: '2026-01-03T00:00:00.000Z',
    } as Media,
    author: { id: 1, name: 'Dawa Sherpa' },
    categories: ['world-news', 'wildlife'],
    publishedAt: '2026-01-03T00:00:00.000Z',
    createdAt: '2026-01-03T00:00:00.000Z',
    featured: false,
  },
  {
    id: 4,
    title: 'How local guides are reshaping sustainable trekking',
    slug: 'how-local-guides-are-reshaping-sustainable-trekking',
    excerpt:
      'A new generation of Nepali-led operators is putting wages, waste and local benefit at the centre of every trip.',
    featuredImage: {
      id: 404,
      url: '/images/admin/himalaya-01.jpg',
      alt: 'A local guide leading trekkers across a high suspension bridge',
      updatedAt: '2026-01-02T00:00:00.000Z',
      createdAt: '2026-01-02T00:00:00.000Z',
    } as Media,
    author: { id: 2, name: 'Pasang Lhamu' },
    categories: ['sustainability', 'culture'],
    publishedAt: '2026-01-02T00:00:00.000Z',
    createdAt: '2026-01-02T00:00:00.000Z',
    featured: false,
  },
  {
    id: 5,
    title: 'New direct flight links Kathmandu with a second European hub',
    slug: 'new-direct-flight-links-kathmandu-with-a-second-european-hub',
    excerpt:
      'A thrice-weekly service cuts the typical Europe–Kathmandu journey by a full connection and several hours.',
    featuredImage: {
      id: 405,
      url: '/images/admin/himalaya-02.jpg',
      alt: 'An airliner on the tarmac at Tribhuvan International Airport',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as Media,
    author: { id: 1, name: 'Dawa Sherpa' },
    categories: ['industry', 'travel'],
    publishedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    featured: false,
  },
  {
    id: 6,
    title: 'Wildlife sightings up in Langtang after a quiet season',
    slug: 'wildlife-sightings-up-in-langtang-after-a-quiet-season',
    excerpt:
      'Guides report a marked rise in red panda and pheasant sightings along the upper Langtang trail this autumn.',
    featuredImage: {
      id: 406,
      url: '/images/admin/himalaya-03.jpg',
      alt: 'A red panda perched in a rhododendron branch',
      updatedAt: '2025-12-31T00:00:00.000Z',
      createdAt: '2025-12-31T00:00:00.000Z',
    } as Media,
    author: { id: 2, name: 'Pasang Lhamu' },
    categories: ['wildlife', 'adventure'],
    publishedAt: '2025-12-31T00:00:00.000Z',
    createdAt: '2025-12-31T00:00:00.000Z',
    featured: false,
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
  placeCategories?: PlaceCategoryValue[] | null
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
  /** Optional link override for cards that do not point to a destination page. */
  href?: string
}

export type PostCard = {
  id: number
  title: string
  slug: string
  excerpt: string
  content?: Blog['content']
  featuredImage: Media
  publishedAt?: string | null
  createdAt: string
  categories?: Blog['categories']
  placeCategories?: PlaceCategoryValue[] | null
  featured?: boolean | null
  author?: number | ({ id: number; name: string; avatar?: number | Media | null } | null)
}

/** A news article as the archive and cards render it — the news twin of {@link PostCard}. */
export type NewsCard = {
  id: number
  title: string
  slug: string
  excerpt: string
  content?: News['content']
  featuredImage: Media
  publishedAt?: string | null
  createdAt: string
  categories?: News['categories']
  featured?: boolean | null
  author?: number | ({ id: number; name: string; avatar?: number | Media | null } | null)
}

const publishedSlugsFor = (collection: Archive | 'pages', tag: string) =>
  cache(() =>
    safeQuery(
      unstable_cache(
        async () => readPublishedSlugs(await getPayloadClient(), collection),
        ['published-slugs-v2', collection],
        { tags: [tag], revalidate: REVALIDATE_SECONDS },
      ),
      [],
    ),
  )

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
  placeCategories: true,
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

export const getTrip = cache(async (slug: string, includeDraft = false): Promise<Trip | null> => {
  if (includeDraft) {
    return safeQuery(() => findDocumentBySlug<Trip>('trips', slug, 2, true), null)
  }

  // Fast-fail unknown/bot slugs against the single cached slug list so probes never boot Payload,
  // touch Postgres, or create one Data Cache entry per random URL.
  const publishedSlugs = await getAllTripSlugs()
  if (!publishedSlugs.includes(slug)) return null

  return safeQuery(
    unstable_cache(() => findDocumentBySlug<Trip>('trips', slug, 2, false), ['trip', slug], {
      tags: [CACHE_TAG.trips, CACHE_TAG.trip(slug)],
      revalidate: REVALIDATE_SECONDS,
    }),
    null,
  )
})

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

export const getAllTripSlugs = publishedSlugsFor('trips', CACHE_TAG.trips)

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

export const getDestination = cache(
  async (slug: string, includeDraft = false): Promise<Destination | null> => {
    if (includeDraft) {
      return safeQuery(async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'destinations',
          locale: SITE_LOCALE,
          depth: 1,
          limit: 1,
          draft: true,
          overrideAccess: true,
          where: { slug: { equals: slug } },
        })
        return (result.docs[0] as Destination | undefined) ?? null
      }, null)
    }

    const publishedSlugs = await getAllDestinationSlugs()
    if (!publishedSlugs.includes(slug)) return null

    return safeQuery(
      unstable_cache(
        async () => {
          const payload = await getPayloadClient()
          const result = await payload.find({
            collection: 'destinations',
            locale: SITE_LOCALE,
            depth: 1,
            limit: 1,
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
  },
)

/**
 * The trips a destination page lists at the bottom, in the card shape.
 *
 * This is deliberately a normal `trips` read rather than the destination's `trips` join field.
 * A join populates its documents at the join field's own `maxDepth` (1 by default), which leaves
 * every relationship *inside* the joined trip as a bare ID — `heroImage` came back as a number and
 * `PayloadImageFill` rendered nothing, so the cards had no photograph. Reading the trips directly
 * at depth 1 populates `heroImage` (and `destination`) exactly like `/trips` does.
 *
 * Preview (`includeDraft`) reads without the Data Cache so unpublished trips show up immediately;
 * the published read is cached under the same `trips` tag as every other trip listing.
 */
export const getDestinationTrips = (
  destinationId: number,
  { includeDraft = false, limit = 50 }: { includeDraft?: boolean; limit?: number } = {},
): Promise<TripCard[]> => {
  if (includeDraft) {
    return safeQuery(async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'trips',
        locale: SITE_LOCALE,
        depth: 1,
        limit,
        sort: '-featured',
        draft: true,
        overrideAccess: true,
        select: tripCardSelect,
        where: { destination: { equals: destinationId } },
      })
      return result.docs as unknown as TripCard[]
    }, [])
  }

  return safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'trips',
          locale: SITE_LOCALE,
          depth: 1,
          limit,
          sort: '-featured',
          select: tripCardSelect,
          where: {
            and: [
              { _status: { equals: 'published' } },
              { destination: { equals: destinationId } },
            ],
          },
        })
        return result.docs as unknown as TripCard[]
      },
      ['trips', 'destination', String(destinationId), String(limit)],
      { tags: [CACHE_TAG.trips, CACHE_TAG.destinations], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )
}

export const getAllDestinationSlugs = publishedSlugsFor('destinations', CACHE_TAG.destinations)

/* -------------------------------------------------------------------------- */
/* Blog                                                                        */
/* -------------------------------------------------------------------------- */

const postCardSelect = {
  content: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  publishedAt: true,
  createdAt: true,
  categories: true,
  placeCategories: true,
  featured: true,
  author: true,
} as const

const newsCardSelect = {
  content: true,
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

/** RSS must never publish the demo cards used by the database-less blog UI. */
export const getRssPosts = (): Promise<RssPost[]> =>
  safeQuery(
    unstable_cache(
      async () => readRssPosts(await getPayloadClient()),
      ['rss-posts'],
      { tags: [CACHE_TAG.posts, CACHE_TAG.news], revalidate: REVALIDATE_SECONDS },
    ),
    [],
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

export const getPost = cache(async (slug: string, includeDraft = false): Promise<Blog | null> => {
  if (includeDraft) {
    return safeQuery(() => findDocumentBySlug<Blog>('blog', slug, 2, true), null)
  }

  const publishedSlugs = await getAllPostSlugs()
  if (!publishedSlugs.includes(slug)) return null

  return safeQuery(
    unstable_cache(() => findDocumentBySlug<Blog>('blog', slug, 2, false), ['post', slug], {
      tags: [CACHE_TAG.posts, CACHE_TAG.post(slug)],
      revalidate: REVALIDATE_SECONDS,
    }),
    null,
  )
})

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

export const getAllPostSlugs = publishedSlugsFor('blog', CACHE_TAG.posts)

/* -------------------------------------------------------------------------- */
/* News                                                                        */
/* -------------------------------------------------------------------------- */

export const getNews = (limit = 100): Promise<NewsCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'news',
          locale: SITE_LOCALE,
          depth: 1,
          limit,
          sort: '-publishedAt',
          where: { _status: { equals: 'published' } },
          select: newsCardSelect,
        })
        return result.docs as unknown as NewsCard[]
      },
      ['news'],
      { tags: [CACHE_TAG.news], revalidate: REVALIDATE_SECONDS },
    ),
    defaultNews.slice(0, limit),
  )

export const getFeaturedNews = (limit = 3): Promise<NewsCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'news',
          locale: SITE_LOCALE,
          depth: 1,
          limit,
          sort: '-publishedAt',
          where: { and: [{ _status: { equals: 'published' } }, { featured: { equals: true } }] },
          select: newsCardSelect,
        })
        return result.docs as unknown as NewsCard[]
      },
      ['news', 'featured', String(limit)],
      { tags: [CACHE_TAG.news], revalidate: REVALIDATE_SECONDS },
    ),
    defaultNews.filter((post) => post.featured).slice(0, limit),
  )

export const getNewsArticle = cache(
  async (slug: string, includeDraft = false): Promise<News | null> => {
    if (includeDraft) {
      return safeQuery(() => findDocumentBySlug<News>('news', slug, 2, true), null)
    }

    const publishedSlugs = await getAllNewsSlugs()
    if (!publishedSlugs.includes(slug)) return null

    return safeQuery(
      unstable_cache(
        () => findDocumentBySlug<News>('news', slug, 2, false),
        ['news-article', slug],
        {
          tags: [CACHE_TAG.news, CACHE_TAG.new(slug)],
          revalidate: REVALIDATE_SECONDS,
        },
      ),
      null,
    )
  },
)

export const getRelatedNews = (post: News, limit = 3): Promise<NewsCard[]> =>
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
            collection: 'news',
            locale: SITE_LOCALE,
            depth: 1,
            limit,
            sort: '-publishedAt',
            where: { and: [{ _status: { equals: 'published' } }, { id: { in: manualIds } }] },
            select: newsCardSelect,
          })
          if (result.docs.length > 0) return result.docs as unknown as NewsCard[]
        }

        const result = await payload.find({
          collection: 'news',
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
          select: newsCardSelect,
        })
        return result.docs as unknown as NewsCard[]
      },
      ['news', 'related', String(post.id)],
      { tags: [CACHE_TAG.news], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

export const getAllNewsSlugs = publishedSlugsFor('news', CACHE_TAG.news)

/* -------------------------------------------------------------------------- */
/* Authors — public profile pages at /authors/<slug>                            */
/* -------------------------------------------------------------------------- */

/**
 * The only user fields that may ever leave the server.
 *
 * A `users` document also carries `email`, `hash`, `salt`, `sessions` and `resetPasswordToken`.
 * Payload's Local API defaults `overrideAccess` to true, so a careless `find({ collection: 'users' })`
 * would read all of them — and `unstable_cache` would then persist the password hash in the Data
 * Cache. Every author read below selects exactly this shape, which makes that impossible rather
 * than merely unlikely.
 */
const authorSelect = {
  name: true,
  slug: true,
  bio: true,
  avatar: true,
  jobTitle: true,
  education: true,
  credentials: { credential: true },
  website: true,
  socials: { platform: true, url: true },
  // The honest `<lastmod>` for the profile page — the account's own last edit.
  updatedAt: true,
} as const

/** A user's public profile, as the `/authors/<slug>` page renders it. */
export type AuthorProfileRecord = {
  id: number
  name: string
  slug: string
  bio?: string | null
  avatar?: number | Media | null
  jobTitle?: string | null
  education?: string | null
  credentials?: { credential: string }[] | null
  website?: string | null
  socials?:
    | {
        platform: 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'linkedin' | 'x'
        url: string
      }[]
    | null
  updatedAt?: string | null
}

/** Every profile page address, so `generateStaticParams` can prerender them all. */
export const getAllAuthorSlugs = (): Promise<string[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const rows = await collectPages((page) =>
          payload.find({
            collection: 'users',
            page,
            limit: 500,
            sort: 'id',
            depth: 0,
            select: { slug: true },
          }),
        )
        return rows.flatMap((row) => (row.slug ? [row.slug] : []))
      },
      ['author-slugs'],
      { tags: [CACHE_TAG.authors], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/** One author, by profile slug. Returns null when the account does not exist. */
export const getAuthorBySlug = cache(
  async (slug: string): Promise<AuthorProfileRecord | null> =>
    safeQuery(
      unstable_cache(
        async () => {
          const payload = await getPayloadClient()
          const result = await payload.find({
            collection: 'users',
            locale: SITE_LOCALE,
            depth: 1,
            limit: 1,
            where: { slug: { equals: slug } },
            select: authorSelect,
          })
          return (result.docs[0] as unknown as AuthorProfileRecord | undefined) ?? null
        },
        ['author', slug],
        { tags: [CACHE_TAG.authors, CACHE_TAG.author(slug)], revalidate: REVALIDATE_SECONDS },
      ),
      null,
    ),
)

/**
 * Every author, with the published-work counts the index and the sitemap both need.
 *
 * Paginated rather than a single `limit`, because an index that silently stops at the first 100
 * accounts would make every later author's page unreachable from the hub — an orphan nobody
 * notices until someone asks why their profile has no internal links.
 *
 * `hasWork` is computed here rather than per page because the sitemap needs it for every author in
 * one pass; the profile page recomputes the same rule from the lists it already renders.
 */
export type AuthorIndexEntry = AuthorProfileRecord & { postCount: number; tripCount: number }

/** An author's published field notes, newest first. */
export const getAuthorPosts = (authorId: number, limit = 12): Promise<PostCard[]> =>
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
          where: { and: [{ _status: { equals: 'published' } }, { author: { equals: authorId } }] },
          select: postCardSelect,
        })
        return result.docs as unknown as PostCard[]
      },
      ['author-posts', String(authorId), String(limit)],
      { tags: [CACHE_TAG.posts, CACHE_TAG.authors], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

/** An author's published trips — the ones they are credited as itinerary expert on. */
export const getAuthorTrips = (authorId: number, limit = 12): Promise<TripCard[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'trips',
          locale: SITE_LOCALE,
          depth: 1,
          limit,
          sort: '-updatedAt',
          where: { and: [{ _status: { equals: 'published' } }, { guide: { equals: authorId } }] },
          select: tripCardSelect,
        })
        return result.docs as unknown as TripCard[]
      },
      ['author-trips', String(authorId), String(limit)],
      { tags: [CACHE_TAG.trips, CACHE_TAG.authors], revalidate: REVALIDATE_SECONDS },
    ),
    [],
  )

export const getAuthorIndex = (): Promise<AuthorIndexEntry[]> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const [authors, posts, trips] = await Promise.all([
          collectPages((page) =>
            payload.find({
              collection: 'users',
              page,
              limit: 500,
              locale: SITE_LOCALE,
              depth: 1,
              sort: 'name',
              select: authorSelect,
            }),
          ),
          // `author` and `guide` are relationships, so counting per author is one grouped query
          // each — not one query per author.
          payload.find({
            collection: 'blog',
            limit: 1000,
            depth: 0,
            sort: '-publishedAt',
            where: { _status: { equals: 'published' } },
            select: { author: true },
          }),
          payload.find({
            collection: 'trips',
            limit: 1000,
            depth: 0,
            sort: '-updatedAt',
            where: { _status: { equals: 'published' } },
            select: { guide: true },
          }),
        ])

        const countByAuthor = (rows: Record<string, unknown>[], field: 'author' | 'guide') => {
          const counts = new Map<number, number>()
          for (const row of rows) {
            const value = row[field]
            const id = typeof value === 'number' ? value : (value as { id?: number } | null)?.id
            if (typeof id === 'number') counts.set(id, (counts.get(id) ?? 0) + 1)
          }
          return counts
        }

        const postCounts = countByAuthor(
          posts.docs as unknown as Record<string, unknown>[],
          'author',
        )
        const tripCounts = countByAuthor(
          trips.docs as unknown as Record<string, unknown>[],
          'guide',
        )

        return (authors as unknown as AuthorProfileRecord[]).map((author) => ({
          ...author,
          postCount: postCounts.get(author.id) ?? 0,
          tripCount: tripCounts.get(author.id) ?? 0,
        }))
      },
      ['author-index'],
      {
        tags: [CACHE_TAG.authors, CACHE_TAG.posts, CACHE_TAG.trips],
        revalidate: REVALIDATE_SECONDS,
      },
    ),
    [],
  )

export type PlaceCategoryContent = {
  trips: TripCard[]
  posts: PostCard[]
}

/**
 * Published trips and posts mapped to one Browse Places category.
 *
 * A tagged document can appear on several place pages, so a shared query with
 * the `placeCategories` has-many select is enough. The fallback keeps all nine
 * database-less category pages populated with the same demo content used by
 * the homepage and listings.
 */
export const getPlaceCategoryContent = (
  slug: PlaceCategoryValue,
  limit = 3,
): Promise<PlaceCategoryContent> =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const where: Where = {
          and: [{ _status: { equals: 'published' } }, { placeCategories: { in: [slug] } }],
        }
        const [trips, posts] = await Promise.all([
          payload.find({
            collection: 'trips',
            locale: SITE_LOCALE,
            depth: 1,
            limit,
            sort: '-featured',
            where,
            select: tripCardSelect,
          }),
          payload.find({
            collection: 'blog',
            locale: SITE_LOCALE,
            depth: 1,
            limit,
            sort: '-publishedAt',
            where,
            select: postCardSelect,
          }),
        ])

        return {
          trips: trips.docs as unknown as TripCard[],
          posts: posts.docs as unknown as PostCard[],
        }
      },
      ['place-category', slug, String(limit)],
      { tags: [CACHE_TAG.trips, CACHE_TAG.posts], revalidate: REVALIDATE_SECONDS },
    ),
    {
      trips: defaultFeaturedTrips
        .filter((trip) => trip.placeCategories?.includes(slug))
        .slice(0, limit),
      posts: defaultPosts.filter((post) => post.placeCategories?.includes(slug)).slice(0, limit),
    },
  )

/* -------------------------------------------------------------------------- */
/* Flexible pages                                                              */
/* -------------------------------------------------------------------------- */

export const getPage = cache(async (slug: string, includeDraft = false): Promise<Page | null> => {
  if (includeDraft) {
    return safeQuery(() => findDocumentBySlug<Page>('pages', slug, 2, true), null)
  }

  // `getPublishedPageSlugs()` holds every published page (including `home`) under one shared Data Cache
  // entry, so unknown/bot slugs on `/[slug]` fail fast with zero Postgres queries or cache bloat.
  const publishedSlugs = await getPublishedPageSlugs()
  if (!publishedSlugs.includes(slug)) return null

  return safeQuery(
    unstable_cache(() => findDocumentBySlug<Page>('pages', slug, 2, false), ['page', slug], {
      tags: [CACHE_TAG.pages, CACHE_TAG.page(slug)],
      revalidate: REVALIDATE_SECONDS,
    }),
    null,
  )
})

const getPublishedPageSlugs = publishedSlugsFor('pages', CACHE_TAG.pages)
export const getAllPageSlugs = async () =>
  (await getPublishedPageSlugs()).filter((slug) => !isReservedPageSlug(slug))

/* -------------------------------------------------------------------------- */
/* Sitemap                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Dedicated, paginated sitemap reads populate only visible hero/gallery uploads and their video
 * thumbnails. Slug readers stay depth-zero and cheap; no per-page HTTP requests are made.
 */
const readSitemapSources = unstable_cache(
  async (): Promise<SitemapSources> => {
    const payload = await getPayloadClient()
    const [trips, destinations, posts, news, pages, authors] = await Promise.all([
      readSitemapDocuments(payload, 'trips'),
      readSitemapDocuments(payload, 'destinations'),
      readSitemapDocuments(payload, 'blog'),
      readSitemapDocuments(payload, 'news'),
      readSitemapDocuments(payload, 'pages'),
      getAuthorIndex(),
    ])
    return {
      trips,
      destinations,
      posts,
      news,
      pages,
      // A bare account has no landing page worth crawling; `published()` drops it below. The
      // profile page reaches the same verdict for its own robots meta, so the two never disagree.
      authors: authors.map((author) => ({
        slug: author.slug,
        updatedAt: author.updatedAt,
        noIndex: !isIndexableAuthor(author, {
          posts: author.postCount,
          trips: author.tripCount,
        }),
      })),
    }
  },
  ['sitemap-with-media-v3'],
  {
    tags: [
      CACHE_TAG.trips,
      CACHE_TAG.destinations,
      CACHE_TAG.posts,
      CACHE_TAG.news,
      CACHE_TAG.pages,
      CACHE_TAG.authors,
    ],
    revalidate: REVALIDATE_SECONDS,
  },
)

export const getSitemapSources = (): Promise<SitemapSources> =>
  safeQuery(readSitemapSources, EMPTY_SITEMAP_SOURCES)

/* -------------------------------------------------------------------------- */
/* Navigation chart (the /sitemap index)                                        */
/* -------------------------------------------------------------------------- */

/** One node record as the /sitemap visual architecture index lists it. */
export type ChartNodeRecord = {
  title: string
  slug: string
  summary: string | null
  meta?: string | null
  updatedAt?: string | null
}

/** One CMS landing page as the navigation chart lists it. */
export type ChartPage = ChartNodeRecord

/** Everything the /sitemap page prints, in one cached read. */
export type ChartSources = {
  trips: number
  destinations: number
  posts: number
  news: number
  /** Published trips (excluding noindex). */
  tripNodes: ChartNodeRecord[]
  /** Published destinations (excluding noindex). */
  destinationNodes: ChartNodeRecord[]
  /** Published blog posts (excluding noindex). */
  postNodes: ChartNodeRecord[]
  /** Published news articles (excluding noindex). */
  newsNodes: ChartNodeRecord[]
  /** Published CMS pages, minus slugs a dedicated route owns. */
  pages: ChartPage[]
  /** Indexable author profiles (accounts with bio or published work). */
  authorNodes: ChartNodeRecord[]
  /** Tagged journeys per Browse Places category, by category value. */
  placeCounts: Record<string, number>
  /** ISO date of the most recently modified indexed document, if available. */
  lastSyncedAt: string | null
}

/**
 * The one cached reader behind the /sitemap chart page: per-collection counts, every indexable
 * document across trips, destinations, journal posts, CMS landing pages and authors, plus the
 * per-landscape tag counts. Kept separate from the full sitemap reader (`readSitemapSources` above)
 * because that one carries gallery media for the XML file and this one needs only slim rows.
 */
const readChartSources = unstable_cache(
  async (): Promise<ChartSources> => {
    const payload = await getPayloadClient()
    const [trips, destinations, posts, news, pages, authors] = await Promise.all([
      collectPages((page) =>
        payload.find({
          collection: 'trips',
          locale: SITE_LOCALE,
          depth: 0,
          limit: 500,
          sort: '-featured',
          page,
          select: {
            title: true,
            slug: true,
            summary: true,
            durationDays: true,
            difficulty: true,
            placeCategories: true,
            destination: true,
            updatedAt: true,
            meta: { noIndex: true, description: true },
          },
          where: { _status: { equals: 'published' } },
        }),
      ),
      collectPages((page) =>
        payload.find({
          collection: 'destinations',
          locale: SITE_LOCALE,
          depth: 0,
          limit: 500,
          sort: 'name',
          page,
          select: {
            id: true,
            name: true,
            slug: true,
            tagline: true,
            country: true,
            description: true,
            updatedAt: true,
            meta: { noIndex: true, description: true },
          },
          where: { _status: { equals: 'published' } },
        }),
      ),
      collectPages((page) =>
        payload.find({
          collection: 'blog',
          locale: SITE_LOCALE,
          depth: 0,
          limit: 500,
          sort: '-publishedAt',
          page,
          select: {
            title: true,
            slug: true,
            excerpt: true,
            categories: true,
            placeCategories: true,
            updatedAt: true,
            meta: { noIndex: true, description: true },
          },
          where: { _status: { equals: 'published' } },
        }),
      ),
      collectPages((page) =>
        payload.find({
          collection: 'news',
          locale: SITE_LOCALE,
          depth: 0,
          limit: 500,
          sort: '-publishedAt',
          page,
          select: {
            title: true,
            slug: true,
            excerpt: true,
            categories: true,
            updatedAt: true,
            meta: { noIndex: true, description: true },
          },
          where: { _status: { equals: 'published' } },
        }),
      ),
      collectPages((page) =>
        payload.find({
          collection: 'pages',
          locale: SITE_LOCALE,
          depth: 0,
          limit: 500,
          sort: 'id',
          page,
          select: {
            title: true,
            slug: true,
            updatedAt: true,
            meta: { noIndex: true, description: true },
          },
          where: { _status: { equals: 'published' } },
        }),
      ),
      getAuthorIndex(),
    ])

    const placeCounts: Record<string, number> = {}
    const bump = (value: string | null | undefined) => {
      if (!value) return
      placeCounts[value] = (placeCounts[value] ?? 0) + 1
    }
    for (const trip of trips) {
      const categories = (trip as { placeCategories?: unknown }).placeCategories
      if (Array.isArray(categories)) categories.forEach((value) => bump(value as string))
    }
    for (const post of posts) {
      const categories = (post as { placeCategories?: unknown }).placeCategories
      if (Array.isArray(categories)) categories.forEach((value) => bump(value as string))
    }

    const timestamps: number[] = []
    const recordDate = (value?: string | null) => {
      if (!value) return
      const parsed = Date.parse(value)
      if (Number.isFinite(parsed)) timestamps.push(parsed)
    }

    const tripNodes: ChartNodeRecord[] = trips
      .map((trip): ChartNodeRecord | null => {
        const record = trip as {
          title?: string | null
          slug?: string | null
          summary?: string | null
          durationDays?: number | null
          difficulty?: string | null
          updatedAt?: string | null
          meta?: { noIndex?: boolean | null; description?: string | null } | null
        }
        if (!record.slug || record.meta?.noIndex) return null
        recordDate(record.updatedAt)
        const parts: string[] = []
        if (typeof record.durationDays === 'number' && record.durationDays > 0) {
          parts.push(`${record.durationDays}d`)
        }
        if (record.difficulty) parts.push(record.difficulty.replace(/-/g, ' '))
        return {
          title: record.title ?? record.slug,
          slug: record.slug,
          summary: record.summary ?? record.meta?.description ?? null,
          meta: parts.length ? parts.join(' · ') : null,
          updatedAt: record.updatedAt ?? null,
        }
      })
      .filter((item): item is ChartNodeRecord => item !== null)

    // Trips per destination id: the "is this continent a real hub?" input. Counted from the trip
    // rows this same read already fetched, so the HTML sitemap reaches the same verdict as the
    // page's robots meta and `/sitemap.xml` (see `src/lib/destination-indexing.ts`).
    const tripsPerDestination = new Map<number, number>()
    for (const trip of trips) {
      const destination = (trip as { destination?: unknown }).destination
      const id =
        typeof destination === 'object' && destination !== null
          ? (destination as { id?: unknown }).id
          : destination
      if (typeof id === 'number') {
        tripsPerDestination.set(id, (tripsPerDestination.get(id) ?? 0) + 1)
      }
    }

    const destinationNodes: ChartNodeRecord[] = destinations
      .map((dest): ChartNodeRecord | null => {
        const record = dest as {
          id?: number
          name?: string | null
          slug?: string | null
          tagline?: string | null
          country?: string | null
          description?: unknown
          updatedAt?: string | null
          meta?: { noIndex?: boolean | null; description?: string | null } | null
        }
        if (!record.slug) return null
        if (
          !isIndexableDestination({
            slug: record.slug,
            tripCount: typeof record.id === 'number' ? (tripsPerDestination.get(record.id) ?? 0) : 0,
            description: record.description,
            editorNoIndex: record.meta?.noIndex,
          })
        ) {
          return null
        }
        recordDate(record.updatedAt)
        return {
          title: record.name ?? record.slug,
          slug: record.slug,
          summary: record.tagline ?? record.meta?.description ?? null,
          meta: record.country ?? null,
          updatedAt: record.updatedAt ?? null,
        }
      })
      .filter((item): item is ChartNodeRecord => item !== null)

    const postNodes: ChartNodeRecord[] = posts
      .map((post): ChartNodeRecord | null => {
        const record = post as {
          title?: string | null
          slug?: string | null
          excerpt?: string | null
          categories?: string[] | null
          updatedAt?: string | null
          meta?: { noIndex?: boolean | null; description?: string | null } | null
        }
        if (!record.slug || record.meta?.noIndex) return null
        recordDate(record.updatedAt)
        const firstCategory = Array.isArray(record.categories) ? record.categories[0] : null
        return {
          title: record.title ?? record.slug,
          slug: record.slug,
          summary: record.excerpt ?? record.meta?.description ?? null,
          meta: firstCategory ? firstCategory.replace(/-/g, ' ') : null,
          updatedAt: record.updatedAt ?? null,
        }
      })
      .filter((item): item is ChartNodeRecord => item !== null)

    const newsNodes: ChartNodeRecord[] = news
      .map((article): ChartNodeRecord | null => {
        const record = article as {
          title?: string | null
          slug?: string | null
          excerpt?: string | null
          categories?: string[] | null
          updatedAt?: string | null
          meta?: { noIndex?: boolean | null; description?: string | null } | null
        }
        if (!record.slug || record.meta?.noIndex) return null
        recordDate(record.updatedAt)
        const firstCategory = Array.isArray(record.categories) ? record.categories[0] : null
        return {
          title: record.title ?? record.slug,
          slug: record.slug,
          summary: record.excerpt ?? record.meta?.description ?? null,
          meta: firstCategory ? firstCategory.replace(/-/g, ' ') : null,
          updatedAt: record.updatedAt ?? null,
        }
      })
      .filter((item): item is ChartNodeRecord => item !== null)

    const chartPages: ChartPage[] = pages
      .map((page): ChartPage | null => {
        const record = page as {
          title?: string | null
          slug?: string | null
          updatedAt?: string | null
          meta?: { noIndex?: boolean | null; description?: string | null } | null
        }
        if (!record.slug || record.meta?.noIndex) return null
        recordDate(record.updatedAt)
        if (isReservedPageSlug(record.slug)) return null
        return {
          title: record.title ?? record.slug,
          slug: record.slug,
          summary: record.meta?.description ?? null,
          meta: 'CMS Page',
          updatedAt: record.updatedAt ?? null,
        }
      })
      .filter((page): page is ChartPage => page !== null)

    const authorNodes: ChartNodeRecord[] = authors
      .filter((author) =>
        Boolean(author.slug) &&
        isIndexableAuthor(author, { posts: author.postCount, trips: author.tripCount }),
      )
      .map((author) => {
        recordDate(author.updatedAt)
        const total = author.postCount + author.tripCount
        return {
          title: author.name,
          slug: author.slug as string,
          summary: author.jobTitle ?? author.bio ?? null,
          meta: total > 0 ? `${total} filed` : 'Guide',
          updatedAt: author.updatedAt ?? null,
        }
      })

    return {
      trips: tripNodes.length,
      destinations: destinationNodes.length,
      posts: postNodes.length,
      news: newsNodes.length,
      tripNodes,
      destinationNodes,
      postNodes,
      newsNodes,
      pages: chartPages,
      authorNodes,
      placeCounts,
      lastSyncedAt: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null,
    }
  },
  ['sitemap-chart-sources-v4'],
  {
    tags: [
      CACHE_TAG.trips,
      CACHE_TAG.destinations,
      CACHE_TAG.posts,
      CACHE_TAG.news,
      CACHE_TAG.pages,
      CACHE_TAG.authors,
    ],
    revalidate: REVALIDATE_SECONDS,
  },
)

const buildFallbackChartSources = (): ChartSources => {
  const placeCounts: Record<string, number> = {}
  const bump = (value: string | null | undefined) => {
    if (!value) return
    placeCounts[value] = (placeCounts[value] ?? 0) + 1
  }
  for (const trip of defaultFeaturedTrips) {
    trip.placeCategories?.forEach(bump)
  }
  for (const post of defaultPosts) {
    post.placeCategories?.forEach(bump)
  }

  return {
    trips: defaultFeaturedTrips.length,
    destinations: defaultFeaturedDestinations.length,
    posts: defaultPosts.length,
    tripNodes: defaultFeaturedTrips.map((trip) => ({
      title: trip.title,
      slug: trip.slug,
      summary: trip.summary,
      meta: `${trip.durationDays}d · ${trip.difficulty.replace(/-/g, ' ')}`,
      updatedAt: null,
    })),
    destinationNodes: defaultFeaturedDestinations.map((dest) => ({
      title: dest.name,
      slug: dest.slug,
      summary: dest.tagline ?? null,
      meta: dest.country,
      updatedAt: null,
    })),
    postNodes: defaultPosts.map((post) => ({
      title: post.title,
      slug: post.slug,
      summary: post.excerpt,
      meta: post.categories?.[0]?.replace(/-/g, ' ') ?? null,
      updatedAt: null,
    })),
    news: defaultNews.length,
    newsNodes: defaultNews.map((article) => ({
      title: article.title,
      slug: article.slug,
      summary: article.excerpt,
      meta: article.categories?.[0]?.replace(/-/g, ' ') ?? null,
      updatedAt: null,
    })),
    pages: [],
    authorNodes: [],
    placeCounts,
    lastSyncedAt: null,
  }
}

export const getChartSources = (): Promise<ChartSources> =>
  safeQuery(readChartSources, buildFallbackChartSources())

/* -------------------------------------------------------------------------- */
/* llms.txt                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A `select`ed row as the five collections spell it: a trip has `title`/`summary`, a destination
 * `name`/`tagline`, a post or news article `excerpt`, and every collection carries `meta.noIndex`
 * plus the meta description an editor may have written.
 */
type LlmsTxtRecord = {
  title?: string | null
  name?: string | null
  slug?: string | null
  summary?: string | null
  tagline?: string | null
  excerpt?: string | null
  tripType?: string | null
  durationDays?: number | null
  difficulty?: string | null
  maxAltitude?: number | null
  priceFrom?: number | null
  priceCurrency?: string | null
  meta?: { noIndex?: boolean | null; description?: string | null } | null
}

/**
 * Reduces one row to the fields `/llms.txt` prints. The fallbacks are the point: each collection
 * names its one-line description differently, and a model reading the file should not care which
 * — a destination's tagline, a post's excerpt and a page's meta description all arrive as
 * `summary`.
 */
const toLlmsTxtDocument = (doc: unknown): LlmsTxtDocument => {
  const record = doc as LlmsTxtRecord

  return {
    title: record.title ?? record.name ?? null,
    slug: record.slug ?? null,
    summary: record.summary ?? record.tagline ?? record.excerpt ?? record.meta?.description ?? null,
    noIndex: record.meta?.noIndex ?? false,
    tripType: record.tripType ?? null,
    durationDays: record.durationDays ?? null,
    difficulty: record.difficulty ?? null,
    maxAltitude: record.maxAltitude ?? null,
    priceFrom: record.priceFrom ?? null,
    priceCurrency: record.priceCurrency ?? null,
  }
}

/**
 * Published trips, reduced to the facts `/llms.txt` prints on a trip line (duration, type,
 * difficulty, altitude, price) plus the summary.
 *
 * A separate reader from the sitemap's rather than a wider slug query: that one feeds
 * `generateStaticParams()` and is hit on every cold route, while this one is fetched when something
 * asks for `/llms.txt`. Keeping them apart means adding a field here cannot quietly make every
 * page's slug query heavier.
 */
const readLlmsTxtTrips = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const rows = await collectPages((page) =>
      payload.find({
        collection: 'trips',
        locale: SITE_LOCALE,
        depth: 0,
        limit: 500,
        sort: 'id',
        page,
        select: {
          title: true,
          slug: true,
          summary: true,
          tripType: true,
          durationDays: true,
          difficulty: true,
          maxAltitude: true,
          priceFrom: true,
          priceCurrency: true,
          meta: true,
        },
        where: { _status: { equals: 'published' } },
      }),
    )

    return rows.map(toLlmsTxtDocument)
  },
  ['llms-txt-trips'],
  { tags: [CACHE_TAG.trips], revalidate: REVALIDATE_SECONDS },
)

const readLlmsTxtDestinations = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const rows = await collectPages((page) =>
      payload.find({
        collection: 'destinations',
        locale: SITE_LOCALE,
        depth: 0,
        limit: 500,
        sort: 'id',
        page,
        select: { name: true, slug: true, tagline: true, meta: true },
        where: { _status: { equals: 'published' } },
      }),
    )

    return rows.map(toLlmsTxtDocument)
  },
  ['llms-txt-destinations'],
  { tags: [CACHE_TAG.destinations], revalidate: REVALIDATE_SECONDS },
)

const readLlmsTxtPosts = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const rows = await collectPages((page) =>
      payload.find({
        collection: 'blog',
        locale: SITE_LOCALE,
        depth: 0,
        limit: 500,
        sort: 'id',
        page,
        select: { title: true, slug: true, excerpt: true, meta: true },
        where: { _status: { equals: 'published' } },
      }),
    )

    return rows.map(toLlmsTxtDocument)
  },
  ['llms-txt-posts'],
  { tags: [CACHE_TAG.posts], revalidate: REVALIDATE_SECONDS },
)

const readLlmsTxtNews = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const rows = await collectPages((page) =>
      payload.find({
        collection: 'news',
        locale: SITE_LOCALE,
        depth: 0,
        limit: 500,
        sort: 'id',
        page,
        select: { title: true, slug: true, excerpt: true, meta: true },
        where: { _status: { equals: 'published' } },
      }),
    )

    return rows.map(toLlmsTxtDocument)
  },
  ['llms-txt-news'],
  { tags: [CACHE_TAG.news], revalidate: REVALIDATE_SECONDS },
)

const readLlmsTxtPages = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    const rows = await collectPages((page) =>
      payload.find({
        collection: 'pages',
        locale: SITE_LOCALE,
        depth: 0,
        limit: 500,
        sort: 'id',
        page,
        select: { title: true, slug: true, meta: true },
        where: { _status: { equals: 'published' } },
      }),
    )

    return rows.map(toLlmsTxtDocument)
  },
  ['llms-txt-pages'],
  { tags: [CACHE_TAG.pages], revalidate: REVALIDATE_SECONDS },
)

/**
 * Everything `/llms.txt` lists: each published trip, destination, post and page with the one line
 * that describes it, and its `noIndex` flag (a page told to stay out of the index must not be
 * advertised in this file either).
 *
 * Like the sitemap's reader, this degrades to an empty list on a database-less build, so the route
 * still answers with the static pages instead of failing the build.
 */
export const getLlmsTxtSources = async (): Promise<LlmsTxtSources> => {
  const [trips, destinations, posts, news, pages] = await Promise.all([
    safeQuery(readLlmsTxtTrips, []),
    safeQuery(readLlmsTxtDestinations, []),
    safeQuery(readLlmsTxtPosts, []),
    safeQuery(readLlmsTxtNews, []),
    safeQuery(readLlmsTxtPages, []),
  ])

  return { trips, destinations, posts, news, pages }
}

/* -------------------------------------------------------------------------- */
/* Internal linking                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The public URL of a document, spelled the way `resolveRichTextLink()` and the renderer's own
 * `docHref()` spell it — so an auto-link and a link an editor inserted by hand to the same
 * document are always the identical string.
 */
export const internalLinkHref = (
  collection: InternalLinkCollection,
  slug: string,
): string | null => {
  if (!slug) return null
  if (collection === 'pages') return sitePath(slug === 'home' ? '/' : `/${slug}`)
  return sitePath(`/${collection}/${slug}`)
}

/**
 * What the queries below pull per document: only what a phrase can be built from.
 *
 * The phrases are the ones an editor typed into **Keyword For Internal Linking**
 * (`internalLinkKeywords`); the title, the slug and the SEO `keywords` are no longer phrase
 * sources. `meta` comes along for its `noIndex` flag (a page told to stay out of the index must
 * not be linked to either). No rich text, no images, no itineraries — these rows stay tiny.
 */
const internalLinkSelect = {
  slug: true,
  internalLinkKeywords: true,
  meta: true,
} as const

type InternalLinkRecord = {
  collection: InternalLinkCollection
  id: number
  slug: string | null
  internalLinkKeywords: string[] | null
  href: string
}

/** Narrows a `select`ed document into the shape the link index consumes. */
const toInternalLinkRecord = (
  collection: InternalLinkCollection,
  doc: unknown,
): InternalLinkRecord | null => {
  const record = doc as {
    id?: number
    slug?: string | null
    internalLinkKeywords?: (string | null)[] | null
    meta?: { noIndex?: boolean | null } | null
  }

  const slug = typeof record.slug === 'string' ? record.slug.trim() : ''
  // Same exclusion as the sitemap: advertising a URL the page disavows, or one a static route
  // already owns, is a contradiction rather than a link.
  if (!slug || record.meta?.noIndex) return null
  if (collection === 'pages' && isReservedPageSlug(slug)) return null

  const href = internalLinkHref(collection, slug)
  if (!href || typeof record.id !== 'number') return null

  const internalLinkKeywords = Array.isArray(record.internalLinkKeywords)
    ? record.internalLinkKeywords.filter(
        (keyword): keyword is string => typeof keyword === 'string',
      )
    : null

  return {
    collection,
    id: record.id,
    slug,
    internalLinkKeywords,
    href,
  }
}

/**
 * Every document the site can link *to*, for automated internal keyword linking.
 *
 * Five queries in parallel, shaped like `getSitemapSources()` above it, and cached under one key
 * tagged with all five collections: publishing, renaming or unpublishing a trip purges the index
 * along with the pages that link to it, so a slug change cannot leave auto-links pointing at a URL
 * that no longer exists. `src/hooks/revalidate.ts` already fires those tags — nothing new to wire.
 */
const readInternalLinkTargets = unstable_cache(
  async () => {
    const payload = await getPayloadClient()

    const query = (collection: InternalLinkCollection) =>
      collectPages((page) =>
        payload.find({
          collection,
          locale: SITE_LOCALE,
          depth: 0,
          limit: 500,
          sort: 'id',
          page,
          select: internalLinkSelect,
          where: { _status: { equals: 'published' } },
        }),
      )

    const [trips, destinations, posts, news, pages] = await Promise.all([
      query('trips'),
      query('destinations'),
      query('blog'),
      query('news'),
      query('pages'),
    ])

    return [
      ...trips.map((doc) => toInternalLinkRecord('trips', doc)),
      ...destinations.map((doc) => toInternalLinkRecord('destinations', doc)),
      ...posts.map((doc) => toInternalLinkRecord('blog', doc)),
      ...news.map((doc) => toInternalLinkRecord('news', doc)),
      ...pages.map((doc) => toInternalLinkRecord('pages', doc)),
    ].filter((record): record is InternalLinkRecord => record !== null)
  },
  ['internal-link-targets'],
  {
    tags: [
      CACHE_TAG.trips,
      CACHE_TAG.destinations,
      CACHE_TAG.posts,
      CACHE_TAG.news,
      CACHE_TAG.pages,
    ],
    revalidate: REVALIDATE_SECONDS,
  },
)

const getInternalLinkTargets = cache((): Promise<InternalLinkRecord[]> =>
  safeQuery(readInternalLinkTargets, []),
)

/**
 * The linker for one page render.
 *
 * Returns an empty linker (never `null`, never a throw) when no database is configured or the
 * queries fail, so a build without Postgres renders the same HTML it always did and the feature
 * degrades to "off" rather than to an error page.
 *
 * `cache()`-wrapped on the `self` identity, so the four detail routes each compile one index per
 * request no matter how many rich text blocks they render.
 */
export const createInternalLinker = cache(
  async (
    self: InternalLinkSelf | null,
    overrides?: InternalLinkConfig,
  ): Promise<InternalLinker> => {
    const records = await getInternalLinkTargets()
    const targets = buildLinkTargets(records)
    const index = compileLinkIndex(targets, overrides)

    return new InternalLinker(index, self, overrides)
  },
)

/* -------------------------------------------------------------------------- */
/* Globals                                                                     */
/* -------------------------------------------------------------------------- */

const readHeader = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'header', locale: SITE_LOCALE, depth: 2 })
  },
  ['global-header'],
  { tags: [CACHE_TAG.header], revalidate: REVALIDATE_SECONDS },
)

export const getHeader = cache((): Promise<Header> => safeQuery(readHeader, defaultHeader))

const readFooter = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'footer', locale: SITE_LOCALE, depth: 2 })
  },
  ['global-footer'],
  { tags: [CACHE_TAG.footer], revalidate: REVALIDATE_SECONDS },
)

export const getFooter = cache((): Promise<Footer> => safeQuery(readFooter, defaultFooter))

const readSettings = unstable_cache(
  async () => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'settings', locale: SITE_LOCALE, depth: 1 })
  },
  ['global-settings'],
  { tags: [CACHE_TAG.settings], revalidate: REVALIDATE_SECONDS },
)

export const getSettings = cache(async (): Promise<Setting> => {
  const settings = await safeQuery(readSettings, defaultSettings)

  return {
    ...defaultSettings,
    ...settings,
    siteName: settings?.siteName || defaultSettings.siteName,
    email: settings?.email || defaultSettings.email,
  }
})

export type Author = Pick<User, 'id' | 'name'> & { avatar?: number | Media | null }

// Nav menus and homepage blocks intentionally request a bounded preview. Public archives
// instead read one deterministically ordered database page, with filters applied before LIMIT.
function archiveReader<T>(
  collection: Archive,
  tag: string,
  select:
    | typeof tripCardSelect
    | typeof destinationCardSelect
    | typeof postCardSelect
    | typeof newsCardSelect,
) {
  return unstable_cache(
    async (page: number, order: string, conditions: Where[]): Promise<CatalogPage<T>> => {
      const payload = await getPayloadClient()
      const { docs, totalPages, totalDocs } = await payload.find({
        collection,
        page,
        limit: PAGE_SIZE,
        depth: 1,
        locale: SITE_LOCALE,
        select,
        sort: [order, 'id'],
        where: { and: [{ _status: { equals: 'published' } }, ...conditions] },
      })
      return { docs: docs as unknown as T[], totalPages, totalDocs }
    },
    ['catalog-archive', collection],
    { tags: [tag], revalidate: REVALIDATE_SECONDS },
  )
}
const readTripsPage = archiveReader<TripCard>('trips', CACHE_TAG.trips, tripCardSelect)
const readDestinationsPage = archiveReader<DestinationCard>(
  'destinations',
  CACHE_TAG.destinations,
  destinationCardSelect,
)
const readPostsPage = archiveReader<PostCard>('blog', CACHE_TAG.posts, postCardSelect)
const readNewsPage = archiveReader<NewsCard>('news', CACHE_TAG.news, newsCardSelect)
function demoPage<T>(docs: T[], page: number): CatalogPage<T> {
  return {
    docs: docs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    totalDocs: docs.length,
    totalPages: Math.ceil(docs.length / PAGE_SIZE),
  }
}
export const getDestinationsPage = (page: number) =>
  safeQuery(
    () => readDestinationsPage(page, '-featured', []),
    demoPage(defaultFeaturedDestinations, page),
  )
export const getPostsPage = (page: number, category: string) =>
  safeQuery(
    () =>
      readPostsPage(
        page,
        '-publishedAt',
        category === 'all' ? [] : [{ categories: { in: [category] } }],
      ),
    demoPage(
      defaultPosts.filter(
        (post) => category === 'all' || post.categories?.some((c) => c === category),
      ),
      page,
    ),
  )
export const getNewsPage = (page: number, category: string) =>
  safeQuery(
    () =>
      readNewsPage(
        page,
        '-publishedAt',
        category === 'all' ? [] : [{ categories: { in: [category] } }],
      ),
    demoPage(
      defaultNews.filter(
        (post) => category === 'all' || post.categories?.some((c) => c === category),
      ),
      page,
    ),
  )
export const getTripsPage = (page: number, filters: TripFilters, destinationId?: number) => {
  const order = tripSorts[filters.sort]
  const demo = defaultFeaturedTrips.filter(
    (t) =>
      (filters.difficulty === 'all' || t.difficulty === filters.difficulty) &&
      (filters.season === 'all' || t.bestSeasons?.includes(filters.season)) &&
      (filters.type === 'all' || t.tripType === filters.type) &&
      (filters.destination === 'all' ||
        (typeof t.destination === 'object' && t.destination?.slug === filters.destination)),
  )
  const field = order.includes('price')
    ? 'priceFrom'
    : order.includes('duration')
      ? 'durationDays'
      : 'featured'
  demo.sort((a, b) => (Number(a[field]) - Number(b[field])) * (order.startsWith('-') ? -1 : 1))
  return safeQuery(
    () => readTripsPage(page, order, tripConditions(filters, destinationId)),
    demoPage(demo, page),
  )
}
export const getDestinationFilterOptions = () =>
  safeQuery(
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const rows = await collectPages((page) =>
          payload.find({
            collection: 'destinations',
            depth: 0,
            locale: SITE_LOCALE,
            select: { slug: true, name: true },
            sort: ['name', 'id'],
            page,
            limit: 500,
            where: { _status: { equals: 'published' } },
          }),
        )
        return rows.flatMap(({ id, name, slug }) => (slug ? [{ id, name, slug }] : []))
      },
      ['archive-destination-options'],
      { tags: [CACHE_TAG.destinations], revalidate: REVALIDATE_SECONDS },
    ),
    defaultFeaturedDestinations.map(({ id, name, slug }) => ({ id, name, slug })),
  )
