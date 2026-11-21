import type { Metadata } from 'next'

import { CtaCard } from '@/components/blocks/cta'
import { PlaceCategoryCard } from '@/components/cards/place-category-card'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHeader } from '@/components/sections/page-header'
import { SectionHeading } from '@/components/sections/section-heading'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getSettings } from '@/lib/data'
import {
  PLACE_INDEX_PATH,
  placeCategories,
  placeCategoryMedia,
  placeCategoryPath,
} from '@/lib/place-categories'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

import './places.css'

export const revalidate = 3600

const INDEX_DESCRIPTION =
  'Nine landscapes, nine ways to choose your next route. Browse curated trips and field notes by the features that make a place unforgettable.'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const hero = placeCategoryMedia(placeCategories[0]!)

  return buildMetadata({
    title: 'Browse places',
    description: INDEX_DESCRIPTION,
    image: hero,
    path: sitePath('/places'),
    siteName: settings.siteName,
  })
}

/** `/places` — the index for all nine Browse Places categories. */
export default async function PlacesPage() {
  const dict = dictionary
  const settings = await getSettings()
  const hero = placeCategoryMedia(placeCategories[0]!)

  return (
    <div data-places-page="index">
      <PageHeader
        eyebrow="EXPLORE BEYOND THE MAP"
        title="Places worth the journey"
        lead={INDEX_DESCRIPTION}
        breadcrumbs={[{ label: dict.nav.home, href: sitePath('/') }, { label: 'All places' }]}
        background={hero}
      />

      <section aria-labelledby="places-index-heading" className="py-16 md:py-24">
        <div className="container-content">
          <SectionHeading
            eyebrow="NINE CURATED CATEGORIES"
            title="Start with a landscape"
            titleId="places-index-heading"
            description="Lakes, passes, summits and sacred places: choose the feature you want to travel toward, and we will show the journeys and stories gathered around it."
            action={{ href: sitePath('/trips'), label: dict.common.viewAll }}
          />

          <div className="places-grid">
            {placeCategories.map((category, index) => (
              <PlaceCategoryCard
                key={category.value}
                category={category}
                index={index}
                priority={index < 3}
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
          ]),
          webPageJsonLd({
            type: 'CollectionPage',
            name: 'Browse places',
            description: INDEX_DESCRIPTION,
            url: PLACE_INDEX_PATH,
            siteName: settings.siteName,
            image: hero,
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
