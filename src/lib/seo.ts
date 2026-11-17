import type { Metadata } from 'next'

import { MAX_KEYWORDS } from '@/fields/keywords'
import { htmlLang, ogLocale } from '@/i18n/config'
import type { Blog, Destination, Media, Trip } from '@/payload-types'
import { lexicalToPlainText, truncate } from './format'
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
 * '/trips?page=2&x=1'    → '/trips'          (query dropped — filters are not pages)
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
      pathname = new URL(raw).pathname
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

  return segments.length === 0 ? '/' : `/${segments.join('/')}`
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
   JSON-LD is how Google turns a page into a rich result. What it can and cannot
   buy has changed a lot, so the rules behind these builders are:

   · `WebSite` (homepage only) — Google's documented way to *state a preference*
     for the site name shown above every result for the domain, and what it reads
     for a brand result's identity. It is a signal, not a directive.
   · `Organization` — the business entity behind the site: name, logo, address,
     contact point and `sameAs` profiles. This is the Knowledge-Panel input.
   · `BreadcrumbList` — can replace the raw URL in a result with a readable path.
   · `TouristTrip` / `TouristDestination` / `BlogPosting` — what the page is.

   Two blocks that look like they help a brand result do not, and are deliberately
   absent (see `websiteJsonLd`):

   · `potentialAction: SearchAction` — powered the sitelinks search box, which
     Google retired on 21 November 2024. The markup no longer does anything.
   · `FAQPage` — rich-result eligibility was cut to government/health sites in
     2023 and dropped entirely in 2026. The FAQ text stays on the page (that is
     what people and AI answers read); only the dead markup is gone.
   ========================================================================== */

type JsonLdInput = Record<string, unknown>

/**
 * The brand node every other graph entry points at, built from one place.
 *
 * A page that says `publisher: { '@type': 'Organization', name: … }` without a `url` or `logo`
 * describes an organization that cannot be matched to the `Organization` node on the homepage —
 * Google reads them as unrelated names. One builder for the reference means the brand is spelled
 * and addressed identically everywhere it appears.
 */
export const brandNode = ({
  siteName,
  url = siteUrl,
  logo,
}: {
  siteName: string
  url?: string
  logo?: string
}): JsonLdInput => ({
  '@type': 'Organization',
  name: siteName,
  url,
  logo: logo ?? `${url}/images/logo.svg`,
})

/**
 * The business behind the site.
 *
 * `legalName` is kept as its own property rather than being promoted to `name`:
 * `name` is the brand a traveller searches for and the one Google matches against
 * the site name, so it must be the short form ("Hike Globally"), while the legal
 * entity ("Hike Globally Trekking Pvt. Ltd.") belongs in `legalName` — the pair is
 * how a brand entity is disambiguated from a same-named one.
 */
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
  logo?: string
  description?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  socials?: { platform: string; url: string }[]
}): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': ['Organization', 'TouristInformationCenter'],
  name,
  legalName: legalName && legalName !== name ? legalName : undefined,
  url,
  logo,
  description: description ?? undefined,
  email: email ?? undefined,
  telephone: phone ?? undefined,
  address: address
    ? { '@type': 'PostalAddress', streetAddress: address.replace(/\n/g, ', ') }
    : undefined,
  // A contact point is what the Knowledge Panel and "customer support" rich results read; without
  // it the organization node describes a name and nothing a traveller can act on.
  contactPoint:
    email || phone
      ? {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: email ?? undefined,
          telephone: phone ?? undefined,
          availableLanguage: htmlLang,
        }
      : undefined,
  sameAs: socials?.length ? socials.map((social) => social.url) : undefined,
})

/**
 * The site-name fallbacks to declare next to the preferred name.
 *
 * Google documents two things it will consider when the preferred name is not the one it picks:
 * an `alternateName`, and — as a last resort — the bare domain. The domain is derived from
 * `siteUrl` rather than typed in, so it can never drift from the origin the rest of the metadata
 * uses, and a host Google could not use as a name (a dotless `localhost` or preview container) is
 * dropped instead of being published as `alternateName: ["localhost"]`.
 */
