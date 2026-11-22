import { ExternalLink, MapPin } from 'lucide-react'

import { formatCoordinates, mapEmbedUrl, mapPageUrl, type Coordinates } from '@/lib/coordinates'

/**
 * ============================================================================
 * Coordinates map
 * ============================================================================
 * A server-rendered, keyless OpenStreetMap embed with a single pin. Used for a destination's
 * location and for a trip's trailhead.
 *
 * Why an `<iframe>` and not Leaflet / MapLibre / Google Maps:
 *
 *  - **Payload.** One pin, no popups, no clustering. An iframe is 0 KB of JavaScript, needs no
 *    `'use client'` boundary (so the pages stay server components end to end, and the coordinates
 *    never cross into the RSC payload as anything but a URL string), and ships with pan/zoom/labels
 *    already built.
 *  - **No third-party key or billing.** Mapbox, MapTiler and Google all need an API key, a card and
 *    a domain allowlist; this needs none of them.
 *  - **Consistency.** The rest of the site's geo work is deliberately dependency-free (see the
 *    header of `globe-renderer.ts`), so the same reasoning applies.
 *
 * Trade-offs, stated plainly: no custom map styling (the tiles are OSM's), no click-to-select
 * markers, and tile rendering depends on openstreetmap.org being reachable at view time. Two more
 * hard limits of the OSM embed specifically: the pin cannot be numbered or coloured, and a URL that
 * is very wide (a latitude near the poles at a close zoom) is clamped by the service.
 *
 * When a map is worth the upgrade: several pins at once (a multi-day itinerary), custom branding on
 * the tiles, or a route polyline. Then swap this component for `react-leaflet` behind the same props
 * — no caller changes.
 */
export function CoordinatesMap({
  name,
  coords,
  zoom = 5,
  heading,
  caption,
  height = 'md',
  className,
}: {
  /** The place — the iframe's accessible title and the pin's popup label. */
  name: string
  /** Already validated by `parseCoordinates()`; the caller renders nothing when this is null. */
  coords: Coordinates
  /** Levels in from the world: 3 continent, 5 region (default), 7 valley, 9 trailhead. */
  zoom?: number
  /** Optional label above the frame, matching the captions on the surrounding figures. */
  heading?: string
  /** figcaption copy, e.g. "Map of the Khumbu region". Defaults to `name`. */
  caption?: string
  /**
   * Frame height. `sm` suits a card that shares a row with two images; `md` a full-width row.
   * (Tailwind needs the class names written out in full, hence the lookup rather than a template.)
   */
  height?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const src = mapEmbedUrl({ coords, label: name, zoom })
  const href = mapPageUrl(coords)
  const degrees = formatCoordinates(coords)
  const frame = {
    sm: 'h-[240px] md:h-[300px]',
    md: 'h-[300px] md:h-[340px]',
    lg: 'h-[320px] md:h-[420px]',
  }[height]

  return (
    <figure className={className}>
      {heading ? (
        <figcaption className="mb-4 font-heading text-subhead font-semibold">{heading}</figcaption>
      ) : null}
      <div className="relative isolate overflow-hidden bg-sage-20">
        <iframe
          // A coordinate change must re-create the frame, not silently keep the old viewport.
          key={src}
          src={src}
          title={`Map of ${name}`}
          className={`block w-full border-0 ${frame}`}
          loading="lazy"
          // The embed posts no messages back to us: it needs no script, form or popup permission.
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen"
        />
        {/* The frame's own marker is small on a wide column; this tag keeps the pin findable. */}
        <span className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 bg-mist px-2.5 py-1 text-label tracking-[0.12em] text-slate-80 uppercase shadow-sm">
          <MapPin className="size-3.5 text-sage-90" aria-hidden />
          {degrees}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-small text-slate-80">
        <span>{caption ?? name}</span>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-ink underline decoration-slate-40 underline-offset-4 transition-colors hover:decoration-ink"
        >
          View larger map
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
      <p className="mt-1 text-small text-slate-80">
        Map data ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-slate-40 underline-offset-2 hover:decoration-ink"
        >
          OpenStreetMap
        </a>{' '}
        contributors
      </p>
    </figure>
  )
}
