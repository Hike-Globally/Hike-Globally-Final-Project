'use client'

import { useRowLabel } from '@payloadcms/ui'

import type { MultiPreviewLink } from '@/lib/multi-url-preview'
import { linkPreviewAddress } from '@/lib/page-sections'

/**
 * A compact, scannable label for collapsed URL rows. The URL is the primary identity; an editor's
 * title override is shown as the friendly name, with the address retained as quiet metadata.
 */
export default function MultiPreviewLinkLabel() {
  const { data, rowNumber } = useRowLabel<MultiPreviewLink>()
  const address = linkPreviewAddress(data.linkPreviewUrl)
  const title = data.linkPreviewTitle?.trim()

  return (
    <span className="hg-multi-preview-link-label">
      <span className="hg-multi-preview-link-label__index">{(rowNumber ?? 0) + 1}</span>
      <span className="hg-multi-preview-link-label__name">
        {title || address || 'New URL'}
      </span>
      {title && address ? (
        <span className="hg-multi-preview-link-label__meta">{address}</span>
      ) : null}
      {!address ? (
        <span className="hg-multi-preview-link-label__badge">Empty</span>
      ) : null}
    </span>
  )
}
