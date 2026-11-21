import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { PLACE_CATEGORY_VALUES, placeCategories, placeCategoryPath } from '../../lib/place-categories'
import { isReservedPageSlug } from '../../lib/site-routes'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const read = (file: string): string => readFileSync(path.join(repoRoot, file), 'utf8')

test('the homepage renders Browse Places exactly once, high on the page', () => {
  const destinations = read('src/components/blocks/homepage-destinations.tsx')

  // The destination sliders must not re-render Browse Places: a second copy used to land
  // immediately above "Latest Blogs and Stories".
  assert.match(destinations, /title="Destinations Around The World"/)
  assert.doesNotMatch(destinations, /<BrowsePlaces/)
  assert.doesNotMatch(destinations, /sections\/browse-places/)

  const route = read('src/app/(frontend)/page.tsx')
  assert.match(route, /<BlockRenderer blocks=\{page\.blocks\} homepage \/>/)
  assert.match(route, /<HomeFallback \/>/)

  // Both homepage paths keep exactly one Browse Places instance, next to the difficulty
  // levels in the first section, and still render the shared destination sections. The
  // second copy used to come from `HomepageDestinations`, directly above "Latest Blogs
  // and Stories"; that component is now the only place the section could be duplicated,
  // so asserting it renders none is the regression guard.
  for (const file of [
    'src/components/blocks/block-renderer.tsx',
    'src/components/views/home-fallback.tsx',
  ]) {
    const source = read(file)
    assert.equal(
      (source.match(/<BrowsePlaces \/>/g) ?? []).length,
      1,
      `${file} renders one Browse Places`,
    )
    assert.match(
      source,
      /<DifficultyLevels \/>\s*<BrowsePlaces \/>/,
      `${file} keeps Browse Places first`,
    )
    assert.match(source, /HomepageDestinations/, `${file} must render the shared homepage sections`)
  }
})

test('the carousel is continuous, pausable, manually navigable and accessible', () => {
  const source = read('src/components/sections/browse-places.tsx')
  const css = read('src/components/sections/browse-places.css')

  assert.match(source, /requestAnimationFrame\(tick\)/)
  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(source, /setManuallyPaused/)
  assert.match(source, /onMouseEnter/)
  assert.match(source, /onFocusCapture/)
  assert.match(source, /onPointerDown/)
  assert.match(source, /onTouchStart/)
  assert.match(source, /onKeyDown/)
  assert.match(source, /role="region"/)
  assert.match(source, /tabIndex=\{0\}/)
  assert.match(source, /aria-keyshortcuts="ArrowLeft ArrowRight PageUp PageDown"/)
  assert.match(source, /aria-label="Previous places"/)
  assert.match(source, /aria-label="Next places"/)
  assert.match(source, /PLACE_INDEX_PATH/)
  assert.match(source, /\[\.\.\.placeCategories, \.\.\.placeCategories\]/)
  assert.match(css, /@media \(width >= 40rem\)/)
  assert.match(css, /@media \(width >= 64rem\)/)
  assert.match(css, /@media \(width >= 96rem\)/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test('cards and place links use the nine dedicated, unprefixed category URLs', () => {
  const card = read('src/components/cards/place-category-card.tsx')
  const links = read('src/components/sections/place-category-links.tsx')
  const field = read('src/fields/place-categories.ts')
  const types = read('src/payload-types.ts')

  assert.match(card, /placeCategoryPath\(category\.value\)/)
  assert.match(links, /placeCategoryPath\(category\.value\)/)
  assert.match(links, /resolvePlaceCategories\(values\)/)
  for (const collection of ['Trips', 'Blog']) {
    assert.match(read(`src/collections/${collection}.ts`), /placeCategoriesField\(\)/)
  }
  assert.match(field, /hasMany: true/)
  assert.match(field, /options: placeCategoryOptions/)
  assert.match(types, /export interface Trip \{[\s\S]*?placeCategories\?:/)
  assert.match(types, /export interface Blog \{[\s\S]*?placeCategories\?:/)
  assert.match(types, /export interface TripsSelect[\s\S]*?placeCategories\?:/)
  assert.match(types, /export interface BlogSelect[\s\S]*?placeCategories\?:/)

  for (const value of PLACE_CATEGORY_VALUES) {
    assert.equal(placeCategories.some((category) => category.value === value), true)
  }
})

test('the carousel keeps card links clickable while still supporting drag', () => {
  const source = read('src/components/sections/browse-places.tsx')
  const card = read('src/components/cards/place-category-card.tsx')
  const down = source.slice(source.indexOf('const onPointerDown'), source.indexOf('const onPointerMove'))
  const move = source.slice(source.indexOf('const onPointerMove'), source.indexOf('const onKeyDown'))

  // Capturing on pointerdown retargets a click from the link to the track.
  assert.doesNotMatch(down, /setPointerCapture/)
  assert.match(move, /Math\.abs\(delta\) <= 4\) return/)
  assert.match(move, /setPointerCapture\(event\.pointerId\)/)
  assert.match(source, /onClickCapture/)
  assert.match(card, /href=\{placeCategoryPath\(category\.value\)\}/)
  assert.match(card, /draggable=\{false\}/)
  for (const category of placeCategories) {
    assert.equal(placeCategoryPath(category.value), `/places/${category.value}`)
  }
})

test('homepage cards have solid backgrounds without removing photos from other places pages', () => {
  const css = read('src/components/sections/browse-places.css')
  const card = read('src/components/cards/place-category-card.tsx')
  const carousel = read('src/components/sections/browse-places.tsx')
  assert.doesNotMatch(css, /\.browse-places::after/)
  assert.match(css, /\.browse-places \.browse-places__card\s*\{\s*background:/)
  assert.match(carousel, /<PlaceCategoryCard[\s\S]*?showImage=\{false\}/)
  assert.match(card, /showImage = true/)
  assert.match(card, /\{showImage && \(\s*<>\s*<Image[\s\S]*?className="browse-places__scrim"/)
  for (const file of ['src/app/(frontend)/places/page.tsx', 'src/app/(frontend)/places/[slug]/page.tsx']) {
    assert.doesNotMatch(read(file), /showImage=\{false\}/)
  }
})

test('single trip and blog pages expose their mapped place categories', () => {
  for (const file of [
    'src/components/views/trip-detail.tsx',
    'src/components/views/post-detail.tsx',
  ]) {
    assert.match(read(file), /<PlaceCategoryLinks values=/, `${file} must render place links`)
  }
  assert.match(read('src/components/views/post-detail.tsx'), /placeCategoryLabels/)
})

test('the new routes join sitemap, llms, reserved slugs, revalidation and translations', () => {
  assert.equal(isReservedPageSlug('places'), true)
  assert.match(read('src/i18n/config.ts'), /places: 'places'/)
  assert.match(read('src/lib/sitemap.ts'), /placeCategoryPaths\(\)|placeCategoryPath\(category\.value\)/)
  assert.match(read('src/lib/llms-txt.ts'), /section\('Places', placeEntries\(\)\)/)
  assert.match(read('src/hooks/revalidate.ts'), /PLACE_INDEX_PATH, \.\.\.placeCategoryPaths\(\)/)
  assert.match(read('src/lib/frontend-i18n.test.ts'), /Browse Places copy is translated/)
  assert.match(read('src/i18n/translations/de.ts'), /"Browse places": "Orte entdecken"/)
  assert.match(read('src/i18n/translations/fr.ts'), /"Browse places": "Découvrir des lieux"/)
  assert.match(read('src/migrations/index.ts'), /20261121_134756_place_categories/)
})
