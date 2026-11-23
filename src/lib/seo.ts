import { parsePage } from './catalog'
import type { Metadata } from 'next'

import { MAX_KEYWORDS } from '@/fields/keywords'
import { htmlLang, ogLocale } from '@/i18n/config'
import type { Blog, Destination, Media, Trip } from '@/payload-types'
import { authorPath, authorProfile, type PublicAuthor } from './author-profile'
import { parseCoordinates } from './coordinates'
import { lexicalToPlainText, truncate } from './format'
import { httpUrl } from './http-url'
import { resolveSiteUrl } from './site-url'

// Normalized so a bare `hikeglobally.com` (no scheme) can never reach `new URL()` and blow up the
// build. See src/lib/site-url.ts.
export const siteUrl = resolveSiteUrl()

/**
 * Prefixes the site origin onto any URL — media and API paths, which are served as-is and are not
 * subject to canonicalization. Page URLs go through `canonicalUrl()` below instead.
 */
export const absoluteUrl = (path: string): string =>
  path.startsWith('http') ? path : `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`

/* ==========================================================================
   Canonical URLs
   ==========================================================================
   One page = one URL. `canonicalPath()` normalizes a route into the exact
   pathname the site serves it at, and `canonicalUrl()` turns that into the
   absolute URL used by `<link rel="canonical">`, `og:url`, the sitemap and
   JSON-LD — so all four always agree, byte for byte.
   ========================================================================== */

/**
 * Percent-encodes one path segment.
 *
 * Route params arrive already decoded (`/blog/caf%C3%A9` → `café`), so encoding once here is what
 * puts the URL back into its wire form. A stray `%` that is not a valid escape is literal text:
 * `decodeURIComponent` throws on it, and `encodeURIComponent` then correctly writes it as `%25`.
 */
const encodeSegment = (segment: string): string => {
  let decoded = segment
  try {
    decoded = decodeURIComponent(segment)
  } catch {
    // Leave as-is — it will still be encoded below.
  }
  return encodeURIComponent(decoded)
}

/**
 * Normalizes any site path into the single pathname a page is served at:
 *
 * ```
 * 'trips'                → '/trips'          (leading slash added)
 * '/trips/'              → '/trips'          (trailing slash dropped)
 * '/trips//everest/'     → '/trips/everest'  (duplicate slashes collapsed)
 * '/trips?page=2&x=1'    → '/trips?page=2'   (only archive pagination is canonical)
 * '/trips/everest#day-3' → '/trips/everest'  (hash dropped)
 * '/blog/café'           → '/blog/caf%C3%A9' (encoded)
 * ''  |  '/'             → '/'
 * ```
 *
 * An absolute URL is reduced to its path: the canonical of a page on this site can only ever live
 * on this site's origin.
 */
