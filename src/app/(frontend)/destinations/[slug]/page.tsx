import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DestinationDetail } from '@/components/views/destination-detail'
import { sitePath } from '@/i18n/config'
import {
  createInternalLinker,
  getAllDestinationSlugs,
  getDestination,
  getDestinationTrips,
  getDestinations,
} from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
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
    // Name the taxonomy in the fallback title: "Khumbu" alone could be a place page, a trip page
    // or a region page, and this is the region one. An editor's meta title still wins if set.
    title: `${destination.name} — trekking region`,
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

  // Read the trips as cards (depth 1) instead of off the destination's `trips` join field: joined
  // documents are only populated at the join's own `maxDepth`, which left every trip's `heroImage`
  // as a bare ID and hid the card photographs. See `getDestinationTrips` in `@/lib/data`.
  const trips = await getDestinationTrips(destination.id, { includeDraft })

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
