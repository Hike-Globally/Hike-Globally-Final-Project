import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TripDetail } from '@/components/views/trip-detail'
import { isLocale, localizedPath, type Locale } from '@/i18n/config'
import { getAllTripSlugs, getRelatedTrips, getSettings, getTrip, getTripOptions } from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import { buildMetadata, seoFromDoc } from '@/lib/seo'

export const revalidate = 3600

/**
 * Every published trip, in every language, is prerendered at build time.
 * `dynamicParams` stays on (the default) so a trip published after the build is rendered on
 * its first request and cached — new content gets a live URL with no redeploy.
 */
export async function generateStaticParams() {
  const slugs = await getAllTripSlugs()
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
  const trip = await getTrip(locale, slug, includeDraft)
  if (!trip) return {}

  const seo = seoFromDoc(trip, {
    title: trip.title,
    description: trip.summary,
    image: trip.heroImage,
  })

  return buildMetadata({
    title: seo.title,
    description: seo.description,
    image: seo.image,
    path: localizedPath(locale, `/trips/${slug}`),
    locale,
    noIndex: seo.noIndex,
  })
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: localeParam, slug } = await params
  if (!isLocale(localeParam)) notFound()

  const locale = localeParam as Locale
  const includeDraft = await isLivePreviewRequest()
  const trip = await getTrip(locale, slug, includeDraft)

  if (!trip) notFound()

  const [related, tripOptions, settings] = await Promise.all([
    getRelatedTrips(locale, trip, 3),
    getTripOptions(locale),
    getSettings(locale),
  ])

  return (
    <TripDetail
      trip={trip}
      locale={locale}
      related={related}
      tripOptions={tripOptions}
      formEmail={settings.formsubmitEmail || process.env.NEXT_PUBLIC_FORMSUBMIT_EMAIL || settings.email}
    />
  )
}
