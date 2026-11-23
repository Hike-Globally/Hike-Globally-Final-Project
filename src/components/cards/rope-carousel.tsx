'use client'

/**
 * ============================================================================
 * ROPE CURVE CAROUSEL — a 1:1 recreation of the reference build saved in
 * `docs/assets/rope-carousel-reference.html` (ropecurvecarousel.framer.website, "Rope Curve Carousel").
 * ============================================================================
 * Every static value (curve shape, rope strokes, card geometry, peg clip,
 * hang shadow, edge fade mask, hover choreography) is measured straight from
 * the reference markup; the dynamics reproduce the reference behaviour
 * documented on its marketplace page:
 *
 *   • Infinite flow — cards ride a sagging rope across the full viewport.
 *   • Card-follow — each card's hang point sits exactly on the rope and its
 *     rotation follows the rope tangent (verified against the snapshot:
 *     pivot = curveY(cardCentreX), per-slot, within 0.05px).
 *   • Natural sway — each card is a damped pendulum around its peg
 *     (~2.2s period), driven by carousel acceleration plus a gentle idle sway.
 *   • Autoplay, pause on hover, drag with momentum, horizontal wheel /
 *     trackpad navigation, keyboard arrows.
 *   • `prefers-reduced-motion`: no autoplay, no sway — the rope stays static
 *     and the cards can still be dragged/wheel-scrolled.
 */

import Link from 'next/link'
import Image from '@/components/ui/next-image'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import { cn } from '@/lib/utils'

import { BRAND, ROPE, ROPE_SHADOW, ROPE_WRAP, mixHex, rgbaOf } from '@/lib/brand-colors'

import './rope-carousel.css'

export type RopeCarouselItem = {
  href: string
  title: string
  caption: string
  image: { src: string; alt: string } | null
}

/* ---------------------------------------------------------------------------
 * Geometry — ratios measured from the reference snapshot (350px cards).
 * ------------------------------------------------------------------------- */
const RATIO = 0.8 // card aspect ratio (w/h)
const RADIUS = 0 // square corners — the house radius, matching `globals.css`
const GAP = 28 // gap between cards — 378px pitch at 350px cards
const PIVOT_RATIO = 23.75 / 350 // rope → card-top distance (transform-origin)
const SAG_RATIO = 128.7 / 350 // rope sag depth, relative to card width
const OVERSCAN = 0.06 // rope extends 6% of the viewport past each edge
// Air above the rope anchor line. Sized so a card dragged fully off the rope
// (the curve clamps at t ≈ 1.25 and the card rises ~0.67·sag above the anchor)
// never clips against the container top — exactly like the reference, whose
// full-viewport container keeps the same headroom.
const TOP_PAD = 0.2715
const BOTTOM_PAD = 0.09 // air below the deepest card
const CLIP_TOP_RATIO = -38.75 / 350
const CLIP_W_RATIO = 22.5 / 350
const CLIP_H_RATIO = 62.5 / 350
const SHADE_W_RATIO = 33.75 / 350
const SHADE_H_RATIO = 12.5 / 350
const CAP_INSET = 21 // caption padding from the card edges

/* ---------------------------------------------------------------------------
 * Dynamics
 * ------------------------------------------------------------------------- */
const AUTO_SPEED = 60 // px/s autoplay drift (leftward)
const MAX_FLING = 2600 // px/s
const SWING_K = 8.2 // pendulum stiffness (1/s²) → ≈2.2s period
const SWING_C = 0.52 // damping ≈ 2·ζ·√k, ζ ≈ 0.09
const SWING_L_RATIO = PIVOT_RATIO + 1 / RATIO / 2 // pivot → card centre, in cardW
const SWAY_AMP = 2.0 // deg — idle sway amplitude
const SWAY_PERIOD = 3.4 // s
const MAX_TORQUE_ACCEL = 420 // px/s² — clamp on swing forcing
const MAX_SWING = 9 // deg — hard clamp on the swing angle
const FLING_RATE = 1.7 // 1/s — fling settles back to autoplay speed
const SETTLE_RATE = 4.0 // 1/s — autoplay ease-in/out (hover pause)
const WHEEL_RATE = 10 // 1/s — wheel/keyboard glide convergence
const GOLDEN = 2.399963229728653 // per-card sway phase step (golden angle)

