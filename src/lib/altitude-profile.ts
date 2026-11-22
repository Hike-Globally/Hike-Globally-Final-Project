/**
 * ============================================================================
 * Altitude profile
 * ============================================================================
 * Turns a trip's `itinerary` array into the points of an elevation profile: "day 1 starts at this
 * height, the route tops out here, it ends there". The rendering lives in
 * `components/sections/altitude-profile.tsx`; everything that can be reasoned about without a
 * browser lives here, because it is the part that is easy to get subtly wrong and cheap to test.
 *
 * What a point represents
 * ---------------------------------------------------------------------------
 * One point per itinerary day, at that day's **highest altitude** (`itinerary[].altitude`) and
 * labelled with that day's **place** (`itinerary[].place`). A day that climbs over a pass and
 * sleeps lower plots the pass, which is what a profile chart is for — the shape of the route, not
 * the shape of the beds.
 *
 * The one thing this model cannot show is the classic same-day side trip *beyond* the day's
 * endpoint: Ghorepani → Poon Hill → Tadapani is one day with one altitude. Editable altitude is
 * therefore the highest point *reached* that day; if a trek's signature view is a sunrise hike,
 * the author records that height on the day it happens.
 *
 * Missing data is normal and never produces a broken chart:
 *   - days with no altitude are dropped (they cannot be plotted),
 *   - days are ordered by their `day` number, not by array order,
 *   - a single remaining point still plots, as a one-dot chart with its label,
 *   - a `place` left empty falls back to "Day n".
 */

/** The subset of a Payload itinerary row this module reads. */
export type AltitudeDayInput = {
  day?: number | null
  place?: string | null
  altitude?: number | null
}

export type AltitudePoint = {
  /** 1-based day number, as authored. */
  day: number
  /** Axis label: the place, or "Day n" when the author left it empty. */
  label: string
  /** Metres above sea level. */
  altitude: number
  /**
   * Fraction of the way along the x-axis, 0 → 1. Computed from the day number, so a gap in the
   * numbering (day 3 missing) leaves a gap in the profile instead of hiding it.
   */
  x: number
}

/** Below this, a profile is a dot or a line with no shape worth showing. */
export const MIN_PROFILE_POINTS = 2

/** Above this, the labels are thinned (see `niceStep`). */
const MAX_LABELS = 8

/**
 * The plottable series, in day order.
 *
 * `labels` is the full set, one per point; `labelled` marks the ones that should print, so a long
 * itinerary keeps its shape while its axis stays readable. Both arrays are parallel to `points`.
 */
export type AltitudeProfile = {
  points: AltitudePoint[]
  minAltitude: number
  maxAltitude: number
  /** Metres of vertical range actually plotted (never zero — see `altitudeScale`). */
  range: number
  /** Which points print a label on the axis. */
  labelled: boolean[]
}

const round = (value: number, decimals = 2): number => Number(value.toFixed(decimals))

/**
 * Reads the itinerary and returns the series, or `null` when there is nothing worth plotting
 * (fewer than `MIN_PROFILE_POINTS` days with an altitude).
 */
export function altitudeProfile(
  days: readonly AltitudeDayInput[] | null | undefined,
): AltitudeProfile | null {
  const rows = (days ?? [])
    .filter(
      (row): row is AltitudeDayInput & { altitude: number } =>
        typeof row.altitude === 'number' &&
        Number.isFinite(row.altitude) &&
        row.altitude >= 0 &&
        row.altitude < 9000, // above Everest's summit: a typo, not a trek
    )
    .map((row, index) => ({
      day: typeof row.day === 'number' && Number.isFinite(row.day) ? row.day : index + 1,
      place: row.place?.trim() || '',
      altitude: row.altitude,
    }))
    .sort((a, b) => a.day - b.day || a.altitude - b.altitude)

  if (rows.length < MIN_PROFILE_POINTS) return null

  const first = rows[0]!.day
  const last = rows[rows.length - 1]!.day
  const span = last - first || 1

  const points: AltitudePoint[] = rows.map((row) => ({
    day: row.day,
    label: row.place || `Day ${row.day}`,
    altitude: row.altitude,
    // Array index would bunch points together when days are missing; the day number keeps the
    // spacing honest. Rounding keeps the SVG path stable between server and client renders.
    x: rows.length === 1 ? 0.5 : round((row.day - first) / span, 5),
  }))

  const altitudes = points.map((point) => point.altitude)
  const minAltitude = Math.min(...altitudes)
  const maxAltitude = Math.max(...altitudes)

  return {
    points,
    minAltitude,
    maxAltitude,
    range: maxAltitude - minAltitude,
    labelled: thinLabels(points),
  }
}

