'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { useFrontendLocale } from '@/i18n/frontend-locale'
import { applyFrontendTranslations, observeFrontendTranslations } from '@/i18n/dom-translations'
import { loadTranslations } from '@/i18n/load-translations'

/**
 * Frontend-only language runtime.
 *
 * The cookie is read on the client so every route remains statically renderable
 * and keeps its existing unprefixed URL. After hydration (and after every App
 * Router navigation) the selected dictionary is applied to the rendered DOM;
 * unknown CMS strings keep their English source. No Payload locale or URL is
 * involved.
 */
export function FrontendLocaleRuntime() {
  const locale = useFrontendLocale()
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    let stopObserving: (() => void) | undefined

    loadTranslations(locale)
      .then((translations) => {
        if (cancelled) return
        applyFrontendTranslations(locale, translations)
        stopObserving = observeFrontendTranslations(locale, translations)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.warn('[frontend-locale] Could not load translations:', error)
        }
      })

    return () => {
      cancelled = true
      stopObserving?.()
    }
  }, [locale, pathname])

  return null
}