const DEG = 180 / Math.PI
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/**
 * Rope drop profile: 0 at the anchors, 1 at mid-span. Quartic blend fitted to
 * the 81 sampled points of the reference rope path (max deviation < 0.12px).
 * Past the anchors the reference clamps the curve at t ≈ 1.2518, so cards
 * that ride off the rope's ends glide along at a fixed height.
 */
const drop = (t: number) => {
  const t2 = t * t
  return 0.88 * t2 + 0.12 * t2 * t2
}
const dropSlope = (t: number) => 1.76 * t + 0.48 * t * t * t
const T_CLAMP = 1.2518

const round1 = (n: number) => Math.round(n * 10) / 10

type Dims = {
  W: number
  H: number
  cardW: number
  cardH: number
  spacing: number
  pivot: number
  anchorY: number
  sag: number
  halfSpan: number
  cx: number
}

type Layout = {
  dims: Dims
  jMin: number
  jMax: number
  cycleW: number
  pathD: string
}

function computeDims(width: number, remScale = 1): Dims {
  const W = Math.max(260 * remScale, width)
  /* The rest of the page follows the root-rem canvas scale in globals.css.
     Keep the rope cards and their inter-card rhythm in step, too; otherwise
     the copy grows at 4K while the images stay at their laptop dimensions. */
  const maxCard = (width >= 3840 ? 560 : width >= 2560 ? 480 : width >= 1920 ? 420 : 350) * remScale
  const minCard = Math.min(230 * remScale, Math.max(168 * remScale, W * 0.68))
  const cardW = Math.min(maxCard, Math.max(minCard, W * 0.72))
  const cardH = cardW / RATIO
  const pivot = PIVOT_RATIO * cardW
  const sag = SAG_RATIO * cardW
  // The clip overhangs the rope by 15px at reference scale; keep it inside.
  const anchorY = (TOP_PAD + 15 / 350) * cardW
  const H = anchorY + sag + pivot + cardH + BOTTOM_PAD * cardW
  return {
    W,
    H,
    cardW,
    cardH,
    spacing: cardW + GAP * remScale,
    pivot,
    anchorY,
    sag,
    halfSpan: W / 2 + OVERSCAN * W,
    cx: W / 2,
  }
}

function computeLayout(dims: Dims, count: number): Layout {
  const cycleW = Math.max(1, count) * dims.spacing
  const margin = dims.spacing * 2
  const jMin = Math.floor(-margin / dims.spacing)
  const jMax = Math.ceil((cycleW + dims.W + margin) / dims.spacing)

  // Rope path: 81 samples across viewport + overscan, exactly like the
  // reference snapshot.
  const o = OVERSCAN * dims.W
  let d = ''
  for (let i = 0; i <= 80; i += 1) {
    const x = -o + ((dims.W + 2 * o) * i) / 80
    const t = Math.abs(x - dims.cx) / dims.halfSpan
    const y = dims.anchorY + dims.sag * (1 - drop(t))
    d += `${i === 0 ? 'M' : ' L'}${round1(x)} ${round1(y)}`
  }

  return { dims, jMin, jMax, cycleW, pathD: d }
}

/* ---------------------------------------------------------------------------
 * Simulation state (refs — the rAF loop never re-renders React).
 * ------------------------------------------------------------------------- */
type Sim = {
  travel: number // unbounded scroll distance; offset = travel mod cycleW
  lastTravel: number // travel at the end of the previous frame
  v: number // current velocity (autoplay / fling / drag), px/s
  prevV: number
  pending: number // queued wheel/keyboard glide, px
  pendulum: { th: number; w: number }[]
  hovered: boolean
  hoverCapable: boolean
  dragging: boolean
  dragStartX: number
  dragStartTravel: number
  dragMoved: number
  reduced: boolean
  inView: boolean
  tabVisible: boolean
  lastT: number
}

