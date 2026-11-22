import type { PlaceCategoryValue } from './place-categories'

/**
 * ============================================================================
 * The `/places` bento — packing data, not CSS guesswork
 * ============================================================================
 *
 * Ten plates (one editorial key + the nine landscapes) are packed into a
 * rectangle with no hole and no ragged edge. The packing is written down here
 * once, as coordinates on a small grid, and consumed twice:
 *
 *   • `PlaceBento` renders each plate's `grid-area` from these numbers;
 *   • `place-bento-layout.test.ts` walks the same numbers to prove that every
 *     cell is claimed exactly once at EVERY breakpoint.
 *
 * Why not hand-written `grid-template-areas` in CSS? Because a bento's failure
 * mode is invisible in code review and obvious on screen: one forgotten cell
 * becomes a hole, one overlapping pair becomes a puzzle piece on top of a
 * photograph. Coordinates plus an exact-cover test make that impossible to
 * ship.
 *
 * Each breakpoint is its own tessellation:
 *
 *   sm  (phones)      one column, editorial stack; the key plate keeps its
 *                     headline and the nine plates alternate their crop
 *   md  (tablets)     six columns — a wide key band, two staggered 4/2 pairs
 *                     and a full-width feature plate
 *   lg  (desktop)     twelve columns — the composition: a 5×4 key, a 5×5
 *                     feature, tall right-hand plates and a three-up foot
 *
 * Tile spans are quoted in grid *cells* (columns × rows), never pixels, so the
 * same composition holds from a laptop to a 4K canvas.
 */

export type BentoTileKey = 'key' | PlaceCategoryValue

export type BentoArea = {
  /** Zero-based column of the plate's left edge. */
  col: number
  /** Zero-based row of the plate's top edge. */
  row: number
  /** Width in columns. */
  span: number
  /** Height in rows. */
  rows: number
}

export type BentoBreakpoint = {
  /** Columns in the layout grid. */
  columns: number
  /** Rows in the layout grid (unused by the stacked phone layout). */
  rows: number
  /** Grid placement, one entry per plate. */
  areas: Record<BentoTileKey, BentoArea>
}

/**
 * Desktop — the composition the section is designed around.
 *
 *   ┌───────────────┬──────────┬────────┐
 *   │               │  Lakes   │ Falls  │
 *   │   KEY 5 × 4   ├────┬─────┼────────┤
 *   │               │Pass│     │Canyons │
 *   ├───────────────┘    │     │        │
 *   │               │    │     │        │
 *   │  Base camps   ├────┴─────┴────────┤
 *   │    5 × 5      │       │           │
 *   │               │ Caves │ Bike 4×5  │
 *   ├───────────┬───┴───┬───┤           │
 *   │  Peaks    │Temples│   │           │
 *   └───────────┴───────┴───┴───────────┘
 *
 * Twelve columns × twelve rows = 144 cells; the nine plates and the key
 * account for every one of them.
 */
const lg: BentoBreakpoint = {
  columns: 12,
  rows: 12,
  areas: {
    key: { col: 0, row: 0, span: 5, rows: 4 },
    lakes: { col: 5, row: 0, span: 4, rows: 3 },
    waterfalls: { col: 9, row: 0, span: 3, rows: 3 },
    'mountain-passes': { col: 5, row: 3, span: 3, rows: 3 },
    canyons: { col: 8, row: 3, span: 4, rows: 4 },
    'base-camps': { col: 0, row: 4, span: 5, rows: 5 },
    caves: { col: 5, row: 6, span: 3, rows: 3 },
    'bike-tours': { col: 8, row: 7, span: 4, rows: 5 },
    'mountain-peaks': { col: 0, row: 9, span: 4, rows: 3 },
    temples: { col: 4, row: 9, span: 4, rows: 3 },
  },
}

/**
 * Tablet — six columns. The key becomes a wide band, and two pairs trade their
 * 4/2 and 2/4 widths so the eye still moves diagonally rather than down a
 * table of equal cells. Base camps runs the full width as the feature plate.
 */
const md: BentoBreakpoint = {
  columns: 6,
  rows: 22,
  areas: {
    key: { col: 0, row: 0, span: 6, rows: 3 },
    lakes: { col: 0, row: 3, span: 4, rows: 4 },
    waterfalls: { col: 4, row: 3, span: 2, rows: 4 },
    'mountain-passes': { col: 0, row: 7, span: 2, rows: 3 },
    canyons: { col: 2, row: 7, span: 4, rows: 3 },
    'base-camps': { col: 0, row: 10, span: 6, rows: 4 },
    caves: { col: 0, row: 14, span: 3, rows: 4 },
    'bike-tours': { col: 3, row: 14, span: 3, rows: 4 },
    'mountain-peaks': { col: 0, row: 18, span: 3, rows: 4 },
    temples: { col: 3, row: 18, span: 3, rows: 4 },
  },
}

/**
 * Phones — one column. Rows are auto-sized here (each plate carries its own
 * crop ratio in the stylesheet), so the row coordinates are simply the stack
 * order; keeping them in the data means the DOM order and the visual order are
 * the same list, which is also the reading/tab order.
 */
const sm: BentoBreakpoint = {
  columns: 1,
  rows: 10,
  areas: {
    key: { col: 0, row: 0, span: 1, rows: 1 },
    lakes: { col: 0, row: 1, span: 1, rows: 1 },
    waterfalls: { col: 0, row: 2, span: 1, rows: 1 },
    'mountain-passes': { col: 0, row: 3, span: 1, rows: 1 },
    canyons: { col: 0, row: 4, span: 1, rows: 1 },
    'base-camps': { col: 0, row: 5, span: 1, rows: 1 },
    caves: { col: 0, row: 6, span: 1, rows: 1 },
    'bike-tours': { col: 0, row: 7, span: 1, rows: 1 },
    'mountain-peaks': { col: 0, row: 8, span: 1, rows: 1 },
    temples: { col: 0, row: 9, span: 1, rows: 1 },
  },
}

export const placeBentoLayout = { sm, md, lg } as const

export type BentoBreakpointName = keyof typeof placeBentoLayout

/** CSS `grid-area` shorthand for one placement (`row / column / span rows / span columns`). */
export const bentoGridArea = ({ col, row, span, rows }: BentoArea): string =>
  `${row + 1} / ${col + 1} / span ${rows} / span ${span}`

/** The three placements of one plate, ready to publish as custom properties. */
export const bentoAreaVars = (
  tile: BentoTileKey,
): Record<'--bento-area-sm' | '--bento-area-md' | '--bento-area-lg', string> => ({
  '--bento-area-sm': bentoGridArea(sm.areas[tile]),
  '--bento-area-md': bentoGridArea(md.areas[tile]),
  '--bento-area-lg': bentoGridArea(lg.areas[tile]),
})

/**
 * The desktop grid's overall aspect ratio, so `grid-template-rows:
 * repeat(12, 1fr)` can size rows from the container width alone — a 3 × 3
 * plate then stays near-square at every canvas from 1024px to a 4K TV without a
 * single media query changing a height.
 *
 * Derived, not measured: 12 columns of `c` and 12 rows of `0.826c` with an
 * 0.75rem gutter both axes resolve to this ratio at the 1280px content column.
 */
export const BENTO_ASPECT_LG = '1280 / 1080'

/** Tablet: 6 columns × 22 rows at the same row/column proportion. */
export const BENTO_ASPECT_MD = '6 / 19.66'
