'use client'

import { ExternalLink } from 'lucide-react'
import type { DefaultCellComponentProps } from 'payload'

import { resolveViewLiveHref } from '@/lib/live-preview-url'

/**
 * List-view column: a link on every row that opens the public page in a new tab. Rows that were
 * never published point at the draft preview instead, because the public URL would 404.
 */
function ViewLiveCell({ rowData, collectionSlug }: DefaultCellComponentProps) {
  const row = (rowData ?? {}) as { slug?: unknown; _status?: string }
  const target = resolveViewLiveHref({
    collectionSlug,
    slug: row.slug,
    published: row._status === undefined || row._status === 'published',
  })

  if (!target) return <span className="hg-view-live hg-view-live--none">—</span>

  const label = target.isDraftPreview ? 'Preview draft' : 'View live'

  return (
    <a
      className="hg-view-live hg-view-live--cell"
      href={target.href}
      target="_blank"
      rel="noopener noreferrer"
      title={
        target.isDraftPreview
          ? 'Not published yet — opens the draft in a new tab'
          : 'Open the live page in a new tab'
      }
    >
      <ExternalLink aria-hidden="true" size={14} />
      <span>{label}</span>
      <span className="hg-view-live__sr"> (opens in a new tab)</span>
    </a>
  )
}

export default ViewLiveCell
