'use client'

import { ExternalLink } from 'lucide-react'
import { useDocumentInfo } from '@payloadcms/ui'

import { resolveViewLiveHref } from '@/lib/live-preview-url'

/**
 * "View live page" in the document editor: opens the public storefront page for the document that
 * is being edited in a new tab. Unpublished documents have no public page yet, so the button
 * opens the authenticated draft preview instead and says so.
 */
function ViewLiveButton() {
  const { collectionSlug, globalSlug, hasPublishedDoc, initialData, savedDocumentData } =
    useDocumentInfo()

  const slug = savedDocumentData?.slug ?? initialData?.slug
  const target = resolveViewLiveHref({
    collectionSlug,
    globalSlug,
    slug,
    published: Boolean(globalSlug) || hasPublishedDoc,
  })

  if (!target) return null

  const label = target.isDraftPreview ? 'Preview draft' : 'View live page'
  const title = target.isDraftPreview
    ? 'Not published yet — opens the draft in a new tab'
    : 'Open the live page in a new tab'

  return (
    <a
      className="hg-view-live"
      href={target.href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
    >
      <ExternalLink aria-hidden="true" size={16} />
      <span>{label}</span>
      <span className="hg-view-live__sr"> (opens in a new tab)</span>
    </a>
  )
}

export default ViewLiveButton
