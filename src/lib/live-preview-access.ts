import { cache } from 'react'
import { draftMode, headers } from 'next/headers'

import { isAdminOrEditor } from '@/access'
import { getPayloadClient } from '@/lib/payload'

/**
 * Draft Mode is only enabled by the authenticated `/api/live-preview` entry route. Check the
 * Payload session as well, so a stale Draft Mode cookie can never expose unpublished content after
 * an editor signs out or loses access.
 *
 * React's request cache lets generateMetadata() and the page body share the same auth check.
 */
export const isLivePreviewRequest = cache(async (): Promise<boolean> => {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return false

  try {
    const requestHeaders = await headers()
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: requestHeaders })
    return isAdminOrEditor(user)
  } catch {
    return false
  }
})
