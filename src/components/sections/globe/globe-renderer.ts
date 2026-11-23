import {
  BRAND,
  LAND_DOT,
  OCEAN_DEEP,
  OCEAN_LIT,
  OCEAN_MID,
  PIN,
  PIN_CORE,
  rgbaOf,
} from '@/lib/brand-colors'

import { GLOBE_DESTINATIONS, GLOBE_ROUTES, LAND_DOT_DATA } from './globe-data'

/**
 * ============================================================================
 * About globe — canvas renderer
 * ============================================================================
 * A real sphere, not a flat map in a circle: every land dot and destination is a
 * 3D unit vector that is rotated by the globe's yaw/tilt, projected
 * orthographically (x, y on screen + z for depth) and drawn back-to-front.
 *
 * Transparency contract: the canvas itself has NO background. Each frame is
 * cleared to fully transparent and the only things ever painted are the
 * sphere (ocean disc, land dots, routes, pins) and a thin haze-blue atmosphere
 * that hugs the limb and finishes fading to `rgba(…, 0)` well inside the
 * canvas. Nothing is ever clipped by the square canvas edge, so the globe
 * sits directly on whatever is behind it — here, the section's ink
 * background — with no visible rectangle or contrasting edge line.
 *
 * Colour: every shade is derived from the eight brand colours in
 * `@/lib/brand-colors` — an ink ocean lit with bright expedition blue, land dots in
 * paper-cooled haze, routes and atmosphere in haze, and the destination pins
 * in coral (the site's vivid warm accent).
 *
 * Deliberately dependency-free (no three.js / globe.gl): the whole visual is a
 * dot field of ~4.5k points, five route arcs and nine markers. Canvas 2D draws
 * that in a couple of milliseconds, keeps the JS payload tiny, and lets the
 * component ship as one lazily-loaded chunk.
 *
 * This module is pure — it only touches a `CanvasRenderingContext2D`, never the
 * DOM — so the exact same code renders both the live globe and the offscreen
 * preview frames used to design it.
 */

const TAU = Math.PI * 2
const DEG = Math.PI / 180

/** Default tilt, radians: the north pole leans ~17° toward the viewer. */
export const GLOBE_TILT = 0.3

/** Rotation the globe starts at: 48°E is dead centre (Europe/Africa/Asia). */
export const GLOBE_INITIAL_YAW = -48 * DEG

/** Sphere diameter as a fraction of the square canvas — leaves air for labels. */
const SPHERE_RATIO = 0.79

/** Depth below which a point counts as behind the horizon. */
const HORIZON = 0.02

export type GlobeView = {
  /** Canvas size in CSS pixels. */
  width: number
  height: number
  /** Rotation around the polar axis, radians. */
  yaw: number
  /** Tilt of the north pole toward the viewer, radians. */
  tilt: number
  /** Seconds since the globe mounted — drives marker pulses and route dots. */
  time: number
}

export type ProjectedMarker = {
  id: string
  name: string
  /** Screen position in CSS pixels. */
  x: number
  y: number
  /** 0 at the horizon … 1 facing the viewer. */
  depth: number
}

type Vec3 = readonly [number, number, number]

/* --------------------------------------------------------------------------
   Geometry (built once, lazily — the component only loads this chunk when the
   section scrolls into view, and decoding 4.5k points costs a few ms).
   -------------------------------------------------------------------------- */

let landVectors: Float32Array | null = null

/** Decodes the packed land dots into flat [x, y, z, x, y, z, …] unit vectors. */
function getLandVectors(): Float32Array {
  if (landVectors) return landVectors

  const vectors = new Float32Array(LAND_DOT_DATA.length * 3)

  for (let i = 0; i < LAND_DOT_DATA.length; i++) {
    const packed = LAND_DOT_DATA[i]!
    // Packing is documented in globe-data.ts: (latIndex × 3600) + lngIndex, 0.1° grid.
    const lat = (Math.floor(packed / 3600) / 10 - 90) * DEG
    const lng = ((packed % 3600) / 10 - 180) * DEG
    const cosLat = Math.cos(lat)

    vectors[i * 3] = cosLat * Math.sin(lng)
    vectors[i * 3 + 1] = Math.sin(lat)
    vectors[i * 3 + 2] = cosLat * Math.cos(lng)
  }

  landVectors = vectors
  return vectors
}

function toVector(lat: number, lng: number): Vec3 {
  const phi = lat * DEG
  const lambda = lng * DEG
  const cosPhi = Math.cos(phi)
  return [cosPhi * Math.sin(lambda), Math.sin(phi), cosPhi * Math.cos(lambda)]
}

const MARKER_VECTORS: Vec3[] = GLOBE_DESTINATIONS.map(({ lat, lng }) => toVector(lat, lng))

const DESTINATION_INDEX = new Map(
  GLOBE_DESTINATIONS.map((destination, index) => [destination.id, index]),
)

/** A great-circle route sampled into unit vectors, plus its animation offset. */
type SampleRoute = { points: Vec3[]; offset: number }

const ROUTE_SEGMENTS = 72

