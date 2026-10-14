'use client'

import { useDocumentInfo, useRowLabel } from '@payloadcms/ui'

import { blogSectionOptions, tripSectionOptions, type PageSection } from '@/lib/page-sections'

export default function PageSectionLabel() {
  const { data, rowNumber } = useRowLabel<PageSection>()
  const { collectionSlug } = useDocumentInfo()
  const options = collectionSlug === 'blog' ? blogSectionOptions : tripSectionOptions
  const label =
    data.kind === 'html'
      ? data.heading?.trim() || 'Custom HTML'
      : options.find(({ value }) => value === data.kind)?.label
  return (
    <span>
      {(rowNumber ?? 0) + 1}. {label || 'Choose a section'}
    </span>
  )
}
