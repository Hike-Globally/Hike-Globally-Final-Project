'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { FocusEvent, KeyboardEvent, PointerEvent } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'

import { PlaceCategoryCard } from '@/components/cards/place-category-card'
import { SectionHeading } from '@/components/sections/section-heading'
import { PLACE_INDEX_PATH, placeCategories } from '@/lib/place-categories'
import {
  advanceLoopPosition,
  getArrowScroll,
  getAutoScrollDelta,
  getLoopWidth,
  getSlideDistance,
  normalizeLoopPosition,
} from '@/lib/place-carousel'

import './browse-places.css'

const TRACK_ID = 'browse-places-track'
const HELP_ID = 'browse-places-help'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const MANUAL_COOLDOWN_MS = 2800
/** How long clicks stay suppressed after a drag/swipe (covers the trailing click). */
const CLICK_SUPPRESS_MS = 500
/** A touch that travels further than this is a swipe, not a tap on a card. */
const TOUCH_SWIPE_THRESHOLD_PX = 8

const getReducedMotionSnapshot = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches

const subscribeToReducedMotion = (onChange: () => void): (() => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

type PauseState = {
  hover: boolean
  focus: boolean
  drag: boolean
  visible: boolean
  hidden: boolean
}

type DragState = {
  active: boolean
  startX: number
  startLeft: number
  moved: boolean
  pointerId: number | null
}

/**
 * A Komoot-inspired "Browse places" marquee, rebuilt in the Hike Globally
 * design language. It is a native horizontal scroller with duplicated cards:
 * requestAnimationFrame advances it, arrow buttons and keyboard move it by a
 * card, mouse/pen drag and touch swipe work, and every form of interaction
 * pauses the automatic motion. Reduced-motion users get the manual carousel
 * only. URL paths stay unprefixed and are never written by this component.
 */
export function BrowsePlaces() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const pauseStateRef = useRef<PauseState>({
    hover: false,
    focus: false,
    drag: false,
    visible: true,
    hidden: false,
  })
  const dragRef = useRef<DragState>({
    active: false,
    startX: 0,
    startLeft: 0,
    moved: false,
    pointerId: null,
  })
  const cooldownRef = useRef(0)
  /**
   * Clicks are ignored until this timestamp after a drag/swipe ends. A boolean
   * reset by `setTimeout(0)` races the click event (the timer can fire first,
   * letting a drag navigate), and touch swipes never set it at all — both made
   * browsing the marquee unexpectedly change the page to a category. A
   * timestamp covers the click however the browser orders the tasks.
   */
  const suppressClickUntilRef = useRef(0)
  /** Touch swipe tracking: a swipe must not become a tap on the card it ends over. */
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const [manuallyPaused, setManuallyPaused] = useState(false)
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  )
  const setSize = placeCategories.length

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const onVisibilityChange = () => {
      pauseStateRef.current.hidden = document.hidden
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    onVisibilityChange()

    let observer: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          pauseStateRef.current.visible = entry?.isIntersecting ?? true
        },
        { threshold: 0.02 },
      )
      observer.observe(section)
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      observer?.disconnect()
    }
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track || reducedMotion || manuallyPaused) return

    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      const delta = getAutoScrollDelta(now - last)
      last = now

      const pause = pauseStateRef.current
      const allowed =
        pause.visible &&
        !pause.hidden &&
        !pause.hover &&
        !pause.focus &&
        !pause.drag &&
        Date.now() >= cooldownRef.current

      if (allowed && delta > 0) {
        const loopWidth = getLoopWidth(track, setSize)
        if (loopWidth > 0) {
          track.scrollLeft = advanceLoopPosition(track.scrollLeft, delta, loopWidth)
        }
      }

      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [manuallyPaused, reducedMotion, setSize])

  const pauseBriefly = useCallback(() => {
    cooldownRef.current = Date.now() + MANUAL_COOLDOWN_MS
  }, [])

  const slide = useCallback(
    (stepCount: number) => {
      const track = trackRef.current
      if (!track) return

      const firstCard = track.children[0] as HTMLElement | undefined
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 20
      const step = getSlideDistance(firstCard?.getBoundingClientRect().width ?? 0, gap, stepCount)
      const loopWidth = getLoopWidth(track, setSize)
      const { prepared, target } = getArrowScroll(track.scrollLeft, step, loopWidth)

      if (prepared !== track.scrollLeft) track.scrollLeft = prepared
      if (typeof track.scrollTo === 'function') {
        track.scrollTo({ left: target, behavior: reducedMotion ? 'auto' : 'smooth' })
      } else {
        track.scrollLeft = target
      }
      pauseBriefly()
    },
    [pauseBriefly, reducedMotion, setSize],
  )

  const finishDrag = useCallback(
    (event?: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      const track = trackRef.current
      if (!drag.active || !track) return

      drag.active = false
      pauseStateRef.current.drag = false
      delete track.dataset.dragging

      if (drag.moved) {
        // The click that follows this drag must not navigate: the pointer
        // captured the track, so the click would otherwise land on whatever
        // card the drag ended over.
        suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS
      }

      if (
        event &&
        drag.pointerId !== null &&
        typeof track.hasPointerCapture === 'function' &&
        typeof track.releasePointerCapture === 'function' &&
        track.hasPointerCapture(drag.pointerId)
      ) {
        track.releasePointerCapture(drag.pointerId)
      }
      pauseBriefly()
    },
    [pauseBriefly],
  )

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Touch gets the browser's native horizontal swipe; mouse/pen get drag-to-scroll.
    if (event.pointerType === 'touch' || event.button !== 0) return
    const track = trackRef.current
    if (!track) return

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startLeft: track.scrollLeft,
      moved: false,
      pointerId: event.pointerId,
    }
    pauseStateRef.current.drag = true
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const track = trackRef.current
    if (!drag.active || !track) return

    const delta = event.clientX - drag.startX
    if (!drag.moved) {
      if (Math.abs(delta) <= 4) return
      drag.moved = true
      track.dataset.dragging = 'true'
      // Capture only once a drag starts. Capturing on pointerdown retargets a
      // normal click to the track instead of the category link underneath.
      if (typeof track.setPointerCapture === 'function') track.setPointerCapture(event.pointerId)
    }
    const loopWidth = getLoopWidth(track, setSize)
    track.scrollLeft = normalizeLoopPosition(drag.startLeft - delta, loopWidth)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Arrow keys belong to the track itself; a focused card link keeps normal link behaviour.
    if (event.target !== event.currentTarget) return
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      PageUp: -2,
      PageDown: 2,
    }
    const step = steps[event.key]
    if (step === undefined) return
    event.preventDefault()
    slide(step)
  }

  const onBlurCapture = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      pauseStateRef.current.focus = false
    }
  }

  const motionLabel = reducedMotion
    ? 'Automatic motion is off'
    : manuallyPaused
      ? 'Resume motion'
      : 'Pause motion'

  return (
    <section
      ref={sectionRef}
      id="browse-places"
      data-browse-places=""
      aria-labelledby="browse-places-title"
      className="browse-places py-16 md:py-24"
      onMouseEnter={() => {
        pauseStateRef.current.hover = true
      }}
      onMouseLeave={() => {
        pauseStateRef.current.hover = false
      }}
      onFocusCapture={() => {
        pauseStateRef.current.focus = true
      }}
      onBlurCapture={onBlurCapture}
    >
      <div className="container-content">
        <SectionHeading
          eyebrow="EXPLORE BEYOND THE MAP"
          title="Browse places"
          titleId="browse-places-title"
          description="Your next favorite place is just a scroll away. Choose a landscape, then follow it into trips and field notes curated around the things worth travelling for."
          action={{ href: PLACE_INDEX_PATH, label: 'View all places' }}
          variant="light"
          className="browse-places__heading"
          titleClassName="home-section-title"
          descriptionClassName="home-section-intro"
          controls={
            <div className="browse-places__controls">
              <span className="browse-places__count" aria-hidden="true">
                09 / Curated
              </span>
              <button
                type="button"
                className="browse-places__control"
                aria-label={motionLabel}
                aria-pressed={manuallyPaused}
                aria-controls={TRACK_ID}
                title={motionLabel}
                disabled={reducedMotion}
                onClick={() => setManuallyPaused((paused) => !paused)}
              >
                {manuallyPaused ? (
                  <Play className="size-4" aria-hidden="true" />
                ) : (
                  <Pause className="size-4" aria-hidden="true" />
                )}
                <span className="sr-only">{motionLabel}</span>
              </button>
              <button
                type="button"
                className="browse-places__control"
                aria-label="Previous places"
                aria-controls={TRACK_ID}
                title="Previous places"
                onClick={() => slide(-1)}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="browse-places__control"
                aria-label="Next places"
                aria-controls={TRACK_ID}
                title="Next places"
                onClick={() => slide(1)}
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          }
        />
      </div>

      <div
        ref={trackRef}
        id={TRACK_ID}
        role="region"
        aria-label="Browse places categories"
        aria-describedby={HELP_ID}
        aria-keyshortcuts="ArrowLeft ArrowRight PageUp PageDown"
        tabIndex={0}
        className="browse-places__track container-gutter no-scrollbar"
        data-place-carousel=""
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onTouchStart={(event) => {
          pauseStateRef.current.drag = true
          pauseBriefly()
          const touch = event.touches[0]
          touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null
        }}
        onTouchEnd={(event) => {
          pauseStateRef.current.drag = false
          pauseBriefly()
          // A swipe ends with a synthetic click on the card under the finger;
          // without suppression, browsing the marquee would navigate to
          // whatever category the swipe happened to stop over.
          const start = touchStartRef.current
          const touch = event.changedTouches[0]
          if (start && touch) {
            const travelled = Math.hypot(touch.clientX - start.x, touch.clientY - start.y)
            if (travelled > TOUCH_SWIPE_THRESHOLD_PX) {
              suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS
            }
          }
          touchStartRef.current = null
        }}
        onClickCapture={(event) => {
          if (Date.now() >= suppressClickUntilRef.current) return
          event.preventDefault()
          event.stopPropagation()
        }}
        onKeyDown={onKeyDown}
      >
        {[...placeCategories, ...placeCategories].map((category, index) => {
          const primary = index < setSize
          return (
            <PlaceCategoryCard
              key={`${primary ? 'primary' : 'loop'}-${category.value}`}
              category={category}
              index={index % setSize}
              glass
              decorative={!primary}
            />
          )
        })}
      </div>

      <p id={HELP_ID} className="browse-places__instruction container-content">
        Drag, swipe or use the arrow keys to explore. The carousel pauses on hover and focus.
      </p>
    </section>
  )
}
