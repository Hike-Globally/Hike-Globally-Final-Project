'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'

import { cn } from '@/lib/utils'

interface HeroScrollCoverProps {
  hero: ReactNode
  firstSection: ReactNode
  subsequentSections?: ReactNode
  className?: string
}

const emptySubscribe = () => () => {}

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}

function subscribeReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

function getReducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getReducedMotionServerSnapshot() {
  return false
}

function subscribeCoverDistance(callback: () => void) {
  window.addEventListener('resize', callback)
  return () => window.removeEventListener('resize', callback)
}

function getCoverDistanceSnapshot() {
  const h = window.innerHeight - 72
  return h > 280 ? h : 320
}

function getCoverDistanceServerSnapshot() {
  return 700
}

/**
 * Sticky hero section with smooth scroll covering animation.
 *
 * - The Hero is full-screen and sticky at the top of the viewport; the header floats above it.
 * - The section after Hero (and subsequent content) rises from below and covers the Hero section.
 * - While scrolling, the Hero subtly recedes with depth dimming and gentle parallax.
 * - The section immediately after Hero performs a silky spring-driven entrance animation (translate, scale, opacity).
 * - Full reduced-motion and SSR-safe fallback support with zero layout shift.
 */
export function HeroScrollCover({
  hero,
  firstSection,
  subsequentSections,
  className,
}: HeroScrollCoverProps) {
  const isMounted = useIsMounted()
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  )
  const coverDistance = useSyncExternalStore(
    subscribeCoverDistance,
    getCoverDistanceSnapshot,
    getCoverDistanceServerSnapshot,
  )

  const { scrollY } = useScroll()

  // Raw scroll progress: 0 when at top of page, 1 when hero is completely covered
  const scrollProgress = useTransform(scrollY, [0, coverDistance], [0, 1], {
    clamp: true,
  })

  // Spring-smoothed progress for organic inertia (complements Lenis)
  const smoothProgress = useSpring(scrollProgress, {
    stiffness: 110,
    damping: 24,
    mass: 0.8,
    restDelta: 0.001,
  })

  // Section after Hero animations
  const firstSectionY = useTransform(smoothProgress, [0, 0.85, 1], [48, 0, 0])
  const firstSectionOpacity = useTransform(smoothProgress, [0, 0.3, 0.85, 1], [0.35, 0.75, 1, 1])
  const firstSectionScale = useTransform(smoothProgress, [0, 0.9, 1], [0.975, 1, 1])

  // Sheet handle bar animation
  const handleWidth = useTransform(smoothProgress, [0, 0.5, 1], [36, 52, 44])
  const handleOpacity = useTransform(smoothProgress, [0, 0.3, 0.8, 1], [0.5, 0.9, 0.6, 0.35])

  // Sticky hero depth effects (hero itself stays pinned full-screen; only a very subtle
  // darkening veil is applied as the next section glides over it. The hero content does
  // not scale, translate, or fade — it stays exactly as it was so the section always
  // looks full-screen and alive while scrolling.)
  const heroOverlayOpacity = useTransform(smoothProgress, [0, 0.7, 1], [0, 0.12, 0.22])
  const heroContentY = useTransform(smoothProgress, [0, 1], [0, 0])
  const heroContentOpacity = useTransform(smoothProgress, [0, 1], [1, 1])
  const heroScale = useTransform(smoothProgress, [0, 1], [1, 1])

  const enableMotion = isMounted && !prefersReducedMotion

  return (
    <div className={cn('relative w-full', className)}>
      {/* Sticky Hero section: full-screen, pinned to the top of the viewport (z-0, under the header) */}
      <div className="sticky top-0 z-0 h-[100svh] w-full overflow-hidden">
        <motion.div
          style={
            enableMotion
              ? {
                  y: heroContentY,
                  opacity: heroContentOpacity,
                  scale: heroScale,
                }
              : undefined
          }
          className="h-full w-full origin-bottom"
        >
          {hero}
        </motion.div>

        {/* Soft darkening veil for physical 3D depth as the next section glides over it */}
        <motion.div
          style={enableMotion ? { opacity: heroOverlayOpacity } : undefined}
          className="pointer-events-none absolute inset-0 bg-ink/40"
          aria-hidden="true"
        />
      </div>

      {/* Covering surface: slides smoothly up and covers the Hero section.
          Square top corners — no radius on either the left or the right side. */}
      <div className="relative z-10 -mt-6 border-t border-black/[0.06] bg-background shadow-[0_-25px_60px_-15px_rgba(0,0,0,0.25)] transition-shadow">
        {/* Hero region ends where this edge reaches the top of the viewport: the global
            header stays pinned over the Hero until it is completely covered
            (see header-frame.tsx). Zero height, so it never affects layout. */}
        <span
          data-header-hero
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-0"
        />

        {/* Subtle grab indicator bar */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <motion.div
            style={
              enableMotion
                ? { width: handleWidth, opacity: handleOpacity }
                : undefined
            }
            className="h-1.5 w-11 rounded-full bg-slate-300/80"
          />
        </div>

        {/* Section immediately after Hero — with smooth scroll-driven entrance animation */}
        <motion.div
          style={
            enableMotion
              ? {
                  y: firstSectionY,
                  opacity: firstSectionOpacity,
                  scale: firstSectionScale,
                }
              : undefined
          }
          className="origin-top"
        >
          {firstSection}
        </motion.div>

        {/* Subsequent sections below (Destinations, Journal, Inquiry...) */}
        {subsequentSections}
      </div>
    </div>
  )
}
