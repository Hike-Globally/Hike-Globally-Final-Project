import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PLACE_CATEGORY_VALUES,
  PLACE_INDEX_PATH,
  getPlaceCategory,
  isPlaceCategoryValue,
  placeCategories,
  placeCategoryMedia,
  placeCategoryOptions,
  placeCategoryPath,
  placeCategoryPaths,
  resolvePlaceCategories,
} from './place-categories'

test('the nine Browse Places categories are the exact requested taxonomy', () => {
  assert.deepEqual(PLACE_CATEGORY_VALUES, [
    'lakes',
    'waterfalls',
    'mountain-passes',
    'canyons',
    'base-camps',
    'caves',
    'bike-tours',
    'mountain-peaks',
    'temples',
  ])
  assert.equal(placeCategories.length, 9)
  assert.deepEqual(
    placeCategories.map((category) => category.label),
    [
      'Lakes',
      'Waterfalls',
      'Mountain Passes',
      'Canyons',
      'Base Camps',
      'Caves',
      'Bike Tours',
      'Mountain Peaks',
      'Temples',
    ],
  )
  for (const category of placeCategories) {
    assert.ok(category.image.startsWith('/images/places/'))
    assert.ok(category.alt.length > 20)
    assert.ok(category.description.length > 20)
    assert.ok(category.intro.length > 80)
  }
})

test('category paths, options and static media stay in one canonical shape', () => {
  assert.equal(PLACE_INDEX_PATH, '/places')
  assert.deepEqual(placeCategoryPaths(), [
    '/places/lakes',
    '/places/waterfalls',
    '/places/mountain-passes',
    '/places/canyons',
    '/places/base-camps',
    '/places/caves',
    '/places/bike-tours',
    '/places/mountain-peaks',
    '/places/temples',
  ])
  assert.equal(placeCategoryPath('temples'), '/places/temples')
  assert.deepEqual(placeCategoryOptions, placeCategories.map(({ label, value }) => ({ label, value })))

  const media = placeCategoryMedia(placeCategories[0]!)
  assert.equal(media.url, '/images/places/lakes.jpg')
  assert.equal(media.alt, placeCategories[0]!.alt)
  assert.equal(media.width, 1200)
  assert.equal(media.height, 1600)
})

test('unknown CMS values are ignored instead of producing broken place links', () => {
  assert.equal(isPlaceCategoryValue('lakes'), true)
  assert.equal(isPlaceCategoryValue('huts'), false)
  assert.equal(getPlaceCategory('mountain-peaks')?.label, 'Mountain Peaks')
  assert.equal(getPlaceCategory('castles'), null)
  assert.deepEqual(
    resolvePlaceCategories(['caves', 'unknown', 'temples', 7]).map((category) => category.value),
    ['caves', 'temples'],
  )
  assert.deepEqual(resolvePlaceCategories(null), [])
})
