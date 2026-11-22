/**
 * The `/places` bento packing — an exact-cover proof.
 *
 * A bento's failure mode is invisible in code review and obvious on screen:
 * one forgotten cell becomes a hole, one overlapping pair becomes a puzzle
 * piece on top of a photograph, and one plate left out of the map silently
 * falls to the grid's auto-placement and opens a gap somewhere else.
 *
 * So the packing is asserted here instead of eyeballed: for every breakpoint,
 * every grid cell must be claimed by exactly one plate, and every plate must
 * appear exactly once.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BENTO_ASPECT_LG,
  BENTO_ASPECT_MD,
  bentoAreaVars,
  bentoGridArea,
  placeBentoLayout,
  type BentoBreakpoint,
} from './place-bento-layout'
import { PLACE_CATEGORY_VALUES, placeCategories, placeCategoryPath } from './place-categories'

const TILE_KEYS = ['key', ...PLACE_CATEGORY_VALUES] as const

/** Every cell covered once — no hole, no overlap — or a message naming both. */
function assertExactTiling(name: string, layout: BentoBreakpoint) {
  const { columns, rows, areas } = layout
  const owner = new Map<string, string>()

  for (const tile of TILE_KEYS) {
    const area = areas[tile]
    assert.ok(area, `${name}: ${tile} has a placement`)
    assert.ok(area.span >= 1 && area.rows >= 1, `${name}: ${tile} spans at least one cell`)
    assert.ok(
      area.col + area.span <= columns,
      `${name}: ${tile} fits inside the ${columns} columns`,
    )
    assert.ok(area.row + area.rows <= rows, `${name}: ${tile} fits inside the ${rows} rows`)

    for (let y = area.row; y < area.row + area.rows; y++) {
      for (let x = area.col; x < area.col + area.span; x++) {
        const cell = `${x},${y}`
        const previous = owner.get(cell)
        assert.equal(previous, undefined, `${name}: cell ${cell} is claimed by ${previous} and ${tile}`)
        owner.set(cell, tile)
      }
    }
  }

  const missing: string[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      if (!owner.has(`${x},${y}`)) missing.push(`${x},${y}`)
    }
  }
  assert.deepEqual(missing, [], `${name}: no cell is left empty (${missing.length} holes)`)
}

for (const [name, layout] of Object.entries(placeBentoLayout)) {
  test(`the ${name} bento packs all ten plates into a rectangle with no hole`, () => {
    assertExactTiling(name, layout)
    assert.equal(Object.keys(layout.areas).length, TILE_KEYS.length, `${name}: ten placements only`)
  })
}

test('the desktop map is the composition the section is designed around', () => {
  const { lg } = placeBentoLayout

  // The key is the top-left block and the widest cell on the first row.
  assert.deepEqual(lg.areas.key, { col: 0, row: 0, span: 5, rows: 4 })

  // One feature plate carries the largest single span, and the wide plates
  // and tall plates differ enough for the composition to read as staggered
  // rather than as a table of equal cells.
  const spans = TILE_KEYS.map((tile) => {
    const area = lg.areas[tile]
    return `${area.span}x${area.rows}`
  })
  assert.ok(new Set(spans).size >= 4, `at least four distinct plate shapes (got ${spans.join(', ')})`)
  assert.ok(
    TILE_KEYS.some((tile) => lg.areas[tile].span * lg.areas[tile].rows >= 25),
    'one plate is large enough to be the feature',
  )
})

test('every placement produces a valid `grid-area` shorthand at every breakpoint', () => {
  for (const tile of TILE_KEYS) {
    const vars = bentoAreaVars(tile)
    for (const [key, value] of Object.entries(vars)) {
      assert.match(
        value,
        /^\d+ \/ \d+ \/ span \d+ \/ span \d+$/,
        `${tile} ${key} is a row-start / column-start / row-span / column-span shorthand`,
      )
    }
    // The phone stack: one column, plates in reading order.
    const sm = placeBentoLayout.sm.areas[tile]
    assert.equal(sm.span, 1, `${tile} is one column wide on a phone`)
    assert.equal(sm.col, 0, `${tile} starts at the phone's only column`)
  }
  assert.equal(bentoGridArea({ col: 5, row: 3, span: 4, rows: 3 }), '4 / 6 / span 3 / span 4')
})

test('the phone stack keeps the key first and the nine plates in canonical order', () => {
  const { sm } = placeBentoLayout
  assert.equal(sm.areas.key.row, 0)
  placeCategories.forEach((category, index) => {
    assert.equal(sm.areas[category.value].row, index + 1, `${category.label} is plate ${index + 1}`)
  })
})

test('the grid aspect ratios match the maps they size', () => {
  // Twelve columns with twelve rows at 0.826 × a column (see the layout docs).
  const [w, h] = BENTO_ASPECT_LG.split(' / ').map(Number)
  assert.equal(w! / h!, 1280 / 1080)
  const [mw, mh] = BENTO_ASPECT_MD.split(' / ').map(Number)
  assert.ok(mw! / mh! > 0.3 && mw! / mh! < 0.4, 'the tablet band is roughly three times tall as wide')
})

test('each plate links to its own category page', () => {
  for (const category of placeCategories) {
    assert.equal(placeCategoryPath(category.value), `/places/${category.value}`)
    assert.ok(placeBentoLayout.lg.areas[category.value], `${category.label} has a desktop placement`)
  }
})
