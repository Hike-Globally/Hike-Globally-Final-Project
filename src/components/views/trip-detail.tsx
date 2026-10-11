import Link from 'next/link'
import {
  ArrowRight,
  BedDouble,
  Check,
  Clock,
  Gauge,
  MapPin,
  Mountain,
  Users,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react'

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
import { dictionary, type Dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import type { TripCard as TripCardData } from '@/lib/data'
import { difficultyLabel } from '@/lib/difficulty'
import { formatNumber, formatPrice } from '@/lib/format'
import { resolveLink } from '@/lib/links'
import { cn } from '@/lib/utils'
import { breadcrumbJsonLd, faqJsonLd, touristTripJsonLd } from '@/lib/seo'
import type { Trip } from '@/payload-types'

/* ----------------------------------------------------------------------------
   Shared styling
   ---------------------------------------------------------------------------- */

/** The one card surface used across the page: white, hairline border, soft layered shadow. */
const surface =
  'border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(1,22,30,0.04),0_18px_40px_-24px_rgba(1,22,30,0.18)]'

/** Eyebrow for dark backgrounds (the shared `.eyebrow` utility is tuned for light ones). */
const eyebrowOnDark =
  'font-heading text-[0.75rem] font-semibold tracking-[0.18em] text-sage uppercase'

function SectionTitle({ title, className }: { title: string; className?: string }) {
  return (
    <div className={cn('mb-10', className)}>
      <h2 className="heading-lg">{title}</h2>
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
  className,
}: {
  trip: Trip
  dict: Dictionary
  bookingHref: string
  className?: string
}) {
  const perGroup = trip.priceUnit === 'per-group'

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-ink p-7 text-mist ring-1 ring-white/10 shadow-[0_40px_80px_-30px_rgba(1,22,30,0.6)]',
        className,
      )}
    >
      {/* Soft brand glows behind the content — purely decorative. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-sage/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 size-64 rounded-full bg-deep blur-3xl"
      />

      <div className="relative">
        <p className={eyebrowOnDark}>
          {perGroup ? dict.trip.pricePerGroup : dict.trip.pricePerPerson}
        </p>

        <div className="mt-4 border border-white/10 bg-white/[0.05] px-5 py-4">
          <p className="font-heading text-4xl leading-none font-semibold tracking-tight text-white">
            {formatPrice(trip.priceFrom, trip.priceCurrency)}
          </p>
        </div>

        <dl className="mt-7 divide-y divide-white/10 border-t border-white/10">
          <div className="flex items-center justify-between gap-4 py-4">
            <dt className="flex items-center gap-2.5 text-[0.9375rem] text-mist/65">
              <Gauge className="size-4 text-sage" aria-hidden />
              {dict.trip.difficultyLevel}
            </dt>
            <dd>
              <span className="bg-sage/15 px-3 py-1 text-[0.8125rem] font-medium text-sage">
                {difficultyLabel(trip.difficulty)}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <dt className="flex items-center gap-2.5 text-[0.9375rem] text-mist/65">
              <Clock className="size-4 text-sage" aria-hidden />
              {dict.trip.duration}
            </dt>
            <dd className="text-right font-heading text-[0.9375rem] font-semibold text-white">
              {trip.durationDays} {dict.common.days}
              {trip.durationNights ? ` / ${trip.durationNights} ${dict.common.nights}` : ''}
            </dd>
          </div>
        </dl>

        <Button asChild size="lg" variant="sage" className="mt-6 h-13 w-full text-[0.9375rem]">
          <Link href={bookingHref}>
            {dict.trip.bookThisTrek}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
   Itinerary day meta chip (accommodation / altitude / food)
   ---------------------------------------------------------------------------- */

function DayChip({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: LucideIcon
  label: string
  value: string
  tone?: 'default' | 'positive' | 'muted'
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 bg-mist px-4 py-3">
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-full',
          tone === 'positive' ? 'bg-sage text-ink' : 'bg-white text-deep shadow-sm',
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[0.6875rem] tracking-[0.14em] text-slate uppercase">{label}</p>
        <p
          className={cn(
            'truncate font-heading text-[0.9375rem] font-semibold',
            tone === 'muted' ? 'text-ink-60' : 'text-ink',
          )}
        >
          {value}
        </p>
      </div>
    </div>
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
  tripOptions,
  formEmail,
}: {
  trip: Trip
  related: TripCardData[]
  tripOptions: { id: number; title: string; slug: string }[]
  formEmail: string
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

  const bookingLink = resolveLink(trip.bookingLink?.link)
  const bookingHref = bookingLink?.href ?? '#inquiry'
  const faqs = (trip.faqs ?? []).filter((faq) => faq.question?.trim())

  return (
    <>
      {/* ---------------- Hero + trip dashboard ---------------- */}
      {/* Hero region: the header stays pinned until this band has scrolled past
          (see header-frame.tsx). */}
      <section data-header-hero className="relative isolate overflow-hidden bg-ink text-mist">
        <PayloadImageFill
          media={trip.heroImage}
          size="hero"
          sizes="100vw"
          priority
          className="-z-10"
          imageClassName="object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/95 via-ink/70 to-ink/25" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/30 to-ink/40" />

        <div className="container-content pt-28 pb-14 md:pt-36 md:pb-16">
          <Breadcrumbs
            className="mb-8"
            items={[
              { label: dict.nav.home, href: sitePath('/') },
              { label: dict.nav.trips, href: sitePath('/trips') },
              { label: trip.title },
            ]}
          />

          <div className="flex flex-wrap items-center gap-3">
            {destination ? (
              <Link
                href={sitePath(`/destinations/${destination.slug}`)}
                className="bg-white/10 px-3.5 py-1.5 text-[0.75rem] tracking-[0.14em] text-sage uppercase ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/20"
              >
                {destination.name}
              </Link>
            ) : null}
            <Badge variant="sage">{dict.trip.factsTitle}</Badge>
          </div>

          <h1 className="heading-xl mt-6 max-w-4xl text-white">{trip.title}</h1>
          <p className="lead mt-6 max-w-2xl text-mist/80">{trip.summary}</p>

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

          {/* Glass dashboard. A 1px gap over a tinted background draws the grid lines. */}
          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden bg-white/10 ring-1 ring-white/10 backdrop-blur-xl md:grid-cols-4">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-center gap-4 bg-ink/60 p-5 backdrop-blur md:p-6"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage/15 text-sage">
                  <fact.icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-[0.6875rem] tracking-[0.14em] text-mist/55 uppercase">
                    {fact.label}
                  </dt>
                  <dd className="mt-1 truncate font-heading text-[0.9375rem] font-semibold text-white">
                    {fact.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------- Trip content + sticky booking card ---------------- */}
      {/* A sticky element can only travel as far as its grid area, so ending this grid right
          before the full-width inquiry panel is what releases the booking card. */}
      <div className="container-content grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
        {/* Trip content — 17px pure-black running copy (see `.single-page-body`). */}
        <div className="single-page-body min-w-0">
          {/* ---------------- Overview + highlights ---------------- */}
          <Reveal as="section" className="py-16 md:py-24">
            <SectionTitle title={dict.trip.overview} />
            <div className="prose-hg max-w-none leading-[1.8]">
              <RichText content={trip.description} />
            </div>

            {trip.highlights?.length ? (
              <div className="mt-14">
                <h3 className="heading-md mb-6">{dict.trip.highlights}</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {trip.highlights.map((highlight) => (
                    <li
                      key={highlight.id ?? highlight.text}
                      className={cn(surface, 'flex items-start gap-4 p-5')}
                    >
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sage text-ink">
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                      </span>
                      <span className="text-[0.9375rem] leading-relaxed text-ink-80">
                        {highlight.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Reveal>

          {/* Keep the booking card near the trip summary on small screens. */}
          <div className="mb-16 lg:hidden">
            <TripBookingCard trip={trip} dict={dict} bookingHref={bookingHref} />
          </div>

          {/* ---------------- Itinerary — full-width day cards ---------------- */}
          {trip.itinerary?.length ? (
            <section id="itinerary" className="scroll-mt-24 py-16 md:py-24">
              <div className="w-full min-w-0">
                <SectionTitle title={dict.trip.itinerary} />

                <div className="w-full min-w-0">
                  <Accordion type="multiple" className="w-full min-w-0 space-y-4">
                    {trip.itinerary.map((day, index) => {
                      const food =
                        day.food === 'included' || day.food === 'not-included' ? day.food : null

                      return (
                        <AccordionItem
                          key={day.id ?? index}
                          value={`day-${day.id ?? index}`}
                          className="w-full min-w-0 border-b-0"
                        >
                          <div
                            className={cn(
                              surface,
                              'w-full min-w-0 overflow-hidden px-4 sm:px-6 md:px-8 [&_[data-slot=accordion-trigger]]:motion-reduce:transition-none [&_[data-slot=accordion-trigger]_span]:motion-reduce:transition-none [&_[data-slot=accordion-content]]:motion-reduce:animate-none',
                            )}
                          >
                            <AccordionTrigger className="min-w-0 items-center py-6 hover:no-underline md:py-7">
                              <span className="min-w-0 break-words text-left font-heading text-base font-semibold text-ink md:text-lg">
                                {day.title}
                              </span>
                            </AccordionTrigger>

                            <AccordionContent>
                              <p className="w-full break-words description-copy leading-relaxed text-ink-70">
                                {day.description}
                              </p>

                              {day.accommodation || typeof day.altitude === 'number' || food ? (
                                <div className="mt-6 grid gap-3 border-t border-black/[0.06] pt-6 sm:grid-cols-2 2xl:grid-cols-3">
                                  {day.accommodation ? (
                                    <DayChip
                                      icon={BedDouble}
                                      label={dict.trip.accommodation}
                                      value={day.accommodation}
                                    />
                                  ) : null}
                                  {typeof day.altitude === 'number' ? (
                                    <DayChip
                                      icon={Mountain}
                                      label={dict.trip.altitude}
                                      value={`${formatNumber(day.altitude)} m`}
                                    />
                                  ) : null}
                                  {food ? (
                                    <DayChip
                                      icon={Utensils}
                                      label={dict.trip.food}
                                      value={
                                        food === 'included'
                                          ? dict.trip.foodIncluded
                                          : dict.trip.foodNotIncluded
                                      }
                                      tone={food === 'included' ? 'positive' : 'muted'}
                                    />
                                  ) : null}
                                </div>
                              ) : null}
                            </AccordionContent>
                          </div>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </div>
              </div>
            </section>
          ) : null}

          {/* ------- Essential information ------- */}
          {trip.contentSections?.length ? (
            <section id="essential-information" className="scroll-mt-24 py-16 md:py-24">
              <Reveal>
                <SectionTitle title={dict.trip.essentialInformation} />

                <Accordion type="multiple" className="space-y-4">
                  {trip.contentSections.map((contentSection, index) => (
                    <AccordionItem
                      key={contentSection.id ?? index}
                      value={`section-${contentSection.id ?? index}`}
                      className={cn(surface, 'overflow-hidden px-6 md:px-8')}
                    >
                      <AccordionTrigger
                        indicator="chevron"
                        className="items-center py-6 hover:no-underline md:py-7"
                      >
                        <span className="min-w-0 text-left font-heading text-base font-semibold text-ink md:text-lg">
                          {contentSection.heading}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <RichText
                          content={contentSection.content}
                          className="w-full min-w-0 break-words"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Reveal>
            </section>
          ) : null}

          {/* ---------------- Included / not included ---------------- */}
          {trip.included?.length || trip.notIncluded?.length ? (
            <Reveal as="section" className="py-16 md:py-24">
              <div className="grid gap-6 md:grid-cols-2">
                {trip.included?.length ? (
                  <div className="bg-sage-20 p-8 ring-1 ring-sage/30 md:p-10">
                    <h2 className="heading-md mb-7">{dict.trip.included}</h2>
                    <ul className="space-y-4">
                      {trip.included.map((item) => (
                        <li key={item.id ?? item.item} className="flex items-start gap-3.5">
                          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-deep text-mist">
                            <Check className="size-3.5" strokeWidth={3} aria-hidden />
                          </span>
                          <span className="text-[0.9375rem] leading-relaxed text-ink-80">
                            {item.item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {trip.notIncluded?.length ? (
                  <div className={cn(surface, 'p-8 md:p-10')}>
                    <h2 className="heading-md mb-7">{dict.trip.notIncluded}</h2>
                    <ul className="space-y-4">
                      {trip.notIncluded.map((item) => (
                        <li key={item.id ?? item.item} className="flex items-start gap-3.5">
                          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-mist-60 text-slate">
                            <X className="size-3.5" strokeWidth={3} aria-hidden />
                          </span>
                          <span className="text-[0.9375rem] leading-relaxed text-ink-60">
                            {item.item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Reveal>
          ) : null}

          {/* ---------------- FAQs ---------------- */}
          {faqs.length ? (
            <section id="faqs" className="scroll-mt-24 py-16 md:py-24">
              <Reveal>
                <SectionTitle title={dict.trip.faqs} />

                <Accordion type="multiple" className="space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem
                      key={faq.id ?? index}
                      value={`faq-${faq.id ?? index}`}
                      className={cn(surface, 'overflow-hidden px-6 md:px-8')}
                    >
                      <AccordionTrigger className="items-center py-6 hover:no-underline md:py-7">
                        <span className="min-w-0 text-left font-heading text-base font-semibold text-ink md:text-lg">
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="max-w-3xl leading-relaxed whitespace-pre-line text-ink-70">
                          {faq.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Reveal>
            </section>
          ) : null}

          {/* ---------------- Gallery ---------------- */}
          {trip.gallery?.length ? (
            <Reveal as="section" className="py-16 md:py-24">
              <SectionTitle title={dict.trip.gallery} />
              <div className="grid gap-5 sm:grid-cols-2">
                {trip.gallery.map((item, index) => (
                  <Reveal key={item.id ?? index} delay={index * 60}>
                    <div className="group overflow-hidden bg-mist-60 ring-1 ring-black/5">
                      <PayloadImage
                        media={item.image}
                        size="tablet"
                        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 92vw"
                        className="aspect-[4/3] w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>

        {/* The card stays in this grid so it can stick beside the trip content. */}
        <aside className="hidden lg:sticky lg:top-28 lg:mt-16 lg:block lg:self-start">
          <TripBookingCard trip={trip} dict={dict} bookingHref={bookingHref} />
        </aside>
      </div>

      {/* ---------------- Inquiry — full width, dark panel ---------------- */}
      <section id="inquiry" className="scroll-mt-24 py-16 md:py-24">
        <div className="container-content">
          <div className="relative isolate overflow-hidden bg-ink p-8 text-mist ring-1 ring-white/10 md:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-40 -right-32 -z-10 size-[28rem] rounded-full bg-sage/15 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-40 -left-32 -z-10 size-[24rem] rounded-full bg-deep blur-3xl"
            />

            <div className="grid gap-10 xl:grid-cols-[0.85fr_1.15fr] xl:gap-16">
              <div>
                <p className={eyebrowOnDark}>{dict.inquiry.formTitle}</p>
                <h2 className="heading-lg mt-3 text-white">{dict.inquiry.title}</h2>
                <p className="lead mt-5 text-mist/70">{dict.inquiry.subtitle}</p>
              </div>
              <InquiryForm
                trips={tripOptions}
                email={formEmail}
                defaultTripSlug={trip.slug}
                variant="dark"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Related ---------------- */}
      {related.length ? (
        <section className="py-16 md:py-24">
          <div className="container-content">
            <SectionTitle title={dict.trip.related} />
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={index * 70}>
                  <TripCard trip={item} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
            image:
              typeof trip.heroImage === 'object' && trip.heroImage?.url
                ? trip.heroImage.url
                : undefined,
            destinationName: destination?.name,
            siteName: 'Hike Globally',
          }),
          ...(faqs.length
            ? [faqJsonLd(faqs.map((faq) => ({ question: faq.question, answer: faq.answer ?? '' })))]
            : []),
        ]}
      />
    </>
  )
}
