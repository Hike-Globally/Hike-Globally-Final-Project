'use client'

import type { DefaultCellComponentProps } from 'payload'

import { livePageTooltip, resolveLivePageTarget } from '@/lib/live-page'

/**
 * The "Live page" column in a collection's list view.
 *
 * Payload's list table has no per-row action menu, so this cell is the row's way out to the
 * storefront: one small link per document, opening the page a visitor would see in a new tab.
 * Published documents go straight to the public URL; anything still in draft goes through the
 * authenticated preview route, because the public URL would 404 for an unpublished document
 * (read access is `publishedOrSignedIn`).
 *
 * Registered as the `Cell` of the `livePage` UI field (see `src/fields/live-page.ts`), which is
 * why it renders in the table without taking up any room in the edit form.
 */
const LivePageCell = ({ collectionSlug, rowData }: DefaultCellComponentProps) => {
  const target = resolveLivePageTarget(collectionSlug, rowData)

  if (!target) {
    return (
      <span className="hg-live-page-cell hg-live-page-cell--empty" title="No public page yet">
        —
      </span>
    )
  }

  return (
    <a
      className={`hg-live-page-cell hg-live-page-cell--${target.isDraft ? 'draft' : 'live'}`}
      href={target.href}
      rel="noopener noreferrer"
      target="_blank"
      title={livePageTooltip(target)}
      // Keep the browser from treating this as the row's own click target.
      onClick={(event) => event.stopPropagation()}
    >
      <span>{target.isDraft ? 'Preview' : 'View'}</span>
      <svg
        aria-hidden="true"
        fill="none"
        height="11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
        width="11"
      >
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </svg>
    </a>
  )
}

export default LivePageCell
