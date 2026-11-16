import assert from 'node:assert/strict'
import test from 'node:test'

import {
  clearTripFilterSearch,
  isSeason,
  isTripType,
  readDestinationFromSearch,
  readSeasonFromSearch,
  readTripTypeFromSearch,
  seasonLabel,
  tripTypeLabel,
  tripsByDestinationPath,
  tripsBySeasonPath,
  tripsByTypePath,
  writeDestinationSearch,
  writeSeasonSearch,
  writeTripTypeSearch,
} from './trip-filters'

test('destination query param reads ?destination= and legacy ?region= and validates slugs', () => {
  const known = new Set(['khumbu', 'annapurna', 'langtang'])

  assert.equal(readDestinationFromSearch('', known), 'all')
  assert.equal(readDestinationFromSearch('?destination=khumbu', known), 'khumbu')
  assert.equal(readDestinationFromSearch('?region=annapurna', known), 'annapurna')
  assert.equal(readDestinationFromSearch('?destination=khumbu&region=annapurna', known), 'khumbu')
  assert.equal(readDestinationFromSearch('?destination=unknown', known), 'all')
  assert.equal(readDestinationFromSearch('?destination=unknown'), 'unknown')
})

test('writeDestinationSearch updates destination while preserving other params and clearing legacy region', () => {
  assert.equal(writeDestinationSearch('', 'khumbu'), '?destination=khumbu')
  assert.equal(
    writeDestinationSearch('?difficulty=moderate&region=annapurna', 'langtang'),
    '?difficulty=moderate&destination=langtang',
  )
  assert.equal(writeDestinationSearch('?difficulty=moderate&destination=khumbu', 'all'), '?difficulty=moderate')
})

test('season query param validates and round-trips cleanly', () => {
  assert.equal(isSeason('spring'), true)
  assert.equal(isSeason('autumn'), true)
  assert.equal(isSeason('monsoon'), false)
  assert.equal(seasonLabel('autumn'), 'Autumn')

  assert.equal(readSeasonFromSearch('?season=autumn'), 'autumn')
  assert.equal(readSeasonFromSearch('?season=monsoon'), 'all')
  assert.equal(writeSeasonSearch('?destination=khumbu', 'spring'), '?destination=khumbu&season=spring')
  assert.equal(writeSeasonSearch('?destination=khumbu&season=spring', 'all'), '?destination=khumbu')
})

test('trip type query param validates and round-trips cleanly', () => {
  assert.equal(isTripType('peak-climbing'), true)
  assert.equal(isTripType('expedition'), true)
  assert.equal(isTripType('safari'), false)
  assert.equal(tripTypeLabel('peak-climbing'), 'Peak climbing')

  assert.equal(readTripTypeFromSearch('?type=expedition'), 'expedition')
  assert.equal(readTripTypeFromSearch('?type=safari'), 'all')
  assert.equal(writeTripTypeSearch('?season=autumn', 'cultural'), '?season=autumn&type=cultural')
  assert.equal(writeTripTypeSearch('?season=autumn&type=cultural', 'all'), '?season=autumn')
})

test('clearTripFilterSearch clears all filter params without dropping unrelated query keys', () => {
  assert.equal(
    clearTripFilterSearch('?difficulty=moderate&destination=khumbu&season=autumn&type=trekking&utm_source=nav'),
    '?utm_source=nav',
  )
  assert.equal(clearTripFilterSearch('?region=annapurna&difficulty=easy'), '')
})

test('deep-link builders produce stable /trips query URLs', () => {
  assert.equal(tripsByDestinationPath('khumbu'), '/trips?destination=khumbu')
  assert.equal(tripsBySeasonPath('autumn'), '/trips?season=autumn')
  assert.equal(tripsByTypePath('peak-climbing'), '/trips?type=peak-climbing')
})
