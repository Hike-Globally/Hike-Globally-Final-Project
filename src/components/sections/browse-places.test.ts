import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { PLACE_CATEGORY_VALUES, placeCategories } from '../../lib/place-categories'
import { isReservedPageSlug } from '../../lib/site-routes'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const read = (file: string): string => readFileSync(path.join(repoRoot, file), 'utf8')

const nthIndexOf = (source: string, needle: string, occurrence: number): number => {
  let index = -1
  for (let count = 0; count < occurrence; count += 1) {
    index = source.indexOf(needle, index + 1)
    if (index === -1) return -1
  }
  return index
}

test('Browse Places sits immediately after Destinations Around The World on both homepage paths', () => {
  const homepage = read('src/components/blocks/homepage-destinations.tsx')
  const secondCarousel = nthIndexOf(homepage, '<DestinationCarousel', 2)
  const browsePlaces = homepage.indexOf('<BrowsePlaces')
  assert.ok(secondCarousel >= 0)
  assert.ok(browsePlaces > secondCarousel)
  assert.match(homepage, /title="Destinations Around The World"/)
  assert.match(homepage, /import \{ BrowsePlaces \} from '@\/components\/sections\/browse-places'/)

  const route = read('src/app/(frontend)/page.tsx')
  assert.match(route, /<BlockRenderer blocks=\{page\.blocks\} homepage \/>/)
  assert.match(route, /<HomeFallback \/>/)
  for (const file of [
    'src/components/blocks/block-renderer.tsx',
    'src/components/views/home-fallback.tsx',
  ]) {
    assert.match(read(file), /HomepageDestinations/, `${file} must render the shared homepage sections`)
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
