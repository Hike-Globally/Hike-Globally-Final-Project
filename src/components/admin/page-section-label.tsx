'use client'

import { useDocumentInfo, useRowLabel } from '@payloadcms/ui'

import {
  blogSectionOptions,
  linkPreviewAddress,
  tripSectionOptions,
  type PageSection,
} from '@/lib/page-sections'

/**
 * What each Page sections row is called in the admin list.
 *
 * A page may hold several Link preview rows, so their labels carry the address each one points at
 * (`3. Link preview — booking.com`, `7. Link preview — /blog/altitude`): two rows that both read
 * "Link preview" would be indistinguishable in a collapsed list.
 */
export default function PageSectionLabel() {
  const { data, rowNumber } = useRowLabel<PageSection>()
  const { collectionSlug } = useDocumentInfo()
  const options = collectionSlug === 'blog' ? blogSectionOptions : tripSectionOptions

  let label: string | undefined
  if (data.kind === 'html') {
    label = data.heading?.trim() || 'Custom HTML'
  } else {
    label = options.find(({ value }) => value === data.kind)?.label
    if (data.kind === 'linkPreview') {
      const address = linkPreviewAddress(data.linkPreviewUrl)
      if (address) label = `${label ?? 'Link preview'} — ${address}`
    }
  }

  return (
    <span>
      {(rowNumber ?? 0) + 1}. {label || 'Choose a section'}
    </span>
  )
}
