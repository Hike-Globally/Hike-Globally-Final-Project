import type { Metadata } from 'next'

import { localeMeta, locales, localizedPath, type Locale } from '@/i18n/config'
import type { Blog, Destination, Media, Trip } from '@/payload-types'
import { lexicalToPlainText, truncate } from './format'

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)

export const absoluteUrl = (path: string): string =>
  path.startsWith('http') ? path : `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`

type MetaGroup = {
  title?: string | null
  description?: string | null
  image?: number | Media | null
  noIndex?: boolean | null
} | null

/** Picks the best available image URL: the dedicated 1200×630 OG size, else the original. */
export const imageUrl = (image: number | Media | null | undefined): string | undefined => {
  if (!image || typeof image === 'number') return undefined
  const url = image.sizes?.og?.url || image.sizes?.tablet?.url || image.url
  if (!url) return undefined
  return absoluteUrl(url)
}

export const imageDimensions = (
  image: number | Media | null | undefined,
): { width: number; height: number } | undefined => {
  if (!image || typeof image === 'number') return undefined
  const og = image.sizes?.og
  if (og?.width && og?.height) return { width: og.width, height: og.height }
  if (image.width && image.height) return { width: image.width, height: image.height }
  return undefined
}

type BuildMetadataArgs = {
  title: string
  description?: string | null
  image?: number | Media | null
  /** Locale-prefixed path of THIS page, e.g. '/de/trips/ebc'. */
  path: string
  locale: Locale
  type?: 'website' | 'article'
  noIndex?: boolean
  publishedTime?: string | null
  modifiedTime?: string | null
  authorName?: string | null
  siteName?: string
}

/**
 * Builds complete Next.js Metadata for a localized page:
 * canonical + hreflang alternates, Open Graph, Twitter card, robots.
 *
 * hreflang is what stops Google treating /en, /de and /fr versions as duplicate content —
 * it is the single most important multilingual SEO detail and the easiest one to forget.
 */
export const buildMetadata = ({
  title,
  description,
  image,
  path,
  locale,
  type = 'website',
  noIndex = false,
  publishedTime,
  modifiedTime,
  authorName,
  siteName = 'Hike Globally',
}: BuildMetadataArgs): Metadata => {
  const cleanDescription = description ? truncate(description, 160) : undefined
  const url = absoluteUrl(path)
  const ogImage = imageUrl(image)
  const dimensions = imageDimensions(image)

  const languages: Record<string, string> = {}
  for (const code of locales) {
    languages[localeMeta[code].hreflang] = absoluteUrl(localizedPath(code, path.replace(/^\/[a-z]{2}(\/|$)/, '$1')))
  }
  languages['x-default'] = absoluteUrl(path.replace(/^\/[a-z]{2}(\/|$)/, '/$1'))

  return {
    title,
    description: cleanDescription,
    applicationName: siteName,
    authors: authorName ? [{ name: authorName }] : undefined,
    alternates: {
      canonical: url,
      languages,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      type,
      url,
      title,
      description: cleanDescription,
      siteName,
      locale: localeMeta[locale].ogLocale,
      alternateLocale: locales.filter((code) => code !== locale).map((code) => localeMeta[code].ogLocale),
      publishedTime: type === 'article' ? (publishedTime ?? undefined) : undefined,
      modifiedTime: type === 'article' ? (modifiedTime ?? undefined) : undefined,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: dimensions?.width ?? 1200,
              height: dimensions?.height ?? 630,
              alt: typeof image === 'object' && image?.alt ? image.alt : title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: cleanDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

/** Merges a document's optional SEO overrides with its fallback content. */
export const seoFromDoc = (
  doc: { meta?: MetaGroup },
  fallback: { title: string; description?: string | null; image?: number | Media | null },
) => ({
  title: doc.meta?.title || fallback.title,
  description: doc.meta?.description || fallback.description || undefined,
  image: doc.meta?.image ?? fallback.image,
  noIndex: doc.meta?.noIndex ?? false,
})

/* ==========================================================================
   Structured data (schema.org)
   ==========================================================================
   JSON-LD is how Google turns a page into a rich result: trip prices, FAQs,
   breadcrumbs and review ratings can all appear directly in the SERP.
   ========================================================================== */

type JsonLdInput = Record<string, unknown>

export const organizationJsonLd = ({
  name,
  url,
  logo,
  email,
  phone,
  address,
  socials,
}: {
  name: string
  url: string
  logo?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  socials?: { platform: string; url: string }[]
}): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': ['Organization', 'TouristInformationCenter'],
  name,
  url,
  logo,
  email: email ?? undefined,
  telephone: phone ?? undefined,
  address: address
    ? { '@type': 'PostalAddress', streetAddress: address.replace(/\n/g, ', ') }
    : undefined,
  sameAs: socials?.length ? socials.map((social) => social.url) : undefined,
})

export const websiteJsonLd = ({ name, url }: { name: string; url: string }): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name,
  url,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${url}/trips?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
})

export const breadcrumbJsonLd = (items: { name: string; url: string }[]): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.url),
  })),
})

export const blogPostingJsonLd = ({
  post,
  url,
  locale,
  authorName,
  image,
  siteName,
}: {
  post: Blog
  url: string
  locale: Locale
  authorName?: string | null
  image?: string
  siteName: string
}): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.meta?.title || post.title,
  description: post.meta?.description || post.excerpt,
  url: absoluteUrl(url),
  mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(url) },
  image: image ? [image] : undefined,
  datePublished: post.publishedAt ?? post.createdAt,
  dateModified: post.updatedAt,
  inLanguage: localeMeta[locale].htmlLang,
  author: authorName ? { '@type': 'Person', name: authorName } : undefined,
  publisher: {
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
  },
  articleBody: truncate(lexicalToPlainText(post.content), 4000),
})

export const touristTripJsonLd = ({
  trip,
  url,
  locale,
  image,
  destinationName,
  siteName,
}: {
  trip: Trip
  url: string
  locale: Locale
  image?: string
  destinationName?: string
  siteName: string
}): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'TouristTrip',
  name: trip.meta?.title || trip.title,
  description: trip.meta?.description || trip.summary,
  url: absoluteUrl(url),
  image: image ? [image] : undefined,
  inLanguage: localeMeta[locale].htmlLang,
  touristType: trip.difficulty,
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
  provider: { '@type': 'Organization', name: siteName, url: siteUrl },
  offers: {
    '@type': 'Offer',
    price: trip.priceFrom,
    priceCurrency: trip.priceCurrency,
    availability: 'https://schema.org/InStock',
    url: absoluteUrl(url),
  },
  ...(destinationName
    ? {
        touristDestination: {
          '@type': 'TouristDestination',
          name: destinationName,
        },
      }
    : {}),
})

export const touristDestinationJsonLd = ({
  destination,
  url,
  locale,
  image,
}: {
  destination: Destination
  url: string
  locale: Locale
  image?: string
}): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'TouristDestination',
  name: destination.meta?.title || destination.name,
  description: destination.meta?.description || destination.tagline,
  url: absoluteUrl(url),
  image: image ? [image] : undefined,
  inLanguage: localeMeta[locale].htmlLang,
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

export const faqJsonLd = (faqs: { question: string; answer: string }[]): JsonLdInput => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
})