/**
 * Chooses which axis labels print.
 *
 * Every point is labelled while they fit (the common 7–8 day trek). Beyond that, labels step by a
 * nice multiple so the axis keeps at most `MAX_LABELS`, and the first and last stay labelled — the
 * two a reader looks for. The tallest point is always labelled too: a profile's whole job is to
 * say where the top is.
 */
function thinLabels(points: readonly AltitudePoint[]): boolean[] {
  const count = points.length
  if (count <= MAX_LABELS) return points.map(() => true)

  const step = Math.ceil(count / MAX_LABELS)
  const tallest = points.reduce(
    (best, point, index) => (point.altitude > points[best]!.altitude ? index : best),
    0,
  )

  return points.map((_, index) => index % step === 0 || index === count - 1 || index === tallest)
}

/**
 * The vertical scale: a padded metre range plus its tick values.
 *
 * Altitude profiles must NOT start at zero — a 3,200 m trek plotted from sea level is a flat smear
 * along the top of the frame. The range is padded by 10% of its own span (minimum 100 m, so a
 * flat-ish route does not zoom into noise) and rounded outward to a tidy step, which is what makes
 * the ticks read 2,000 / 2,500 / 3,000 rather than 2,043 / 2,611 / 3,179.
 */
export function altitudeScale(profile: Pick<AltitudeProfile, 'minAltitude' | 'maxAltitude'>): {
  from: number
  to: number
  ticks: number[]
} {
  const span = Math.max(profile.maxAltitude - profile.minAltitude, 200)
  const padding = Math.max(span * 0.08, 80)
  const low = Math.max(0, profile.minAltitude - padding)
  const high = profile.maxAltitude + padding
  const step = niceStep((high - low) / 4)

  const from = Math.max(0, Math.floor(low / step) * step)
  const to = Math.ceil(high / step) * step

  const ticks: number[] = []
  for (let value = from; value <= to; value += step) ticks.push(value)

  return { from, to, ticks }
}

/**
 * The nearest "human" step to `raw`: 1 / 2 / 2.5 / 5 × 10ⁿ.
 *
 * Nearest, not next-up. Rounding *up* turns a proposed 700 m step into 1,000 m, which on a
 * 820 → 3,210 m trek stretches the axis to 0 → 4,000 and flattens the profile into the top third of
 * the frame — the exact failure the "never from zero" rule is there to prevent.
 */
function niceStep(raw: number): number {
  const LADDER = [1, 2, 2.5, 5, 10]
  if (!Number.isFinite(raw) || raw <= 0) return 500

  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalised = raw / magnitude
  let best = LADDER[0]!
  for (const candidate of LADDER) {
    if (Math.abs(candidate - normalised) < Math.abs(best - normalised)) best = candidate
  }
  return Math.max(1, best * magnitude)
}

/**
 * The `M … L … Z` path pair for the filled profile, in an SVG user space of `width × height`.
 *
 * Points sit on a padding-aware plot box; the line follows them and the area closes the shape down
 * to the baseline. Returned together so both use the exact same coordinates.
 */
export function profilePaths({
  points,
  scale,
  width,
  height,
  padding,
}: {
  points: readonly AltitudePoint[]
  scale: { from: number; to: number }
  width: number
  height: number
  padding: { top: number; right: number; bottom: number; left: number }
}): { line: string; area: string; coords: { x: number; y: number }[] } {
  const boxWidth = width - padding.left - padding.right
  const boxHeight = height - padding.top - padding.bottom
  const range = Math.max(scale.to - scale.from, 1)

  const coords = points.map((point) => ({
    x: round(padding.left + point.x * boxWidth, 1),
    y: round(padding.top + (1 - (point.altitude - scale.from) / range) * boxHeight, 1),
  }))

  const line = coords.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')
  const baseline = round(height - padding.bottom, 1)
  const area =
    coords.length === 0
      ? ''
      : `${line} L${coords[coords.length - 1]!.x} ${baseline} L${coords[0]!.x} ${baseline} Z`

  return { line, area, coords }
}