const createSim = (): Sim => ({
  travel: 0,
  lastTravel: 0,
  v: 0,
  prevV: 0,
  pending: 0,
  pendulum: [],
  hovered: false,
  hoverCapable: true,
  dragging: false,
  dragStartX: 0,
  dragStartTravel: 0,
  dragMoved: 0,
  reduced: false,
  inView: true,
  tabVisible: true,
  lastT: 0,
})

/* ---------------------------------------------------------------------------
 * The peg clip — exact path data from the reference markup.
 * ------------------------------------------------------------------------- */
function PegClip() {
  return (
    <svg
      viewBox="0 0 18 50"
      width="100%"
      height="100%"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden
    >
      <path
        d="M4 0 H14 A2 2 0 0 1 16 2 V47 A3 3 0 0 1 13 50 H5 A3 3 0 0 1 2 47 V2 A2 2 0 0 1 4 0 Z"
        fill={ROPE}
      />
      <path
        d="M4 0 H6 V50 H5 A3 3 0 0 1 2 47 V2 A2 2 0 0 1 4 0 Z"
        fill={BRAND.white}
        opacity="0.22"
      />
      <path
        d="M13 0 H14 A2 2 0 0 1 16 2 V47 A3 3 0 0 1 13 50 Z"
        fill={BRAND.ink}
        opacity="0.18"
      />
      <path d="M9 30 V49.5" stroke={BRAND.ink} strokeOpacity="0.24" strokeWidth="0.9" />
      <rect x="0.5" y="19" width="17" height="6" rx="2" fill={ROPE_WRAP} />
      <path
        d="M4 19.6 V24.4 M7 19.6 V24.4 M10 19.6 V24.4 M13 19.6 V24.4"
        stroke={ROPE_SHADOW}
        strokeOpacity="0.32"
        strokeWidth="0.7"
      />
      <rect
        x="1"
        y="19.3"
        width="16"
        height="1.3"
        rx="0.65"
        fill={BRAND.white}
        opacity="0.5"
      />
    </svg>
  )
}

/* --------------------------------------------------------------------------- */

