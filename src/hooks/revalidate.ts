import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

import { authorProfile } from '../lib/author-profile'
import { CACHE_TAG, revalidationDisabled } from '../lib/cache-tags'
import type { User } from '../payload-types'
import { LLMS_TXT_PATH } from '../lib/llms-txt'
import { PLACE_INDEX_PATH, placeCategoryPaths } from '../lib/place-categories'
import { RSS_FEED_PATH } from '../lib/rss'
import {
  shouldRevalidateAfterChange,
  shouldRevalidateAfterDelete,
  slugOf,
} from '../lib/revalidate-rules'

/**
 * ============================================================================
 * On-demand revalidation
 * ============================================================================
 *
 * When an editor saves a trip, a destination, a post or a page, the matching Next.js caches are
 * thrown away immediately — so the change is live on the site in the same second, without a
 * rebuild and without waiting for a time-based revalidation window.
 *
 * Two mechanisms are used together, deliberately:
 *   1. `revalidateTag` — purges the cached database reads (see `src/lib/data.ts`).
 *   2. `revalidatePath` — purges the rendered HTML of the affected routes, plus `/sitemap.xml`
 *      and `/llms.txt`, whose URL lists change whenever a slug is published, renamed or deleted.
 *
 * Hooks run inside Payload's route handlers (a Next.js request scope), so both are legal here.
 * During seeding and CLI work there is no request scope; `revalidationDisabled()` plus the
 * try/catch below make those runs safe.
 */

type RevalidateConfig = {
  collection: 'trips' | 'destinations' | 'blog' | 'pages'
  /** URL segment of the listing page, e.g. 'trips'. */
  segment: string
  /** Extra tags to invalidate (a trip change also affects destination pages and the homepage). */
  extraTags?: string[]
}

const collectionTag = (collection: RevalidateConfig['collection']): string =>
  collection === 'trips'
    ? CACHE_TAG.trips
    : collection === 'destinations'
      ? CACHE_TAG.destinations
      : collection === 'blog'
        ? CACHE_TAG.posts
        : CACHE_TAG.pages

const documentTag = (collection: RevalidateConfig['collection'], slug: string): string =>
  collection === 'trips'
    ? CACHE_TAG.trip(slug)
    : collection === 'destinations'
      ? CACHE_TAG.destination(slug)
      : collection === 'blog'
        ? CACHE_TAG.post(slug)
        : CACHE_TAG.page(slug)

const revalidateDocument = async ({
  collection,
  segment,
  extraTags = [],
  doc,
  previousDoc,
  req,
}: RevalidateConfig & {
  doc: { id: string | number }
  previousDoc?: unknown
  req: PayloadRequest
}) => {
  const tags: string[] = [collectionTag(collection), ...extraTags]
  const paths: string[] = []

  // Only hit the database when the hook payload lacks a slug (e.g. a narrow select/partial doc).
  let slug = slugOf(doc)
  if (!slug) {
    try {
      const fullDoc = await req.payload.findByID({
        id: doc.id,
        collection,
        depth: 0,
        draft: true,
        overrideAccess: true,
        disableErrors: true,
      })
      slug = slugOf(fullDoc)
    } catch {
      slug = undefined
    }
  }

  const previousSlug = slugOf(previousDoc)

  // Pages have no listing route — their "index" is the homepage.
  paths.push(collection === 'pages' ? '/' : `/${segment}`)

  if (slug) {
    paths.push(collection === 'pages' && slug === 'home' ? '/' : `/${segment}/${slug}`)
    tags.push(documentTag(collection, slug))
  }

  // A renamed slug must purge the old URL too, or it keeps serving stale HTML.
  if (previousSlug && previousSlug !== slug) {
    paths.push(`/${[segment, previousSlug].filter(Boolean).join('/')}`)
    tags.push(documentTag(collection, previousSlug))
  }

  // A trip or post can be mapped into any Browse Places category, so every
  // place page must rebuild when one of those documents changes. The list is
  // fixed and short (one index plus nine category pages).
  if (collection === 'trips' || collection === 'blog') {
    paths.push(PLACE_INDEX_PATH, ...placeCategoryPaths())
  }

  // `/sitemap.xml` and `/llms.txt` both list this document's slug and title, so a publish, rename
  // or delete has to rebuild them — otherwise a brand-new trip only appears when the route's
  // 1-hour window expires.
  paths.push('/sitemap.xml')
  paths.push(LLMS_TXT_PATH)
  if (collection === 'blog') paths.push(RSS_FEED_PATH)

  if (revalidationDisabled()) return

  try {
    for (const tag of new Set(tags)) revalidateTag(tag, { expire: 0 })
    for (const path of new Set(paths)) revalidatePath(path)
  } catch (error) {
    // No Next.js request scope (seeding, CLI) — nothing to invalidate.
    console.warn(`[revalidate] skipped — ${(error as Error).message}`)
  }
}

const createRevalidateHooks = (config: RevalidateConfig) => {
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (!shouldRevalidateAfterChange({ doc, previousDoc, req })) return doc
    await revalidateDocument({ ...config, doc, previousDoc, req })
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (!shouldRevalidateAfterDelete({ doc })) return doc
    await revalidateDocument({ ...config, doc, req })
    return doc
  }

  return { afterChange, afterDelete }
}

const tripHooks = createRevalidateHooks({
  collection: 'trips',
  segment: 'trips',
  extraTags: [CACHE_TAG.destinations, CACHE_TAG.pages],
})

