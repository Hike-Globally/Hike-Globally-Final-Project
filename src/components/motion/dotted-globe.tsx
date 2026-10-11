'use client'

import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

export type GlobeRegion = {
  id: string
  /** Short label for the chip row. */
  chip: string
  /** Full name shown in the caption while the region is active. */
  label: string
  /** Degrees north — negative for the southern hemisphere. */
  lat: number
  /** Degrees east — negative for the western hemisphere. */
  lon: number
  packages: number
  blurb: string
}

/** Every route on the globe is planned from here. */
const HUB = { lat: 27.7, lon: 85.3 }

const DEG = Math.PI / 180

/** Dot budget for the sphere. Fine enough to read as texture, cheap enough to be free per frame. */
const DOT_COUNT = 940
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/** Faint parallels — the wireframe that makes a dotted sphere read as a globe. */
const PARALLELS = [45, 0, -45]
const PARALLEL_STEPS = 96

/** Samples per route. Enough for a smooth great-circle arc over the limb. */
const ARC_STEPS = 56
/** Arc sits a hair above the surface so it never fights with the dots underneath it. */
const ARC_LIFT = 1.045

/** The globe leans towards the viewer so the north pole is visible, the way a desk globe does. */
const AXIS_TILT = 16 * DEG

/** Idle spin, in radians per second — a full turn takes about two and a half minutes. */
const DRIFT = 0.042

/** How quickly the globe swings around to a selected region (higher = snappier). */
const FOCUS_SPEED = 3.1

/**
 * How much of the turn is decided by the region versus by the Kathmandu hub.
 *
 * Rotating the destination dead-centre would push the hub off the far side of the sphere and the
 * route would vanish behind it. Weighting the turn 72/28 keeps the destination prominent *and*
 * usually leaves the hub on the visible hemisphere, so the route between them can be followed,
 * however far apart the two are.
 */
const FOCUS_REGION_WEIGHT = 0.72

/** Cartographic labels use the site's heading face. */
const LABEL_SIZE = 11

/**
 * Canvas needs a real font stack — it cannot resolve `var()`. next/font exposes the generated
 * family through `--font-google-sans-flex`, so that token is read off the root element and
 * resolved into a literal stack here (with the plain family name as the fallback).
 */
function resolveLabelFont(): string {
  const generated = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-google-sans-flex')
    .trim()
  return [generated, "'Google Sans Flex'", 'system-ui', 'sans-serif'].filter(Boolean).join(', ')
}

/** Hit radius, in CSS pixels, for hovering a region marker on the canvas. */
const HIT_RADIUS = 26

/** Evenly distributed points on a unit sphere (Fibonacci lattice) — no clustering at the poles. */
const SPHERE = Array.from({ length: DOT_COUNT }, (_, index) => {
  const y = 1 - (index / (DOT_COUNT - 1)) * 2
  const ring = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = index * GOLDEN_ANGLE
  return { x: Math.cos(theta) * ring, y, z: Math.sin(theta) * ring }
})

const FRONT_DOT = '174, 195, 176' // sage
const BACK_DOT = '89, 131, 146' // slate

/**
 * Direction the sphere is lit from, in view space (upper-left and slightly towards the viewer).
 *
 * Shading the dots by this instead of by depth alone is what turns a flat disc of points into a
 * sphere: the lit side brightens towards the light, the far limb falls away, and the terminator
 * between them is what the eye reads as curvature.
 */
const LIGHT = (() => {
  const vector = { x: -0.44, y: 0.52, z: 0.73 }
  const length = Math.hypot(vector.x, vector.y, vector.z)
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length }
})()

/** Alpha is quantised to 1/20th steps so only a handful of colour strings is ever allocated. */
const colorCache = new Map<string, string>()

function dotColor(front: boolean, alpha: number): string {
  const quantised = Math.round(Math.min(1, Math.max(0, alpha)) * 20) / 20
  const key = `${front ? 'f' : 'b'}:${quantised}`
  let color = colorCache.get(key)
  if (!color) {
    color = `rgba(${front ? FRONT_DOT : BACK_DOT}, ${quantised})`
    colorCache.set(key, color)
  }
  return color
}

