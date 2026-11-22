import type { ReactNode } from 'react'

/**
 * The hero's centrepiece: the whole site drawn as a single trekking elevation profile.
 *
 * Waypoints are plotted left → right in the order a visitor would walk the site —
 * Home at 1,420 m up to the summit register. Every dot is a live link into the page,
 * labelled for assistive tech; the chart itself is decorative geometry. Camp labels
 * (one per layer that has at least one waypoint) mark where the four sections below
 * begin. Server-rendered: no client JS, deterministic rounding.
 */

export type ProfilePoint = {
  title: string
  href: string
  path: string
  elevation: number
  /** Uppercase camp label drawn above the line — set on the first point of each camp. */
  camp?: string
}

const VIEW_W = 1240
const VIEW_H = 330
const PAD_L = 30
const PLOT_R = 1116
const TOP = 46
const BOTTOM = 246
const MIN_ELEV = 1200

const fmtElev = (value: number) => `${value.toLocaleString('en-US')} m`
const round = (value: number) => Math.round(value * 100) / 100

/** Catmull-Rom → cubic Bézier, so the ridgeline reads as terrain, not a polyline. */
function smoothLine(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  const segments = [`M ${round(points[0].x)} ${round(points[0].y)}`]
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)]
    const p1 = points[index]
    const p2 = points[index + 1]
    const p3 = points[Math.min(points.length - 1, index + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    segments.push(
      `C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(p2.x)} ${round(p2.y)}`,
    )
  }
  return segments.join(' ')
}

export function SitemapProfile({ points }: { points: ProfilePoint[] }): ReactNode {
  if (points.length === 0) return null

  const n = points.length
  const summit = points[n - 1].elevation
  const maxElev = Math.ceil((summit + 160) / 100) * 100

  const x = (index: number) => PAD_L + (index * (PLOT_R - PAD_L)) / (n - 1)
  const y = (elevation: number) =>
    BOTTOM - ((elevation - MIN_ELEV) / (maxElev - MIN_ELEV)) * (BOTTOM - TOP)

  const coords = points.map((point, index) => ({ x: x(index), y: y(point.elevation) }))
  const line = smoothLine(coords)
  const area = `${line} L ${round(coords[n - 1].x)} ${BOTTOM} L ${round(coords[0].x)} ${BOTTOM} Z`

  const gridElevations = [2000, 3000, 4000, 5000].filter((grid) => grid < maxElev - 80)
  const camps = points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.camp)

  const first = points[0]

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="profile"
      role="group"
      aria-label={`Elevation profile of the site — ${n} waypoints, climbing from ${fmtElev(
        first.elevation,
      )} at ${first.title} to ${fmtElev(summit)}. Every waypoint is a link.`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Altimeter gridlines */}
      {gridElevations.map((grid) => (
        <g key={grid}>
          <line
            x1={PAD_L}
            x2={PLOT_R}
            y1={y(grid)}
            y2={y(grid)}
            className="profile__gridline"
          />
          <text x={PLOT_R + 10} y={y(grid) + 4} className="profile__grid-label">
            {grid.toLocaleString('en-US')}
            {grid === gridElevations[gridElevations.length - 1] ? ' m' : ''}
          </text>
        </g>
      ))}

      {/* Camp boundaries — a dashed plumb line where each section below begins */}
      {camps.map(({ point, index }) => (
        <g key={point.camp} aria-hidden="true">
          <line
            x1={x(index)}
            x2={x(index)}
            y1={TOP - 8}
            y2={BOTTOM}
            className="profile__camp-line"
          />
          <text x={x(index) + (index === 0 ? 2 : 9)} y={TOP - 22} className="profile__camp-label">
            {point.camp}
          </text>
        </g>
      ))}

      {/* Area wash, then the ridgeline itself */}
      <path d={area} className="profile__area" />
      <path d={line} className="profile__line" fill="none" />

      {/* Baseline */}
      <line x1={PAD_L} x2={PLOT_R} y1={BOTTOM} y2={BOTTOM} className="profile__baseline" />

      {/* Summit plumb — the sitemap's highest point, as a trig survey */}
      <line
        x1={coords[n - 1].x}
        x2={coords[n - 1].x}
        y1={coords[n - 1].y}
        y2={BOTTOM}
        className="profile__summit-plumb"
        aria-hidden="true"
      />
      <polygon
        points={`${coords[n - 1].x},${coords[n - 1].y - 15} ${coords[n - 1].x + 8.5},${
          coords[n - 1].y - 1
        } ${coords[n - 1].x - 8.5},${coords[n - 1].y - 1}`}
        className="profile__trig"
        aria-hidden="true"
      />

      {/* Waypoints — live links along the ridge */}
      {points.map((point, index) => (
        <a key={`${point.href}-${index}`} href={point.href} className="profile-dot">
          <title>{`${point.title} — ${point.path} (${fmtElev(point.elevation)})`}</title>
          <circle cx={x(index)} cy={y(point.elevation)} r="15" className="profile-dot__hit" />
          <circle cx={x(index)} cy={y(point.elevation)} r="4.6" className="profile-dot__mark" />
        </a>
      ))}

      {/* Axis captions */}
      <text x={PAD_L} y={BOTTOM + 26} className="profile__axis-cap">
        {fmtElev(first.elevation)} — {first.title.toUpperCase()}
      </text>
      <text x={PLOT_R} y={BOTTOM + 26} className="profile__axis-cap profile__axis-cap--end">
        {fmtElev(summit)} — SUMMIT OF THE REGISTER
      </text>
    </svg>
  )
}
