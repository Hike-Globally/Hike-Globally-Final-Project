'use client'

import { useState } from 'react'

/**
 * The link card's thumbnail.
 *
 * The image belongs to whichever page was linked, so it is loaded straight from that host and
 * bypasses the Next image optimizer (which only accepts the domains in `next.config.mjs`). Two
 * things go wrong with other people's images, and both used to leave a hole in the card:
 *
 *   · the page declares no image at all — a blocked bot, a JavaScript-only app, a plain document;
 *   · the page declares one, but the host refuses to serve it to another site (hotlink protection)
 *     or has since removed it, and the browser draws a broken-image icon.
 *
 * In either case the tile falls back to the site's initial on a tinted square, which reads as a
 * deliberate, finished card instead of an empty box. `onError` is what makes the second case work,
 * hence the client component.
 */
export function LinkPreviewThumb({ image, host }: { image: string | null; host: string }) {
  const [failed, setFailed] = useState(false)

  if (image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote, unknown host: see above.
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    )
  }

  return <span className="link-preview-thumb-initial">{initialOf(host)}</span>
}

/** `www.booking.com` → `B`, `guide-to-iceland.example` → `G`. */
export function initialOf(host: string): string {
  const label = host
    .replace(/^www\./i, '')
    .replace(/^[^a-z0-9]+/i, '')
    .trim()
  return (label[0] ?? '?').toUpperCase()
}
