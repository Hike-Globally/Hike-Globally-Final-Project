/**
 * Topography — the chart's contour field, drawn as pure SVG.
 *
 * No image file, no gradients, no blur: seven nested elevation loops cut from the same haze
 * the rest of the site uses, softened by a deterministic modulation (fixed phases, no randomness),
 * plus a single ember route line that climbs from the frame's bottom edge to a trig point.
 * It is deliberately static — the hero is a chart, not an animation — and it sits behind the
 * copy (`pointer-events: none`, `aria-hidden`).
 */

type Point = [number, number]

/** One loop of a fixed base radius, modulated so no two contours are identical circles. */
function loopPath(cx: number, cy: number, base: number, amp: number, phase: number): string {
  const points: Point[] = []
  const STEPS = 40
  for (let index = 0; index < STEPS; index += 1) {
    const theta = (index / STEPS) * Math.PI * 2
    const r =
      base *
      (1 + 0.14 * Math.sin(3 * theta + phase) + 0.09 * Math.cos(5 * theta + phase * 1.7))
    points.push([cx + Math.cos(theta) * r, cy + Math.sin(theta) * r * 0.78])
  }
  // Closed smoothing: quadratic curves through the midpoints of each segment.
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const last = points[points.length - 1]
  const first = points[0]
  let d = `M ${mid(last, first).join(' ')}`
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length]
    d += ` Q ${points[index].join(' ')} ${mid(points[index], next).join(' ')}`
  }
  return `${d} Z`
}

/** The route line, as a series of anchor points smoothed into a single sweeping stroke. */
function routePath(points: Point[]): string {
  let d = `M ${points[0].join(' ')}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const midX = (points[index][0] + points[index + 1][0]) / 2
    const midY = (points[index][1] + points[index + 1][1]) / 2
    d += ` Q ${points[index].join(' ')} ${midX} ${midY}`
  }
  const end = points[points.length - 1]
  d += ` L ${end.join(' ')}`
  return d
}

const PEAK: Point = [764, 268]

const LOOPS = [
  { base: 84, amp: 0.9, phase: 0.6 },
  { base: 118, amp: 0.9, phase: 1.4 },
  { base: 154, amp: 0.9, phase: 2.3 },
  { base: 194, amp: 0.9, phase: 3.1 },
  { base: 238, amp: 0.9, phase: 0.9 },
  { base: 288, amp: 0.9, phase: 1.9 },
  { base: 344, amp: 0.9, phase: 2.8 },
] as const

const ROUTE: Point[] = [
  [40, 668],
  [212, 556],
  [420, 492],
  [588, 396],
  [686, 322],
  [764, 268],
]

export function Topography({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 640"
      aria-hidden
      focusable="false"
      className={className}
      style={{ pointerEvents: 'none' }}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" stroke="var(--color-haze)" strokeWidth="1" vectorEffect="non-scaling-stroke">
        {LOOPS.map((loop, index) => (
          <path
            key={loop.base}
            d={loopPath(PEAK[0], PEAK[1], loop.base, loop.amp, loop.phase)}
            opacity={0.16 - index * 0.014}
          />
        ))}
      </g>

      {/* The route — one ember line, climbed by a surveyor's eye. */}
      <path
        d={routePath(ROUTE)}
        fill="none"
        stroke="var(--color-sage)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
        vectorEffect="non-scaling-stroke"
      />
      {/* Waypoints along the route */}
      <g fill="var(--color-sage)">
        <circle cx="212" cy="556" r="4.5" />
        <circle cx="420" cy="492" r="4.5" />
        <circle cx="588" cy="396" r="4.5" />
      </g>

      {/* Trig point at the summit: a small triangle with a crosshair. */}
      <g opacity="0.9">
        <path d="M 764 252 L 779 274 L 749 274 Z" fill="var(--color-sage)" />
        <line x1="764" y1="234" x2="764" y2="252" stroke="var(--color-mist)" strokeWidth="1" opacity="0.55" />
        <line x1="748" y1="234" x2="780" y2="234" stroke="var(--color-mist)" strokeWidth="1" opacity="0.55" />
      </g>
    </svg>
  )
}
