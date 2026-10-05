import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

import { CACHE_TAG, revalidationDisabled } from '../lib/cache-tags'
import { locales, type Locale } from '../i18n/config'

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
 *   2. `revalidatePath` — purges the rendered HTML of the affected routes.
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

/**
 * Reads the slug of every language for a document.
 *
 * A hook only sees the locale it was saved from, but a German editor saving a German trip must
 * also invalidate the English and French caches — otherwise /en/trips/x can keep serving stale
 * content even though the underlying document changed.
 */
const slugsByLocale = (doc: unknown): Partial<Record<Locale, string>> => {
  const result: Partial<Record<Locale, string>> = {}
  if (!doc || typeof doc !== 'object') return result

  const record = doc as Record<string, unknown>
  const currentSlug = typeof record.slug === 'string' ? record.slug : undefined

  for (const locale of locales) {
    const localized = record[locale]
    if (localized && typeof localized === 'object') {
      const slug = (localized as { slug?: unknown }).slug
      if (typeof slug === 'string' && slug.length > 0) {
        result[locale] = slug
        continue
      }
    }
    if (currentSlug) result[locale] = currentSlug
  }

  return result
}

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

  // Load every language so the right per-locale URLs get rebuilt.
  let fullDoc: unknown = doc
  try {
    fullDoc = await req.payload.findByID({
      id: doc.id,
      collection,
      locale: 'all',
      depth: 0,
      draft: true,
      overrideAccess: true,
      disableErrors: true,
    })
  } catch {
    fullDoc = doc
  }

  const slugs = slugsByLocale(fullDoc)
  const previousSlugs = slugsByLocale(previousDoc)

  for (const locale of locales) {
    // Pages have no listing route — their "index" is the homepage.
    paths.push(collection === 'pages' ? `/${locale}` : `/${locale}/${segment}`)

    const slug = slugs[locale]
    if (slug) {
      paths.push(
        collection === 'pages' && slug === 'home' ? `/${locale}` : `/${locale}/${segment}/${slug}`,
      )
      tags.push(documentTag(collection, slug))
    }

    // A renamed slug must purge the old URL too, or it keeps serving stale HTML.
    const previousSlug = previousSlugs[locale]
    if (previousSlug && previousSlug !== slug) {
      paths.push(`/${locale}/${segment}/${previousSlug}`)
      tags.push(documentTag(collection, previousSlug))
    }
  }

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
    await revalidateDocument({ ...config, doc, previousDoc, req })
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
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
 * Header / footer / settings appear on every page, so a change invalidates the whole
 * locale layout (`revalidatePath('/en', 'layout')`) instead of guessing which pages are touched.
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
      global === 'header' ? CACHE_TAG.header : global === 'footer' ? CACHE_TAG.footer : CACHE_TAG.settings

    if (!revalidationDisabled()) {
      try {
        for (const locale of locales) revalidatePath(`/${locale}`, 'layout')
        revalidateTag(tag, { expire: 0 })
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
    incoming?._status === 'published' || (data as { _status?: string } | undefined)?._status === 'published'

  if ((operation === 'create' || operation === 'update') && isPublished) {
    const existing = (data as { publishedAt?: string | null } | undefined)?.publishedAt
    if (!existing) {
      return { ...data, publishedAt: new Date().toISOString() }
    }
  }

  return data
}