export const canonicalPath = (path?: string | null): string => {
  const raw = String(path ?? '').trim()
  if (!raw) return '/'

  let pathname = raw
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw)
      pathname = url.pathname + url.search
    } catch {
      return '/'
    }
  }

  const segments = pathname
    .split(/[?#]/, 1)[0]
    .split('/')
    // `filter(Boolean)` drops the leading, trailing and duplicated empty segments at once.
    .filter(Boolean)
    .map(encodeSegment)

  const pathOnly = `/${segments.join('/')}`
  if (['/trips', '/destinations', '/blog'].includes(pathOnly)) {
    const search = pathname.split('#')[0].split('?')[1]
    const pages = new URLSearchParams(search).getAll('page')
    const page = pages.length === 1 ? parsePage(pages[0]) : null
    if (page && page > 1) return `${pathOnly}?page=${page}`
  }
  return pathOnly
}

/**
 * The absolute canonical URL of a page path — what crawlers must see in `<link rel="canonical">`.
 *
 * The homepage resolves to the bare origin (`https://hikeglobally.com`, no trailing slash) because
 * that is exactly what Next.js emits for it, so a page's canonical, its sitemap entry and its
 * `og:url` are never three spellings of the same URL.
 */
export const canonicalUrl = (path?: string | null): string => {
  const url = new URL(`${siteUrl}${canonicalPath(path)}`)
  return url.pathname === '/' ? url.origin : url.href
}

type MetaGroup = {
  title?: string | null
  description?: string | null
  image?: number | Media | null
  noIndex?: boolean | null
} | null

/* ==========================================================================
   Keywords
   ==========================================================================
   Trips and Blog documents carry a "Keywords" section (src/fields/keywords.ts):
   the phrases the page is targeting. They are published as
   `<meta name="keywords">`, as `article:tag` Open Graph tags on posts, and as
   `keywords` in the page's JSON-LD.

   Google has ignored the meta tag as a ranking signal for well over a decade,
   so this list is documentation as much as markup — it records the intent
   behind the page and keeps Bing, Yandex, internal search and the editor's own
   copy aligned. That is also why it is normalized hard below: a bloated or
   duplicated list is the one thing that makes the tag look like stuffing.
   ========================================================================== */

/**
 * Turns whatever an editor typed into the keyword list into a clean array.
 *
 * Handles the two ways the list arrives — Payload's chip input (`['everest base camp trek', …]`)
 * and a paste into any text field (`'everest trek, gokyo lakes\nkala patthar'`) — by splitting on
 * commas, semicolons and newlines, then trimming, dropping empties, de-duplicating
 * case-insensitively and capping the result. The cap is the same one the CMS field enforces, so a
 * value that arrives through the API cannot exceed it.
 */
export const normalizeKeywords = (
  keywords?: (string | null | undefined)[] | string | null,
): string[] => {
  const source = Array.isArray(keywords) ? keywords.join(',') : (keywords ?? '')

  const seen = new Set<string>()
  const result: string[] = []

  for (const part of source.split(/[,;\n\r]+/)) {
    const keyword = part.replace(/\s+/g, ' ').trim()
    if (!keyword) continue

    const key = keyword.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    result.push(keyword)
    if (result.length >= MAX_KEYWORDS) break
  }

  return result
}

/** Social previews use the original upload, not a cropped or compressed derivative. */
export const imageUrl = (image: number | Media | null | undefined): string | undefined => {
  if (!image || typeof image === 'number') return undefined
  const url = image.url
  if (!url) return undefined
  return absoluteUrl(url)
}

export const imageDimensions = (
  image: number | Media | null | undefined,
): { width: number; height: number } | undefined => {
  if (!image || typeof image === 'number') return undefined
  if (image.width && image.height) return { width: image.width, height: image.height }
  return undefined
}

/**
 * The absolute image URL for structured data.
 *
 * schema.org images must be full URLs — JSON-LD is not resolved against the page's origin by
 * Google's parsers, so a relative `/api/media/file/x.jpg` is dropped from the rich result (and
 * flagged by the Rich Results Test). This is the one place that turns a Media document into that
 * URL, so no page can hand a relative path to a `*JsonLd()` builder by accident.
 *
 * Use the original upload for image rich results too, without an artificial size limit.
 */
export const schemaImageUrl = (
  image: number | Media | string | null | undefined,
): string | undefined => {
  if (!image) return undefined
  if (typeof image === 'string') return image.startsWith('http') ? image : absoluteUrl(image)
  if (typeof image === 'number') return undefined

  const url = image.url
  return url ? absoluteUrl(url) : undefined
}

type BuildMetadataArgs = {
  title: string
  description?: string | null
  image?: number | Media | null
  /**
   * Target keywords for this page — the list from the document's "Keywords" section.
   *
   * Published as `<meta name="keywords">` and, on article pages, as `article:tag` Open Graph
   * tags. Normalized by `normalizeKeywords()`, so a page can pass the raw CMS value.
   */
  keywords?: (string | null | undefined)[] | string | null
  /**
   * Path of THIS page, e.g. '/trips/everest-base-camp'.
   *
   * It becomes the canonical URL (and `og:url`), so it must be the exact path the page is served
   * at — build it from the route params (`sitePath(`/trips/${slug}`)`), never from CMS content.
   * Anything that is not part of the URL (query strings, trailing slashes, duplicate slashes) is
   * normalized away by `canonicalPath()`.
   */
  path: string
  type?: 'website' | 'article'
  noIndex?: boolean
  publishedTime?: string | null
  modifiedTime?: string | null
  authorName?: string | null
  siteName?: string
}

/**
 * Builds complete Next.js Metadata for a page: canonical URL, Open Graph, Twitter card,
 * robots. The site is English-only, so there are no hreflang alternates to emit — the
 * canonical URL is the single source of truth for search engines.
 *
 * Every page on the site goes through this, which is what guarantees each one self-references its
 * own exact URL. `src/lib/canonical-coverage.test.ts` fails the test run if a page under
 * `src/app/(frontend)` ever stops doing so.
 */
export const buildMetadata = ({
  title,
  description,
  image,
  keywords,
  path,
  type = 'website',
  noIndex = false,
  publishedTime,
  modifiedTime,
  authorName,
  siteName = 'Hike Globally',
}: BuildMetadataArgs): Metadata => {
  const cleanDescription = description ? truncate(description, 160) : undefined
  const url = canonicalUrl(path)
  const ogImage = imageUrl(image)
  const dimensions = imageDimensions(image)
  const cleanKeywords = normalizeKeywords(keywords)

  return {
    title,
    description: cleanDescription,
    // `undefined` (not `[]`) when there is no list: an empty `<meta name="keywords">` is worse than
    // no tag at all.
    keywords: cleanKeywords.length > 0 ? cleanKeywords : undefined,
    applicationName: siteName,
    authors: authorName ? [{ name: authorName }] : undefined,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
        },
    openGraph: {
      type,
      url,
      title,
      description: cleanDescription,
      siteName,
      locale: ogLocale,
      publishedTime: type === 'article' ? (publishedTime ?? undefined) : undefined,
      modifiedTime: type === 'article' ? (modifiedTime ?? undefined) : undefined,
      // `article:tag` is only valid on the article type, so it is spread in for posts alone —
      // sharing a post to Facebook/LinkedIn then carries the terms it targets.
      ...(type === 'article' && cleanKeywords.length > 0 ? { tags: cleanKeywords } : {}),
      /**
       * `images` is present only when this page has an image of its own, so the block never
       * carries an empty key. Note that this does *not* fall back to the layout's default share
       * image: when a route returns an `openGraph` object Next.js uses it wholesale, so pages that
       * want the site default have to ask for it (`settings.defaultOgImage`).
       */
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: dimensions?.width ?? 1200,
                height: dimensions?.height ?? 630,
                alt: typeof image === 'object' && image?.alt ? image.alt : title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: cleanDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

/**
 * Merges a document's optional SEO overrides with its fallback content.
 *
 * `keywords` comes from the document's "Keywords" section (Trips and Blog — see
 * `src/fields/keywords.ts`); documents without one simply yield an empty list.
 */
export const seoFromDoc = (
  doc: { meta?: MetaGroup; keywords?: (string | null)[] | null },
  fallback: { title: string; description?: string | null; image?: number | Media | null },
) => ({
  title: doc.meta?.title || fallback.title,
  description: doc.meta?.description || fallback.description || undefined,
  image: doc.meta?.image ?? fallback.image,
  keywords: normalizeKeywords(doc.keywords),
  noIndex: doc.meta?.noIndex ?? false,
})

/* ==========================================================================
   Structured data (schema.org)
   ==========================================================================
   JSON-LD describes page content to search engines; supported types such as
   breadcrumbs may appear in the SERP. No review or rating markup is emitted.
   (FAQ rich results were removed in May 2026 — FAQPage is still emitted, but for
   AI/LLM parsing, not SERP.)
   ========================================================================== */

type JsonLdInput = Record<string, unknown>

/** The root layout emits the full Organization; page publishers reference the same entity. */
export const organizationId = `${siteUrl}/#organization`

export const organizationJsonLd = ({
  name,
  legalName,
  url,
  logo,
  description,
  email,
  phone,
  address,
  socials,
}: {
  name: string
  legalName?: string | null
  url: string
  logo?: number | Media | string | null
  description?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  socials?: { url: string }[] | null
}): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': organizationId,
  name,
  legalName: legalName?.trim() || undefined,
  url,
  logo: schemaImageUrl(logo) ?? absoluteUrl('/images/logo.svg'),
  description: description?.trim() || undefined,
  email: email?.trim() || undefined,
  telephone: phone?.trim() || undefined,
  address: address?.trim()
    ? { '@type': 'PostalAddress', streetAddress: address.trim().replace(/\n/g, ', ') }
    : undefined,
  contactPoint:
    email?.trim() || phone?.trim()
      ? {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: email?.trim() || undefined,
          telephone: phone?.trim() || undefined,
          availableLanguage: htmlLang,
        }
      : undefined,
  sameAs: socialProfileUrls(socials),
})

const socialProfileUrls = (socials?: { url: string }[] | null): string[] | undefined => {
  const urls = [...new Set((socials ?? []).flatMap((social) => httpUrl(social?.url) ?? []))]
  return urls.length ? urls : undefined
}

/** Page-level publishers link to the full, site-wide Organization. */
const publisherJsonLd = ({
  name,
  logo,
  socials,
}: {
  name: string
  logo?: number | Media | string | null
  socials?: { url: string }[] | null
}): JsonLdInput => ({
  '@type': 'Organization',
  '@id': organizationId,
  name,
  url: siteUrl,
  logo: schemaImageUrl(logo) ?? absoluteUrl('/images/logo.svg'),
  sameAs: socialProfileUrls(socials),
})

/** Only public, editor-supplied facts are published; absent profiles are not invented. */
export const personJsonLd = (
  author: PublicAuthor | number | null | undefined,
): JsonLdInput | undefined => {
  const profile = authorProfile(author)
  if (!profile) return undefined

  const credentials = [
    ...(profile.education
      ? [
          {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'education',
            name: profile.education,
          },
        ]
      : []),
    ...profile.credentials.map((name) => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'professional credential',
      name,
    })),
  ]

  // `Person.url` is the page *about* the person, which is the profile on this site — not the
  // author's own homepage. Google reads it as "this is the entity these articles are attributed
  // to", and an external URL makes that connection someone else's to make. The personal site
  // still appears, as `sameAs`, where it belongs: a pointer to the same person elsewhere.
  const profileUrl = authorPath(author)
  const sameAs = [profile.website, ...profile.socials.map((social) => social.url)].filter(
    (url): url is string => Boolean(url),
  )

  return {
    '@type': 'Person',
    name: profile.name,
    url: profileUrl ? canonicalUrl(profileUrl) : profile.website ?? profile.socials[0]?.url,
    image: schemaImageUrl(profile.avatar),
    description: profile.bio,
    jobTitle: profile.jobTitle,
    sameAs: sameAs.length ? sameAs : undefined,
    hasCredential: credentials.length ? credentials : undefined,
  }
}

