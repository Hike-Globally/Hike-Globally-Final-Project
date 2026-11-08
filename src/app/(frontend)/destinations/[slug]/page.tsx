import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DestinationDetail } from '@/components/views/destination-detail'
import { sitePath } from '@/i18n/config'
import {
  createInternalLinker,
  getAllDestinationSlugs,
  getDestination,
  getDestinations,
} from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import type { TripCard } from '@/lib/data'
import { buildMetadata, seoFromDoc } from '@/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllDestinationSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const includeDraft = await isLivePreviewRequest()
  const destination = await getDestination(slug, includeDraft)
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
    path: sitePath(`/destinations/${slug}`),
    noIndex: seo.noIndex,
  })
}

/** DESTINATION DETAIL — `/destinations/[slug]` */
export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const includeDraft = await isLivePreviewRequest()
  const destination = await getDestination(slug, includeDraft)

  if (!destination) notFound()

  const allDestinations = await getDestinations()

  // The `trips` join field is resolved in the same query as the destination — no extra round trip.
  const trips = ((destination as unknown as { trips?: { docs?: (number | unknown)[] } }).trips
    ?.docs ?? []) as unknown as TripCard[]

  const otherDestinations = allDestinations.filter((item) => item.id !== destination.id).slice(0, 3)

  /**
   * Automated internal keyword linking (see `src/lib/internal-links.ts`): a destination's
   * description and getting-there copy link to the trips and posts they mention. Passing the
   * destination as `self` is what stops it linking to itself.
   */
  const linker = await createInternalLinker({ collection: 'destinations', id: destination.id })

  return (
    <DestinationDetail
      destination={destination}
      trips={trips}
      otherDestinations={otherDestinations}
      linker={linker}
    />
  )
}
