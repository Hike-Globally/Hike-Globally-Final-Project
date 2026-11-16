/**
 * The card's details for a page **on this site**, read from the CMS instead of the network.
 *
 * A trip is illustrated by its hero image and a post by its featured image — that is the picture
 * the card should show. Scraping our own page for it worked in principle (the pages do publish it
 * as `og:image`), but it made the card depend on the site successfully fetching itself: whenever
 * that self-request was slow, blocked or answered before the page was deployed, the scrape came
 * back empty, the card fell through to the site icon, and the result was cached for an hour. The
 * document itself cannot fail that way, and answering from the CMS means the card costs no request
 * at all.
 *
 * Only the document's own fields are used, and the **featured image comes first** — a trip's hero
 * image, a post's featured image, a destination's hero image — because that is the picture the
 * document is illustrated with. An editor's sharing image from the SEO group is the fallback for a
 * document that has none.
 *
 * The data layer is imported lazily so this module's pure helpers can be tested without booting
 * Payload; `lookupInternalLinkPreview` is the only part that touches the database.
 */

import type { Blog, Destination, Media, Trip } from '@/payload-types'

import type { InternalLinkPreview } from './link-preview'
import { imageUrl } from './seo'
import { resolveSiteUrl } from './site-url'

export type InternalPreviewKind = 'trips' | 'blog' | 'destinations'

export type InternalPreviewTarget = { kind: InternalPreviewKind; slug: string }

/** The routes whose detail page is a CMS document with a featured image of its own. */
const ROUTES: Record<string, InternalPreviewKind> = {
  trips: 'trips',
  blog: 'blog',
  destinations: 'destinations',
}

const trimText = (value: string | null | undefined): string | null => {
  const text = value?.trim()
  return text ? text : null
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).host.replace(/^www\./i, '').toLowerCase()
  } catch {
    return ''
  }
}

/**
 * `/trips/everest-base-camp` → `{ kind: 'trips', slug: 'everest-base-camp' }`.
 *
 * Exactly one route segment and one slug: `/trips` is a listing, `/trips/x/brochure` is a file,
 * and neither is a document with a featured image.
 */
export function internalPreviewTarget(url: string): InternalPreviewTarget | null {
  let pathname: string
  try {
    pathname = new URL(url, 'https://site.invalid').pathname
  } catch {
    return null
  }

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length !== 2) return null

  const [route, rawSlug] = segments as [string, string]
  const kind = ROUTES[route.toLowerCase()]
  if (!kind) return null

  let slug = rawSlug
  try {
    slug = decodeURIComponent(rawSlug)
  } catch {
    // A stray `%` is literal text, not an escape.
  }

  return slug ? { kind, slug } : null
}

/** A trip: hero image, title, summary. */
export function previewFromTrip(trip: Trip): InternalLinkPreview {
  return {
    title: trimText(trip.title),
    description: trimText(trip.summary),
    ...cardImages(
      trip.heroImage,
      trip.meta?.image,
      ...(trip.gallery ?? []).map((row) => row.image),
    ),
  }
}

/** A post: featured image, title, excerpt. */
export function previewFromPost(post: Blog): InternalLinkPreview {
  return {
    title: trimText(post.title),
    description: trimText(post.excerpt),
    ...cardImages(post.featuredImage, post.meta?.image),
  }
}

/** A destination: hero image, name, tagline. */
export function previewFromDestination(destination: Destination): InternalLinkPreview {
  return {
    title: trimText(destination.name),
    description: trimText(destination.tagline),
    ...cardImages(
      destination.heroImage,
      destination.meta?.image,
      ...(destination.gallery ?? []).map((row) => row.image),
    ),
  }
}

/** Featured image first, then sharing and gallery images if the first one fails to load. */
function cardImages(...media: (number | Media | null | undefined)[]): {
  image: string | null
  images: string[]
} {
  const images = [
    ...new Set(media.map((item) => imageUrl(item)).filter((url): url is string => Boolean(url))),
  ].slice(0, 6)
  return { image: images[0] ?? null, images: images.slice(1) }
}

/**
 * The card for a page on this site, or `null` when the link is not one of our detail pages, points
 * at another site, or names a document that does not exist (or is not published).
 *
 * Never throws: a card must render, so a database problem falls back to reading the page over the
 * network rather than failing the section.
 */
export async function lookupInternalLinkPreview(url: string): Promise<InternalLinkPreview | null> {
  const siteHost = hostOf(resolveSiteUrl())
  if (!siteHost || hostOf(url) !== siteHost) return null

  const target = internalPreviewTarget(url)
  if (!target) return null

  try {
    const data = await import('./data')

    if (target.kind === 'trips') {
      const trip = await data.getTrip(target.slug)
      return trip ? previewFromTrip(trip) : null
    }

    if (target.kind === 'blog') {
      const post = await data.getPost(target.slug)
      return post ? previewFromPost(post) : null
    }

    const destination = await data.getDestination(target.slug)
    return destination ? previewFromDestination(destination) : null
  } catch {
    return null
  }
}
