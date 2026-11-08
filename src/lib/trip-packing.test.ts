import assert from 'node:assert/strict'
import test from 'node:test'

import {
  groupPackingList,
  inferPackingCategory,
  packingItemKey,
  packingProgress,
  type PackingListRow,
} from './trip-packing'

const rows = (...items: [string, string?][]): PackingListRow[] =>
  items.map(([item, category]) => ({ item, category }))

test('groups are rendered in the order the page promises', () => {
  const groups = groupPackingList(
    rows(
      ['Duffel bag', 'trekking-equipment'],
      ['Passport and permits', 'personal-items'],
      ['Down jacket', 'clothing-footwear'],
    ),
  )

  assert.deepEqual(
    groups.map((group) => group.heading),
    ['Clothing and Footwear', 'Trekking Equipment', 'Personal Items'],
  )
})

test('order inside a group follows the CMS, and blanks are dropped', () => {
  const groups = groupPackingList(
    rows(
      ['Trekking boots', 'clothing-footwear'],
      ['   ', 'clothing-footwear'],
      ['Down jacket', 'clothing-footwear'],
      ['Socks (5 pairs)', 'clothing-footwear'],
    ),
  )

  assert.equal(groups.length, 1)
  assert.deepEqual(
    groups[0].items.map(({ item }) => item),
    ['Trekking boots', 'Down jacket', 'Socks (5 pairs)'],
  )
  assert.equal(groups[0].count, 3)
})

test('an empty group is omitted rather than rendered as an empty accordion', () => {
  const groups = groupPackingList(rows(['Fleece', 'clothing-footwear']))
  assert.deepEqual(
    groups.map((group) => group.category),
    ['clothing-footwear'],
  )
})

test('legacy rows without a category are inferred, never dropped', () => {
  const groups = groupPackingList(
    rows(['Trekking boots'], ['Sleeping bag'], ['Passport, visa and insurance']),
  )

  const placed = groups.flatMap((group) =>
    group.items.map(({ item }) => [item, group.category] as const),
  )

  assert.deepEqual(placed, [
    ['Trekking boots', 'clothing-footwear'],
    ['Sleeping bag', 'trekking-equipment'],
    ['Passport, visa and insurance', 'personal-items'],
  ])
})

test('an unknown category falls back to the same keyword rules', () => {
  assert.equal(inferPackingCategory('Down jacket'), 'clothing-footwear')
  assert.equal(inferPackingCategory('Water purification tablets'), 'personal-items')
  assert.equal(inferPackingCategory('Sleeping mat'), 'trekking-equipment')
  assert.equal(inferPackingCategory('Something nobody has packed before'), 'trekking-equipment')
})

test('keyword matching is whole-word, so "capacity" is not a hat', () => {
  assert.equal(inferPackingCategory('20 litre capacity daypack'), 'trekking-equipment')
  assert.equal(inferPackingCategory('Baseball cap'), 'clothing-footwear')
})

test('item keys are unique even when an editor repeats a line', () => {
  const groups = groupPackingList(
    rows(['Spare batteries', 'personal-items'], ['Spare batteries', 'personal-items']),
  )

  const keys = groups[0].items.map((_, index) => packingItemKey(groups[0].category, index))
  assert.equal(new Set(keys).size, 2)
})

test('progress counts only keys that exist on this trip', () => {
  const groups = groupPackingList(
    rows(['Trekking boots', 'clothing-footwear'], ['Sleeping bag', 'trekking-equipment']),
  )

  assert.deepEqual(packingProgress(groups, new Set()), { total: 2, done: 0, percent: 0 })

  // A key left in localStorage by a trip whose list has since changed is ignored, not counted.
  const packed = new Set([
    packingItemKey('clothing-footwear', 0),
    packingItemKey('personal-items', 7),
  ])
  assert.deepEqual(packingProgress(groups, packed), { total: 2, done: 1, percent: 50 })

  const all = new Set([
    packingItemKey('clothing-footwear', 0),
    packingItemKey('trekking-equipment', 0),
  ])
  assert.deepEqual(packingProgress(groups, all), { total: 2, done: 2, percent: 100 })
})

test('an empty list has no groups and 0%, never NaN', () => {
  assert.deepEqual(groupPackingList(null), [])
  assert.deepEqual(groupPackingList([]), [])
  assert.deepEqual(packingProgress([], new Set()), { total: 0, done: 0, percent: 0 })
})