const destinationHooks = createRevalidateHooks({
  collection: 'destinations',
  segment: 'destinations',
  extraTags: [CACHE_TAG.trips, CACHE_TAG.pages],
})

const postHooks = createRevalidateHooks({
  collection: 'blog',
  segment: 'blog',
  extraTags: [CACHE_TAG.pages],
})

const pageHooks = createRevalidateHooks({ collection: 'pages', segment: '' })

export const revalidateTrip = tripHooks.afterChange
export const revalidateTripDelete = tripHooks.afterDelete

export const revalidateDestination = destinationHooks.afterChange
export const revalidateDestinationDelete = destinationHooks.afterDelete

export const revalidatePost = postHooks.afterChange
export const revalidatePostDelete = postHooks.afterDelete

export const revalidatePage = pageHooks.afterChange
export const revalidatePageDelete = pageHooks.afterDelete

/**
 * Profiles are populated inside cached posts/trips; a User save must refresh those reads too.
 *
 * The author's own page is a separate matter: a bio edit changes `/authors/<slug>` and the
 * `/authors` index, while a *slug* edit moves the page entirely — so the old address has to be
 * purged as well, or it keeps serving the profile under a URL that no longer exists.
 */
const revalidateAuthorPages = (
  doc?: { slug?: string | null } | null,
  previousDoc?: { slug?: string | null } | null,
) => {
  if (revalidationDisabled()) return

  const slugs = [doc, previousDoc].flatMap((record) =>
    typeof record?.slug === 'string' && record.slug ? [record.slug] : [],
  )

  try {
    for (const tag of [
      CACHE_TAG.posts,
      CACHE_TAG.trips,
      CACHE_TAG.pages,
      CACHE_TAG.authors,
      ...slugs.map((slug) => CACHE_TAG.author(slug)),
    ]) {
      revalidateTag(tag, { expire: 0 })
    }

    revalidatePath('/', 'layout')
    for (const path of new Set(['/authors', ...slugs.map((slug) => `/authors/${slug}`)])) {
      revalidatePath(path)
    }
    // `/sitemap.xml` lists the profile page, so a new account has to appear there at once.
    revalidatePath('/sitemap.xml')
  } catch (error) {
    console.warn(`[revalidate] skipped — ${(error as Error).message}`)
  }
}

export const revalidateAuthor: CollectionAfterChangeHook<User> = ({ doc, previousDoc }) => {
  // Login/session/password changes must not invalidate the public site. `slug` is part of the
  // compared profile, so renaming a profile URL is caught here rather than silently serving the
  // page at its old address.
  if (JSON.stringify(authorProfile(doc)) !== JSON.stringify(authorProfile(previousDoc))) {
    revalidateAuthorPages(doc, previousDoc)
  }
  return doc
}

export const revalidateAuthorDelete: CollectionAfterDeleteHook<User> = ({ doc }) => {
  revalidateAuthorPages(doc)
  return doc
}

/**
 * Header / footer / settings appear on every page, so a change invalidates the whole root
 * layout (`revalidatePath('/', 'layout')`) instead of guessing which pages are touched.
 */
export const revalidateGlobal =
  (global: 'header' | 'footer' | 'settings'): GlobalAfterChangeHook =>
  // Payload calls an afterChange hook with ONE argument — the whole args object
  // ({ doc, previousDoc, req, global, context, … }), and whatever the hook returns REPLACES the
  // saved document. Destructuring here and returning only `doc` is therefore essential: returning
  // `args` would hand Payload's internal `req`/`payload`/`db` objects back as the "global", and the
  // REST handler would then fail to serialise them (circular structure) with a 500 on every save.
  ({ doc }) => {
    const tag =
      global === 'header'
        ? CACHE_TAG.header
        : global === 'footer'
          ? CACHE_TAG.footer
          : CACHE_TAG.settings

    if (!revalidationDisabled()) {
      try {
        revalidatePath('/', 'layout')
        revalidateTag(tag, { expire: 0 })
        if (global === 'settings') revalidatePath(RSS_FEED_PATH)
      } catch (error) {
        console.warn(`[revalidate] skipped — ${(error as Error).message}`)
      }
    }

    return doc
  }

/** Sets the publication date the first time a post is published, then never touches it again. */
export const populatePublishedAt: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  const incoming = req.data as { _status?: string } | undefined
  const isPublished =
    incoming?._status === 'published' ||
    (data as { _status?: string } | undefined)?._status === 'published'

  if ((operation === 'create' || operation === 'update') && isPublished) {
    const existing = (data as { publishedAt?: string | null } | undefined)?.publishedAt
    if (!existing) {
      return { ...data, publishedAt: new Date().toISOString() }
    }
  }

  return data
}

/** Upload metadata is populated inside cached pages and sitemap media records. */
const revalidateMediaPages = () => {
  if (revalidationDisabled()) return
  try {
    for (const tag of [CACHE_TAG.trips, CACHE_TAG.destinations, CACHE_TAG.posts, CACHE_TAG.pages]) {
      revalidateTag(tag, { expire: 0 })
    }
    revalidatePath('/', 'layout')
    revalidatePath('/sitemap.xml')
  } catch (error) {
    console.warn(`[revalidate] skipped — ${(error as Error).message}`)
  }
}

export const revalidateMedia: CollectionAfterChangeHook = ({ doc }) => {
  revalidateMediaPages()
  return doc
}

export const revalidateMediaDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateMediaPages()
  return doc
}
