'use client'

import { useSyncExternalStore } from 'react'

import {
  FRONTEND_LOCALE_COOKIE,
  defaultFrontendLocale,
  isFrontendLocale,
  type FrontendLocale,
} from './config'

export const FRONTEND_LOCALE_EVENT = 'hg:frontend-locale-change'

/** Parse the cookie without touching the DOM, so this is easy to unit-test. */
export function getFrontendLocaleFromCookie(cookie: string): FrontendLocale {
  const prefix = `${FRONTEND_LOCALE_COOKIE}=`

  for (const part of cookie.split(';')) {
    const entry = part.trim()
    if (!entry.startsWith(prefix)) continue
    try {
      const value = decodeURIComponent(entry.slice(prefix.length))
      if (isFrontendLocale(value)) return value
    } catch {
      // A malformed cookie simply falls back to English.
    }
  }

  return defaultFrontendLocale
}

export function getFrontendLocale(): FrontendLocale {
  if (typeof document === 'undefined') return defaultFrontendLocale
  return getFrontendLocaleFromCookie(document.cookie)
}

function writeFrontendLocaleCookie(locale: FrontendLocale): void {
  if (typeof document === 'undefined') return
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie =
    `${FRONTEND_LOCALE_COOKIE}=${encodeURIComponent(locale)}; ` +
    `Path=/; Max-Age=31536000; SameSite=Lax${secure}`
}

/** Change language in place — the URL and route are deliberately untouched. */
export function setFrontendLocale(locale: FrontendLocale): FrontendLocale {
  const next = isFrontendLocale(locale) ? locale : defaultFrontendLocale
  writeFrontendLocaleCookie(next)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(FRONTEND_LOCALE_EVENT))
  }
  return next
}

export function subscribeFrontendLocale(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(FRONTEND_LOCALE_EVENT, listener)
  window.addEventListener('focus', listener)
  return () => {
    window.removeEventListener(FRONTEND_LOCALE_EVENT, listener)
    window.removeEventListener('focus', listener)
  }
}

const getServerFrontendLocale = (): FrontendLocale => defaultFrontendLocale

/** Server render stays English; the client re-renders with the cookie locale after hydration. */
export function useFrontendLocale(): FrontendLocale {
  return useSyncExternalStore(
    subscribeFrontendLocale,
    getFrontendLocale,
    getServerFrontendLocale,
  )
}
