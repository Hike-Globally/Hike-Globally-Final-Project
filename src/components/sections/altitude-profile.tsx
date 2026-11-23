import { Mountain } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  altitudeProfile,
  altitudeScale,
  profilePaths,
  type AltitudeDayInput,
} from '@/lib/altitude-profile'
import { formatNumber } from '@/lib/format'
import { BRAND, mixHex, OCEAN_LIT as PALETTE_OCEAN_LIT } from '@/lib/brand-colors'

/**
 * ============================================================================
 * Altitude profile
 * ============================================================================
 * The elevation profile of a trek, drawn from the itinerary instead of uploaded as a picture.
 *
 * Hand-written inline SVG, in the same spirit as the homepage globe (`globe-renderer.ts`) and the
 * map embed (`coordinates-map.tsx`): no chart library, no client boundary, no JavaScript bundle. A
 * profile is a polyline, a filled area, a handful of axis labels and dots — maybe 3 KB of markup,
 * which is less than the library's own loader would weigh and infinitely easier to style to the
 * brand. It also means the chart is in the HTML on first paint and reads correctly with JavaScript
 * off.
 *
 * The viewBox is a fixed 800 × 448 user space, so every text size below is in the same units and
 * the whole chart scales fluidly with its container (`w-full`, `h-auto`). Its taller frame uses the
 * same vertical space as the paired route-map card without distorting the plotted line or labels.
 * Nothing is measured at runtime, which is what lets this stay a pure server component.
 */

/** The drawing box, in viewBox units. Kept here so the tests can reason about the same numbers. */
const WIDTH = 800
const HEIGHT = 448
// Left/right room for the rotated place names, which lean out past their dots — generous enough
// that long labels still fit inside the frame. The larger bottom inset keeps them clear of the edge
// now that the chart uses more of the card's height.
const PADDING = { top: 34, right: 30, bottom: 100, left: 64 }

const INK = BRAND.ink
const SLATE = BRAND.earth
const OCEAN_LIT = PALETTE_OCEAN_LIT
const OCEAN_WASH = mixHex(BRAND.paper, BRAND.blue, 0.16)

/** Altitude as whole metres: 3210, not "3,210" — the reference chart's denser, ungrouped form. */
const metres = (value: number): string => String(Math.round(value))

export function AltitudeProfile({
  days,
  className,
  title = 'Altitude profile',
}: {
  /** The trip's `itinerary` array. Days without an altitude are ignored. */
  days: readonly AltitudeDayInput[] | null | undefined
  className?: string
  /** Accessible name of the figure — the section already says "Altitude chart". */
  title?: string
}) {
  const profile = altitudeProfile(days)
  // The caller decides what to show instead; a one-point profile is not worth drawing.
  if (!profile) return null

  const scale = altitudeScale(profile)
  const { line, area, coords } = profilePaths({
    points: profile.points,
    scale,
    width: WIDTH,
    height: HEIGHT,
    padding: PADDING,
  })

  const baseline = HEIGHT - PADDING.bottom

  return (
    <figure className={cn('w-full min-w-0', className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`${title}: ${formatNumber(profile.minAltitude)} to ${formatNumber(
          profile.maxAltitude,
        )} metres over ${profile.points.length} days.`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* No y-axis and no gridlines, by design: every point prints its own metre value, so an
            axis would only add ink. This is the treatment of the operator's reference chart (and
            of most trek profiles), and it keeps an 18-day itinerary from looking like a spreadsheet.
            The scale itself is still computed and padded — `altitudePaths()` uses it — which is
            what stops the profile from flattening into the top of the frame. */}

        {/* The profile: a filled area under the line, then the line itself. */}
        <path d={area} fill={OCEAN_WASH} />
        <path d={line} fill="none" stroke={OCEAN_LIT} strokeWidth={2.5} strokeLinejoin="round" />

        {profile.points.map((point, index) => {
          const { x, y } = coords[index]!
          const isTop = point.altitude === profile.maxAltitude
          // The end labels would otherwise run off the frame and collide with the y-axis ticks,
          // so they hang inside the plot box instead of being centred on their dot.
          const anchor =
            index === 0 ? 'start' : index === profile.points.length - 1 ? 'end' : 'middle'
          const labelX = anchor === 'start' ? x - 4 : anchor === 'end' ? x + 4 : x
          // At the two ends the line runs away from the label, so the value is pushed further up
          // to keep it off the stroke.
          const labelY =
            y - (isTop ? 14 : index === 0 || index === profile.points.length - 1 ? 20 : 12)

          return (
            <g key={`${point.day}-${point.label}`}>
              <circle cx={x} cy={y} r={isTop ? 5 : 4} fill={OCEAN_LIT} />
              {/* The metre value above each dot, clear of the line. */}
              <text
                x={labelX}
                y={labelY}
                textAnchor={anchor}
                fontSize={13}
                fontWeight={isTop ? 600 : 400}
                fill={INK}
              >
                {metres(point.altitude)}m
              </text>
              {/* The place name under the axis, rotated like the reference chart so the labels
                  never collide even on a full 18-day itinerary. */}
              {profile.labelled[index] ? (
                <text
                  x={x}
                  y={baseline + 16}
                  textAnchor="end"
                  fontSize={12.5}
                  fill={SLATE}
                  transform={`rotate(-35 ${x} ${baseline + 16})`}
                >
                  {point.label}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>

      {/* Screen readers get the numbers as text: the chart above is a picture of this table. */}
      <figcaption className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Place</th>
              <th scope="col">Altitude (m)</th>
            </tr>
          </thead>
          <tbody>
            {profile.points.map((point) => (
              <tr key={`row-${point.day}`}>
                <td>{point.day}</td>
                <td>{point.label}</td>
                <td>{formatNumber(point.altitude)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>

      {/* Sighted readers get the same thing as a line of text, which also explains what a point
          plots when a day has a high point and a lower bed. */}
      <p className="mt-4 flex items-center gap-1.5 text-small text-slate-80">
        <Mountain className="size-3.5 text-sage-90" aria-hidden />
        Highest point of each day, {formatNumber(profile.minAltitude)}–
        {formatNumber(profile.maxAltitude)} m over {profile.points.length} days
        <span className="sr-only">. Full values in the table above.</span>
      </p>
    </figure>
  )
}

/** Exported for the layout tests: the drawing box the paths are computed against. */
export const ALTITUDE_PROFILE_SIZE = { width: WIDTH, height: HEIGHT, padding: PADDING }
