'use client'

import { useState } from 'react'

import { linkPreviewImageCandidates } from '@/lib/link-preview-image'

/**
 * The link card's thumbnail.
 *
 * A card without its picture is the failure this component exists to prevent, so it does not trust
 * one address: it walks `linkPreviewImageCandidates` — the linked page's own image first, then the
 * site's icon — and only gives up when every one of them has failed to load. The addresses are all
 * served through `/api/link-preview-image`, so a host that refuses hotlinks, a `Referer` it dislikes
 * or a CDN that only answers its own pages cannot break the picture: the browser only talks to us.
 *
 * The tile is the last resort (every candidate 404'd, i.e. the site is unreachable from here), and
 * it is designed to look finished rather than broken: the site's initial on a tinted square.
 */
export function LinkPreviewThumb({ image, host }: { image: string | null; host: string }) {
  const candidates = linkPreviewImageCandidates(image, host)
  const [failed, setFailed] = useState<string[]>([])

  const candidate = candidates.find((entry) => !failed.includes(entry.src))

  return (
    <span className="link-preview-thumb" aria-hidden="true">
      {candidate ? (
        // eslint-disable-next-line @next/next/no-img-element -- proxied through our own origin.
        <img
          src={candidate.src}
          alt=""
          loading="lazy"
          decoding="async"
          data-icon={candidate.icon ? 'true' : undefined}
          onError={() =>
            setFailed((previous) =>
              previous.includes(candidate.src) ? previous : [...previous, candidate.src],
            )
          }
        />
      ) : (
        <span className="link-preview-thumb-initial">{initialOf(host)}</span>
      )}
    </span>
  )
}

/** `www.booking.com` → `B`, `guide-to-iceland.example` → `G`. */
export function initialOf(host: string): string {
  const label = host
    .replace(/^www\./i, '')
    .replace(/^[^a-z0-9]+/i, '')
    .trim()
  return (label[0] ?? '?').toUpperCase()
}
