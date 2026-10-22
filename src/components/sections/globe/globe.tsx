'use client'

import { lazy, Suspense, useEffect, useRef, useState } from 'react'

import './globe.css'

/**
 * The globe carries the ~40 KB land-dot field plus the canvas renderer, so it is
 * code-split behind `lazy()` and only imported when the visual is about to enter
 * the viewport — a visit that never scrolls this far never downloads it. Until
 * then, and on every server render, a static sphere stands in so the section
 * never jumps or flashes an empty square.
 */
const GlobeCanvas = lazy(() =>
  import('./globe-canvas').then((module) => ({ default: module.GlobeCanvas })),
)

/**
 * "About Hike Globally" globe — the interactive replacement for the old orbit
 * illustration.
 *
 * The component is desktop-only at the section level (`hidden lg:block`): a
 * 3D sphere needs room to read, and the section below `lg` is a single stacked
 * column of copy + ticker. Because a `display: none` element never intersects,
 * phones never download the globe chunk either.
 */
export function Globe() {
  const frameRef = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (live) return

    const frame = frameRef.current
    if (!frame) return

    // Older browsers without IntersectionObserver simply get the globe at once,
    // on the next task so the first paint (and hydration) is never blocked.
    if (typeof IntersectionObserver === 'undefined') {
      const timer = window.setTimeout(() => setLive(true), 0)
      return () => window.clearTimeout(timer)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLive(true)
          observer.disconnect()
        }
      },
      // Start fetching slightly before the globe scrolls in, so it is drawn by
      // the time it is actually on screen.
      { rootMargin: '300px 0px' },
    )

    observer.observe(frame)
    return () => observer.disconnect()
  }, [live])

  return (
    <div className="relative w-full">
      <div
        ref={frameRef}
        className="relative mx-auto aspect-square w-full max-w-[27rem] 3xl:max-w-[32rem]"
      >
        {live ? (
          <Suspense fallback={<GlobePlaceholder />}>
            <GlobeCanvas />
          </Suspense>
        ) : (
          <GlobePlaceholder />
        )}
      </div>

      <p
        id="about-globe-hint"
        className="mt-1 flex items-center justify-center gap-3 text-[0.625rem] font-semibold tracking-[0.22em] text-mist/40 uppercase"
      >
        <span aria-hidden="true" className="h-px w-6 bg-white/15" />
        Drag to explore
        <span aria-hidden="true" className="h-px w-6 bg-white/15" />
      </p>
    </div>
  )
}

/** Static stand-in: the ocean sphere only, sized and lit exactly like the canvas one. */
function GlobePlaceholder() {
  return (
    <div aria-hidden="true" className="globe-placeholder">
      <span className="globe-placeholder__sphere" />
    </div>
  )
}
