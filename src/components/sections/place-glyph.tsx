import type { ReactNode } from 'react'

import type { PlaceCategoryValue } from '@/lib/place-categories'
import { cn } from '@/lib/utils'

/**
 * Place glyphs — the motif half of a category page's themed identity.
 *
 * Nine small survey-line marks, one per Browse Places category, drawn as pure
 * SVG on a 64 × 64 grid (no image files, no randomness). They borrow the
 * Topography component's stroke discipline: `currentColor` so the page's
 * accent variable paints them, and `vector-effect="non-scaling-stroke"` so the
 * line stays a crisp hairline whether the glyph renders at 28px in the pager
 * or 380px as the hero watermark.
 *
 * Decorative by contract: every call site renders them `aria-hidden`, because
 * the visible category title is already the accessible name of the link or
 * heading they accompany.
 */

const GLYPHS: Record<PlaceCategoryValue, ReactNode> = {
  lakes: (
    <>
      {/* Low sun over the water line. */}
      <circle cx="32" cy="13" r="5" />
      <path d="M8 30q6-5 12 0t12 0 12 0 12 0" />
      <path d="M8 40q6-5 12 0t12 0 12 0 12 0" />
      <path d="M8 50q6-5 12 0t12 0 12 0 12 0" />
    </>
  ),
  waterfalls: (
    <>
      {/* Cliff lips, the falling water, the pool it lands in. */}
      <path d="M10 7h13M41 7h13" />
      <path d="M27 7c0 12 5 14 5 24s-5 13-5 21" />
      <path d="M38 7c0 9 4 11 4 18" />
      <path d="M10 55q7 5 14 0t14 0 14 0" />
      <path d="M31 46q4 4 8 1" />
    </>
  ),
  'mountain-passes': (
    <>
      {/* Ridge line with the col between two summits, crossed by a route. */}
      <path d="M4 55 18 27l10 13L45 15l15 34" />
      <path d="M45 15V8M41.5 11.5h7" />
      <path d="M12 51l16-9 12-8" strokeDasharray="3.5 4.5" />
    </>
  ),
  canyons: (
    <>
      {/* Two stratified walls stepping down to the riverbed between them. */}
      <path d="M8 9h13v13h9v13h9" />
      <path d="M56 9H43v13h-9v13h-9" />
      <path d="M8 47q8 8 16 1" />
      <path d="M56 47q-8 8-16 1" />
      <path d="M30 47h4" />
    </>
  ),
  'base-camps': (
    <>
      {/* Expedition tent under a summit flag, pitched on the ground line. */}
      <path d="M14 47 32 18l18 29" />
      <path d="M26 47l6-13 6 13" />
      <path d="M32 18V9l8 3-8 3" />
      <path d="M6 47h52" />
    </>
  ),
  caves: (
    <>
      {/* Outer mouth, inner chamber, the floor they both stand on. */}
      <path d="M13 52V31a19 15 0 0 1 38 0v21" />
      <path d="M24 52V35a8 7 0 0 1 16 0v17" />
      <path d="M6 52h52" />
      <path d="M32 16v-4" />
    </>
  ),
  'bike-tours': (
    <>
      {/* One wheel, one road running out to the horizon. */}
      <circle cx="24" cy="37" r="14" />
      <circle cx="24" cy="37" r="2.5" />
      <path d="M14.1 27.1l19.8 19.8M33.9 27.1 14.1 46.9" />
      <path d="M4 57c16-2 30-7 40-22 4-6 7-10 14-12" />
    </>
  ),
  'mountain-peaks': (
    <>
      {/* Twin summits with the snow line and a trig point on top. */}
      <path d="M4 55 24 15l10 19 8-12 18 33" />
      <path d="M18 30h12" />
      <path d="M24 15V7M20 11h8" />
      <path d="M40 41h9" />
    </>
  ),
  temples: (
    <>
      {/* Three tiers of eaves on a platform, finial on top. */}
      <path d="M32 4v7" />
      <circle cx="32" cy="13" r="1.6" />
      <path d="M18 22q14-8 28 0M18 22v2M46 22v2" />
      <path d="M24 23v8M40 23v8" />
      <path d="M13 34q19-9 38 0M13 34v2M51 34v2" />
      <path d="M19 36v8M45 36v8" />
      <path d="M8 46q24-9 48 0M8 46v3M56 46v3" />
      <path d="M14 48v6M50 48v6" />
      <path d="M7 54h50" />
    </>
  ),
}

export function PlaceGlyph({
  value,
  className,
  strokeWidth = 1.5,
}: {
  value: PlaceCategoryValue
  className?: string
  /** Stroke width in screen pixels — the stroke does not scale with the box. */
  strokeWidth?: number
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('place-glyph', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g vectorEffect="non-scaling-stroke">{GLYPHS[value]}</g>
    </svg>
  )
}
