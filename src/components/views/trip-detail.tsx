import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

import { CustomHtmlSection } from '@/components/content/custom-html-section'
import { RichText } from '@/components/content/rich-text'
import { JsonLd } from '@/components/seo/json-ld'
import { TripCard } from '@/components/cards/trip-card'
import { Reveal } from '@/components/motion/reveal'
import { InquiryForm } from '@/components/forms/inquiry-form'
import { FaqSection } from '@/components/sections/faq-section'
import { DeparturesSection } from '@/components/sections/departures-section'
import { ItinerarySection } from '@/components/sections/itinerary-section'
import { PayloadImage } from '@/components/ui/payload-image'
import { surface } from '@/components/ui/surface'
import { TripHero } from '@/components/trip/trip-hero'
import { TripBookingCard } from '@/components/trip/trip-booking-card'
import { TripSectionHeading } from '@/components/trip/trip-section-heading'
import { TripSectionNav } from '@/components/trip/trip-section-nav'
import { TripHighlights } from '@/components/trip/trip-highlights'
import { TripInclusions } from '@/components/trip/trip-inclusions'
import { TripPackingList } from '@/components/trip/trip-packing-list'
import { TripGallery } from '@/components/trip/trip-gallery'
import { TripTrustBand } from '@/components/trip/trip-trust-band'
import { TripMobileBar } from '@/components/trip/trip-mobile-bar'
import { dictionary, type Dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import type { TripCard as TripCardData } from '@/lib/data'
import { normalizeDepartures } from '@/lib/departures'
import { hasRichTextContent } from '@/lib/rich-text-content'
import { formatPrice } from '@/lib/format'
import { resolveLink } from '@/lib/links'
import { getTripFaqGroups } from '@/lib/trip-faqs'
import {
  departureCountdown,
  nextDeparture,
  tripAnchors,
  trustBandBreak,
  type NextDeparture,
} from '@/lib/trip-page'
import { groupPageSections, resolvePageSections, tripSectionOptions } from '@/lib/page-sections'
import { cn } from '@/lib/utils'
import { breadcrumbJsonLd, faqJsonLd, touristTripJsonLd } from '@/lib/seo'
import type { Trip } from '@/payload-types'

/* ----------------------------------------------------------------------------
   Shared bits
   ---------------------------------------------------------------------------- */

/**
 * Eyebrow for dark backgrounds, where the light-tuned `.eyebrow` utility has no
 * contrast. Used by the inquiry band.
 */
const eyebrowOnDark =
  'font-heading text-[0.75rem] font-semibold tracking-[0.18em] text-sage uppercase'

/**
 * Which section kinds have content on this page.
 *
 * `tripAnchors()` uses this so the sticky nav never links to a section that
 * renders nothing — an FAQ anchor with no questions is worse than no anchor.
 */
function visibleSectionKinds(trip: Trip, faqCount: number, departureCount: number): Set<string> {
  const visible = new Set<string>()
  if (hasRichTextContent(trip.description)) visible.add('overview')
  if (trip.itinerary?.length) visible.add('itinerary')
  if (departureCount > 0 || hasRichTextContent(trip.departures)) visible.add('departures')
  if (trip.keyTakeaways?.some(({ text }) => text?.trim())) visible.add('keyTakeaways')
  if (hasRichTextContent(trip.whyChooseThisTrek)) visible.add('whyChoose')
  if (trip.highlights?.some(({ text }) => text?.trim())) visible.add('highlights')
  if (
    hasRichTextContent(trip.routeMapContent) ||
    (trip.routeMap && typeof trip.routeMap !== 'number') ||
    (trip.altitudeChart && typeof trip.altitudeChart !== 'number')
  ) {
    visible.add('routeMap')
  }
  if (trip.contentSections?.length) visible.add('information')
  if (trip.included?.length || trip.notIncluded?.length) visible.add('inclusions')
  if (trip.packingList?.length) visible.add('packing')
  if (faqCount > 0) visible.add('faqs')
  if (trip.gallery?.length) visible.add('gallery')
  // The inquiry block always renders when the editor has kept it in the layout.
  visible.add('inquiry')
  return visible
}

/* ----------------------------------------------------------------------------
   Page
   ---------------------------------------------------------------------------- */

/**
 * Trip detail view — shared by the public route (statically rendered) and the
 * preview route (draft mode), so editors see exactly what visitors will see.
 *
 * LAYOUT, top to bottom:
 *   1. `<TripHero>`            cinematic photo, title, actions, five-fact strip
 *   2. `<TripSectionNav>`      sticky in-page anchor strip (client island)
 *   3. content column + rail   2-column from `lg`, booking card sticky in the rail
 *   4. `<TripTrustBand>`       full-bleed dark band breaking up the white column
 *   5. inquiry, related trips  full-bleed closing bands
 *
 * Everything except the section nav and the itinerary/date pickers is server
 * rendered — the page's weight is CSS and photography, not JavaScript.
 */
export function TripDetail({
  trip,
  related,
  tripOptions,
  formEmail,
  whatsapp,
  phone,
}: {
  trip: Trip
  related: TripCardData[]
  tripOptions: { id: number; title: string; slug: string }[]
  formEmail: string
  /** Settings' WhatsApp number (digits only) — rendered as a direct-chat CTA. */
  whatsapp?: string | null
  /** Settings' phone number — rendered as a click-to-call in the booking card. */
  phone?: string | null
}) {
  const dict: Dictionary = dictionary

  const destination =
    trip.destination && typeof trip.destination !== 'number' ? trip.destination : null

  const sections = resolvePageSections(trip.pageSections, tripSectionOptions)
  const hasInquiry = sections.some(({ kind }) => kind === 'inquiry')
  const inquiryHref = hasInquiry ? '#inquiry' : sitePath('/inquiry')
  const bookingLink = resolveLink(trip.bookingLink?.link)
  const bookingHref = bookingLink?.href ?? inquiryHref
  const faqGroups = getTripFaqGroups(trip)
  const faqs = faqGroups.flatMap(({ faqs: items }) => items)

  /* The next bookable departure — the scarcest line on the page, so it is
     computed once here and shared by the booking card(s). */
  const departures = normalizeDepartures(trip.departureDates, {
    durationDays: trip.durationDays,
    priceFrom: trip.priceFrom,
  })
  const next: NextDeparture | null = nextDeparture(departures, {
    groupSizeMax: trip.groupSizeMax,
  })

  const visible = visibleSectionKinds(trip, faqs.length, departures.length)
  const anchors = tripAnchors(
    sections.map(({ kind }) => kind),
    visible,
  )

  /* ------------------------------------------------------------------------ */
  /* Sections                                                                  */
  /* ------------------------------------------------------------------------ */

  const sectionContent: Record<string, ReactNode> = {
    hero: (
      <TripHero
        trip={trip}
        destination={destination}
        amountHref={departures.length ? '#departures' : '#itinerary'}
        hasDepartures={departures.length > 0}
        whatsapp={whatsapp}
      />
    ),

    keyTakeaways: (
      <TripHighlights
        id="key-takeaways"
        title={dict.trip.keyTakeawaysHeading}
        eyebrow={dict.trip.sectionGlance}
        kicker={dict.trip.fieldNotes}
        items={trip.keyTakeaways}
        className="trip-section first:pt-0"
      />
    ),

    overview: (
      <section id="overview" className="trip-section">
        <Reveal>
          <TripSectionHeading eyebrow={dict.trip.sectionOverview} title={dict.trip.overview} />
          <div className="prose-hg max-w-none leading-[1.8]">
            <RichText content={trip.description} />
          </div>
        </Reveal>
      </section>
    ),

    whyChoose: hasRichTextContent(trip.whyChooseThisTrek) ? (
      <section id="why-choose-this-trek" className="trip-section">
        <TripSectionHeading
          eyebrow={dict.trip.sectionHighlights}
          title={dict.trip.whyChooseHeading}
        />
        <div className="prose-hg max-w-none">
          <RichText content={trip.whyChooseThisTrek} />
        </div>
      </section>
    ) : null,

    routeMap:
      hasRichTextContent(trip.routeMapContent) ||
      (trip.routeMap && typeof trip.routeMap !== 'number') ||
      (trip.altitudeChart && typeof trip.altitudeChart !== 'number') ? (
        <section id="route-map" className="trip-section">
          <TripSectionHeading
            eyebrow={dict.trip.sectionRoute}
            title={dict.trip.routeMapHeading}
          />
          {hasRichTextContent(trip.routeMapContent) ? (
            <RichText content={trip.routeMapContent} className="mb-8" />
          ) : null}
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { media: trip.routeMap, label: 'Original route map' },
              { media: trip.altitudeChart, label: 'Altitude chart' },
            ].map(({ media, label }) =>
              media && typeof media !== 'number' ? (
                <figure key={label} className={cn(surface, 'overflow-hidden p-4 sm:p-5')}>
                  <figcaption className="mb-3 flex items-center gap-2 font-heading text-[0.75rem] font-semibold tracking-[0.12em] text-deep uppercase">
                    <span aria-hidden className="h-3 w-1 bg-sage" />
                    {label}
                  </figcaption>
                  <PayloadImage
                    media={media}
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    imageClassName="h-auto object-contain"
                  />
                </figure>
              ) : null,
            )}
          </div>
        </section>
      ) : null,

    departures: (
      <DeparturesSection
        trip={trip}
        bookingHref={bookingHref}
        hasExternalBookingLink={Boolean(bookingLink)}
      />
    ),

    highlights: (
      <TripHighlights
        id="highlights"
        title={dict.trip.highlights}
        eyebrow={dict.trip.sectionHighlights}
        kicker={dict.trip.fieldNotes}
        items={trip.highlights}
        className="trip-section"
      />
    ),

    itinerary: trip.itinerary?.length ? <ItinerarySection days={trip.itinerary} /> : null,

    information: trip.contentSections?.length ? (
      <section id="essential-information" className="trip-section">
        <TripSectionHeading
          eyebrow={dict.trip.sectionIncludes}
          title={dict.trip.essentialInformation}
        />
        <div className="space-y-3">
          {trip.contentSections.map((contentSection, index) => (
            <details
              key={contentSection.id ?? index}
              className="group border border-ink/[0.08] bg-white open:border-deep/25 open:shadow-[0_18px_40px_-30px_rgba(4,21,31,0.35)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-heading text-base font-semibold text-ink transition-colors hover:text-deep md:px-6 md:py-5">
                <span className="min-w-0">{contentSection.heading}</span>
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-ink/10 text-deep transition-transform duration-300 group-open:rotate-45"
                >
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" strokeWidth="2">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <div className="border-t border-ink/[0.06] px-5 pt-4 pb-5 md:px-6">
                <RichText
                  content={contentSection.content}
                  className="w-full min-w-0 break-words text-[1rem]"
                />
              </div>
            </details>
          ))}
        </div>
      </section>
    ) : null,

    inclusions: (
      <TripInclusions
        included={trip.included}
        notIncluded={trip.notIncluded}
        className="trip-section"
      />
    ),

    packing: <TripPackingList items={trip.packingList ?? []} className="trip-section" />,

    faqs: (
      <FaqSection
        title={dict.trip.faqs}
        eyebrow={dict.trip.sectionFaqs}
        groups={faqGroups}
        headingVariant="trip"
      />
    ),

    gallery: <TripGallery gallery={trip.gallery ?? []} className="trip-section" />,

    inquiry: (
      <section id="inquiry" className="trip-band-dark scroll-mt-24">
        <div className="container-content py-16 md:py-24">
          <div className="grid gap-10 xl:grid-cols-[0.8fr_1.2fr] xl:gap-16">
            <div>
              <p className={eyebrowOnDark}>{dict.trip.sectionInquiry}</p>
              <h2 className="heading-lg mt-3 text-white">{dict.inquiry.title}</h2>
              <p className="lead mt-5 text-mist/70">{dict.inquiry.subtitle}</p>

              <ul className="mt-8 space-y-3 border-t border-white/10 pt-6">
                {[dict.trip.assuranceLocal, dict.trip.assuranceReply, dict.trip.assuranceFees].map(
                  (line) => (
                    <li key={line} className="flex items-start gap-3 text-[0.9375rem] text-mist/75">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sage/20 text-sage">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      {line}
                    </li>
                  ),
                )}
              </ul>

              {whatsapp || phone ? (
                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[0.9375rem]">
                  {whatsapp ? (
                    <a
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-medium text-sage underline-offset-4 hover:underline"
                    >
                      WhatsApp us
                    </a>
                  ) : null}
                  {phone ? (
                    <a
                      href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                      className="inline-flex items-center gap-2 font-medium text-sage underline-offset-4 hover:underline"
                    >
                      {phone}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>

            <InquiryForm
              trips={tripOptions}
              email={formEmail}
              defaultTripSlug={trip.slug}
              variant="dark"
            />
          </div>
        </div>
      </section>
    ),

    related: related.length ? (
      <section className="py-16 md:py-24">
        <div className="container-content">
          <TripSectionHeading
            eyebrow={dict.trip.sectionGlance}
            title={dict.trip.related}
            action={
              <Link
                href={sitePath('/trips')}
                className="inline-flex items-center gap-2 font-heading text-[0.8125rem] font-semibold tracking-[0.06em] text-deep underline-offset-4 hover:underline"
              >
                {dict.common.viewAll}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
            {related.map((item, index) => (
              <Reveal key={item.id} delay={index * 70}>
                <TripCard trip={item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    ) : null,
  }

  /* ------------------------------------------------------------------------ */
  /* Assembly                                                                  */
  /* ------------------------------------------------------------------------ */

  const groups = groupPageSections(sections, ['hero', 'inquiry', 'related'])

  /**
   * The mobile booking card drops in after the first *content* section (the
   * highlights or the overview), so the price is reachable within one screen of
   * the hero without a sticky rail. Desktop gets the rail instead.
   */
  const renders = (kind: string) =>
    kind === 'html' || Boolean(visible.has(kind) && sectionContent[kind])

  const bookingAnchor =
    sections.find(({ kind }) => kind === 'highlights' && renders(kind)) ??
    sections.find(({ kind }) => kind === 'keyTakeaways' && renders(kind)) ??
    sections.find(({ kind }) => kind === 'overview' && renders(kind)) ??
    groups.find((group) => !group.fullWidth)?.sections.find(({ kind }) => renders(kind))

  const bookingCard = (className?: string) => (
    <TripBookingCard
      trip={trip}
      bookingHref={bookingHref}
      inquiryHref={inquiryHref}
      next={next}
      whatsapp={whatsapp}
      phone={phone}
      className={className}
    />
  )

  /**
   * Where the dark trust band interrupts the white column.
   *
   * `groupPageSections` merges every adjacent body section into a single run, so
   * the break is computed against the *sections* (see `trustBandBreak`) and then
   * applied inside the body group at that offset. A `Map` rather than a counter:
   * group indices are stable, section indices are not.
   */
  const bodyGroupIndex = groups.findIndex((group) => !group.fullWidth)
  const bodySections = bodyGroupIndex === -1 ? [] : groups[bodyGroupIndex]!.sections

  /**
   * Only sections that actually render are counted, so a trip with sparse content
   * cannot end up with the band sitting directly under the hero (where it would
   * read as a second opening) because four empty sections happened to precede it.
   */
  const renderedBody = bodySections.filter(({ kind }) => renders(kind))
  const breakInRendered = trustBandBreak(renderedBody)
  const splitAfter =
    breakInRendered === -1
      ? -1
      : (() => {
          const last = bodySections.indexOf(renderedBody[breakInRendered]!)
          // Absorb any empty sections that follow the break into the first column,
          // so the band never opens the second column with dead space.
          let end = last
          while (end + 1 < bodySections.length && !renders(bodySections[end + 1]!.kind)) end += 1
          return end
        })()

  return (
    <div data-trip-page="">
      <TripSectionNav
        anchors={anchors}
        label={dict.trip.onThisPage}
        withPrice={
          bookingLink
            ? { href: bookingHref, label: dict.trip.bookNow }
            : { href: inquiryHref, label: dict.trip.enquireNow }
        }
      />

      {groups.map((group, groupIndex) => {
        const renderSection = (section: (typeof group.sections)[number], index: number) => (
          <Fragment key={section.id ?? `${section.kind}-${index}`}>
            {section.kind === 'html' ? (
              <CustomHtmlSection section={section} />
            ) : (
              sectionContent[section.kind]
            )}
            {/* Mobile: the price and the CTA arrive with the first content
                section, so they are reachable without the desktop rail. */}
            {section === bookingAnchor ? (
              <div className="lg:hidden">{bookingCard('my-10')}</div>
            ) : null}
          </Fragment>
        )

        if (group.fullWidth) {
          return (
            <Fragment key={groupIndex}>
              {group.sections.map((section, index) => renderSection(section, index))}
            </Fragment>
          )
        }

        /* One grid per body run: the trust band goes *inside* the content column
           (variant="column") so the sticky booking rail keeps tracking beside it,
           and the page never shows two booking cards side by side on desktop. */
        const split = groupIndex === bodyGroupIndex ? splitAfter : -1

        return (
          <div
            key={groupIndex}
            className="container-content grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14 3xl:grid-cols-[minmax(0,1fr)_26rem]"
          >
            <div className="single-page-body min-w-0">
              {group.sections.map((section, index) => (
                <Fragment key={section.id ?? `${section.kind}-${index}`}>
                  {renderSection(section, index)}
                  {split === index ? <TripTrustBand variant="column" /> : null}
                </Fragment>
              ))}
            </div>
            <aside className="hidden lg:sticky lg:top-24 lg:mt-12 lg:block lg:self-start">
              {bookingCard()}
            </aside>
          </div>
        )
      })}

      {/* Phone-only sticky price + CTA. Both hrefs are the same ones the
          booking cards use, so there is a single source of truth for "book". */}
      <TripMobileBar
        priceLabel={
          trip.priceUnit === 'per-group' ? dict.trip.pricePerGroup : dict.trip.pricePerPerson
        }
        unitLabel={trip.priceUnit === 'per-group' ? dict.common.perGroup : dict.common.perPerson}
        price={formatPrice(trip.priceFrom, trip.priceCurrency)}
        nextLabel={
          next ? `${dict.trip.nextDeparture} · ${next.startLabel} (${departureCountdown(next.daysAway)})` : null
        }
        href={bookingHref}
        enquiryHref={inquiryHref}
      />

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
            siteName: dict.structuredData.organization,
          }),
          ...(faqs.length && sections.some(({ kind }) => kind === 'faqs')
            ? [faqJsonLd(faqs.map((faq) => ({ question: faq.question, answer: faq.answer ?? '' })))]
            : []),
        ]}
      />
    </div>
  )
}
