import Link from 'next/link'
import { CalendarDays, Check, Clock, MapPin, Mountain, Users, X } from 'lucide-react'

import { RichText } from '@/components/content/rich-text'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { TripCard } from '@/components/cards/trip-card'
import { Reveal } from '@/components/motion/reveal'
import { InquiryForm } from '@/components/forms/inquiry-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { PayloadImageFill, PayloadImage } from '@/components/ui/payload-image'
import { getDictionary } from '@/i18n/dictionaries'
import { localizedPath, type Locale } from '@/i18n/config'
import type { TripCard as TripCardData } from '@/lib/data'
import { formatNumber, formatPrice } from '@/lib/format'
import { resolveLink } from '@/lib/links'
import { breadcrumbJsonLd, faqJsonLd, touristTripJsonLd } from '@/lib/seo'
import type { Trip } from '@/payload-types'

const difficultyVariant: Record<string, 'sage' | 'light' | 'outline' | 'default' | 'muted'> = {
  easy: 'sage',
  moderate: 'light',
  challenging: 'outline',
  strenuous: 'outline',
  extreme: 'default',
}

/**
 * Trip detail view — shared by the public route (statically rendered) and the
 * preview route (draft mode), so editors see exactly what visitors will see.
 */
export function TripDetail({
  trip,
  locale,
  related,
  tripOptions,
  formEmail,
}: {
  trip: Trip
  locale: Locale
  related: TripCardData[]
  tripOptions: { id: number; title: string; slug: string }[]
  formEmail: string
}) {
  const dict = getDictionary(locale)

  const destination =
    trip.destination && typeof trip.destination !== 'number' ? trip.destination : null

  const facts = [
    { icon: Clock, label: dict.trip.duration, value: `${trip.durationDays} ${dict.common.days}` },
    trip.groupSizeMax
      ? { icon: Users, label: dict.trip.groupSize, value: `max ${trip.groupSizeMax}` }
      : null,
    trip.maxAltitude
      ? {
          icon: Mountain,
          label: dict.trip.maxAltitude,
          value: `${formatNumber(trip.maxAltitude, locale)} m`,
        }
      : null,
    {
      icon: MapPin,
      label: dict.trip.destination,
      value: destination?.name ?? '—',
    },
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[]

  const seasons =
    trip.bestSeasons?.map(
      (season) =>
        dict.destinations[
          `season${season.charAt(0).toUpperCase()}${season.slice(1)}` as keyof typeof dict.destinations
        ] ?? season,
    ) ?? []

  const bookingLink = resolveLink(trip.bookingLink?.link, locale)

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative isolate min-h-[70svh] overflow-hidden bg-ink text-mist">
        <PayloadImageFill
          media={trip.heroImage}
          size="hero"
          sizes="100vw"
          priority
          className="-z-10"
          imageClassName="object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-ink/60" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-ink/85 to-transparent" />

        <div className="container-content pt-28 pb-16 md:pt-36 md:pb-20">
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: dict.nav.home, href: localizedPath(locale, '/') },
              { label: dict.nav.trips, href: localizedPath(locale, '/trips') },
              { label: trip.title },
            ]}
          />

          <div className="flex flex-wrap items-center gap-3">
            {destination ? (
              <Link
                href={localizedPath(locale, `/destinations/${destination.slug}`)}
                className="rounded-full bg-white/10 px-3 py-1 text-[0.75rem] tracking-[0.14em] text-sage uppercase backdrop-blur transition-colors hover:bg-white/20"
              >
                {destination.name}
              </Link>
            ) : null}
            <Badge variant="sage">{dict.trip.factsTitle}</Badge>
          </div>

          <h1 className="heading-xl mt-5 max-w-4xl text-white">{trip.title}</h1>
          <p className="lead mt-5 max-w-2xl text-mist/85">{trip.summary}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="sage">
              <Link href="#inquiry">{dict.trip.enquire}</Link>
            </Button>
            {bookingLink ? (
              <Button asChild size="lg" variant="outline-light">
                <Link href={bookingLink.href}>{bookingLink.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* ---------------- Facts bar ---------------- */}
      <section className="border-b border-black/[0.06] bg-mist">
        <div className="container-content grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-20 text-deep">
                <fact.icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[0.6875rem] tracking-[0.14em] text-slate uppercase">{fact.label}</p>
                <p className="font-heading text-[0.9375rem] font-semibold text-ink">{fact.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Overview + highlights ---------------- */}
      <section className="py-16 md:py-24">
        <div className="container-content grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <div>
            <h2 className="heading-lg">{dict.trip.overview}</h2>
            <div className="mt-6">
              <RichText content={trip.description} locale={locale} />
            </div>

            {trip.highlights?.length ? (
              <div className="mt-12">
                <h3 className="heading-md">{dict.trip.highlights}</h3>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {trip.highlights.map((highlight) => (
                    <li key={highlight.id ?? highlight.text} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sage/60 text-ink">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      <span className="text-[0.9375rem] leading-relaxed text-ink-80">{highlight.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Sticky booking card */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-black/[0.06] bg-card p-7 shadow-[0_1px_2px_rgba(1,22,30,0.04)]">
              <p className="eyebrow mb-3 text-slate">{dict.common.from}</p>
              <p className="font-heading text-4xl font-semibold tracking-tight text-ink">
                {formatPrice(trip.priceFrom, trip.priceCurrency, locale)}
              </p>
              <p className="mt-1 text-[0.8125rem] text-slate">
                {trip.priceUnit === 'per-group' ? dict.common.perGroup : dict.common.perPerson}
              </p>
              {trip.priceNote ? (
                <p className="mt-2 text-[0.8125rem] text-ink-60">{trip.priceNote}</p>
              ) : null}

              <dl className="mt-7 space-y-4 border-t border-black/[0.06] pt-6 text-[0.9375rem]">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate">{dict.trip.difficulty}</dt>
                  <dd>
                    <Badge variant={difficultyVariant[trip.difficulty] ?? 'light'}>
                      {dict.trips[
                        `difficulty${trip.difficulty.charAt(0).toUpperCase()}${trip.difficulty.slice(1)}` as keyof typeof dict.trips
                      ] ?? trip.difficulty}
                    </Badge>
                  </dd>
                </div>
                {seasons.length ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate">{dict.trip.bestSeason}</dt>
                    <dd className="text-right text-ink">{seasons.join(' · ')}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate">{dict.trip.duration}</dt>
                  <dd className="text-ink">
                    {trip.durationDays} {dict.common.days}
                    {trip.durationNights ? ` / ${trip.durationNights} ${dict.common.nights}` : ''}
                  </dd>
                </div>
                {trip.tripType ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate">{dict.trips.typeTrekking}</dt>
                    <dd className="text-ink">
                      {dict.trips[
                        `type${trip.tripType
                          .split('-')
                          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                          .join('')}` as keyof typeof dict.trips
                      ] ?? trip.tripType}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <Button asChild size="lg" className="mt-7 w-full">
                <Link href="#inquiry">{dict.trip.enquire}</Link>
              </Button>
              {bookingLink ? (
                <Button asChild size="lg" variant="outline" className="mt-3 w-full">
                  <Link href={bookingLink.href}>{bookingLink.label}</Link>
                </Button>
              ) : null}

              <p className="mt-5 flex items-center gap-2 text-[0.8125rem] text-slate">
                <CalendarDays className="size-4" aria-hidden />
                {dict.inquiry.flexible}
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ---------------- Itinerary ---------------- */}
      {trip.itinerary?.length ? (
        <section id="itinerary" className="scroll-mt-24 bg-mist py-16 md:py-24">
          <div className="container-content">
            <h2 className="heading-lg mb-10">{dict.trip.itinerary}</h2>

            <Accordion type="multiple" className="space-y-3">
              {trip.itinerary.map((day, index) => (
                <AccordionItem
                  key={day.id ?? index}
                  value={`day-${day.id ?? index}`}
                  className="overflow-hidden rounded-2xl border border-black/[0.06] bg-card px-5 shadow-[0_1px_2px_rgba(1,22,30,0.04)] last:border-b last:border-black/[0.06] md:px-7"
                >
                  <AccordionTrigger className="items-center py-5 hover:no-underline md:py-6">
                    <span className="flex min-w-0 items-center gap-4">
                      <span
                        aria-hidden="true"
                        className="grid size-10 shrink-0 place-items-center rounded-full border border-sage bg-mist font-heading text-sm font-semibold text-deep"
                      >
                        {day.day}
                      </span>
                      <span className="min-w-0 text-left">
                        <span className="block font-heading text-base font-semibold text-ink md:text-lg">
                          {day.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-slate md:text-[0.8125rem]">
                          <span className="tracking-[0.12em] uppercase">
                            {dict.trip.day} {day.day}
                          </span>
                          {day.altitude ? (
                            <span className="flex items-center gap-1.5">
                              <Mountain className="size-3.5" aria-hidden />
                              {formatNumber(day.altitude, locale)} m
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-14 md:pl-[3.5rem]">
                    <p className="leading-relaxed text-ink-70">{day.description}</p>
                    {day.accommodation ? (
                      <p className="mt-3 text-[0.8125rem] text-slate">
                        {dict.trip.accommodation}: {day.accommodation}
                      </p>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      ) : null}

      {/* ---------------- Additional headed content ---------------- */}
      {trip.contentSections?.length ? (
        <div className="bg-mist py-16 md:py-24">
          {/* Match the itinerary container. Each heading sits above its own full-width content box. */}
          <div className="container-content space-y-12 md:space-y-16">
            {trip.contentSections.map((contentSection, index) => (
              <section
                key={contentSection.id ?? index}
                aria-labelledby={`trip-content-heading-${index}`}
                className="min-w-0 w-full"
              >
                <h2 id={`trip-content-heading-${index}`} className="heading-lg mb-8 md:mb-10">
                  {contentSection.heading}
                </h2>
                <div className="rounded-2xl border border-black/[0.06] bg-card p-6 shadow-[0_1px_2px_rgba(1,22,30,0.04)] md:p-8">
                  <RichText
                    content={contentSection.content}
                    locale={locale}
                    className="w-full min-w-0 break-words"
                  />
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}

      {/* ---------------- Included / not included ---------------- */}
      {(trip.included?.length || trip.notIncluded?.length) ? (
        <section className="py-16 md:py-24">
          <div className="container-content grid gap-10 md:grid-cols-2">
            {trip.included?.length ? (
              <div className="rounded-2xl bg-sage-20 p-8">
                <h2 className="heading-md mb-6">{dict.trip.included}</h2>
                <ul className="space-y-3">
                  {trip.included.map((item) => (
                    <li key={item.id ?? item.item} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-deep" strokeWidth={3} aria-hidden />
                      <span className="text-[0.9375rem] leading-relaxed text-ink-80">{item.item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {trip.notIncluded?.length ? (
              <div className="rounded-2xl border border-black/[0.06] p-8">
                <h2 className="heading-md mb-6">{dict.trip.notIncluded}</h2>
                <ul className="space-y-3">
                  {trip.notIncluded.map((item) => (
                    <li key={item.id ?? item.item} className="flex items-start gap-3">
                      <X className="mt-0.5 size-4 shrink-0 text-slate" strokeWidth={3} aria-hidden />
                      <span className="text-[0.9375rem] leading-relaxed text-ink-60">{item.item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ---------------- Gallery ---------------- */}
      {trip.gallery?.length ? (
        <section className="bg-mist py-16 md:py-24">
          <div className="container-content">
            <h2 className="heading-lg mb-10">{dict.trip.gallery}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trip.gallery.map((item, index) => (
                <Reveal key={item.id ?? index} delay={index * 60}>
                  <div className="overflow-hidden rounded-2xl bg-mist-60">
                    <PayloadImage
                      media={item.image}
                      size="tablet"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 45vw, 92vw"
                      className="aspect-[4/3] w-full"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------- Inquiry ---------------- */}
      <section id="inquiry" className="scroll-mt-24 py-16 md:py-24">
        <div className="container-content grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="eyebrow mb-3 text-slate">{dict.inquiry.formTitle}</p>
            <h2 className="heading-lg">{dict.inquiry.title}</h2>
            <p className="lead mt-5">{dict.inquiry.subtitle}</p>
          </div>
          <InquiryForm locale={locale} trips={tripOptions} email={formEmail} defaultTripSlug={trip.slug} />
        </div>
      </section>

      {/* ---------------- Related ---------------- */}
      {related.length ? (
        <section className="bg-mist py-16 md:py-24">
          <div className="container-content">
            <h2 className="heading-lg mb-10">{dict.trip.related}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={index * 70}>
                  <TripCard trip={item} locale={locale} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: localizedPath(locale, '/') },
            { name: dict.nav.trips, url: localizedPath(locale, '/trips') },
            { name: trip.title, url: localizedPath(locale, `/trips/${trip.slug}`) },
          ]),
          touristTripJsonLd({
            trip,
            url: localizedPath(locale, `/trips/${trip.slug}`),
            locale,
            image:
              typeof trip.heroImage === 'object' && trip.heroImage?.url ? trip.heroImage.url : undefined,
            destinationName: destination?.name,
            siteName: 'Hike Globally',
          }),
          ...(trip.faqs?.length
            ? [
                faqJsonLd(
                  trip.faqs.map((faq) => ({ question: faq.question ?? '', answer: faq.answer ?? '' })),
                ),
              ]
            : []),
        ]}
      />
    </>
  )
}
