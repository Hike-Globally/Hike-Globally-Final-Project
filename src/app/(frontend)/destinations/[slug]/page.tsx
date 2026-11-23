import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { DestinationDetail } from '@/components/views/destination-detail'
import { sitePath } from '@/i18n/config'
import {
  createInternalLinker,
  getAllDestinationSlugs,
  getDestination,
  getDestinationTrips,
  getDestinations,
} from '@/lib/data'
import { isContinentDestination } from '@/lib/destination-groups'
import { isIndexableDestination } from '@/lib/destination-indexing'
import { relatedDestinations } from '@/lib/related-destinations'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import { buildMetadata, seoFromDoc } from '@/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllDestinationSlugs()
  return slugs.map((slug) => ({ slug }))
}

/**
 * Everything the route needs, read once per request. `generateMetadata` and the page component
 * are two React trees over the same URL, so without `cache()` each would run its own queries;
 * with it the second caller reuses the first. The trip read is needed by *both*: the page draws
 * the cards, the metadata needs the count for the continent-hub indexability rule.
 */
const readDestinationPage = cache(async (slug: string) => {
  const includeDraft = await isLivePreviewRequest()
  const destination = await getDestination(slug, includeDraft)
  if (!destination) return null

  // Read the trips as cards (depth 1) instead of off the destination's `trips` join field: joined
  // documents are only populated at the join's own `maxDepth`, which left every trip's `heroImage`
  // as a bare ID and hid the card photographs. See `getDestinationTrips` in `@/lib/data`.
  const [allDestinations, trips] = await Promise.all([
    getDestinations(),
    getDestinationTrips(destination.id, { includeDraft }),
  ])

  return { destination, allDestinations, trips }
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const page = await readDestinationPage(slug)
  if (!page) return {}
  const { destination, trips } = page

  // A continent is not a region, so it does not get a region's title: "Europe — trekking region"
  // is the wrong query. The subject guard below is what stops an editor's "Europe" or
  // "Eastern Nepal: Hike Globally" from replacing either fallback with a keyword-free title.
  const fallbackTitle = isContinentDestination(destination)
    ? `${destination.name} — trekking destinations & trails`
    : `${destination.name} — trekking region`

  const seo = seoFromDoc(destination, {
    title: fallbackTitle,
    description: destination.tagline,
    image: destination.heroImage,
    subject: destination.name,
  })

  // The same verdict `/sitemap.xml` reaches for this document (see `destination-indexing.ts`):
  // a continent with one trip and a generic essay is not indexed, and is not advertised either.
  const indexable = isIndexableDestination({
    slug: destination.slug ?? slug,
    tripCount: trips.length,
    description: destination.description,
    editorNoIndex: destination.meta?.noIndex,
  })

  return buildMetadata({
    title: seo.title,
    description: seo.description,
    image: seo.image,
    path: sitePath(`/destinations/${slug}`),
    noIndex: seo.noIndex || !indexable,
    // Follow, always: a page that is out of the index still passes its links to the trips and
    // regions it points at, which is the whole point of keeping it crawlable.
    follow: true,
  })
}

/** DESTINATION DETAIL — `/destinations/[slug]` */
export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const page = await readDestinationPage(slug)
  if (!page) notFound()
  const { destination, allDestinations, trips } = page

  // Never "everything that is not me": a continent recommends continents, a region recommends
  // regions, ranked by shared country and region bucket (see `src/lib/related-destinations.ts`).
  const otherDestinations = relatedDestinations(destination, allDestinations, 3)

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
