'use client'

import { useDocumentInfo } from '@payloadcms/ui'

import { livePageTooltip, resolveLivePageTarget } from '@/lib/live-page'

/**
 * The document editor's "View live" control.
 *
 * Registered in `beforeDocumentControls` on the content collections, next to the preview-pane
 * toggle. Payload does have a preview button of its own, but it is a bare external-link glyph with
 * no label — and it is only rendered when `admin.preview` is configured, which this project does
 * not use (it configures `admin.livePreview` instead). So the one control in the editor that jumps
 * to the storefront is both unlabelled and, here, absent. This replaces it with something that
 * says what it does.
 *
 * Like the list column, it picks the destination from the document's workflow status:
 *  - published → the public URL, i.e. exactly what a visitor sees;
 *  - draft     → the authenticated preview route, because the public URL would 404.
 *
 * Nothing renders for a document with no slug yet (a trip that has just been opened and not
 * named), or for collections that have no public page at all.
 */
const ViewLivePageButton = () => {
  const { collectionSlug, data, initialData, savedDocumentData } = useDocumentInfo()

  // Prefer the last saved version: for a published document whose slug is being edited, the saved
  // slug is the one that is actually live. A brand-new document has nothing saved yet, so it falls
  // back to the form as it is being typed — `initialData` first, which is the document as the
  // server rendered it, before the form has mounted and started reporting live values.
  const doc = savedDocumentData?.id ? savedDocumentData : (data ?? initialData ?? {})
  const target = collectionSlug ? resolveLivePageTarget(collectionSlug, doc) : null

  if (!target) return null

  return (
    <a
      className={`hg-view-live-page hg-view-live-page--${target.isDraft ? 'draft' : 'live'}`}
      href={target.href}
      id="view-live-page-button"
      rel="noopener noreferrer"
      target="_blank"
      title={livePageTooltip(target)}
    >
      <svg
        aria-hidden="true"
        fill="none"
        height="13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
        width="13"
      >
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </svg>
      <span>{target.isDraft ? 'Preview' : 'View live'}</span>
    </a>
  )
}

export default ViewLivePageButton
