import { lookupInternalLinkPreview } from '@/lib/link-preview-internal'
import type { MultiUrlPreviewSource } from '@/lib/multi-url-preview'
import { resolveMultiUrlPreview } from '@/lib/multi-url-preview-resolver'

import { MultiUrlPreviewRail } from './multi-url-preview-rail'

/** Both placements resolve on the server; the client only receives finished, serializable cards. */
export async function MultiUrlPreviewSection({
  source,
  placement = 'section',
}: {
  source: MultiUrlPreviewSource
  placement?: 'section' | 'inline'
}) {
  const preview = await resolveMultiUrlPreview(source, { internal: lookupInternalLinkPreview })
  if (!preview?.cards.length) return null
  return <MultiUrlPreviewRail {...preview} placement={placement} />
}
