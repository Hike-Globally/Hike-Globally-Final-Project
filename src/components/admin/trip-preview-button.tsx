'use client'

import { Eye } from 'lucide-react'
import { useLivePreviewContext } from '@payloadcms/ui'

/** Keep the familiar eye control, but open the authenticated draft preview in a new tab. */
export default function TripPreviewButton() {
  const { previewURL } = useLivePreviewContext()

  if (!previewURL) return null

  const label = 'Preview trip (opens in a new tab)'

  return (
    <a
      className="preview-btn"
      id="preview-button"
      href={previewURL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
    >
      <Eye aria-hidden="true" size={24} />
    </a>
  )
}
