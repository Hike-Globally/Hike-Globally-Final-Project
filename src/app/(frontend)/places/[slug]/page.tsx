import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'

import { CtaCard } from '@/components/blocks/cta'
import { PlaceCategoryCard } from '@/components/cards/place-category-card'
import { PostCard } from '@/components/cards/post-card'
import { TripCard } from '@/components/cards/trip-card'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHeader } from '@/components/sections/page-header'
import { SectionHeading } from '@/components/sections/section-heading'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getPlaceCategoryContent, getSettings } from '@/lib/data'
import {
  PLACE_INDEX_PATH,
  getPlaceCategory,
  placeCategories,
  placeCategoryMedia,
  placeCategoryPath,
} from '@/lib/place-categories'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

import '../places.css'

export const revalidate = 3600
export const dynamicParams = false

export function generateStaticParams() {
  return placeCategories.map((category) => ({ slug: category.value }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = getPlaceCategory(slug)
  if (!category) notFound()

  const settings = await getSettings()

  return buildMetadata({
    title: `${category.label} adventures`,
    description: category.intro,
    image: placeCategoryMedia(category),
    path: sitePath(`/places/${slug}`),
    siteName: settings.siteName,
  })
}

/** `/places/<category>` — one curated, indexable page per Browse Places category. */
export default async function PlaceCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = getPlaceCategory(slug)
  if (!category) notFound()

  const dict = dictionary
  const media = placeCategoryMedia(category)
  const [settings, content] = await Promise.all([
    getSettings(),
    getPlaceCategoryContent(category.value, 3),
  ])
  const categoryNumber = String(
    placeCategories.findIndex((item) => item.value === category.value) + 1,
  ).padStart(2, '0')
  const related = placeCategories.filter((item) => item.value !== category.value).slice(0, 3)

  return (
    <div data-places-page={category.value}>
      <PageHeader
        eyebrow="BROWSE PLACES"
        title={category.label}
        lead={category.intro}
        background={media}
        breadcrumbs={[
          { label: dict.nav.home, href: sitePath('/') },
          { label: 'All places', href: PLACE_INDEX_PATH },
          { label: category.label },
        ]}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-label font-medium tracking-[0.14em] text-mist uppercase">
          <span className="inline-flex items-center gap-2">
            <span>Curated landscape</span>
            <span>{categoryNumber} / 09</span>
          </span>
          <Link
            href={PLACE_INDEX_PATH}
            className="group inline-flex items-center gap-2 border-b border-mist/45 pb-1 transition-colors hover:border-mist"
          >
            <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Back to all places
          </Link>
        </div>
      </PageHeader>

      <section aria-labelledby="place-trips-heading" className="py-16 md:py-24">
        <div className="container-content">
          <SectionHeading
            eyebrow="CURATED TRIPS"
            title="Trips shaped by this landscape"
            titleId="place-trips-heading"
            description="Trips and expeditions tagged with this landscape, from first approaches to once-in-a-lifetime crossings."
            action={{ href: sitePath('/trips'), label: 'View all trips' }}
          />

          {content.trips.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {content.trips.map((trip, index) => (
                <TripCard key={trip.id} trip={trip} priority={index === 0} className="h-full" />
              ))}
            </div>
          ) : (
            <div className="places-empty">
              <h3 className="heading-md">No trips tagged yet</h3>
              <p className="lead mt-3 max-w-xl">
                Tell us what you have in mind and we will shape a route around this landscape.
              </p>
              <Link
                href={sitePath('/contact')}
                className="mt-6 inline-flex items-center gap-2 text-ui font-medium text-deep-90 hover:text-deep-80"
              >
                Plan your trip
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section
        aria-labelledby="place-notes-heading"
        className="border-y border-slate-20 bg-mist py-16 md:py-24"
      >
        <div className="container-content">
          <SectionHeading
            eyebrow="FIELD NOTES"
            title="Guides and journal entries connected to this landscape"
            titleId="place-notes-heading"
            description="Practical advice, field reports and stories from the trail, filed under the same place category."
            action={{ href: sitePath('/blog'), label: dict.blog.browseJournal }}
          />

          {content.posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {content.posts.map((post, index) => (
                <PostCard key={post.id} post={post} priority={index === 0} />
              ))}
            </div>
          ) : (
            <div className="places-empty bg-paper">
              <h3 className="heading-md">No field notes tagged yet</h3>
              <p className="lead mt-3 max-w-xl">
                Browse the journal for practical advice and stories from the trail.
              </p>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="more-places-heading" className="py-16 md:py-24">
        <div className="container-content">
          <SectionHeading
            eyebrow="KEEP EXPLORING"
            title="Continue exploring"
            titleId="more-places-heading"
            description="More landscapes to follow, each with its own trips, stories and sense of scale."
            action={{ href: PLACE_INDEX_PATH, label: 'Back to all places' }}
          />
          <div className="places-related-grid">
            {related.map((item, index) => (
              <PlaceCategoryCard
                key={item.value}
                category={item}
                index={placeCategories.findIndex((entry) => entry.value === item.value)}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      <CtaCard
        eyebrow={dict.cta.eyebrow}
        heading={dict.cta.heading}
        text={dict.inquiry.subtitle}
        link={{ href: sitePath('/contact'), label: dict.cta.action }}
        variant="dark"
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: sitePath('/') },
            { name: 'All places', url: PLACE_INDEX_PATH },
            { name: category.label, url: placeCategoryPath(category.value) },
          ]),
          webPageJsonLd({
            type: 'CollectionPage',
            name: `${category.label} adventures`,
            description: category.intro,
            url: placeCategoryPath(category.value),
            siteName: settings.siteName,
            image: media,
            items: [
              ...content.trips.map((trip) => ({
                name: trip.title,
                url: sitePath(`/trips/${trip.slug}`),
              })),
              ...content.posts.map((post) => ({
                name: post.title,
                url: sitePath(`/blog/${post.slug}`),
              })),
            ],
          }),
        ]}
      />
    </div>
  )
}
