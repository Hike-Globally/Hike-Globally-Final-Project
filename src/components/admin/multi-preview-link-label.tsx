'use client'

import { useRowLabel } from '@payloadcms/ui'

import type { MultiPreviewLink } from '@/lib/multi-url-preview'
import { linkPreviewAddress } from '@/lib/page-sections'

export default function MultiPreviewLinkLabel() {
  const { data, rowNumber } = useRowLabel<MultiPreviewLink>()
  return (
    <span>
      {(rowNumber ?? 0) + 1}.{' '}
      {data.linkPreviewTitle?.trim() || linkPreviewAddress(data.linkPreviewUrl) || 'Add a URL'}
    </span>
  )
}
