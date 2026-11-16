'use client'

import { useState } from 'react'

import { linkPreviewImageCandidates } from '@/lib/link-preview-image'

/** Try the page's images in order, with a local travel photograph as the last resort. */
export function LinkPreviewThumb({
  image,
  host,
  alternatives = [],
}: {
  image: string | null
  host: string
  alternatives?: readonly string[]
}) {
  const candidates = linkPreviewImageCandidates(image, host, alternatives)
  const [failed, setFailed] = useState<string[]>([])

  const candidate = candidates.find((entry) => !failed.includes(entry.src))

  return (
    <span className="link-preview-thumb" aria-hidden="true">
      {candidate ? (
        // eslint-disable-next-line @next/next/no-img-element -- external images may need a direct fallback.
        <img
          src={candidate.src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() =>
            setFailed((previous) =>
              previous.includes(candidate.src) ? previous : [...previous, candidate.src],
            )
          }
        />
      ) : null}
    </span>
  )
}
