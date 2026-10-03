'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'

declare global {
  interface Window {
    __lenis?: Lenis
  }
}

/**
 * Lenis smooth scrolling.
 *
 * Lenis intercepts the wheel/touch events and animates `scrollTop` itself on a rAF loop, which
 * is what produces the heavy, inertia-like feel of a high-end site without hijacking keyboard
 * navigation or screen readers.
 *
 * Two details that matter in production:
 *  1. It is disabled entirely for visitors with `prefers-reduced-motion: reduce`.
 *  2. It is torn down on unmount, and re-created when the route changes, so the scroll position
 *     resets to the top of the new page instead of sticking halfway down.
 */
export function SmoothScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.05,
      // Exponential ease-out: fast start, long soft landing.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    })

    window.__lenis = lenis

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    // Route softly to in-page anchors (/#itinerary) instead of jumping.
    const onAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || !href.startsWith('#')) return
      const target = document.querySelector(href)
      if (!target) return
      event.preventDefault()
      lenis.scrollTo(target as HTMLElement, { offset: -96 })
    }

    document.addEventListener('click', onAnchorClick)

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('click', onAnchorClick)
      lenis.destroy()
      delete window.__lenis
    }
  }, [])

  useEffect(() => {
    window.__lenis?.scrollTo(0, { immediate: true })
  }, [pathname])

  return null
}