/**
 * `ProfilePage` structured data for `/authors/<slug>` — the page that *is* about the author.
 *
 * `mainEntity` is the same `Person` node the byline and every `BlogPosting` emit, so a crawler
 * reading a post, its author card and the author page resolves all three to one entity instead of
 * three names that happen to match. That shared identity is the whole E-E-A-T point of giving an
 * author a page at all.
 */
export const profilePageJsonLd = ({
  author,
  url,
  siteName = 'Hike Globally',
}: {
  author: PublicAuthor | number | null | undefined
  url: string
  siteName?: string
}): JsonLdInput => {
  const person = personJsonLd(author)

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: person?.name ? `${person.name} — ${siteName}` : siteName,
    url: canonicalUrl(url),
    inLanguage: htmlLang,
    isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
    publisher: { '@type': 'Organization', '@id': organizationId, name: siteName, url: siteUrl },
    mainEntity: person,
  }
}

/**
 * WebSite markup supports Google's site-name selection, not a sitelinks search box
 * (removed November 21, 2024). Keep name, alternateName and url; omit SearchAction.
 */
export const websiteJsonLd = ({
  name,
  alternateName,
  url,
}: {
  name: string
  alternateName?: string
  url: string
}): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name,
  alternateName,
  url,
})

export const breadcrumbJsonLd = (items: { name: string; url: string }[]): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: canonicalUrl(item.url),
  })),
})

