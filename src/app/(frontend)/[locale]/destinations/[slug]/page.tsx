import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DestinationDetail } from '@/components/views/destination-detail'
import { isLocale, localizedPath, type Locale } from '@/i18n/config'
import { getAllDestinationSlugs, getDestination, getDestinations } from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import type { TripCard } from '@/lib/data'
import { buildMetadata, seoFromDoc } from '@/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllDestinationSlugs()
  return slugs.map(({ locale, slug }) => ({ locale, slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}

  const includeDraft = await isLivePreviewRequest()
  const destination = await getDestination(locale, slug, includeDraft)
  if (!destination) return {}

  const seo = seoFromDoc(destination, {
    title: destination.name,
    description: destination.tagline,
    image: destination.heroImage,
  })

  return buildMetadata({
    title: seo.title,
    description: seo.description,
    image: seo.image,
    path: localizedPath(locale, `/destinations/${slug}`),
    locale,
    noIndex: seo.noIndex,
  })
}

/** DESTINATION DETAIL — `/[locale]/destinations/[slug]` */
export default async function DestinationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: localeParam, slug } = await params
  if (!isLocale(localeParam)) notFound()

  const locale = localeParam as Locale
  const includeDraft = await isLivePreviewRequest()
  const destination = await getDestination(locale, slug, includeDraft)

  if (!destination) notFound()

  const allDestinations = await getDestinations(locale)

  // The `trips` join field is resolved in the same query as the destination — no extra round trip.
  const trips = ((destination as unknown as { trips?: { docs?: (number | unknown)[] } }).trips?.docs ??
    []) as unknown as TripCard[]

  const otherDestinations = allDestinations.filter((item) => item.id !== destination.id).slice(0, 3)

  return (
    <DestinationDetail
      destination={destination}
      locale={locale}
      trips={trips}
      otherDestinations={otherDestinations}
    />
  )
}
