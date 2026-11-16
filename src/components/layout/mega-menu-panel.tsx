'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Clock, Mountain } from 'lucide-react'

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

function DestinationsDesktopMega({
  data,
  customLinks,
  pathname,
  onNavigate,
}: {
  data: MegaMenuData['destinations']
  customLinks: MegaMenuCustomLink[]
  pathname: string
  onNavigate: () => void
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
      <div className="pn-mega-dest-body">
        <div className="pn-mega-dest-directory">
          <div className="pn-mega-section-head">
            <p className="pn-mega-eyebrow">Explore destinations</p>
            {data.totalCount > 0 ? (
              <span className="pn-mega-count">
                {data.totalCount} {data.totalCount === 1 ? 'region' : 'regions'}
              </span>
            ) : null}
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

            <Link
              href={preview.href}
              className="pn-mega-dest-card"
              onClick={onNavigate}
            >
              {preview.image ? (
                /* eslint-disable-next-line @next/next/no-img-element -- serves the original uploaded bytes matching PayloadImage/unoptimized policy */
                <img
                  key={preview.image.src}
                  src={preview.image.src}
                  alt={preview.image.alt}
                  style={{ objectPosition: preview.image.objectPosition }}
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
}: {
  data: MegaMenuData['trips']
  customLinks: MegaMenuCustomLink[]
  onNavigate: () => void
}) {
  const existingHrefs = new Set<string>([
    ...data.featuredTrips.map((trip) => trip.href),
    ...data.moreTrips.map((trip) => trip.href),
    ...data.byDestination.map((facet) => facet.href),
    ...data.byDifficulty.map((facet) => facet.href),
    ...data.byType.map((facet) => facet.href),
    ...data.bySeason.map((facet) => facet.href),
  ])
  const extraLinks = filterExtraCustomLinks(customLinks, existingHrefs, sitePath('/trips'))

  return (
    <div className="pn-mega-inner">
      <div className="pn-mega-trips-body">
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

          {data.byDifficulty.length > 0 ? (
            <div className="pn-mega-rail-group">
              <p className="pn-mega-eyebrow">By difficulty</p>
              <div className="pn-mega-chips">
                {data.byDifficulty.map((facet) => (
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

        <div className="pn-mega-trips-main">
          <div className="pn-mega-section-head">
            <p className="pn-mega-eyebrow">
              {data.isFeaturedHeading ? 'Featured trips' : 'Popular trips'}
            </p>
            {data.totalCount > 0 ? (
              <span className="pn-mega-count">
                {plural(dictionary.trips as unknown as Record<string, string>, data.totalCount)}
              </span>
            ) : null}
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
                      /* eslint-disable-next-line @next/next/no-img-element -- serves original uploaded bytes matching PayloadImage/unoptimized policy */
                      <img
                        src={trip.image.src}
                        alt={trip.image.alt}
                        style={{ objectPosition: trip.image.objectPosition }}
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
        {data.bySeason.length > 0 ? (
          <div className="pn-mega-footer-note">
            <span>Browse by season:</span>
            {data.bySeason.map((season) => (
              <Link
                key={season.value}
                href={season.href}
                className="pn-mega-footer-inline"
                onClick={onNavigate}
              >
                {season.label}
              </Link>
            ))}
          </div>
        ) : (
          <div className="pn-mega-footer-note">
            <span>Looking for a custom itinerary?</span>
            <Link
              href={sitePath('/contact')}
              className="pn-mega-footer-inline"
              onClick={onNavigate}
            >
              Plan a private trip
            </Link>
          </div>
        )}

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
}: {
  kind: MegaMenuKind
  data: MegaMenuData
  customLinks: MegaMenuCustomLink[]
  pathname: string
  onNavigate: () => void
}) {
  if (kind === 'destinations') {
    return (
      <DestinationsDesktopMega
        data={data.destinations}
        customLinks={customLinks}
        pathname={pathname}
        onNavigate={onNavigate}
      />
    )
  }

  return <TripsDesktopMega data={data.trips} customLinks={customLinks} onNavigate={onNavigate} />
}

export function MobileMegaMenu({
  kind,
  data,
  customLinks,
  onNavigate,
}: {
  kind: MegaMenuKind
  data: MegaMenuData
  customLinks: MegaMenuCustomLink[]
  onNavigate: () => void
}) {
  if (kind === 'destinations') {
    const existingHrefs = new Set(data.destinations.items.map((item) => item.href))
    const extraLinks = filterExtraCustomLinks(
      customLinks,
      existingHrefs,
      sitePath('/destinations'),
    )

    return (
      <div className="pn-mobile-mega">
        {data.destinations.items.length > 0 ? (
          <div className="pn-mobile-mega-list">
            {data.destinations.items.map((destination) => (
              <Link
                key={destination.id}
                href={destination.href}
                className="pn-mobile-mega-row"
                onClick={onNavigate}
              >
                <span className="pn-mobile-mega-title">{destination.name}</span>
                <span className="pn-mobile-mega-sub">
                  {destination.tripCount > 0
                    ? tripCountLabel(destination.tripCount)
                    : destination.country}
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        {extraLinks.length > 0 ? (
          <div className="pn-mobile-mega-group">
            <p className="pn-mega-eyebrow">More links</p>
            <div className="pn-mega-chips">
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

        <Link
          href={sitePath('/destinations')}
          className="pn-mobile-mega-all"
          onClick={onNavigate}
        >
          <span>Explore all destinations</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    )
  }

  const existingHrefs = new Set<string>([
    ...data.trips.featuredTrips.map((trip) => trip.href),
    ...data.trips.byDestination.map((facet) => facet.href),
    ...data.trips.byDifficulty.map((facet) => facet.href),
  ])
  const extraLinks = filterExtraCustomLinks(customLinks, existingHrefs, sitePath('/trips'))

  return (
    <div className="pn-mobile-mega">
      {data.trips.featuredTrips.length > 0 ? (
        <div className="pn-mobile-mega-group">
          <p className="pn-mega-eyebrow">
            {data.trips.isFeaturedHeading ? 'Featured trips' : 'Popular trips'}
          </p>
          <div className="pn-mobile-mega-list">
            {data.trips.featuredTrips.map((trip) => (
              <Link
                key={trip.id}
                href={trip.href}
                className="pn-mobile-mega-trip"
                onClick={onNavigate}
              >
                {trip.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- serves original uploaded bytes matching PayloadImage/unoptimized policy */
                  <img
                    src={trip.image.src}
                    alt=""
                    aria-hidden="true"
                    style={{ objectPosition: trip.image.objectPosition }}
                    className="pn-mobile-mega-thumb"
                  />
                ) : null}
                <span className="pn-mobile-mega-trip-copy">
                  <span className="pn-mobile-mega-title">{trip.title}</span>
                  <span className="pn-mobile-mega-sub">
                    {trip.durationDays} {dictionary.common.days} · {dictionary.common.from}{' '}
                    {trip.priceFormatted}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {data.trips.byDestination.length > 0 ? (
        <div className="pn-mobile-mega-group">
          <p className="pn-mega-eyebrow">By region</p>
          <div className="pn-mega-chips">
            {data.trips.byDestination.map((facet) => (
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

      {data.trips.byDifficulty.length > 0 ? (
        <div className="pn-mobile-mega-group">
          <p className="pn-mega-eyebrow">By difficulty</p>
          <div className="pn-mega-chips">
            {data.trips.byDifficulty.map((facet) => (
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
        <div className="pn-mobile-mega-group">
          <p className="pn-mega-eyebrow">Quick links</p>
          <div className="pn-mega-chips">
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

      <Link href={sitePath('/trips')} className="pn-mobile-mega-all" onClick={onNavigate}>
        <span>View all trips</span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