function sampleRoute(from: Vec3, to: Vec3): Vec3[] {
  const dot = Math.min(1, Math.max(-1, from[0] * to[0] + from[1] * to[1] + from[2] * to[2]))
  const omega = Math.acos(dot)

  // Coincident points — no arc to draw.
  if (omega < 1e-4) return [from, to]

  const sinOmega = Math.sin(omega)
  const points: Vec3[] = []

  for (let i = 0; i <= ROUTE_SEGMENTS; i++) {
    const t = i / ROUTE_SEGMENTS
    const a = Math.sin((1 - t) * omega) / sinOmega
    const b = Math.sin(t * omega) / sinOmega

    points.push([from[0] * a + to[0] * b, from[1] * a + to[1] * b, from[2] * a + to[2] * b])
  }

  return points
}

const ROUTES: SampleRoute[] = GLOBE_ROUTES.flatMap(([fromId, toId], index) => {
  const from = DESTINATION_INDEX.get(fromId)
  const to = DESTINATION_INDEX.get(toId)
  if (from === undefined || to === undefined) return []

  return [
    {
      points: sampleRoute(MARKER_VECTORS[from]!, MARKER_VECTORS[to]!),
      offset: index / GLOBE_ROUTES.length,
    },
  ]
})

/* --------------------------------------------------------------------------
   Projection
   -------------------------------------------------------------------------- */

function project(
  x: number,
  y: number,
  z: number,
  cosYaw: number,
  sinYaw: number,
  cosTilt: number,
  sinTilt: number,
  cx: number,
  cy: number,
  radius: number,
): { x: number; y: number; depth: number } {
  // Yaw: spin around the polar axis.
  const rx = x * cosYaw + z * sinYaw
  const rz = -x * sinYaw + z * cosYaw

  // Tilt: lean the north pole toward the viewer.
  const ry = y * cosTilt - rz * sinTilt
  const depth = y * sinTilt + rz * cosTilt

  return { x: cx + radius * rx, y: cy - radius * ry, depth }
}