export const blogPostingJsonLd = ({
  post,
  url,
  author,
  authorName,
  image,
  siteName,
  organizationLogo,
  organizationSocials,
  categories,
}: {
  post: Blog
  url: string
  /** Defaults to the post's populated author relationship. */
  author?: PublicAuthor | number | null
  /** Fallback for callers that only know the author's name. */
  authorName?: string | null
  /** Media document, media id or an already-absolute URL — resolved by `schemaImageUrl()`. */
  image?: number | Media | string | null
  siteName: string
  /** The publisher's configured logo; resolved to an absolute URL, with the site logo fallback. */
  organizationLogo?: number | Media | string | null
  organizationSocials?: { url: string }[] | null
  /** Human-readable category names, published as `articleSection`. */
  categories?: string[]
}): JsonLdInput => {
  const articleImage = schemaImageUrl(image)
  const body = lexicalToPlainText(post.content)

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: truncate(post.meta?.title || post.title, 110),
    description: post.meta?.description || post.excerpt,
    url: canonicalUrl(url),
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl(url) },
    image: articleImage ? [articleImage] : undefined,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: htmlLang,
    // The "Keywords" section of the post, in the order the editor wrote it.
    keywords: normalizeKeywords(post.keywords).join(', ') || undefined,
    articleSection: categories?.length ? categories : undefined,
    wordCount: body ? body.split(/\s+/).length : undefined,
    author:
      personJsonLd(author === undefined ? post.author : author) ??
      (authorName?.trim() ? { '@type': 'Person', name: authorName.trim() } : undefined),
    publisher: publisherJsonLd({
      name: siteName,
      logo: organizationLogo,
      socials: organizationSocials,
    }),
    articleBody: truncate(body, 4000),
  }
}

