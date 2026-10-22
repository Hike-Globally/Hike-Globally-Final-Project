'use client'

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { useReducedMotion } from 'motion/react'

import { GLOBE_DESTINATIONS } from './globe-data'
import { drawGlobe, GLOBE_INITIAL_YAW, GLOBE_TILT, type ProjectedMarker } from './globe-renderer'

/** Idle spin, radians per second — one full turn every ~74 seconds. */
const AUTO_ROTATE_SPEED = 0.085

/** Drag sensitivity: radians of rotation per pixel. */
const DRAG_YAW = 0.0075
const DRAG_TILT = 0.0045

/** The pole can lean at most ~66° either way before the view gets disorienting. */
const TILT_LIMIT = 1.15

/** Exponential decay applied to the fling after the pointer is released. */
const SPIN_FRICTION = 3.6
const SPIN_LIMIT = 5

/** Labels sit this far under their pin, so the dot stays readable. */
const LABEL_OFFSET = 9

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Fades a label in as its pin crosses the horizon (kept in sync with the renderer). */
function labelOpacity(depth: number): number {
  const t = clamp((depth - 0.02) / 0.28, 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * The interactive globe.
 *
 * A transparent canvas draws the sphere, its land dots, route arcs and pins; the
 * destination names are real HTML labels layered on top, repositioned each frame
 * from the renderer's projection. Keeping the names in the DOM (rather than
 * painting text into the canvas) means they stay crisp at any DPR, use the
 * site's typeface, and remain readable to screen readers.
 *
 * Interaction is drag-first, no libraries:
 *  - horizontal drag spins the globe, vertical drag leans it;
 *  - releasing flings it with momentum, then the idle spin takes over;
 *  - arrow keys rotate it for keyboard users, Home resets the view;
 *  - when `prefers-reduced-motion` is set the idle spin, pulses and route dots
 *    all hold still, and only the visitor's own drag moves the globe.
 *
 * The animation only runs while the section is in (or near) the viewport and
 * the tab is visible, so a globe parked far below the fold costs nothing.
 */
export function GlobeCanvas() {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRefs = useRef(new Map<string, HTMLSpanElement>())

  const rotation = useRef({ yaw: GLOBE_INITIAL_YAW, tilt: GLOBE_TILT, spin: 0 })
  const drag = useRef({ active: false, x: 0, y: 0, time: 0 })

  const reduceMotion = useReducedMotion()
  // Seeded from the media query so the very first frame already respects it,
  // then kept in sync by `useReducedMotion` if the OS setting changes.
  const reducedRef = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    reducedRef.current = reduceMotion === true
  }, [reduceMotion])

  useEffect(() => {
    const host = frameRef.current
    const canvas = canvasRef.current
    // `alpha: true` (stated explicitly — it is also the default): the surface
    // starts fully transparent and only the sphere is ever painted onto it,
    // so no background colour can sit behind the globe.
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!host || !canvas || !ctx) return

    let frame = 0
    let last = performance.now()
    let elapsed = 0
    let width = 0
    let height = 0
    let inView = true
    let pageVisible = !document.hidden
    let running = false

    const updateLabels = (markers: ProjectedMarker[]) => {
      const visible = new Set<string>()

      for (const marker of markers) {
        visible.add(marker.id)
        const node = labelRefs.current.get(marker.id)
        if (!node) continue

        node.style.opacity = labelOpacity(marker.depth).toFixed(2)
        node.style.transform = `translate3d(${marker.x.toFixed(1)}px, ${(
          marker.y + LABEL_OFFSET
        ).toFixed(1)}px, 0) translate(-50%, 0)`
      }

      // Pins that crossed the horizon this frame: hide their labels.
      for (const [id, node] of labelRefs.current) {
        if (!visible.has(id)) node.style.opacity = '0'
      }
    }

    const paint = (now: number) => {
      const delta = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now

      const view = rotation.current
      if (!reducedRef.current) elapsed += delta

      if (!drag.current.active) {
        if (Math.abs(view.spin) > 0.015) {
          view.yaw += view.spin * delta
          view.spin *= Math.exp(-SPIN_FRICTION * delta)
        } else {
          view.spin = 0
          if (!reducedRef.current) view.yaw += AUTO_ROTATE_SPEED * delta
        }
      }

      if (width <= 0 || height <= 0) return

      const markers = drawGlobe(ctx, {
        width,
        height,
        yaw: view.yaw,
        tilt: view.tilt,
        time: elapsed,
      })

      updateLabels(markers)
    }

    const resize = () => {
      const rect = host.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      width = rect.width
      height = rect.height

      // Cap the backing store at 2× so a 3× phone doesn't render a 3× canvas.
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      last = performance.now()
      paint(last)
    }

    const tick = (now: number) => {
      paint(now)
      frame = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running || !inView || !pageVisible) return
      running = true
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }

    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
    }

    const sync = () => {
      if (inView && pageVisible) start()
      else stop()
    }

    const onVisibilityChange = () => {
      pageVisible = !document.hidden
      sync()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    document.addEventListener('visibilitychange', onVisibilityChange)

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting)
        sync()
      },
      { rootMargin: '160px 0px' },
    )
    intersectionObserver.observe(host)

    resize()
    start()

    return () => {
      stop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    event.currentTarget.setPointerCapture(event.pointerId)
    // Focus lets the arrow keys take over straight after a drag, but must not
    // scroll the page when the user is mid-drag on a touch screen.
    event.currentTarget.focus({ preventScroll: true })

    drag.current = { active: true, x: event.clientX, y: event.clientY, time: performance.now() }
    rotation.current.spin = 0
    event.currentTarget.setAttribute('data-dragging', 'true')
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = drag.current
    if (!pointer.active) return

    const now = performance.now()
    const deltaX = event.clientX - pointer.x
    const deltaY = event.clientY - pointer.y
    const seconds = Math.max(8, now - pointer.time) / 1000

    pointer.x = event.clientX
    pointer.y = event.clientY
    pointer.time = now

    rotation.current.yaw += deltaX * DRAG_YAW
    rotation.current.tilt = clamp(
      rotation.current.tilt + deltaY * DRAG_TILT,
      -TILT_LIMIT,
      TILT_LIMIT,
    )
    // Remember the last flick so releasing the pointer carries the motion on.
    rotation.current.spin = clamp((deltaX * DRAG_YAW) / seconds, -SPIN_LIMIT, SPIN_LIMIT)
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = drag.current
    if (!pointer.active) return

    pointer.active = false
    // A pointer held still before release shouldn't fling the globe.
    if (performance.now() - pointer.time > 90) rotation.current.spin = 0

    event.currentTarget.removeAttribute('data-dragging')
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const view = rotation.current
    const keyStep = 0.14
    const tiltStep = 0.09
    let handled = true

    switch (event.key) {
      case 'ArrowLeft':
        view.yaw -= keyStep
        break
      case 'ArrowRight':
        view.yaw += keyStep
        break
      case 'ArrowUp':
        view.tilt = clamp(view.tilt - tiltStep, -TILT_LIMIT, TILT_LIMIT)
        break
      case 'ArrowDown':
        view.tilt = clamp(view.tilt + tiltStep, -TILT_LIMIT, TILT_LIMIT)
        break
      case 'Home':
        view.yaw = GLOBE_INITIAL_YAW
        view.tilt = GLOBE_TILT
        break
      default:
        handled = false
    }

    if (!handled) return

    view.spin = 0
    event.preventDefault()
  }

  return (
    <div
      ref={frameRef}
      data-globe
      role="group"
      tabIndex={0}
      aria-roledescription="3D globe"
      aria-label="Globe of Hike Globally destinations. Drag, or use the arrow keys, to rotate it."
      aria-describedby="about-globe-hint"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onKeyDown={onKeyDown}
      className="globe-frame absolute inset-0"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 size-full bg-transparent"
      />

      {/* Names are painted from the canvas projection each frame; the ticker below
          already lists every destination in text, so this layer is decorative. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {GLOBE_DESTINATIONS.map((destination) => (
          <span
            key={destination.id}
            ref={(node) => {
              if (node) labelRefs.current.set(destination.id, node)
              else labelRefs.current.delete(destination.id)
            }}
            className="globe-label"
            style={{ opacity: 0 }}
          >
            {destination.name}
          </span>
        ))}
      </div>
    </div>
  )
}