/** 0 outside `edge0..edge1`, 1 inside — a small smoothstep for occlusion fades. */
function fade(value: number, edge0: number, edge1: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/* --------------------------------------------------------------------------
   Frame
   -------------------------------------------------------------------------- */

/**
 * Draws one frame and returns where each visible destination marker landed on
 * screen, so the React layer can position its HTML labels over the canvas.
 */
export function drawGlobe(ctx: CanvasRenderingContext2D, view: GlobeView): ProjectedMarker[] {
  const { width, height, yaw, tilt, time } = view
  const cx = width / 2
  const cy = height / 2
  const radius = (Math.min(width, height) * SPHERE_RATIO) / 2

  ctx.clearRect(0, 0, width, height)
  if (radius <= 0) return []

  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)
  const cosTilt = Math.cos(tilt)
  const sinTilt = Math.sin(tilt)

  /* --- Atmosphere: a thin haze glow hugging the limb ------------------------
     It must finish fading INSIDE the canvas. The old halo reached 1.5× the
     sphere radius — past the edge of the square canvas (sphere diameter is
     79% of the canvas, so 1.5× radius ≈ 59% of the width from centre) — and
     the browser clipped it mid-gradient at ~10% alpha. That straight clipped
     edge read as a contrasting background rectangle behind the globe.
     Now the glow is capped at 1.22× radius (≈48% of the width) and at least
     2px short of the nearest canvas edge, is haze-only (no second wash
     tinting the square), and its final stop is fully transparent — so
     outside the atmosphere the canvas is exactly transparent. */
  const haloRadius = Math.min(radius * 1.22, Math.max(radius, Math.min(cx, cy) - 2))
  const halo = ctx.createRadialGradient(cx, cy, radius * 0.92, cx, cy, haloRadius)
  halo.addColorStop(0, rgbaOf(BRAND.haze, 0.2))
  // The limb itself sits at ≈0.27 of this gradient (1.00 between 0.92…1.22).
  halo.addColorStop(0.3, rgbaOf(BRAND.haze, 0.16))
  halo.addColorStop(0.62, rgbaOf(BRAND.haze, 0.055))
  halo.addColorStop(1, rgbaOf(BRAND.haze, 0))
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(cx, cy, haloRadius, 0, TAU)
  ctx.fill()

  /* --- Ocean: one offset radial gradient gives the sphere its volume --- */
  const body = ctx.createRadialGradient(
    cx - radius * 0.38,
    cy - radius * 0.42,
    radius * 0.05,
    cx + radius * 0.08,
    cy + radius * 0.12,
    radius * 1.12,
  )
  body.addColorStop(0, OCEAN_LIT)
  body.addColorStop(0.38, OCEAN_MID)
  body.addColorStop(0.72, OCEAN_DEEP)
  body.addColorStop(1, BRAND.ink)

  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, TAU)
  ctx.fillStyle = body
  ctx.fill()

  /* --- Land dots, batched into depth bands so the whole field costs ~7 fills --- */
  const vectors = getLandVectors()
  const BANDS = 7
  const bands: number[][] = Array.from({ length: BANDS }, () => [])

  for (let i = 0; i < vectors.length; i += 3) {
    const projected = project(
      vectors[i]!,
      vectors[i + 1]!,
      vectors[i + 2]!,
      cosYaw,
      sinYaw,
      cosTilt,
      sinTilt,
      cx,
      cy,
      radius,
    )

    if (projected.depth <= HORIZON) continue

    const band = Math.min(BANDS - 1, Math.floor(projected.depth * BANDS))
    bands[band]!.push(projected.x, projected.y)
  }

  for (let band = 0; band < BANDS; band++) {
    const points = bands[band]!
    if (!points.length) continue

    const t = (band + 0.5) / BANDS
    const dotRadius = 0.55 + 0.9 * t

    ctx.beginPath()
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i]!
      const y = points[i + 1]!
      ctx.moveTo(x + dotRadius, y)
      ctx.arc(x, y, dotRadius, 0, TAU)
    }
    ctx.fillStyle = rgbaOf(LAND_DOT, 0.1 + 0.55 * t)
    ctx.fill()
  }

  /* --- Routes: great-circle arcs, only the stretches above the horizon --- */
  ctx.lineWidth = 1.1
  ctx.lineCap = 'round'
  ctx.strokeStyle = rgbaOf(BRAND.haze, 0.34)

  for (const route of ROUTES) {
    let drawing = false

    ctx.beginPath()
    for (const point of route.points) {
      const projected = project(
        point[0],
        point[1],
        point[2],
        cosYaw,
        sinYaw,
        cosTilt,
        sinTilt,
        cx,
        cy,
        radius,
      )

      if (projected.depth <= HORIZON) {
        drawing = false
        continue
      }

      if (drawing) ctx.lineTo(projected.x, projected.y)
      else ctx.moveTo(projected.x, projected.y)

      drawing = true
    }
    ctx.stroke()
  }

  const routeDotRadius = 2.2

  for (const route of ROUTES) {
    // One dot travelling each route, looping. `time` is frozen for reduced-motion
    // visitors, which parks every dot at its starting offset instead of animating.
    const phase = (((time * 0.075 + route.offset) % 1) + 1) % 1
    const index = Math.min(ROUTE_SEGMENTS, Math.round(phase * ROUTE_SEGMENTS))
    const point = route.points[index]!
    const projected = project(
      point[0],
      point[1],
      point[2],
      cosYaw,
      sinYaw,
      cosTilt,
      sinTilt,
      cx,
      cy,
      radius,
    )

    if (projected.depth <= HORIZON) continue

    const alpha = fade(projected.depth, HORIZON, 0.3)

    ctx.fillStyle = rgbaOf(BRAND.haze, 0.18 * alpha)
    ctx.beginPath()
    ctx.arc(projected.x, projected.y, routeDotRadius * 3, 0, TAU)
    ctx.fill()

    ctx.fillStyle = rgbaOf(LAND_DOT, 0.92 * alpha)
    ctx.beginPath()
    ctx.arc(projected.x, projected.y, routeDotRadius * 0.75, 0, TAU)
    ctx.fill()
  }

  /* --- Rim light, then destination markers --- */
  ctx.beginPath()
  ctx.arc(cx, cy, radius - 0.6, 0, TAU)
  ctx.strokeStyle = rgbaOf(BRAND.haze, 0.3)
  ctx.lineWidth = 1.2
  ctx.stroke()

  const projectedMarkers: ProjectedMarker[] = []

  GLOBE_DESTINATIONS.forEach((destination, index) => {
    const vector = MARKER_VECTORS[index]!
    const projected = project(
      vector[0],
      vector[1],
      vector[2],
      cosYaw,
      sinYaw,
      cosTilt,
      sinTilt,
      cx,
      cy,
      radius,
    )

    if (projected.depth <= HORIZON) return

    const visibility = fade(projected.depth, HORIZON, 0.28)
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.7 + index * 1.9)

    // Pulsing halo: a soft glow plus an expanding ring that fades as it grows,
    // which reads as a live pin instead of a blurry disc over the land dots.
    ctx.fillStyle = rgbaOf(BRAND.coral, 0.2 * visibility)
    ctx.beginPath()
    ctx.arc(projected.x, projected.y, 5.5, 0, TAU)
    ctx.fill()

    ctx.strokeStyle = rgbaOf(BRAND.coral, 0.55 * visibility * (1 - pulse))
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(projected.x, projected.y, 5 + pulse * 9, 0, TAU)
    ctx.stroke()

    // Pin: coral disc lifted with white until it clears 4.5:1 on the ocean,
    // with a near-paper core.
    ctx.fillStyle = rgbaOf(PIN, visibility)
    ctx.beginPath()
    ctx.arc(projected.x, projected.y, 3.4, 0, TAU)
    ctx.fill()

    ctx.fillStyle = rgbaOf(PIN_CORE, visibility)
    ctx.beginPath()
    ctx.arc(projected.x, projected.y, 1.25, 0, TAU)
    ctx.fill()

    projectedMarkers.push({
      id: destination.id,
      name: destination.name,
      x: projected.x,
      y: projected.y,
      depth: projected.depth,
    })
  })

  return projectedMarkers
}
