'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import { useCallback, useSyncExternalStore } from 'react'

const subscribe = () => () => {}

const getPreviewOrigin = (): string | null => {
  if (typeof window === 'undefined' || (window.parent === window && !window.opener)) return null
  return window.location.origin
}

/**
 * Payload sends document events from its admin editor to the storefront iframe. Refresh the current
 * server-rendered route after autosaves so the newest draft version is read from the Local API.
 * This stays inert on ordinary visits and only subscribes when the page is embedded/opened by the
 * Payload admin.
 */
export function LivePreviewRefresh() {
  const router = useRouter()
  const serverURL = useSyncExternalStore(subscribe, getPreviewOrigin, () => null)
  const refresh = useCallback(() => router.refresh(), [router])

  if (!serverURL) return null

  return <RefreshRouteOnSave refresh={refresh} serverURL={serverURL} />
}
