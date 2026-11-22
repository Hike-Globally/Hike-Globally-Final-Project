import type { Metadata } from 'next'

import { CtaCard } from '@/components/blocks/cta'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHeader } from '@/components/sections/page-header'
import { PlaceBento } from '@/components/sections/place-bento'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getSettings } from '@/lib/data'
import { PLACE_INDEX_PATH, placeCategories, placeCategoryPath } from '@/lib/place-categories'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'
import type { Media } from '@/payload-types'

import './places.css'

export const revalidate = 3600

const INDEX_DESCRIPTION =
  'Nine landscapes, nine ways to choose your next route. Browse curated trips and field notes by the features that make a place unforgettable.'

/**
 * The index gets its own frontispiece: a panorama shot for this page alone, so
 * the hero never repeats the Lakes plate that opens the gallery below it.
 * Shaped like a Media document for PageHeader, Open Graph and JSON-LD — the
 * same contract `placeCategoryMedia` keeps for the category pages.
 */
const INDEX_HERO: Media = {
  id: 0,
  url: '/images/places/index-hero.jpg',
  alt: 'Alpenglow on a Himalayan range above a valley filled with cloud',
  mimeType: 'image/jpeg',
  width: 1568,
  height: 672,
  focalX: 50,
  focalY: 50,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as unknown as Media

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()

  return buildMetadata({
    title: 'Browse places',
    description: INDEX_DESCRIPTION,
    image: INDEX_HERO,
    path: sitePath('/places'),
    siteName: settings.siteName,
  })
}

/** `/places` — the atlas index for all nine Browse Places categories. */
export default async function PlacesPage() {
  const dict = dictionary
  const settings = await getSettings()

  return (
    <div data-places-page="index">
      <PageHeader
        eyebrow="EXPLORE BEYOND THE MAP"
        title="Places worth the journey"
        lead={INDEX_DESCRIPTION}
        breadcrumbs={[{ label: dict.nav.home, href: sitePath('/') }, { label: 'All places' }]}
        background={INDEX_HERO}
      >
        {/* The count line the homepage marquee and the category heroes share —
            one hairline and `09 / Curated` under the standfirst. */}
        <div className="places-index__hero-meta">
          <span>09 / Curated</span>
        </div>
      </PageHeader>

      <section aria-labelledby="places-index-heading" className="py-16 md:py-24">
        <div className="container-content">
          {/* The grid's own key plate carries the section heading — see
              `place-bento.tsx`. Nothing sits above the composition: the bento
              is the section, not a gallery dropped under a heading. */}
          <PlaceBento titleId="places-index-heading" />
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
          ]),
          webPageJsonLd({
            type: 'CollectionPage',
            name: 'Browse places',
            description: INDEX_DESCRIPTION,
            url: PLACE_INDEX_PATH,
            siteName: settings.siteName,
            image: INDEX_HERO,
            items: placeCategories.map((category) => ({
              name: category.label,
              url: placeCategoryPath(category.value),
            })),
          }),
        ]}
      />
    </div>
  )
}
