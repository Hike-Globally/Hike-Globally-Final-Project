import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'

import { CtaCard } from '@/components/blocks/cta'
import { PlaceCategoryCard } from '@/components/cards/place-category-card'
import { PostCard } from '@/components/cards/post-card'
import { TripCard } from '@/components/cards/trip-card'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { DestinationLinks } from '@/components/sections/destination-links'
import { PlaceGlyph } from '@/components/sections/place-glyph'
import { SectionHeading } from '@/components/sections/section-heading'
import { PayloadImageFill } from '@/components/ui/payload-image'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getPlaceCategoryContent, getSettings } from '@/lib/data'
import { hasHubContent } from '@/lib/hub-indexing'
import {
  PLACE_INDEX_PATH,
  getPlaceCategory,
  placeCategories,
  placeCategoryMedia,
  placeCategoryPath,
} from '@/lib/place-categories'
import { getPlaceTheme, placeThemeStyle } from '@/lib/place-themes'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'
import { regionsOf } from '@/lib/taxonomy'
import type { Media } from '@/payload-types'

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

  const [settings, content] = await Promise.all([getSettings(), getPlaceCategoryContent(category.value, 1)])

  return buildMetadata({
    // Every search-facing string on this page says "landscape": it is one of nine parallel ways
    // into the trips, and the region atlas (`/destinations`) is the other. A bare "Lakes
    // adventures" let the two compete for the same queries (see `src/lib/taxonomy.ts`).
    title: `${category.label} — treks by landscape`,
    description: category.intro,
    image: placeCategoryMedia(category),
    path: sitePath(`/places/${slug}`),
    siteName: settings.siteName,
    noIndex: !hasHubContent(content),
    follow: true,
  })
}

/**
 * The full-bleed photographic backdrop behind the hero and the quote
 * interlude — the one shared navy wash, so copy over the image keeps the
 * site's documented scrim contrast wherever it sits.
 */
function PlaceBackdrop({ media, priority = false }: { media: Media; priority?: boolean }) {
  return (
    <>
      <PayloadImageFill
        media={media}
        sizes="100vw"
        priority={priority}
        className="-z-10"
        imageClassName="object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-ink/72" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent" />
    </>
  )
}

/**
 * The within-page chapter marker that opens each editorial chapter.
 *
 * Purely decorative: the visible words live in the section's own heading, so
 * screen readers skip the roman numeral and its hairline (`aria-hidden`).
 */
function ChapterMark({ numeral }: { numeral: 'I' | 'II' | 'III' }) {
  return (
    <p className="place-chapter" aria-hidden="true">
      <span className="place-chapter__num">{numeral}</span>
      <span className="place-chapter__rule" />
    </p>
  )
}

/**
 * `/places/<category>` — one themed, editorial page per Browse Places category.
 *
 * The shared skeleton runs as three chapters (trips → field notes → keep
 * exploring). What makes each of the nine pages its own destination is the
 * theme published on the root element: an accent set mixed from the locked
 * palette (`@/lib/place-themes`) plus a survey-line glyph.
 */
