/**
 * The `/places` bento — markup and accessibility contract.
 *
 * The packing itself is proved in `src/lib/place-bento-layout.test.ts`; this
 * file guards the things that are easy to break while restyling the section:
 * one link per category, a heading the section can be labelled by, the label
 * as the only accessible name, and a photograph that is decorative.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { PLACE_CATEGORY_VALUES, placeCategories } from '../../lib/place-categories'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const read = (file: string): string => readFileSync(path.join(repoRoot, file), 'utf8')

test('the index renders the bento instead of the retired atlas gallery', () => {
  const page = read('src/app/(frontend)/places/page.tsx')
  assert.match(page, /<PlaceBento\s+titleId="places-index-heading"/)
  assert.doesNotMatch(page, /PlaceAtlasCard|places-grid/, 'the card gallery is gone')
  assert.match(
    page,
    /<section aria-labelledby="places-index-heading"/,
    'the section is labelled by the bento key plate heading',
  )
  assert.match(page, /placeCategories\.map\(/, 'the CollectionPage JSON-LD still lists all nine')

  // The old card component is deleted, not orphaned.
  assert.throws(() => read('src/components/cards/place-atlas-card.tsx'))
})

test('the bento renders one plate per category, in the canonical order', () => {
  const source = read('src/components/sections/place-bento.tsx')

  assert.match(source, /placeCategories\.map\(/, 'plates come from the single source of truth')
  // Every category reaches the stylesheet as a `data-tile` hook, and the
  // layout map knows all nine (also asserted in the layout test).
  assert.match(source, /data-tile=\{category\.value\}/)
  assert.equal(new Set(PLACE_CATEGORY_VALUES).size, 9)
  assert.match(source, /placeCategoryPath\(category\.value\)/, 'each plate links to its own page')
  assert.match(source, /bentoAreaVars\(category\.value\)/, 'each plate publishes its three placements')
  assert.match(source, /bentoAreaVars\('key'\)/, 'the key plate is placed by the same map')
  assert.equal(placeCategories.length, 9)
})

test('a plate is announced by its category name alone', () => {
  const source = read('src/components/sections/place-bento.tsx')

  // The numeral and corner mark must not precede the title in the accessible
  // name — a screen reader listing nine links should say the nine landscapes,
  // not nine numbers.
  assert.match(source, /className="pb-plate__top" aria-hidden="true"/)
  // The supporting line is visual emphasis; it is not part of the link name.
  assert.match(source, /className="pb-plate__desc" aria-hidden="true"/)
  assert.match(source, /<h3 className="pb-plate__title">\{category\.label\}<\/h3>/)
  // The photograph stays decorative; the title is the name.
  assert.match(source, /alt=""[\s\S]{0,220}aria-hidden="true"/)
})

test('the section heading lives inside the composition, at the right level', () => {
  const source = read('src/components/sections/place-bento.tsx')

  // The key plate carries the h2, so the grid is a section of the page rather
  // than a gallery dropped under a floating heading.
  assert.match(source, /<h2 id=\{titleId\} className="pb-key__title">/)
  assert.match(source, /titleId = 'places-bento-title'/)
  // The italic accent line is the site's hero treatment.
  assert.match(source, /Start with a <i>landscape<\/i>/)
})

test('the bento keeps the site image treatment and a single gutter', () => {
  const css = read('src/components/sections/place-bento.css')

  // One gutter variable, used by the grid's both axes.
  assert.match(css, /--bento-gap:/)
  assert.match(css, /gap: var\(--bento-gap\)/)
  // The site's one image grade and the one ink scrim.
  assert.match(css, /filter: var\(--image-grade\)/)
  assert.match(css, /color-mix\(in srgb, var\(--color-ink\) 86%, transparent\)/)
  // No plate carries a margin of its own — the gap is the only distance between
  // cells. (Inner text nodes still reset their own UA margins; that is text
  // rhythm, not layout.)
  const plateRule = css.match(/^\.pb-plate\s*\{([^}]*)\}/m)?.[1]
  assert.ok(plateRule, 'the plate has one base rule')
  assert.doesNotMatch(plateRule, /\bmargin(?:-[a-z]+)?\s*:/)

  // Every breakpoint clears the phone crops before the map takes over, or a
  // `4 / 3` plate would force its row taller than the track and shear the grid.
  const tablet = css.slice(css.indexOf('@media (width >= 48rem)'), css.indexOf('@media (width >= 64rem)'))
  assert.match(tablet, /aspect-ratio: auto;/)
  assert.match(tablet, /grid-area: var\(--bento-area-md\)/)

  const desktop = css.slice(css.indexOf('@media (width >= 64rem)'))
  assert.match(desktop, /repeat\(12, minmax\(0, 1fr\)\)/)
  assert.match(desktop, /grid-area: var\(--bento-area-lg\)/)
  assert.match(desktop, /aspect-ratio: 1280 \/ 1080/)
})

test('the bento respects reduced motion and keeps visible focus', () => {
  const css = read('src/components/sections/place-bento.css')
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /\.pb-plate:focus-visible\s*\{[\s\S]{0,160}outline: 2px solid/)
})

test('the category pages still render their own related strip', () => {
  const page = read('src/app/(frontend)/places/[slug]/page.tsx')
  const css = read('src/app/(frontend)/places/places.css')

  assert.match(page, /places-related-grid/)
  assert.match(css, /\.places-related-grid/)
  // The index's retired gallery rules must not linger in the page stylesheet.
  assert.doesNotMatch(css, /\.places-grid\s*\{/)
  assert.doesNotMatch(css, /\.atlas-card/)
})
