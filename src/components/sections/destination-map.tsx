import { ExternalLink, MapPin } from 'lucide-react'

import { formatCoordinates, mapEmbedUrl, mapPageUrl, type Coordinates } from '@/lib/coordinates'

/**
 * ============================================================================
 * Destination map
 * ============================================================================
 * A server-rendered, keyless OpenStreetMap embed with a single pin.
 *
 * Why an `<iframe>` and not Leaflet / MapLibre / Google Maps:
 *
 *  - **Payload.** One pin, no popups, no clustering. An iframe is 0 KB of JavaScript, needs no
 *    `'use client'` boundary (so the destination page stays a server component end to end, and the
 *    coordinates never cross into the RSC payload as anything but a URL string), and ships with
 *    pan/zoom/labels already built.
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
export function DestinationMap({
  name,
  coords,
  zoom = 5,
  caption,
  className,
}: {
  /** Destination name — the iframe's accessible title and the pin's popup label. */
  name: string
  /** Already validated by `parseCoordinates()`; the caller renders nothing when this is null. */
  coords: Coordinates
  /** Levels in from the world: 3 continent, 5 region (default), 7 valley, 10 trailhead. */
  zoom?: number
  /** figcaption copy, e.g. "Map of the Khumbu region". */
  caption?: string
  className?: string
}) {
  const src = mapEmbedUrl({ coords, label: name, zoom })
  const href = mapPageUrl(coords)
  const degrees = formatCoordinates(coords)

  return (
    <figure className={className}>
      <div className="relative isolate overflow-hidden bg-sage-20">
        <iframe
          // A coordinate change must re-create the frame, not silently keep the old viewport.
          key={src}
          src={src}
          title={`Map of ${name}`}
          className="block h-[300px] w-full border-0 md:h-[340px]"
          loading="lazy"
          // The embed is same-origin-ish only in the sense that it posts no messages back to us;
          // it needs no script, form or popup permission.
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen"
        />
        {/* The frame's own marker is small on a wide column; this tag keeps the pin findable. */}
        <span className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 bg-mist px-2.5 py-1 text-label tracking-[0.12em] text-slate-80 uppercase shadow-sm">
          <MapPin className="size-3.5 text-sage-90" aria-hidden />
          {degrees}
        </span>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-small text-slate-80">
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
      </figcaption>
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
