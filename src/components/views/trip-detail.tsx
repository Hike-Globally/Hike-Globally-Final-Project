import { Fragment } from 'react'
import { CustomHtmlSection } from '@/components/content/custom-html-section'
import type { InternalLinker } from '@/lib/internal-links'
import {
  groupPageSections,
  resolvePageSections,
  resolveSectionContent,
  orderTripPageSections,
  tripSectionOptions,
  type PageSectionContent,
} from '@/lib/page-sections'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Clock,
  Gauge,
  MapPin,
  Mountain,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'

import { AuthorProfile } from '@/components/content/author-profile'
import { RichText } from '@/components/content/rich-text'
import { CtaCard } from '@/components/blocks/cta'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { TripCard } from '@/components/cards/trip-card'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import {
  EssentialInformationSection,
  HotelsNearDestinationSection,
} from '@/components/sections/essential-information-section'
import { TripBrochureButton } from '@/components/trips/trip-brochure-button'
import { TripSectionNav } from '@/components/trips/trip-section-nav'
import { AltitudeProfile } from '@/components/sections/altitude-profile'
import { CoordinatesMap } from '@/components/sections/coordinates-map'
import { FaqSection } from '@/components/sections/faq-section'
import { DeparturesSection } from '@/components/sections/departures-section'
import { KeyTakeawaysSection } from '@/components/sections/key-takeaways-section'
import { TripAudienceSection } from '@/components/sections/trip-audience-section'
import { LinkPreviewSection } from '@/components/sections/link-preview-section'
import { MultiUrlPreviewSection } from '@/components/sections/multi-url-preview-section'
import { TripPackingSection } from '@/components/sections/trip-packing-section'
import { KeyPointsPanel } from '@/components/sections/key-points-panel'
import { PlaceCategoryLinks } from '@/components/sections/place-category-links'
import { ItinerarySection } from '@/components/sections/itinerary-section'
import { surface } from '@/components/ui/surface'
import { altitudeProfile } from '@/lib/altitude-profile'
import { parseCoordinates } from '@/lib/coordinates'
import { PayloadImageFill, PayloadImage } from '@/components/ui/payload-image'
import { dictionary, type Dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import type { TripCard as TripCardData } from '@/lib/data'
import { difficultyLabel } from '@/lib/difficulty'
import { formatNumber, formatPrice } from '@/lib/format'
import { getTripFaqGroups } from '@/lib/trip-faqs'
import { normalizeDepartures } from '@/lib/departures'
import { resolveTripBrochure, type TripBrochure } from '@/lib/trip-brochure'
import { resolveLink } from '@/lib/links'
import { cn } from '@/lib/utils'
import { hasRichTextContent } from '@/lib/rich-text-content'
import { breadcrumbJsonLd, faqJsonLd, touristTripJsonLd } from '@/lib/seo'
import type { Setting, Trip } from '@/payload-types'

/* ----------------------------------------------------------------------------
   Shared styling
   ---------------------------------------------------------------------------- */

/** Eyebrow for dark backgrounds (the shared `.eyebrow` utility is tuned for light ones).
    Paper grey rather than ember: at this size the warm accent sits under 4.5:1. */
const eyebrowOnDark = 'font-heading text-label font-medium tracking-[0.18em] text-mist uppercase'

function SectionTitle({
  title,
  className,
  level = 'h2',
}: {
  title: string
  className?: string
  level?: 'h2' | 'h3'
}) {
  const Heading = level

  return (
    <div className={cn('mb-10', className)}>
      <Heading className="heading-lg">{title}</Heading>
    </div>
  )
}

/* ----------------------------------------------------------------------------
   Sticky booking card — price, difficulty, duration and the booking CTA
   ---------------------------------------------------------------------------- */

function TripBookingCard({
  trip,
  dict,
  bookingHref,
  brochure,
  className,
}: {
  trip: Trip
  dict: Dictionary
  bookingHref: string
  brochure: TripBrochure | null
  className?: string
}) {
  const perGroup = trip.priceUnit === 'per-group'

  return (
    <div
      className={cn(
        'relative overflow-hidden border-t-2 border-sage bg-ink p-5 text-mist sm:p-7',
        className,
      )}
    >
      <div className="relative">
        <p className={eyebrowOnDark}>
          {perGroup ? dict.trip.pricePerGroup : dict.trip.pricePerPerson}
        </p>

        <div className="mt-4 bg-ink-80 px-5 py-4">
          <p className="font-display text-section leading-none text-white">
            {formatPrice(trip.priceFrom, trip.priceCurrency)}
          </p>
        </div>

        <dl className="mt-7 divide-y divide-white/10 border-t border-white/10">
          <div className="flex items-center justify-between gap-4 py-4">
            <dt className="flex items-center gap-2.5 text-ui text-mist/80">
              <Gauge className="size-4 text-sage-light" aria-hidden />
              {dict.trip.difficultyLevel}
            </dt>
            <dd>
              <span className="px-3 py-1 text-small font-medium text-white">
                {difficultyLabel(trip.difficulty)}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <dt className="flex items-center gap-2.5 text-ui text-mist/80">
              <Clock className="size-4 text-sage-light" aria-hidden />
              {dict.trip.duration}
            </dt>
            <dd className="text-right font-heading text-ui font-semibold text-white">
              {trip.durationDays} {dict.common.days}
              {trip.durationNights ? ` / ${trip.durationNights} ${dict.common.nights}` : ''}
            </dd>
          </div>
        </dl>

        <Button asChild size="lg" variant="sage" className="mt-6 h-13 w-full text-ui">
          <Link href={bookingHref}>
            {dict.trip.bookThisTrek}
            <ArrowRight aria-hidden />
          </Link>
        </Button>

        {/* Sits under the booking CTA — the brochure answers "what exactly am I booking?"
            at the moment the price and the button have the visitor's attention. */}
        {brochure ? <TripBrochureButton brochure={brochure} /> : null}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
   Route map, live map and altitude chart
   ---------------------------------------------------------------------------- */

/** The interactive route map and itinerary-generated altitude chart. */
function RouteMapSection({ trip }: { trip: Trip }) {
  const coordinates = parseCoordinates(trip.coordinates)
  const profile = altitudeProfile(trip.itinerary)
  if (!coordinates && !profile) return null

  const mapCard = coordinates ? (
    <CoordinatesMap
      key="live-map"
      name={trip.title}
      coords={coordinates}
      // A trailhead, not a region: close enough to read the valleys around the start.
      zoom={9}
      height="sm"
      heading="Live map"
      caption="Trailhead and route start"
      className={cn(surface, 'flex flex-col p-4 sm:p-6')}
    />
  ) : null

  const chartCard = profile ? (
    <div
      key="altitude-profile"
      className={cn(surface, 'flex min-w-0 flex-col overflow-hidden p-4 sm:p-6')}
    >
      <h3 className="mb-4 font-heading text-subhead font-semibold">Altitude chart</h3>
      <div className="flex min-w-0 flex-1">
        <AltitudeProfile days={trip.itinerary} className="w-full" title="Altitude chart" />
      </div>
    </div>
  ) : null
  const items = [mapCard, chartCard].filter(Boolean)

  return (
    <section id="route-map" className="scroll-mt-24 pb-16 md:pb-24">
      <SectionTitle title="Route map and altitude chart" />

      <div className="grid gap-6 md:grid-cols-2">{items}</div>
    </section>
  )
}

/* ----------------------------------------------------------------------------
   Page
   ---------------------------------------------------------------------------- */

/**
 * Trip detail view — shared by the public route (statically rendered) and the
 * preview route (draft mode), so editors see exactly what visitors will see.
 */
export function TripDetail({
  trip,
  related,
  settings,
  linker,
}: {
  trip: Trip
  related: TripCardData[]
  settings: Pick<Setting, 'siteName' | 'logo' | 'socials'>
  /**
   * The page's automated internal keyword linking, created by the route (see
   * `src/lib/internal-links.ts`). Omitted, every section renders exactly as it did before.
   */
  linker?: InternalLinker | null
}) {
  const dict = dictionary

  const destination =
    trip.destination && typeof trip.destination !== 'number' ? trip.destination : null

  /* "Trip at a glance" dashboard — shown inside the hero. */
  const facts: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Clock, label: dict.trip.duration, value: `${trip.durationDays} ${dict.common.days}` },
    trip.groupSizeMax
      ? { icon: Users, label: dict.trip.groupSize, value: `max ${trip.groupSizeMax}` }
      : null,
    trip.maxAltitude
      ? {
          icon: Mountain,
          label: dict.trip.maxAltitude,
          value: `${formatNumber(trip.maxAltitude)} m`,
        }
      : null,
    { icon: MapPin, label: dict.trip.destination, value: destination?.name ?? '—' },
  ].filter((fact): fact is NonNullable<typeof fact> => fact !== null)

  const sections = orderTripPageSections(resolvePageSections(trip.pageSections, tripSectionOptions))
  const hasInquiry = sections.some(({ kind }) => kind === 'inquiry')
  const inquiryHref = hasInquiry ? '#inquiry' : sitePath('/contact')
  const bookingLink = resolveLink(trip.bookingLink?.link)
  const bookingHref = bookingLink?.href ?? inquiryHref
  const faqGroups = getTripFaqGroups(trip)
  const faqs = faqGroups.flatMap(({ faqs: items }) => items)
  const highlights = trip.highlights?.filter(({ text }) => text.trim())
  const brochure = resolveTripBrochure(trip, trip.slug, dict.trip.downloadBrochure)
  const hasSection = (kind: string) => sections.some((section) => section.kind === kind)
  const tripNavItems = [
    {
      id: 'overview',
      label: 'Overview',
      kind: 'overview',
      hasContent: hasRichTextContent(trip.description),
    },
    {
      id: 'key-highlights',
      label: 'Highlights',
      kind: 'highlights',
      hasContent: Boolean(highlights?.length),
    },
    {
      id: 'itinerary',
      label: 'Itinerary',
      kind: 'itinerary',
      hasContent: Boolean(trip.itinerary?.length),
    },
    {
      id: 'essential-information',
      label: 'Essential Info',
      kind: 'information',
      hasContent: Boolean(trip.contentSections?.length),
    },
    {
      id: 'hotels-near-destination',
      label: dict.trip.hotelsNearDestination,
      kind: 'hotelsNearDestination',
      hasContent: Boolean(trip.hotelsNearDestination?.length),
    },
    {
      id: 'departures',
      label: 'Departures',
      kind: 'departures',
      hasContent:
        normalizeDepartures(trip.departureDates, {
          durationDays: trip.durationDays,
          priceFrom: trip.priceFrom,
        }).length > 0 || hasRichTextContent(trip.departures),
    },
    { id: 'faqs', label: 'FAQs', kind: 'faqs', hasContent: Boolean(faqGroups.length) },
  ].filter(({ kind, hasContent }) => hasSection(kind) && hasContent)

  const sectionContent: Record<string, PageSectionContent> = {
    hero: (
      <>
        <section
          data-header-hero
          // The band is a viewport tall, so the copy is bottom-aligned like
          // every other hero on the site (see `.hero-region` in globals.css,
          // and `Hero` / `PageHeader`): the masthead and the fact strip sit on
          // the foot of the photo, not floating in the sky above it.
          className="hero-region relative isolate flex items-end overflow-hidden bg-ink text-mist"
        >
          <PayloadImageFill
            media={trip.heroImage}
            sizes="100vw"
            priority
            className="-z-10"
            imageClassName="object-cover"
          />
          {/* One navy wash plus the shared photo scrim — no second, competing
              gradient, and no blur behind the copy. */}
          <div className="absolute inset-0 -z-10 bg-ink/72" />
          <div className="photo-scrim pointer-events-none absolute inset-0 -z-10" />

          <div className="container-content w-full pt-28 pb-12 sm:pb-16 md:pt-36 md:pb-20">
            <Breadcrumbs
              className="mb-8"
              items={[
                { label: dict.nav.home, href: sitePath('/') },
                { label: dict.nav.trips, href: sitePath('/trips') },
                { label: trip.title },
              ]}
            />

            <h1 className="heading-display hero-title max-w-4xl text-white">{trip.title}</h1>
            <p className="lead hero-description mt-6 max-w-2xl text-mist">{trip.summary}</p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="sage">
                <Link href={inquiryHref}>{dict.trip.enquire}</Link>
              </Button>
              {bookingLink ? (
                <Button asChild size="lg" variant="outline-light">
                  <Link href={bookingLink.href}>{bookingLink.label}</Link>
                </Button>
              ) : null}
            </div>

            {/* Fact dashboard. A 1px gap over a hairline tint draws the grid lines. */}
            <dl className="mt-10 grid grid-cols-1 gap-px overflow-hidden bg-white/12 xs:grid-cols-2 md:mt-14 md:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-center gap-4 bg-ink/72 p-5 md:p-6">
                  <span className="grid size-10 shrink-0 place-items-center bg-mist/12 text-mist">
                    <fact.icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[0.625rem] leading-[1.4] tracking-[0.14em] text-mist/75 uppercase md:text-label">
                      {fact.label}
                    </dt>
                    <dd className="mt-1 truncate font-heading text-[0.8125rem] leading-[1.5] font-semibold text-white md:text-ui">
                      {fact.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </>
    ),
    keyTakeaways: <KeyTakeawaysSection items={trip.keyTakeaways} />,
    overview: hasRichTextContent(trip.description) ? (
      <section id="overview" className="scroll-mt-24">
        <Reveal className="py-16 md:py-24">
          <SectionTitle title={dict.trip.overview} />
          <div className="prose-hg max-w-none leading-[1.8]">
            <RichText content={trip.description} linker={linker} />
          </div>
        </Reveal>
      </section>
    ) : null,
    whyChoose: hasRichTextContent(trip.whyChooseThisTrek) ? (
      <section id="why-choose-this-trek" className="scroll-mt-24 pb-16 md:pb-24">
        <SectionTitle title="Why Choose This Trek" />
        <RichText content={trip.whyChooseThisTrek} linker={linker} />
      </section>
    ) : null,
    routeMap: <RouteMapSection trip={trip} />,
    departures: (
      <DeparturesSection
        trip={trip}
        bookingHref={bookingHref}
        hasExternalBookingLink={Boolean(bookingLink)}
        linker={linker}
      />
    ),
    highlights: highlights?.length ? (
      <section
        id="key-highlights"
        aria-labelledby="key-highlights-heading"
        className="key-points-section scroll-mt-24 pb-16 md:pb-24"
      >
        <Reveal>
          <KeyPointsPanel
            title={dict.trip.highlights}
            titleId="key-highlights-heading"
            items={highlights}
          />
        </Reveal>
      </section>
    ) : null,
    audience: <TripAudienceSection trip={trip} linker={linker} />,
    // The card's URL lives in its own row, so the row is what the section reads.
    linkPreview: (section) => <LinkPreviewSection source={section} />,
    multiUrlPreview: (section) => <MultiUrlPreviewSection source={section} />,
    itinerary: <>{trip.itinerary?.length ? <ItinerarySection days={trip.itinerary} /> : null}</>,
    information: (
      <EssentialInformationSection
        title={dict.trip.essentialInformation}
        sections={trip.contentSections ?? []}
        linker={linker}
      />
    ),
    hotelsNearDestination: (
      <HotelsNearDestinationSection
        title={dict.trip.hotelsNearDestination}
        sections={trip.hotelsNearDestination ?? []}
        linker={linker}
      />
    ),
    inclusions: (
      <>
        {trip.included?.length || trip.notIncluded?.length ? (
          <Reveal as="section" className="py-16 md:py-24">
            <div className="grid gap-6 md:grid-cols-2">
              {trip.included?.length ? (
                <div className="border border-sage-40 bg-sage-20 p-5 sm:p-8 md:p-10">
                  <h2 className="heading-md mb-7">{dict.trip.included}</h2>
                  <ul className="space-y-4">
                    {trip.included.map((item) => (
                      <li key={item.id ?? item.item} className="flex items-start gap-3.5">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center bg-deep text-white">
                          <Check className="size-3.5" strokeWidth={3} aria-hidden />
                        </span>
                        <span className="text-ui leading-relaxed text-ink-80">{item.item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {trip.notIncluded?.length ? (
                <div className={cn(surface, 'p-5 sm:p-8 md:p-10')}>
                  <h2 className="heading-md mb-7">{dict.trip.notIncluded}</h2>
                  <ul className="space-y-4">
                    {trip.notIncluded.map((item) => (
                      <li key={item.id ?? item.item} className="flex items-start gap-3.5">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center bg-mist text-slate-80">
                          <X className="size-3.5" strokeWidth={3} aria-hidden />
                        </span>
                        <span className="text-ui leading-relaxed text-ink-60">{item.item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Reveal>
        ) : null}
      </>
    ),
    // Three accordions (Clothing and Footwear, Trekking Equipment, Personal Items) under a
    // packing dashboard — grouping, the legible count and the tickable checklist all live in the
    // section so the preview and the public page cannot drift apart.
    packing: <TripPackingSection rows={trip.packingList} tripSlug={trip.slug ?? 'trip'} />,
    faqs: <FaqSection title={dict.trip.faqs} groups={faqGroups} />,
    gallery: (
      <>
        {trip.gallery?.length ? (
          <Reveal as="section" className="py-16 md:py-24">
            <SectionTitle title={dict.trip.gallery} />
            <div className="grid gap-5 sm:grid-cols-2">
              {trip.gallery.map((item, index) => (
                <Reveal key={item.id ?? index} delay={index * 60}>
                  <div className="photo-plate group">
                    <PayloadImage
                      media={item.image}
                      sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 92vw"
                      className="aspect-[4/3] w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        ) : null}
      </>
    ),
    inquiry: (
      <CtaCard
        eyebrow={dict.cta.eyebrow}
        heading={dict.cta.heading}
        text={dict.inquiry.subtitle}
        link={{ href: sitePath('/contact'), label: dict.cta.action }}
        variant="dark"
      />
    ),
    related: (
      <>
        {related.length ? (
          <section className="py-16 md:py-24">
            <div className="container-content">
              <SectionTitle title={dict.trip.related} />
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
                {related.map((item, index) => (
                  <Reveal key={item.id} delay={index * 70}>
                    <TripCard trip={item} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </>
    ),
  }
  // Custom HTML stays with the body sections so it uses the same main column and single sticky
  // booking sidebar instead of splitting the page into another full-width group.
  const groups = groupPageSections(sections, ['hero', 'inquiry', 'related'])
  const lastBodyGroup = groups.findLast((group) => !group.fullWidth)
  const firstBodyGroupIndex = groups.findIndex((group) => !group.fullWidth)
  const hasHeroSection = sections.some(({ kind }) => kind === 'hero')
  const guideProfile = (
    <AuthorProfile author={trip.guide} label={dict.trip.aboutGuide} className="mt-0 mb-16" />
  )

  const bookingAnchor =
    sections.find(({ kind }) => kind === 'highlights') ??
    sections.find(({ kind }) => kind === 'overview') ??
    groups.find((group) => !group.fullWidth)?.sections[0]

  return (
    <>
      {groups.map((group, groupIndex) => {
        const content = group.sections.map((section, index) => (
          <Fragment key={section.id ?? `${section.kind}-${index}`}>
            {section.kind === 'html' ? (
              <CustomHtmlSection section={section} variant="trip" />
            ) : (
              resolveSectionContent(sectionContent, section)
            )}
            {section === bookingAnchor ? (
              <div className="mb-16 lg:hidden">
                <TripBookingCard
                  trip={trip}
                  dict={dict}
                  bookingHref={bookingHref}
                  brochure={brochure}
                />
              </div>
            ) : null}
          </Fragment>
        ))
        if (group.fullWidth) {
          return (
            <Fragment key={groupIndex}>
              {content}
              {group.sections.some(({ kind }) => kind === 'hero') ? (
                <TripSectionNav items={tripNavItems} />
              ) : null}
            </Fragment>
          )
        }
        return (
          <Fragment key={groupIndex}>
            {!hasHeroSection && groupIndex === firstBodyGroupIndex ? (
              <TripSectionNav items={tripNavItems} />
            ) : null}
            <div className="container-content grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14 3xl:grid-cols-[minmax(0,1fr)_26rem]">
              <div className="single-page-body min-w-0">
                {content}
                {group === lastBodyGroup ? guideProfile : null}
              </div>
              <aside className="hidden lg:sticky lg:top-28 lg:mt-16 lg:block lg:self-start">
                <TripBookingCard
                  trip={trip}
                  dict={dict}
                  bookingHref={bookingHref}
                  brochure={brochure}
                />
              </aside>
            </div>
          </Fragment>
        )
      })}
      <PlaceCategoryLinks values={trip.placeCategories} className="mt-16 md:mt-24" />
      <p className="container-content my-8 text-small">
        {dict.common.affiliateDescription} We may earn a commission if you book through a partner
        link.
      </p>
      {/* A layout with no body column still needs visible attribution for its schema. */}
      {!lastBodyGroup ? <div className="container-content">{guideProfile}</div> : null}

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: sitePath('/') },
            { name: dict.nav.trips, url: sitePath('/trips') },
            { name: trip.title, url: sitePath(`/trips/${trip.slug}`) },
          ]),
          touristTripJsonLd({
            trip,
            url: sitePath(`/trips/${trip.slug}`),
            // The Media document, not its `url`: `schemaImageUrl()` turns it into the absolute URL
            // structured data requires (a relative one is dropped from the rich result).
            image: trip.heroImage,
            destinationName: destination?.name,
            siteName: settings.siteName,
            organizationLogo: settings.logo,
            organizationSocials: settings.socials,
          }),
          ...(faqs.length && sections.some(({ kind }) => kind === 'faqs')
            ? [faqJsonLd(faqs.map((faq) => ({ question: faq.question, answer: faq.answer ?? '' })))]
            : []),
        ]}
      />
    </>
  )
}