/** Latitude/longitude → a unit vector on the sphere. */
function toVector(lat: number, lon: number) {
  const phi = lat * DEG
  const lambda = lon * DEG
  const cosPhi = Math.cos(phi)
  return {
    x: cosPhi * Math.sin(lambda),
    y: Math.sin(phi),
    z: cosPhi * Math.cos(lambda),
  }
}

/**
 * Spherical linear interpolation — the path a plane actually flies. A straight lerp between two
 * surface vectors would dip *through* the globe instead of following it.
 */
function slerp(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  const dot = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z))
  const omega = Math.acos(dot)
  const sinOmega = Math.sin(omega)

  if (sinOmega < 1e-6) return () => a

  return (t: number) => {
    const wa = Math.sin((1 - t) * omega) / sinOmega
    const wb = Math.sin(t * omega) / sinOmega
    return { x: a.x * wa + b.x * wb, y: a.y * wa + b.y * wb, z: a.z * wa + b.z * wb }
  }
}

const shortestAngle = (from: number, to: number) => {
  const delta = (to - from + Math.PI) % (Math.PI * 2)
  return (delta < 0 ? delta + Math.PI * 2 : delta) - Math.PI
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type Props = {
  regions: GlobeRegion[]
  /** Currently highlighted region — from the chips, or from hovering the globe itself. */
  activeId: string | null
  /** Called with the region under the pointer, or `null` when the pointer leaves them. */
  onActivate: (id: string | null) => void
  className?: string
}

/**
 * The globe: a dotted sphere drawn on a canvas, a marker per region, and a great-circle route
 * from the Kathmandu hub out to whichever region is highlighted.
 *
 * WHY CANVAS: 600+ points at 60fps is trivial for a raster surface, but the same scene in the DOM
 * (600 elements repositioned every frame) would thrash the compositor — and a 3D CSS globe cannot
 * put markers on the sphere's *surface* without clipping them through it. Here every element is
 * projected through the same two rotations, so dots, markers and routes are always consistently
 * in front of, or behind, the sphere: the route to a destination on the far side of the world
 * genuinely disappears around the limb.
 *
 * Interaction: the globe turns to face whichever region is highlighted (chip hover/focus, or the
 * pointer moving over its marker on the canvas) and a pulse travels the route to it. Idle, it
 * drifts slowly and leans a few degrees towards the pointer.
 *
 * Cost control: the render loop only runs while the globe is on screen (IntersectionObserver),
 * pointer parallax reads a cached rect, and `prefers-reduced-motion` turns the loop off entirely —
 * the globe then redraws only when the selection or the box size changes.
 */
export function DottedGlobe({ regions, activeId, onActivate, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Latest props, read by the render loop without restarting it.
  const activeRef = useRef(activeId)
  const regionsRef = useRef(regions)
  const onActivateRef = useRef(onActivate)
  /** Set by the effect below so a reduced-motion redraw can be triggered from outside the loop. */
  const syncRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    activeRef.current = activeId
    syncRef.current?.()
  }, [activeId])

  useEffect(() => {
    regionsRef.current = regions
  }, [regions])

  useEffect(() => {
    onActivateRef.current = onActivate
  }, [onActivate])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const labelFont = resolveLabelFont()

    let width = 0
    let height = 0
    let radius = 0
    let centerX = 0
    let centerY = 0

    let yaw = -0.55
    let pitch = AXIS_TILT

    // Pointer parallax, eased towards its target each frame.
    let parallaxYaw = 0
    let parallaxPitch = 0
    let targetParallaxYaw = 0
    let targetParallaxPitch = 0

    let hovered: string | null = null

    let frame = 0
    let last = 0
    let running = false

    /** Rotate a point on the sphere into screen space. `depth` > 0 means facing the viewer. */
    const projectVector = (
      vector: { x: number; y: number; z: number },
      yawValue: number,
      pitchValue: number,
      lift = 1,
    ) => {
      const cosYaw = Math.cos(yawValue)
      const sinYaw = Math.sin(yawValue)
      const x = vector.x * cosYaw + vector.z * sinYaw
      const z = -vector.x * sinYaw + vector.z * cosYaw

      const cosPitch = Math.cos(pitchValue)
      const sinPitch = Math.sin(pitchValue)
      const tiltedY = vector.y * cosPitch - z * sinPitch
      const tiltedZ = vector.y * sinPitch + z * cosPitch

      return {
        x: centerX + x * radius * lift,
        y: centerY - tiltedY * radius * lift,
        depth: tiltedZ,
      }
    }

    const project = (lat: number, lon: number, yawValue: number, pitchValue: number, lift = 1) =>
      projectVector(toVector(lat, lon), yawValue, pitchValue, lift)

    const activeRegion = () => regionsRef.current.find((region) => region.id === activeRef.current)

    /** Yaw/pitch that frame a region and the hub — see `FOCUS_REGION_WEIGHT`. */
    const focusTarget = (region: GlobeRegion | undefined) => {
      if (!region) return { yaw: null as number | null, pitch: AXIS_TILT }

      const weight = FOCUS_REGION_WEIGHT
      const lon = region.lon * weight + HUB.lon * (1 - weight)
      const lat = region.lat * weight + HUB.lat * (1 - weight)

      return {
        yaw: -lon * DEG,
        pitch: AXIS_TILT + clamp(lat * DEG * 0.55, -0.34, 0.34),
      }
    }

    /** Snap straight to a selection — used when motion is reduced. */
    const syncToSelection = () => {
      const target = focusTarget(activeRegion())
      if (target.yaw !== null) yaw = target.yaw
      pitch = target.pitch
      parallaxYaw = 0
      parallaxPitch = 0
      targetParallaxYaw = 0
      targetParallaxPitch = 0
      draw(0)
    }

    /**
     * Great-circle route from the hub to a region.
     *
     * The arc is sampled on the sphere and projected like everything else, so the part that has
     * gone around the back of the globe is simply not drawn — which is exactly what sells the
     * depth. The moving highlight is a short bright run travelling from the hub outwards.
     */
    const drawArc = (
      from: { x: number; y: number; z: number },
      to: { x: number; y: number; z: number },
      options: { alpha: number; animated: boolean; time: number },
    ) => {
      const interpolate = slerp(from, to)
      const points: { x: number; y: number; depth: number }[] = []
      for (let step = 0; step <= ARC_STEPS; step += 1) {
        points.push(
          projectVector(interpolate(step / ARC_STEPS), yaw + parallaxYaw, pitch + parallaxPitch, ARC_LIFT),
        )
      }

      // One path per contiguous visible run, so a full-width stroke is a single draw call.
      let runStart = -1
      const strokeRun = (startIndex: number, endIndex: number) => {
        let peak = 0
        for (let i = startIndex; i <= endIndex; i += 1) peak = Math.max(peak, points[i]!.depth)

        context.beginPath()
        context.moveTo(points[startIndex]!.x, points[startIndex]!.y)
        for (let i = startIndex + 1; i <= endIndex; i += 1) context.lineTo(points[i]!.x, points[i]!.y)
        // Fade the run out as it slips around the limb, which hides the cut.
        context.strokeStyle = `rgba(${FRONT_DOT}, ${options.alpha * Math.min(1, peak * 2.6)})`
        context.lineWidth = options.animated ? 1.4 : 1
        context.stroke()
      }

      for (let i = 0; i < points.length - 1; i += 1) {
        const visible = points[i]!.depth > 0.015 && points[i + 1]!.depth > 0.015

        if (visible && runStart === -1) runStart = i
        if (runStart !== -1 && (!visible || i === points.length - 2)) {
          strokeRun(runStart, visible ? i + 1 : i)
          runStart = -1
        }
      }

      if (!options.animated) return

      // Travelling highlight: a comet head with a short tail, hub → region, on repeat.
      const head = (options.time * 0.2) % 1
      const tail = Math.max(0, head - 0.16)
      const fromIndex = Math.floor(tail * ARC_STEPS)
      const toIndex = Math.min(ARC_STEPS, Math.ceil(head * ARC_STEPS))

      context.lineWidth = 1.9
      for (let i = fromIndex; i < toIndex; i += 1) {
        const a = points[i]!
        const b = points[i + 1]!
        if (a.depth <= 0.015 || b.depth <= 0.015) continue

        const along = (i - fromIndex) / Math.max(1, toIndex - fromIndex)
        context.beginPath()
        context.moveTo(a.x, a.y)
        context.lineTo(b.x, b.y)
        context.strokeStyle = `rgba(232, 244, 232, ${0.16 + along * 0.7})`
        context.stroke()
      }

      const headPoint = points[toIndex]
      if (headPoint && headPoint.depth > 0.015) {
        context.save()
        context.shadowColor = 'rgba(232, 244, 232, 0.9)'
        context.shadowBlur = 12
        context.beginPath()
        context.arc(headPoint.x, headPoint.y, 2.2, 0, Math.PI * 2)
        context.fillStyle = 'rgba(240, 250, 240, 0.95)'
        context.fill()
        context.restore()
      }
    }

    /**
     * A cartographic label next to a marker, kept on the visible side of the globe and flipped to
     * the left of a marker that sits near the right rim so it never runs off the canvas.
     */
    const drawLabel = (
      text: string,
      point: { x: number; y: number; depth: number },
      options: { alpha: number; weight: number },
    ) => {
      // A touch past the halfway point: labels stay put almost to the limb, where the marker
      // they belong to is still clearly visible.
      if (point.depth <= 0.05 || !text) return

      const flip = point.x > centerX + radius * 0.56
      context.save()
      context.font = `${options.weight} ${LABEL_SIZE}px ${labelFont}`
      context.textAlign = flip ? 'right' : 'left'
      context.textBaseline = 'middle'

      // Two passes: a hard dark outline that works over any dot or route line, then the fill.
      context.lineJoin = 'round'
      context.lineWidth = 3
      context.strokeStyle = 'rgba(1, 22, 30, 0.92)'
      context.strokeText(text, point.x + (flip ? -11 : 11), point.y + 0.5)

      context.fillStyle = `rgba(248, 249, 250, ${options.alpha})`
      context.fillText(text, point.x + (flip ? -11 : 11), point.y + 0.5)
      context.restore()
    }

    const drawMarker = (
      point: { x: number; y: number; depth: number },
      options: { active: boolean; hub?: boolean; time: number },
    ) => {
      const hidden = point.depth < -0.3
      const alpha = hidden ? 0.16 : Math.min(1, 0.35 + Math.max(0, point.depth) * 0.85)

      if (options.active) {
        const pulse = (options.time * 0.85) % 1
        context.beginPath()
        context.arc(point.x, point.y, 5 + pulse * 26, 0, Math.PI * 2)
        context.strokeStyle = `rgba(${FRONT_DOT}, ${(1 - pulse) * 0.5})`
        context.lineWidth = 1.2
        context.stroke()
      }

      context.save()
      if (options.active || options.hub) {
        context.shadowColor = `rgba(${FRONT_DOT}, 0.85)`
        context.shadowBlur = options.active ? 16 : 10
      }
      context.beginPath()
      context.arc(point.x, point.y, options.active ? 4.2 : options.hub ? 3.4 : 2.7, 0, Math.PI * 2)
      context.fillStyle = options.active
        ? 'rgba(232, 244, 232, 0.98)'
        : `rgba(${FRONT_DOT}, ${Math.min(1, alpha + (options.hub ? 0.35 : 0))})`
      context.fill()
      context.restore()

      if (options.hub) {
        context.beginPath()
        context.arc(point.x, point.y, 7.5, 0, Math.PI * 2)
        context.strokeStyle = `rgba(${FRONT_DOT}, ${alpha * 0.5})`
        context.lineWidth = 1
        context.stroke()
      }
    }

    const draw = (time: number) => {
      if (!width || !height) return

      const renderYaw = yaw + parallaxYaw
      const renderPitch = pitch + parallaxPitch

      context.clearRect(0, 0, width, height)

      // Halo behind the sphere — gives the dots something to sit in. Its centre is nudged
      // towards the light so the glow reinforces the shading instead of fighting it.
      const glowX = centerX - radius * 0.2
      const glowY = centerY - radius * 0.24
      const halo = context.createRadialGradient(glowX, glowY, radius * 0.06, glowX, glowY, radius * 1.42)
      halo.addColorStop(0, 'rgba(89, 131, 146, 0.34)')
      halo.addColorStop(0.34, 'rgba(18, 69, 89, 0.3)')
      halo.addColorStop(0.7, 'rgba(18, 69, 89, 0.11)')
      halo.addColorStop(1, 'rgba(1, 22, 30, 0)')
      context.beginPath()
      context.arc(glowX, glowY, radius * 1.42, 0, Math.PI * 2)
      context.fillStyle = halo
      context.fill()

      // A faint wireframe (three parallels) under the dots: without it a dotted sphere reads as
      // a scatter of stars rather than as a planet.
      context.fillStyle = `rgba(${FRONT_DOT}, 0.085)`
      for (const parallel of PARALLELS) {
        for (let step = 0; step < PARALLEL_STEPS; step += 1) {
          const point = project(parallel, (step / PARALLEL_STEPS) * 360 - 180, renderYaw, renderPitch)
          if (point.depth <= 0) continue
          context.beginPath()
          context.arc(point.x, point.y, 0.7, 0, Math.PI * 2)
          context.fill()
        }
      }

      // The sphere itself.
      const cosYaw = Math.cos(renderYaw)
      const sinYaw = Math.sin(renderYaw)
      const cosPitch = Math.cos(renderPitch)
      const sinPitch = Math.sin(renderPitch)

      for (const dot of SPHERE) {
        const x = dot.x * cosYaw + dot.z * sinYaw
        const z = -dot.x * sinYaw + dot.z * cosYaw
        const tiltedY = dot.y * cosPitch - z * sinPitch
        const tiltedZ = dot.y * sinPitch + z * cosPitch

        const front = tiltedZ > 0
        // (x, tiltedY, tiltedZ) is this dot's normal in view space, so the light term is a
        // plain dot product with the light direction.
        const lambert = Math.max(0, x * LIGHT.x + tiltedY * LIGHT.y + tiltedZ * LIGHT.z)

        const size = front ? 0.7 + lambert * 0.75 + tiltedZ * 0.2 : 0.66
        context.beginPath()
        context.arc(centerX + x * radius, centerY - tiltedY * radius, size, 0, Math.PI * 2)
        context.fillStyle = dotColor(
          front,
          front ? 0.1 + 0.62 * lambert * (0.5 + 0.5 * tiltedZ) : 0.05 + (tiltedZ + 1) * 0.035,
        )
        context.fill()
      }

      // Rim, so the sphere still reads where the dots thin out.
      context.beginPath()
      context.arc(centerX, centerY, radius, 0, Math.PI * 2)
      context.strokeStyle = `rgba(${FRONT_DOT}, 0.14)`
      context.lineWidth = 1
      context.stroke()

      const hubVector = toVector(HUB.lat, HUB.lon)
      const hubPoint = projectVector(hubVector, renderYaw, renderPitch)

      // Routes from the hub to every region; the selected one carries the travelling highlight.
      for (const region of regionsRef.current) {
        const active = region.id === activeRef.current
        drawArc(hubVector, toVector(region.lat, region.lon), {
          // The unselected routes are only a hint of a network: any brighter and the sphere turns
          // into a cat's cradle.
          alpha: active ? 0.9 : 0.07,
          animated: active && !reduceMotion,
          time,
        })
      }

      for (const region of regionsRef.current) {
        const active = region.id === activeRef.current
        const point = project(region.lat, region.lon, renderYaw, renderPitch)
        if (active) {
          drawLabel(`${region.label} · ${region.packages}`, point, { alpha: 0.82, weight: 600 })
        }
        drawMarker(point, { active, time })
      }

      drawMarker(hubPoint, { active: false, hub: true, time })
      drawLabel('Kathmandu', hubPoint, { alpha: 0.42, weight: 500 })
    }

    const advance = (dt: number) => {
      const target = focusTarget(activeRegion())

      if (target.yaw === null) {
        // Nothing selected: drift, and lean back towards the resting tilt.
        yaw += dt * DRIFT
        pitch += (AXIS_TILT - pitch) * Math.min(1, dt * 2)
      } else {
        yaw += shortestAngle(yaw, target.yaw) * Math.min(1, dt * FOCUS_SPEED)
        pitch += (target.pitch - pitch) * Math.min(1, dt * FOCUS_SPEED)
      }

      parallaxYaw += (targetParallaxYaw - parallaxYaw) * Math.min(1, dt * 2.4)
      parallaxPitch += (targetParallaxPitch - parallaxPitch) * Math.min(1, dt * 2.4)
    }

    const step = (now: number) => {
      frame = requestAnimationFrame(step)
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016
      last = now
      advance(dt)
      draw(now / 1000)
    }

    const start = () => {
      if (running) return
      running = true
      last = 0
      frame = requestAnimationFrame(step)
    }

    const stop = () => {
      running = false
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      last = 0
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const nextWidth = Math.max(1, Math.round(rect.width))
      const nextHeight = Math.max(1, Math.round(rect.height))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      width = nextWidth
      height = nextHeight
      canvas.width = Math.round(nextWidth * dpr)
      canvas.height = Math.round(nextHeight * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      radius = (Math.min(width, height) / 2) * 0.86
      centerX = width / 2
      centerY = height / 2

      if (!running) draw(performance.now() / 1000)
    }

    const hitTest = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const pointerX = event.clientX - rect.left
      const pointerY = event.clientY - rect.top

      let closest: string | null = null
      let closestDistance = HIT_RADIUS

      for (const region of regionsRef.current) {
        const point = project(region.lat, region.lon, yaw + parallaxYaw, pitch + parallaxPitch)
        // Regions on the far side are not tappable — the pointer would be "over" something the
        // visitor cannot see.
        if (point.depth < -0.15) continue

        const distance = Math.hypot(point.x - pointerX, point.y - pointerY)
        if (distance < closestDistance) {
          closestDistance = distance
          closest = region.id
        }
      }

      return { closest, pointerX, pointerY, rect }
    }

    const onPointerMove = (event: PointerEvent) => {
      const { closest, pointerX, pointerY, rect } = hitTest(event)

      if (rect.width && rect.height) {
        targetParallaxYaw = ((pointerX / rect.width) * 2 - 1) * 0.28
        targetParallaxPitch = ((pointerY / rect.height) * 2 - 1) * -0.2
      }

      if (closest !== hovered) {
        hovered = closest
        canvas.style.cursor = closest ? 'pointer' : ''
        onActivateRef.current(closest)
      }
    }

    const onPointerLeave = () => {
      targetParallaxYaw = 0
      targetParallaxPitch = 0
      if (hovered !== null) {
        hovered = null
        canvas.style.cursor = ''
        onActivateRef.current(null)
      }
    }

    resize()

    if (reduceMotion) {
      // No loop, no drift: redraw only when the selection or the box changes.
      syncRef.current = syncToSelection
      syncToSelection()
    } else {
      syncRef.current = null
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    // The loop is only worth running while the globe can be seen.
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (reduceMotion) {
            if (entry.isIntersecting) draw(0)
            continue
          }
          if (entry.isIntersecting) start()
          else stop()
        }
      },
      { threshold: 0.05 },
    )
    intersectionObserver.observe(canvas)

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)

    return () => {
      stop()
      syncRef.current = null
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className={cn('block h-full w-full', className)} />
}