export function RopeCarousel({
  items,
  label = 'Hanging cards',
  className,
}: {
  items: RopeCarouselItem[]
  label?: string
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const simRef = useRef<Sim>(createSim())
  const [grabbing, setGrabbing] = useState(false)
  const [layout, setLayout] = useState<Layout>(() =>
    computeLayout(computeDims(1440), Math.max(1, items.length)),
  )
  const layoutRef = useRef(layout)
  const lastWidthRef = useRef(0)
  const lastRemScaleRef = useRef(1)

  useEffect(() => {
    layoutRef.current = layout
  }, [layout])

  /* ---- measure + keep layout in sync with the container width ----------- */
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const apply = (width: number) => {
      const remScale = Math.max(1, parseFloat(getComputedStyle(document.documentElement).fontSize) / 16)
      if (
        Math.abs(width - lastWidthRef.current) < 1 &&
        Math.abs(remScale - lastRemScaleRef.current) < 0.005
      ) {
        return
      }
      lastWidthRef.current = width
      lastRemScaleRef.current = remScale
      setLayout(computeLayout(computeDims(width, remScale), Math.max(1, items.length)))
    }

    const measure = () => apply(root.getBoundingClientRect().width)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    window.addEventListener('resize', measure, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [items.length])

  /* ---- environment flags ------------------------------------------------- */
  useEffect(() => {
    const sim = simRef.current
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const hoverQuery = window.matchMedia('(hover: hover)')
    sim.reduced = reducedQuery.matches
    sim.hoverCapable = hoverQuery.matches
    const onReduced = () => {
      sim.reduced = reducedQuery.matches
    }
    const onHover = () => {
      sim.hoverCapable = hoverQuery.matches
    }
    reducedQuery.addEventListener('change', onReduced)
    hoverQuery.addEventListener('change', onHover)

    const onVisibility = () => {
      sim.tabVisible = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibility)

    const root = rootRef.current
    let ioCleanup: (() => void) | undefined
    if (root && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) sim.inView = entry.isIntersecting
        },
        { threshold: 0 },
      )
      io.observe(root)
      ioCleanup = () => io.disconnect()
    }

    return () => {
      reducedQuery.removeEventListener('change', onReduced)
      hoverQuery.removeEventListener('change', onHover)
      document.removeEventListener('visibilitychange', onVisibility)
      ioCleanup?.()
    }
  }, [])

  /* ---- wheel: horizontal deltas drive the rope; vertical keeps page scroll
     (the reference maps both axes, but on the homepage a vertical scroll trap
     would lock visitors inside the section). ------------------------------- */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onWheel = (e: WheelEvent) => {
      const sim = simRef.current
      let dx = e.deltaX
      let dy = e.deltaY
      if (e.deltaMode === 1) {
        dx *= 32
        dy *= 32
      } else if (e.deltaMode === 2) {
        dx *= layoutRef.current.dims.W
        dy *= layoutRef.current.dims.H
      }
      if (Math.abs(dx) < Math.abs(dy) && !e.shiftKey) return
      e.preventDefault()
      sim.pending += clamp(dx, -720, 720)
    }
    root.addEventListener('wheel', onWheel, { passive: false })
    return () => root.removeEventListener('wheel', onWheel)
  }, [])

  /* ---- the animation loop ------------------------------------------------ */
  useEffect(() => {
    let raf = 0

    const step = (nowMs: number) => {
      raf = requestAnimationFrame(step)
      const t = nowMs / 1000
      const sim = simRef.current
      if (sim.lastT === 0) {
        sim.lastT = t
        return
      }
      let dt = t - sim.lastT
      sim.lastT = t
      if (dt <= 0) return
      if (dt > 0.05) dt = 0.05

      const { dims, jMin, jMax, cycleW } = layoutRef.current
      const { cardW, spacing, pivot, anchorY, sag, halfSpan, cx, W } = dims
      const L = SWING_L_RATIO * cardW

      const running = sim.inView && sim.tabVisible
      if (!running) {
        sim.prevV = 0
        return
      }

      /* -- velocity -------------------------------------------------------- */
      const paused = sim.reduced || sim.dragging || (sim.hovered && sim.hoverCapable)
      const targetV = paused ? 0 : AUTO_SPEED
      if (!sim.dragging) {
        const rate = Math.abs(sim.v - targetV) > AUTO_SPEED * 1.5 ? FLING_RATE : SETTLE_RATE
        sim.v += (targetV - sim.v) * (1 - Math.exp(-dt * rate))
      }

      /* -- wheel / keyboard glide ------------------------------------------ */
      let glide = 0
      if (sim.pending !== 0) {
        glide = sim.pending * (1 - Math.exp(-dt * WHEEL_RATE))
        sim.pending -= glide
        if (Math.abs(sim.pending) < 0.1) {
          glide += sim.pending
          sim.pending = 0
        }
      }

      /* -- advance ---------------------------------------------------------- */
      let delta: number
      if (sim.dragging) {
        // onPointerMove already applied the pointer delta to travel; measure it
        // against the end of the previous frame so fling velocity is captured.
        delta = sim.travel - sim.lastTravel
      } else {
        delta = sim.v * dt + glide
        sim.travel += delta
      }
      const instV = delta / dt
      if (sim.dragging) {
        // Track the pointer velocity for the fling on release.
        sim.v += (instV - sim.v) * (1 - Math.exp(-dt * 14))
      }
      const accel = clamp((instV - sim.prevV) / dt, -MAX_TORQUE_ACCEL, MAX_TORQUE_ACCEL)
      sim.prevV = instV
      sim.lastTravel = sim.travel
      const offset = ((sim.travel % cycleW) + cycleW) % cycleW

      /* -- per-card pendulum + placement ------------------------------------ */
      const count = jMax - jMin + 1
      while (sim.pendulum.length < count) sim.pendulum.push({ th: 0, w: 0 })

      for (let i = 0; i < count; i += 1) {
        const el = slotRefs.current[i]
        if (!el) continue
        const j = jMin + i
        const x = j * spacing - offset
        const centerX = x + cardW / 2

        const p = sim.pendulum[i]!
        const frac = ((j * 0.61803398875) % 1 + 1) % 1
        const period = SWAY_PERIOD * (0.85 + 0.3 * frac)
        const swayTarget = sim.reduced ? 0 : SWAY_AMP * Math.sin((2 * Math.PI * t) / period + j * GOLDEN)
        const torque =
          SWING_K * (swayTarget - p.th) -
          SWING_C * p.w -
          (accel / L) * DEG * Math.cos(p.th / DEG)
        p.w += torque * dt
        p.th += p.w * dt
        if (p.th > MAX_SWING) {
          p.th = MAX_SWING
          p.w = Math.min(p.w, 0)
        } else if (p.th < -MAX_SWING) {
          p.th = -MAX_SWING
          p.w = Math.max(p.w, 0)
        }

        // Rope geometry at the card centre: the hang point sits exactly on the
        // sagging curve, and rotation follows the curve's tangent.
        const tt = Math.min(Math.abs(centerX - cx) / halfSpan, T_CLAMP)
        const slope = (-sag * dropSlope(tt) * Math.sign(centerX - cx)) / halfSpan
        const tangent = Math.atan(slope) * DEG

        const y = anchorY + sag * (1 - drop(tt))
        el.style.transform = `translate3d(${round1(x)}px, ${round1(y + pivot)}px, 0px) rotate(${round1(tangent + p.th)}deg)`
        el.style.visibility =
          centerX < -spacing * 1.5 || centerX > W + spacing * 1.5 ? 'hidden' : 'visible'
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* ---- drag --------------------------------------------------------------- */
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const sim = simRef.current
    const root = rootRef.current
    if (!root) return
    try {
      root.setPointerCapture(e.pointerId)
    } catch {
      /* pointer already gone */
    }
    sim.dragging = true
    sim.dragMoved = 0
    sim.dragStartX = e.clientX
    sim.dragStartTravel = sim.travel
    sim.pending = 0
    setGrabbing(true)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const sim = simRef.current
    if (!sim.dragging) return
    const dx = e.clientX - sim.dragStartX
    sim.dragMoved = Math.max(sim.dragMoved, Math.abs(dx))
    sim.travel = sim.dragStartTravel - dx
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const sim = simRef.current
    if (!sim.dragging) return
    sim.dragging = false
    sim.v = clamp(sim.v, -MAX_FLING, MAX_FLING)
    try {
      rootRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    setGrabbing(false)
  }

  /* ---- keyboard ----------------------------------------------------------- */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const sim = simRef.current
    const { spacing } = layoutRef.current.dims
    if (e.key === 'ArrowRight') {
      sim.pending += spacing
      e.preventDefault()
    } else if (e.key === 'ArrowLeft') {
      sim.pending -= spacing
      e.preventDefault()
    }
  }

  /* ---- render -------------------------------------------------------------- */
  const { dims, jMin, jMax } = layout
  const count = Math.max(1, items.length)

  const renderSlot = (i: number, duplicate: boolean) => {
    const j = jMin + i
    const itemIndex = ((j % count) + count) % count
    const item = items[itemIndex]!
    const slotIndex = i

    return (
      <div
        key={j}
        data-slot={slotIndex}
        ref={(el) => {
          slotRefs.current[slotIndex] = el
        }}
        aria-hidden={duplicate || undefined}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: dims.cardW,
          transformOrigin: `${dims.cardW / 2}px ${-dims.pivot}px`,
          willChange: 'transform',
          visibility: 'hidden',
        }}
      >
        <Link
          href={item.href}
          tabIndex={duplicate ? -1 : 0}
          className="rcc-face"
          style={{
            display: 'block',
            position: 'relative',
            zIndex: 1,
            borderRadius: RADIUS,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: `${RATIO}`,
              borderRadius: RADIUS,
              overflow: 'hidden',
              background: 'var(--color-mist)',
            }}
          >
            {item.image ? (
              // A single <img> (no wrapper) is what the card animation expects;
              // next/image still renders one and now hands the browser a proper
              // AVIF/WebP srcset for the card slot instead of the original upload.
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                sizes="(max-width: 768px) 52vw, 300px"
                draggable={false}
                loading={i < 5 ? 'eager' : 'lazy'}
                style={{ objectFit: 'cover', display: 'block' }}
              />
            ) : null}
            <div
              className="rcc-shade"
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: 'var(--scrim-ink)',
              }}
            />
            <div
              className="rcc-cap"
              style={{
                position: 'absolute',
                left: CAP_INSET,
                right: CAP_INSET,
                bottom: CAP_INSET,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-card)',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  lineHeight: '1.2em',
                  fontFamily: 'var(--font-heading), sans-serif',
                  color: 'var(--color-paper)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-body)',
                  fontWeight: 400,
                  letterSpacing: '0em',
                  lineHeight: '1.4em',
                  color: 'color-mix(in srgb, var(--color-paper) 86%, transparent)',
                  marginTop: 4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.caption}
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                boxShadow: 'var(--image-frame)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </Link>

        {/* Hang shadow cast on the card's top edge */}
        <div
          style={{
            position: 'absolute',
            zIndex: 2,
            left: (dims.cardW - dims.cardW * SHADE_W_RATIO) / 2,
            top: 0,
            width: dims.cardW * SHADE_W_RATIO,
            height: dims.cardW * SHADE_H_RATIO,
            pointerEvents: 'none',
            background: `radial-gradient(ellipse at 50% 0%, ${rgbaOf(BRAND.ink, 0.18)}, ${rgbaOf(
              BRAND.ink,
              0,
            )} 70%)`,
          }}
        />

        {/* Peg clip gripping the rope */}
        <div
          style={{
            position: 'absolute',
            zIndex: 3,
            left: (dims.cardW - dims.cardW * CLIP_W_RATIO) / 2,
            top: dims.cardW * CLIP_TOP_RATIO,
            width: dims.cardW * CLIP_W_RATIO,
            height: dims.cardW * CLIP_H_RATIO,
            pointerEvents: 'none',
          }}
        >
          <PegClip />
        </div>
      </div>
    )
  }

  const slots = []
  const seenItems = new Set<number>()
  for (let i = 0; i <= jMax - jMin; i += 1) {
    const j = jMin + i
    const itemIndex = ((j % count) + count) % count
    // Only the first copy of each trip is exposed to assistive tech; the
    // repetitions that make the loop seamless are decorative.
    const duplicate = seenItems.has(itemIndex)
    seenItems.add(itemIndex)
    slots.push(renderSlot(i, duplicate))
  }

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerEnter={() => {
        simRef.current.hovered = true
      }}
      onPointerLeave={() => {
        simRef.current.hovered = false
      }}
      onKeyDown={onKeyDown}
      onClickCapture={(e) => {
        // A drag must never end up navigating to the card under the pointer.
        if (simRef.current.dragMoved > 8) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      className={cn(
        'outline-none select-none',
        grabbing ? 'cursor-grabbing' : 'cursor-grab',
        className,
      )}
      style={{
        position: 'relative',
        width: '100%',
        height: dims.H,
        overflow: 'hidden',
        touchAction: 'pan-y',
      }}
    >
      <div
        className="rcc-mask"
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        <svg
          width={dims.W}
          height="100%"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
          aria-hidden
        >
          <path
            d={layout.pathD}
            fill="none"
            stroke={rgbaOf(BRAND.ink, 0.08)}
            strokeWidth={3}
            transform="translate(0 5)"
            strokeLinecap="round"
          />
          <path
            d={layout.pathD}
            fill="none"
            stroke={mixHex(BRAND.white, BRAND.slate, 0.45)}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <path
            d={layout.pathD}
            fill="none"
            stroke={rgbaOf(BRAND.white, 0.45)}
            strokeWidth={0.72}
            strokeDasharray="2.24 2.88"
          />
        </svg>
        {slots}
      </div>
    </div>
  )
}