export const touristTripJsonLd = ({
  trip,
  url,
  image,
  guide,
  destinationName,
  siteName,
  organizationLogo,
  organizationSocials,
}: {
  trip: Trip
  url: string
  /** Media document, media id or an already-absolute URL — resolved by `schemaImageUrl()`. */
  image?: number | Media | string | null
  /** Defaults to the trip's populated itinerary expert relationship. */
  guide?: PublicAuthor | number | null
  destinationName?: string
  siteName: string
  organizationLogo?: number | Media | string | null
  organizationSocials?: { url: string }[] | null
}): JsonLdInput => {
  const tripImage = schemaImageUrl(image)
  const tripGuide = personJsonLd(guide === undefined ? trip.guide : guide)
  const pageUrl = canonicalUrl(url)
  // The trailhead, when the editor set one. `TouristTrip` is a product, not a location, so there is
  // no coordinates property on it: the pin belongs on the `about` Place of the page that describes
  // the trip.
  const trailhead = parseCoordinates(trip.coordinates)

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': `${pageUrl}#trip`,
    name: trip.meta?.title || trip.title,
    description: trip.meta?.description || trip.summary,
    url: pageUrl,
    image: tripImage ? [tripImage] : undefined,
    inLanguage: htmlLang,
    // TouristTrip is not a CreativeWork: authorship belongs to the page describing it.
    subjectOf: {
      '@type': 'WebPage',
      '@id': pageUrl,
      url: pageUrl,
      name: trip.title,
      author: tripGuide,
      publisher: publisherJsonLd({
        name: siteName,
        logo: organizationLogo,
        socials: organizationSocials,
      }),
      mainEntity: { '@id': `${pageUrl}#trip` },
      datePublished: trip.createdAt,
      dateModified: trip.updatedAt,
      // The trailhead, when the editor set one: `about` names the place the trip starts from and
      // carries its coordinates. (A `GeoCoordinates` node cannot hang off `TouristTrip` itself —
      // the trip is a product, not a location.)
      ...(trailhead
        ? {
            about: {
              '@type': 'Place',
              name: trip.title,
              geo: {
                '@type': 'GeoCoordinates',
                latitude: trailhead.latitude,
                longitude: trailhead.longitude,
              },
            },
          }
        : {}),
    },
    // The "Keywords" section of the trip, in the order the editor wrote it.
    keywords: normalizeKeywords(trip.keywords).join(', ') || undefined,
    touristType: trip.difficulty,
    duration: trip.durationDays ? `P${trip.durationDays}D` : undefined,
    itinerary: Array.isArray(trip.itinerary)
      ? {
          '@type': 'ItemList',
          numberOfItems: trip.itinerary.length,
          itemListElement: trip.itinerary.map((day, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: day.title,
          })),
        }
      : undefined,
    // A listing price is not a verified operator offer. Do not infer a provider
    // from the publisher or availability from the presence of a booking link.
    ...(destinationName
      ? {
          touristDestination: {
            '@type': 'TouristDestination',
            name: destinationName,
          },
        }
      : {}),
  }
}

