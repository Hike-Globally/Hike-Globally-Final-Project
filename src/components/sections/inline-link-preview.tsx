import { resolveLinkPreview, type LinkPreviewSource } from '@/lib/link-preview'
import { lookupInternalLinkPreview } from '@/lib/link-preview-internal'

import { LinkPreviewCard } from './link-preview-card'

/** Resolve the same metadata and render the same card as a standalone Link preview section. */
export async function InlineLinkPreview({ source }: { source: LinkPreviewSource }) {
  const card = await resolveLinkPreview(source, { internal: lookupInternalLinkPreview })
  if (!card) return null

  return (
    <div className="inline-link-preview">
      <LinkPreviewCard card={card} />
    </div>
  )
}