export const siteNameAlternates = (url: string = siteUrl): string[] => {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '')
    return host.includes('.') ? [host] : []
  } catch {
    return []
  }
}

/**
 * The site as an entity — the homepage's declaration of its own name.
 *
 * `name` + `url` are the two properties Google's site-name feature documents as
 * required; `alternateName` is the documented escape hatch for when the preferred
 * name is not selected (a shorter form, an acronym, or the bare domain). Google
 * cross-checks this against `og:site_name`, the homepage `<title>` and the
 * homepage headings, so all of them carry `settings.siteName` unchanged.
 *
 * There is deliberately no `potentialAction`/`SearchAction`: it fed the sitelinks
 * search box, which Google removed on 21 November 2024, and the template it pointed
 * at (`/trips?q=…`) never filtered anything — the explorer's filters live in the
 * URL as `?difficulty=`, `?destination=`, `?season=` and `?type=`.
 */
export const websiteJsonLd = ({
  name,
  alternateName,
  url,
}: {
  name: string
  alternateName?: string[]
  url: string
}): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name,
  alternateName: alternateName?.length ? alternateName : undefined,
  url,
})

/**
 * The visible trail, as markup. The last entry is the page itself, so its `item`
 * URL is left out — the one omission Google documents for a `BreadcrumbList`, and
 * the one that keeps the trail from linking a page to itself.
 */
export const breadcrumbJsonLd = (items: { name: string; url: string }[]): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: index === items.length - 1 ? undefined : canonicalUrl(item.url),
  })),
})

export const blogPostingJsonLd = ({
  post,
  url,
  authorName,
  image,
  siteName,
  categories,
}: {
  post: Blog
  url: string
  authorName?: string | null
  /** Media document, media id or an already-absolute URL — resolved by `schemaImageUrl()`. */
  image?: number | Media | string | null
  siteName: string
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
    author: authorName ? { '@type': 'Person', name: authorName } : undefined,
    // The homepage's `Organization` node, by reference: same name, same URL, same logo.
    publisher: brandNode({ siteName }),
    articleBody: truncate(body, 4000),
  }
}

export const touristTripJsonLd = ({
  trip,
  url,
  image,
  destinationName,
  siteName,
}: {
  trip: Trip
  url: string
  /** Media document, media id or an already-absolute URL — resolved by `schemaImageUrl()`. */
  image?: number | Media | string | null
  destinationName?: string
  siteName: string
}): JsonLdInput => {
  const tripImage = schemaImageUrl(image)

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: trip.meta?.title || trip.title,
    description: trip.meta?.description || trip.summary,
    url: canonicalUrl(url),
    image: tripImage ? [tripImage] : undefined,
    inLanguage: htmlLang,
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
    provider: brandNode({ siteName }),
    offers: {
      '@type': 'Offer',
      price: trip.priceFrom,
      priceCurrency: trip.priceCurrency,
      availability: 'https://schema.org/InStock',
      url: canonicalUrl(url),
    },
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
    publisher: brandNode({ siteName }),
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
}): JsonLdInput => ({
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
  geo:
    destination.coordinates?.latitude && destination.coordinates?.longitude
      ? {
          '@type': 'GeoCoordinates',
          latitude: destination.coordinates.latitude,
          longitude: destination.coordinates.longitude,
        }
      : undefined,
})

/* There is no `faqJsonLd()`.
 *
 * It emitted `FAQPage`, which Google stopped rendering for ordinary sites in August 2023
 * (eligibility was cut to government and health sites) and dropped for everyone in 2026, when
 * the documentation and the Search Console report were removed too. Keeping the block would be
 * markup that reads well in a validator and earns nothing in a result — and, on a trip page, a
 * second `FAQPage` node describing the same questions the page already lists.
 *
 * The questions themselves stay visible and in the HTML: that is what readers, AI answers and
 * every engine other than Google read. Only the dead annotation is gone.
 */
