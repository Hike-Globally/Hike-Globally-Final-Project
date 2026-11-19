import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TripDetail } from '@/components/views/trip-detail'
import { sitePath } from '@/i18n/config'
import {
  createInternalLinker,
  getAllTripSlugs,
  getRelatedTrips,
  getSettings,
  getTrip,
} from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import { buildMetadata, seoFromDoc } from '@/lib/seo'

export const revalidate = 3600

/**
 * Every published trip is prerendered at build time.
 * `dynamicParams` stays on (the default) so a trip published after the build is rendered on
 * its first request and cached — new content gets a live URL with no redeploy.
 */
export async function generateStaticParams() {
  const slugs = await getAllTripSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const includeDraft = await isLivePreviewRequest()
  const trip = await getTrip(slug, includeDraft)
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
    // From the trip's "Keywords" section — published as <meta name="keywords"> and as
    // `keywords` in the TouristTrip markup (see TripDetail).
    keywords: seo.keywords,
    path: sitePath(`/trips/${slug}`),
    noIndex: seo.noIndex,
  })
}

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const includeDraft = await isLivePreviewRequest()
  const trip = await getTrip(slug, includeDraft)

  if (!trip) notFound()

  const [related, settings, linker] = await Promise.all([
    getRelatedTrips(trip, 3),
    getSettings(),
    /**
     * Automated internal keyword linking (see `src/lib/internal-links.ts`): the overview, "why
     * choose this trek", the route map intro, departure notes, the audience cards and the
     * essential-information accordions all share one budget, and link out to the destinations and
     * posts they mention. Passing the trip as `self` is what stops it linking to itself.
     */
    createInternalLinker({ collection: 'trips', id: trip.id }),
  ])

  return <TripDetail trip={trip} related={related} settings={settings} linker={linker} />
}
