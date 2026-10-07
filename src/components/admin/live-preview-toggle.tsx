'use client'

import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useLivePreviewContext } from '@payloadcms/ui'

/** A clear, keyboard-accessible way to collapse and reopen Payload's live-preview pane. */
function LivePreviewToggle() {
  const { isLivePreviewing, setIsLivePreviewing, url } = useLivePreviewContext()

  if (!url) return null

  const label = isLivePreviewing ? 'Collapse preview' : 'Expand preview'
  const Icon = isLivePreviewing ? PanelRightClose : PanelRightOpen

  return (
    <button
      type="button"
      className="hg-live-preview-toggle"
      aria-label={label}
      aria-expanded={isLivePreviewing}
      title={label}
      onClick={() => setIsLivePreviewing(!isLivePreviewing)}
    >
      <Icon aria-hidden="true" size={16} />
      <span>{label}</span>
    </button>
  )
}

export default LivePreviewToggle
