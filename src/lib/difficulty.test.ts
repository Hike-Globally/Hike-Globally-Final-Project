/**
 * Difficulty scale — CMS options, homepage slider cards and the /trips deep-link all read from
 * the same list. These tests lock the nine rungs and the query-string contract so a rename in
 * one place cannot silently desync the others.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DIFFICULTY_LEVELS,
  DIFFICULTY_QUERY_PARAM,
  DIFFICULTY_VALUES,
  difficultyLabel,
  difficultySelectOptions,
  isDifficulty,
  parseDifficultyParam,
  readDifficultyFromSearch,
  tripsByDifficultyPath,
  writeDifficultySearch,
} from './difficulty'

const expectedValues = [
  'easy',
  'easy-moderate',
  'moderate',
  'moderate-challenging',
  'challenging',
  'challenging-strenuous',
  'strenuous',
  'strenuous-extreme',
  'extreme',
] as const

test('the scale has the nine rungs the homepage slider and CMS select share', () => {
  assert.equal(DIFFICULTY_LEVELS.length, 9)
  assert.deepEqual(DIFFICULTY_VALUES, expectedValues)
  assert.deepEqual(
    DIFFICULTY_LEVELS.map((level) => level.label),
    [
      'Easy',
      'Easy - Moderate',
      'Moderate',
      'Moderate - Challenging',
      'Challenging',
      'Challenging - Strenuous',
      'Strenuous',
      'Strenuous - Extreme',
      'Extreme',
    ],
  )
})

test('CMS select options are the same values and labels, in the same order', () => {
  assert.deepEqual(
    difficultySelectOptions,
    DIFFICULTY_LEVELS.map(({ value, label }) => ({ value, label })),
  )
})

test('isDifficulty accepts every rung and rejects anything else', () => {
  for (const value of expectedValues) assert.equal(isDifficulty(value), true)
  assert.equal(isDifficulty('hard'), false)
  assert.equal(isDifficulty('Easy'), false)
  assert.equal(isDifficulty('easy_moderate'), false)
  assert.equal(isDifficulty(''), false)
  assert.equal(isDifficulty(null), false)
})

test('parseDifficultyParam only returns a rung for an exact query value', () => {
  assert.equal(parseDifficultyParam('easy-moderate'), 'easy-moderate')
  assert.equal(parseDifficultyParam('strenuous-extreme'), 'strenuous-extreme')
  assert.equal(parseDifficultyParam('hard'), null)
  assert.equal(parseDifficultyParam(null), null)
  assert.equal(parseDifficultyParam(undefined), null)
})

test('readDifficultyFromSearch hydrates the /trips filter from the query string', () => {
  assert.equal(readDifficultyFromSearch(''), 'all')
  assert.equal(readDifficultyFromSearch('?destination=khumbu'), 'all')
  assert.equal(readDifficultyFromSearch('?difficulty=easy'), 'easy')
  assert.equal(
    readDifficultyFromSearch('difficulty=moderate-challenging&sort=price-asc'),
    'moderate-challenging',
  )
  assert.equal(readDifficultyFromSearch('?difficulty=hard'), 'all')
})

test('writeDifficultySearch sets, replaces and clears the difficulty param without dropping others', () => {
  assert.equal(writeDifficultySearch('', 'easy'), '?difficulty=easy')
  assert.equal(writeDifficultySearch('?difficulty=easy', 'challenging'), '?difficulty=challenging')
  assert.equal(writeDifficultySearch('?difficulty=easy', 'all'), '')
  assert.equal(
    writeDifficultySearch('?destination=khumbu', 'strenuous'),
    '?destination=khumbu&difficulty=strenuous',
  )
  assert.equal(
    writeDifficultySearch('?destination=khumbu&difficulty=easy', 'all'),
    '?destination=khumbu',
  )
})

test('slider cards deep-link at /trips?difficulty=<rung>', () => {
  assert.equal(DIFFICULTY_QUERY_PARAM, 'difficulty')
  assert.equal(tripsByDifficultyPath('easy'), '/trips?difficulty=easy')
  assert.equal(tripsByDifficultyPath('easy-moderate'), '/trips?difficulty=easy-moderate')
  assert.equal(
    tripsByDifficultyPath('challenging-strenuous'),
    '/trips?difficulty=challenging-strenuous',
  )
})

test('difficultyLabel falls back to the raw value when the rung is unknown', () => {
  assert.equal(difficultyLabel('moderate'), 'Moderate')
  assert.equal(difficultyLabel('easy-moderate'), 'Easy - Moderate')
  assert.equal(difficultyLabel('custom'), 'custom')
})
