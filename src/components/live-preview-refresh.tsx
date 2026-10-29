'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

const subscribe = () => () => {}

const getPreviewOrigin = (): string | null => {
  if (typeof window === 'undefined' || (window.parent === window && !window.opener)) return null
  return window.location.origin
}

/**
 * Payload sends document events from its admin editor to the storefront iframe. Refresh the current
 * server-rendered route after autosaves so the newest draft version is read from the Local API.
 * Debounced so rapid back-to-back save events coalesce into one RSC render instead of stacking CPU
 * work on Fluid Compute. Stays inert on ordinary visits.
 */
export function LivePreviewRefresh() {
  const router = useRouter()
  const serverURL = useSyncExternalStore(subscribe, getPreviewOrigin, () => null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    },
    [],
  )

  const refresh = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      router.refresh()
    }, 300)
  }, [router])

  if (!serverURL) return null

  return <RefreshRouteOnSave refresh={refresh} serverURL={serverURL} />
}