export default async function PlaceCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = getPlaceCategory(slug)
  if (!category) notFound()

  const dict = dictionary
  const media = placeCategoryMedia(category)
  const theme = getPlaceTheme(category.value)
  const [settings, content] = await Promise.all([
    getSettings(),
    getPlaceCategoryContent(category.value, 3),
  ])

  const categoryIndex = placeCategories.findIndex((item) => item.value === category.value)
  const categoryNumber = String(categoryIndex + 1).padStart(2, '0')
  const previousCategory =
    placeCategories[(categoryIndex - 1 + placeCategories.length) % placeCategories.length]!
  const nextCategory = placeCategories[(categoryIndex + 1) % placeCategories.length]!
  const related = placeCategories.filter((item) => item.value !== category.value).slice(0, 3)

  return (
    <div
      data-places-page={category.value}
      className="place-themed"
      style={placeThemeStyle(theme) as CSSProperties}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Hero — the themed masthead for this landscape.                    */}
      {/* ---------------------------------------------------------------- */}
      <section
        data-header-hero
        className="hero-region place-hero relative isolate flex items-end overflow-hidden bg-ink text-mist"
      >
        <PlaceBackdrop media={media} priority />
        <PlaceGlyph value={category.value} strokeWidth={1} className="place-hero__watermark" />

        <div className="container-content relative w-full pt-28 pb-16 sm:pb-20 md:pt-36 md:pb-28">
          <Breadcrumbs
            items={[
              { label: dict.nav.home, href: sitePath('/') },
              { label: 'All places', href: PLACE_INDEX_PATH },
              { label: category.label },
            ]}
            className="mb-6"
          />

          <p className="eyebrow place-hero__eyebrow">BROWSE PLACES</p>

          <h1 className="heading-display hero-title mt-4 max-w-4xl text-white">{category.label}</h1>

          <p className="lead hero-description mt-6 max-w-2xl text-mist">{category.description}</p>

          <div className="place-hero__meta">
            <span className="place-hero__meta-item">
              <span>Curated landscape</span>
              <span className="place-hero__meta-count">{categoryNumber} / 09</span>
            </span>
            <Link href={PLACE_INDEX_PATH} className="group place-hero__back">
              <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
              Back to all places
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Chapter I — curated trips tagged with this landscape.             */}
      {/* ---------------------------------------------------------------- */}
      <section
        aria-labelledby="place-trips-heading"
        className="place-chapter-section place-trips py-16 md:py-24"
      >
        <div className="container-content">
          <ChapterMark numeral="I" />
          <SectionHeading
            eyebrow="CURATED TRIPS"
            title="Trips shaped by this landscape"
            titleId="place-trips-heading"
            description="Trips and expeditions tagged with this landscape, from first approaches to once-in-a-lifetime crossings."
            action={{ href: sitePath('/trips'), label: 'View all trips' }}
          />

          {content.trips.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {content.trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} className="h-full" />
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

      {/* ---------------------------------------------------------------- */}
      {/* The other half of "where to go": the regions these trips run in.    */}
      {/* ---------------------------------------------------------------- */}
      <DestinationLinks regions={regionsOf(content.trips)} />

      {/* ---------------------------------------------------------------- */}
      {/* Chapter II — field notes, on the tinted band.                     */}
      {/* ---------------------------------------------------------------- */}
      <section
        aria-labelledby="place-notes-heading"
        className="place-chapter-section place-band border-y border-slate-20 py-16 md:py-24"
      >
        <div className="container-content">
          <ChapterMark numeral="II" />
          <SectionHeading
            eyebrow="FIELD NOTES"
            title="Guides and journal entries connected to this landscape"
            titleId="place-notes-heading"
            description="Practical advice, field reports and stories from the trail, filed under the same place category."
            action={{ href: sitePath('/blog'), label: dict.blog.browseJournal }}
          />

          {content.posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {content.posts.map((post) => (
                <PostCard key={post.id} post={post} />
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

      {/* ---------------------------------------------------------------- */}
      {/* Chapter III — more landscapes, plus the prev/next pager.          */}
      {/* ---------------------------------------------------------------- */}
      <section
        aria-labelledby="more-places-heading"
        className="place-chapter-section py-16 md:py-24"
      >
        <div className="container-content">
          <ChapterMark numeral="III" />
          <SectionHeading
            eyebrow="KEEP EXPLORING"
            title="Continue exploring"
            titleId="more-places-heading"
            description="More landscapes to follow, each with its own trips, stories and sense of scale."
            action={{ href: PLACE_INDEX_PATH, label: 'Back to all places' }}
          />
          <div className="places-related-grid">
            {related.map((item) => (
              <PlaceCategoryCard
                key={item.value}
                category={item}
                index={placeCategories.findIndex((entry) => entry.value === item.value)}
              />
            ))}
          </div>

          <nav className="place-pager" aria-label="More places">
            <Link href={placeCategoryPath(previousCategory.value)} className="place-pager__link">
              <span className="eyebrow place-pager__label">Previous place</span>
              <span className="place-pager__name">
                <ArrowLeft className="size-4 place-pager__arrow" aria-hidden="true" />
                {previousCategory.label}
              </span>
            </Link>
            <Link
              href={placeCategoryPath(nextCategory.value)}
              className="place-pager__link place-pager__link--next"
            >
              <span className="eyebrow place-pager__label">Next place</span>
              <span className="place-pager__name">
                {nextCategory.label}
                <ArrowRight className="size-4 place-pager__arrow" aria-hidden="true" />
              </span>
            </Link>
          </nav>
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
