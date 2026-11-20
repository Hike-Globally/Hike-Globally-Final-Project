'use client'

import { useState } from 'react'
import Image from '@/components/ui/next-image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Clock, Mountain, X } from 'lucide-react'

import { sitePath } from '@/i18n/config'
import { dictionary, plural } from '@/i18n/dictionaries'
import { formatNumber } from '@/lib/format'
import {
  filterExtraCustomLinks,
  type MegaMenuData,
  type MegaMenuKind,
} from '@/lib/mega-menu'

export type MegaMenuCustomLink = {
  href: string
  label: string
  newTab: boolean
}

const linkTargetProps = (link: MegaMenuCustomLink) =>
  link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}

const tripCountLabel = (count: number) =>
  plural(dictionary.destinations as unknown as Record<string, string>, count)

function TouchPanelHeader({
  title,
  allHref,
  allLabel,
  onNavigate,
  onClose,
}: {
  title: string
  allHref: string
  allLabel: string
  onNavigate: () => void
  onClose: () => void
}) {
  return (
    <div className="pn-mega-touchbar">
      <div className="pn-mega-touchbar-title-group">
        <span className="pn-mega-touchbar-title">{title}</span>
      </div>
      <div className="pn-mega-touchbar-actions">
        <Link href={allHref} className="pn-mega-touchbar-all" onClick={onNavigate}>
          <span>{allLabel}</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          className="pn-mega-close"
          aria-label={`Close ${title.toLowerCase()} menu`}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function DestinationsDesktopMega({
  data,
  customLinks,
  pathname,
  onNavigate,
  onClose,
}: {
  data: MegaMenuData['destinations']
  customLinks: MegaMenuCustomLink[]
  pathname: string
  onNavigate: () => void
  onClose: () => void
}) {
  const defaultPreview = data.items[0] ?? null
  const [previewSlug, setPreviewSlug] = useState<string | null>(null)

  const preview =
    (previewSlug ? data.items.find((item) => item.slug === previewSlug) : null) ?? defaultPreview
  const isDefaultPreview = !previewSlug || preview?.slug === defaultPreview?.slug

  const existingHrefs = new Set(data.items.map((item) => item.href))
  const extraLinks = filterExtraCustomLinks(customLinks, existingHrefs, sitePath('/destinations'))

  return (
    <div className="pn-mega-inner">
      <TouchPanelHeader
        title={dictionary.nav.destinations}
        allHref={sitePath('/destinations')}
        allLabel="All destinations"
        onNavigate={onNavigate}
        onClose={onClose}
      />

      <div className="pn-mega-dest-body">
        <div className="pn-mega-dest-directory">
          <div className="pn-mega-section-head">
            <p className="pn-mega-eyebrow">Explore destinations</p>
          </div>

          {data.items.length > 0 ? (
            <div className="pn-mega-dest-grid">
              {data.items.map((destination) => {
                const isRouteActive =
                  pathname === destination.href || pathname.startsWith(`${destination.href}/`)
                const isPreviewing = preview?.slug === destination.slug && !isDefaultPreview
                const meta =
                  destination.tripCount > 0
                    ? `${destination.country} · ${tripCountLabel(destination.tripCount)}`
                    : destination.country

                return (
                  <Link
                    key={destination.id}
                    href={destination.href}
                    className="pn-mega-dest-item"
                    data-active={isRouteActive || undefined}
                    data-previewing={isPreviewing || undefined}
                    onMouseEnter={() => setPreviewSlug(destination.slug)}
                    onFocus={() => setPreviewSlug(destination.slug)}
                    onClick={onNavigate}
                  >
                    <span className="pn-mega-dest-copy">
                      <span className="pn-mega-dest-name">{destination.name}</span>
                      <span className="pn-mega-dest-meta">{meta}</span>
                    </span>
                    <ArrowUpRight className="pn-mega-arrow size-3.5" aria-hidden="true" />
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="pn-mega-empty">
              Explore mountain regions across Nepal and beyond — ask our local guides for custom
              routes.
            </p>
          )}

          {extraLinks.length > 0 ? (
            <div className="pn-mega-custom">
              <p className="pn-mega-eyebrow">More links</p>
              <div className="pn-mega-custom-links">
                {extraLinks.map((child) => (
                  <Link
                    key={`${child.href}-${child.label}`}
                    href={child.href}
                    {...linkTargetProps(child)}
                    className="pn-mega-chip"
                    onClick={onNavigate}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {preview ? (
          <div className="pn-mega-dest-showcase">
            <div className="pn-mega-section-head">
              <p className="pn-mega-eyebrow">
                {isDefaultPreview ? 'Featured destination' : 'Region preview'}
              </p>
            </div>

            <Link href={preview.href} className="pn-mega-dest-card" onClick={onNavigate}>
              {preview.image ? (
                <Image
                  key={preview.image.src}
                  src={preview.image.src}
                  alt={preview.image.alt}
                  fill
                  sizes="(max-width: 1180px) 34vw, 400px"
                  style={{ objectFit: 'cover', objectPosition: preview.image.objectPosition }}
                  className="pn-mega-dest-card-img"
                />
              ) : null}
              <div className="pn-mega-dest-card-scrim" aria-hidden="true" />

              {preview.tripCount > 0 ? (
                <span className="pn-mega-dest-card-badge">
                  {tripCountLabel(preview.tripCount)}
                </span>
              ) : null}

              <div className="pn-mega-dest-card-content">
                <p className="pn-mega-dest-card-country">{preview.country}</p>
                <p className="pn-mega-dest-card-title">{preview.name}</p>
                {preview.tagline ? (
                  <p className="pn-mega-dest-card-tagline">{preview.tagline}</p>
                ) : null}
                <span className="pn-mega-dest-card-cta">
                  Explore region
                  <ArrowUpRight className="pn-mega-arrow size-3.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="pn-mega-footer">
        <div className="pn-mega-footer-note">
          <span>Not sure which region suits your season?</span>
          <Link
            href={sitePath('/contact')}
            className="pn-mega-footer-inline"
            onClick={onNavigate}
          >
            Ask a local guide
          </Link>
        </div>
        <Link
          href={sitePath('/destinations')}
          className="pn-mega-footer-cta"
          onClick={onNavigate}
        >
          <span>Explore all destinations</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

function TripsDesktopMega({
  data,
  customLinks,
  onNavigate,
  onClose,
}: {
  data: MegaMenuData['trips']
  customLinks: MegaMenuCustomLink[]
  onNavigate: () => void
  onClose: () => void
}) {
  const existingHrefs = new Set<string>([
    ...data.featuredTrips.map((trip) => trip.href),
    ...data.moreTrips.map((trip) => trip.href),
    ...data.byDestination.map((facet) => facet.href),
    ...data.byType.map((facet) => facet.href),
  ])
  const extraLinks = filterExtraCustomLinks(customLinks, existingHrefs, sitePath('/trips'))
  const hasRail =
    data.byDestination.length > 0 || data.byType.length > 0 || extraLinks.length > 0

  return (
    <div className="pn-mega-inner">
      <TouchPanelHeader
        title={dictionary.nav.trips}
        allHref={sitePath('/trips')}
        allLabel="All trips"
        onNavigate={onNavigate}
        onClose={onClose}
      />

      <div
        className={hasRail ? 'pn-mega-trips-body' : 'pn-mega-trips-body pn-mega-trips-body--single'}
      >
        {hasRail ? (
          <div className="pn-mega-rail">
            {data.byDestination.length > 0 ? (
              <div className="pn-mega-rail-group">
                <p className="pn-mega-eyebrow">By region</p>
                <div className="pn-mega-facet-list">
                  {data.byDestination.map((facet) => (
                    <Link
                      key={facet.value}
                      href={facet.href}
                      className="pn-mega-facet-link"
                      onClick={onNavigate}
                    >
                      <span>{facet.label}</span>
                      <span className="pn-mega-facet-count">{facet.count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {data.byType.length > 0 ? (
              <div className="pn-mega-rail-group">
                <p className="pn-mega-eyebrow">By style</p>
                <div className="pn-mega-chips">
                  {data.byType.map((facet) => (
                    <Link
                      key={facet.value}
                      href={facet.href}
                      className="pn-mega-chip"
                      onClick={onNavigate}
                    >
                      {facet.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {extraLinks.length > 0 ? (
              <div className="pn-mega-rail-group">
                <p className="pn-mega-eyebrow">Quick links</p>
                <div className="pn-mega-facet-list">
                  {extraLinks.map((child) => (
                    <Link
                      key={`${child.href}-${child.label}`}
                      href={child.href}
                      {...linkTargetProps(child)}
                      className="pn-mega-facet-link"
                      onClick={onNavigate}
                    >
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="pn-mega-trips-main">
          <div className="pn-mega-section-head">
            <p className="pn-mega-eyebrow">
              {data.isFeaturedHeading ? 'Featured trips' : 'Popular trips'}
            </p>
          </div>

          {data.featuredTrips.length > 0 ? (
            <div className="pn-mega-trip-grid">
              {data.featuredTrips.map((trip) => (
                <Link
                  key={trip.id}
                  href={trip.href}
                  className="pn-mega-trip-card"
                  onClick={onNavigate}
                >
                  <div className="pn-mega-trip-media">
                    {trip.image ? (
                      <Image
                        src={trip.image.src}
                        alt={trip.image.alt}
                        fill
                        sizes="(max-width: 1180px) 30vw, 380px"
                        style={{
                          objectFit: 'cover',
                          objectPosition: trip.image.objectPosition,
                        }}
                        className="pn-mega-trip-img"
                      />
                    ) : null}
                    <div className="pn-mega-trip-scrim" aria-hidden="true" />
                    {trip.destinationName ? (
                      <span className="pn-mega-trip-region">{trip.destinationName}</span>
                    ) : null}
                  </div>

                  <div className="pn-mega-trip-body">
                    <p className="pn-mega-trip-title">{trip.title}</p>

                    <div className="pn-mega-trip-stats">
                      <span className="pn-mega-trip-stat">
                        <Clock className="size-3" aria-hidden="true" />
                        {trip.durationDays} {dictionary.common.days}
                      </span>
                      {trip.maxAltitude ? (
                        <span className="pn-mega-trip-stat">
                          <Mountain className="size-3" aria-hidden="true" />
                          {formatNumber(trip.maxAltitude)} m
                        </span>
                      ) : null}
                    </div>

                    <div className="pn-mega-trip-foot">
                      <span className="pn-mega-trip-price">
                        {dictionary.common.from}{' '}
                        <strong>{trip.priceFormatted}</strong>
                      </span>
                      <ArrowUpRight className="pn-mega-arrow size-3.5" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="pn-mega-empty">
              Small-group Himalayan treks and custom expeditions led by local Sherpa guides.
            </p>
          )}

          {data.moreTrips.length > 0 ? (
            <div className="pn-mega-more">
              <p className="pn-mega-eyebrow">More itineraries</p>
              <div className="pn-mega-more-grid">
                {data.moreTrips.map((trip) => (
                  <Link
                    key={trip.id}
                    href={trip.href}
                    className="pn-mega-more-link"
                    onClick={onNavigate}
                  >
                    <span className="pn-mega-more-title">{trip.title}</span>
                    <span className="pn-mega-more-meta">
                      {trip.durationDays}d · {trip.priceFormatted}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="pn-mega-footer">
        <Link href={sitePath('/trips')} className="pn-mega-footer-cta" onClick={onNavigate}>
          <span>View all trips</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

export function DesktopMegaMenu({
  kind,
  data,
  customLinks,
  pathname,
  onNavigate,
  onClose,
}: {
  kind: MegaMenuKind
  data: MegaMenuData
  customLinks: MegaMenuCustomLink[]
  pathname: string
  onNavigate: () => void
  onClose?: () => void
}) {
  const handleClose = onClose ?? onNavigate

  if (kind === 'destinations') {
    return (
      <DestinationsDesktopMega
        data={data.destinations}
        customLinks={customLinks}
        pathname={pathname}
        onNavigate={onNavigate}
        onClose={handleClose}
      />
    )
  }

  return (
    <TripsDesktopMega
      data={data.trips}
      customLinks={customLinks}
      onNavigate={onNavigate}
      onClose={handleClose}
    />
  )
}

export function MobileMegaMenu({
  kind,
  data,
  customLinks,
  pathname = '/',
  onNavigate,
}: {
  kind: MegaMenuKind
  data: MegaMenuData
  customLinks: MegaMenuCustomLink[]
  pathname?: string
  onNavigate: () => void
}) {
  if (kind === 'destinations') {
    const featuredDestination = data.destinations.items[0] ?? null
    const existingHrefs = new Set(data.destinations.items.map((item) => item.href))
    const extraLinks = filterExtraCustomLinks(
      customLinks,
      existingHrefs,
      sitePath('/destinations'),
    )

    return (
      <div className="pn-mobile-mega">
        {featuredDestination ? (
          <Link
            href={featuredDestination.href}
            className="pn-mobile-dest-hero"
            onClick={onNavigate}
          >
            {featuredDestination.image ? (
              <Image
                src={featuredDestination.image.src}
                alt={featuredDestination.image.alt}
                fill
                sizes="100vw"
                style={{ objectFit: 'cover', objectPosition: featuredDestination.image.objectPosition }}
                className="pn-mega-dest-card-img"
              />
            ) : null}
            <div className="pn-mega-dest-card-scrim" aria-hidden="true" />
            {featuredDestination.tripCount > 0 ? (
              <span className="pn-mega-dest-card-badge">
                {tripCountLabel(featuredDestination.tripCount)}
              </span>
            ) : null}
            <div className="pn-mobile-dest-hero-content">
              <p className="pn-mega-dest-card-country">
                Featured · {featuredDestination.country}
              </p>
              <p className="pn-mobile-dest-hero-title">{featuredDestination.name}</p>
              {featuredDestination.tagline ? (
                <p className="pn-mega-dest-card-tagline">{featuredDestination.tagline}</p>
              ) : null}
              <span className="pn-mega-dest-card-cta">
                Explore region
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ) : null}

        {data.destinations.items.length > 0 ? (
          <div className="pn-mobile-mega-group">
            <div className="pn-mega-section-head pn-mobile-section-head">
              <p className="pn-mega-eyebrow">All regions</p>
            </div>
            <div className="pn-mobile-dest-grid">
              {data.destinations.items.map((destination) => {
                const isRouteActive =
                  pathname === destination.href || pathname.startsWith(`${destination.href}/`)
                const meta =
                  destination.tripCount > 0
                    ? `${destination.country} · ${tripCountLabel(destination.tripCount)}`
                    : destination.country

                return (
                  <Link
                    key={destination.id}
                    href={destination.href}
                    className="pn-mobile-mega-row"
                    data-active={isRouteActive || undefined}
                    onClick={onNavigate}
                  >
                    <span className="pn-mobile-mega-row-copy">
                      <span className="pn-mobile-mega-title">{destination.name}</span>
                      <span className="pn-mobile-mega-sub">{meta}</span>
                    </span>
                    <ArrowUpRight className="pn-mega-arrow size-3.5" aria-hidden="true" />
                  </Link>
                )
              })}
            </div>
          </div>
        ) : null}

        {extraLinks.length > 0 ? (
          <div className="pn-mobile-mega-group">
            <p className="pn-mega-eyebrow">More links</p>
            <div className="pn-mega-chips pn-mobile-chips">
              {extraLinks.map((child) => (
                <Link
                  key={`${child.href}-${child.label}`}
                  href={child.href}
                  {...linkTargetProps(child)}
                  className="pn-mega-chip pn-mobile-chip"
                  onClick={onNavigate}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="pn-mobile-mega-footer">
          <Link
            href={sitePath('/destinations')}
            className="pn-mobile-mega-all"
            onClick={onNavigate}
          >
            <span>Explore all destinations</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href={sitePath('/contact')}
            className="pn-mobile-mega-guide"
            onClick={onNavigate}
          >
            Ask a local guide
          </Link>
        </div>
      </div>
    )
  }

  const existingHrefs = new Set<string>([
    ...data.trips.featuredTrips.map((trip) => trip.href),
    ...data.trips.moreTrips.map((trip) => trip.href),
    ...data.trips.byDestination.map((facet) => facet.href),
    ...data.trips.byType.map((facet) => facet.href),
  ])
  const extraLinks = filterExtraCustomLinks(customLinks, existingHrefs, sitePath('/trips'))

  return (
    <div className="pn-mobile-mega">
      {data.trips.featuredTrips.length > 0 ? (
        <div className="pn-mobile-mega-group">
          <div className="pn-mega-section-head pn-mobile-section-head">
            <p className="pn-mega-eyebrow">
              {data.trips.isFeaturedHeading ? 'Featured trips' : 'Popular trips'}
            </p>
          </div>

          <div className="pn-mobile-trip-grid">
            {data.trips.featuredTrips.map((trip) => (
              <Link
                key={trip.id}
                href={trip.href}
                className="pn-mobile-mega-trip"
                onClick={onNavigate}
              >
                <div className="pn-mobile-trip-media">
                  {trip.image ? (
                    <Image
                      src={trip.image.src}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="84px"
                      style={{
                        objectFit: 'cover',
                        objectPosition: trip.image.objectPosition,
                      }}
                      className="pn-mobile-mega-thumb"
                    />
                  ) : null}
                  {trip.destinationName ? (
                    <span className="pn-mobile-trip-badge">{trip.destinationName}</span>
                  ) : null}
                </div>

                <div className="pn-mobile-mega-trip-copy">
                  {trip.destinationName ? (
                    <span className="pn-mobile-trip-region">{trip.destinationName}</span>
                  ) : null}
                  <span className="pn-mobile-mega-title">{trip.title}</span>
                  <span className="pn-mobile-mega-sub">
                    {trip.durationDays} {dictionary.common.days}
                    {trip.maxAltitude ? ` · ${formatNumber(trip.maxAltitude)} m` : ''}
                  </span>
                  <span className="pn-mobile-trip-price">
                    <span>
                      {dictionary.common.from} <strong>{trip.priceFormatted}</strong>
                    </span>
                    <ArrowUpRight className="pn-mega-arrow size-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {data.trips.moreTrips.length > 0 ? (
        <div className="pn-mobile-mega-group">
          <p className="pn-mega-eyebrow">More itineraries</p>
          <div className="pn-mobile-more-grid">
            {data.trips.moreTrips.map((trip) => (
              <Link
                key={trip.id}
                href={trip.href}
                className="pn-mobile-mega-row"
                onClick={onNavigate}
              >
                <span className="pn-mobile-mega-title">{trip.title}</span>
                <span className="pn-mobile-mega-sub pn-mobile-no-shrink">
                  {trip.durationDays}d · {trip.priceFormatted}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {data.trips.byDestination.length > 0 ? (
        <div className="pn-mobile-mega-group">
          <p className="pn-mega-eyebrow">By region</p>
          <div className="pn-mega-chips pn-mobile-chips">
            {data.trips.byDestination.map((facet) => (
              <Link
                key={facet.value}
                href={facet.href}
                className="pn-mega-chip pn-mobile-chip"
                onClick={onNavigate}
              >
                <span>{facet.label}</span>
                <span className="pn-mobile-chip-count">{facet.count}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {data.trips.byType.length > 0 ? (
        <div className="pn-mobile-mega-group">
          <p className="pn-mega-eyebrow">By style</p>
          <div className="pn-mega-chips pn-mobile-chips">
            {data.trips.byType.map((facet) => (
              <Link
                key={facet.value}
                href={facet.href}
                className="pn-mega-chip pn-mobile-chip"
                onClick={onNavigate}
              >
                {facet.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {extraLinks.length > 0 ? (
        <div className="pn-mobile-mega-group">
          <p className="pn-mega-eyebrow">Quick links</p>
          <div className="pn-mega-chips pn-mobile-chips">
            {extraLinks.map((child) => (
              <Link
                key={`${child.href}-${child.label}`}
                href={child.href}
                {...linkTargetProps(child)}
                className="pn-mega-chip pn-mobile-chip"
                onClick={onNavigate}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="pn-mobile-mega-footer">
        <Link href={sitePath('/trips')} className="pn-mobile-mega-all" onClick={onNavigate}>
          <span>View all trips</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