/**
 * The page-level node for every route that is not a trip, a post or a destination: the flexible
 * CMS pages (`WebPage`), the three listings (`CollectionPage`) and `/inquiry` (`ContactPage`).
 *
 * `items` is what turns a listing into real structure for Google: an `ItemList` of the cards the
 * page actually links to, each with the exact URL those cards point at — the same URLs the
 * sitemap and the canonicals use.
 */
export const webPageJsonLd = ({
  type = 'WebPage',
  name,
  description,
  url,
  siteName = 'Hike Globally',
  image,
  items,
}: {
  type?: 'WebPage' | 'CollectionPage' | 'ContactPage' | 'AboutPage'
  name: string
  description?: string | null
  url: string
  siteName?: string
  image?: number | Media | string | null
  items?: { name: string; url: string }[]
}): JsonLdInput => {
  const pageImage = schemaImageUrl(image)

  return {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description: description ?? undefined,
    url: canonicalUrl(url),
    image: pageImage ? [pageImage] : undefined,
    inLanguage: htmlLang,
    isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
    publisher: { '@type': 'Organization', '@id': organizationId, name: siteName, url: siteUrl },
    mainEntity: items?.length
      ? {
          '@type': 'ItemList',
          numberOfItems: items.length,
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            url: canonicalUrl(item.url),
          })),
        }
      : undefined,
  }
}

export const touristDestinationJsonLd = ({
  destination,
  url,
  image,
}: {
  destination: Destination
  url: string
  /** Media document, media id or an already-absolute URL — resolved by `schemaImageUrl()`. */
  image?: number | Media | string | null
}): JsonLdInput => {
  const coordinates = parseCoordinates(destination.coordinates)

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: destination.meta?.title || destination.name,
    description: destination.meta?.description || destination.tagline,
    url: canonicalUrl(url),
    image: schemaImageUrl(image) ? [schemaImageUrl(image)] : undefined,
    inLanguage: htmlLang,
    address: {
      '@type': 'PostalAddress',
      addressCountry: destination.country,
    },
    // `parseCoordinates()` rather than a truthiness check: a destination on the equator (latitude 0)
    // or the Greenwich meridian (longitude 0) still deserves its GeoCoordinates.
    geo: coordinates
      ? {
          '@type': 'GeoCoordinates',
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        }
      : undefined,
  }
}

/**
 * FAQPage structured data.
 *
 * Google removed FAQ rich results entirely on 2026-05-07, so this no longer produces
 * a SERP feature. It is kept because Google still parses FAQPage — the Q&A markup
 * feeds AI Overviews and LLM answers, the same audience /llms.txt serves. Keep the
 * visible FAQ section for its content value; don't budget for rich results.
 */
export const faqJsonLd = (faqs: { question: string; answer: string }[]): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
})
