import assert from 'node:assert/strict'
import { test } from 'node:test'

import { resolveTripAudience, tripAudienceDefaults } from './trip-audience'

const copy = (text: string) => ({
  root: { children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] },
})
const emptyEditor = { root: { children: [{ type: 'paragraph', children: [{ text: ' ' }] }] } }

test('trip audience: nothing filled in renders nothing', () => {
  assert.deepEqual(resolveTripAudience({}), [])
  assert.deepEqual(
    resolveTripAudience({
      tripForHeading: 'Heading without copy',
      tripForDescription: emptyEditor,
      tripNotForDescription: null,
    }),
    [],
  )
})

test('trip audience: blank headings fall back to the default wording, "for" first', () => {
  const cards = resolveTripAudience({
    tripForHeading: '   ',
    tripForDescription: copy('Fit walkers'),
    tripNotForHeading: null,
    tripNotForDescription: copy('Anyone after hotel comfort'),
  })
  assert.deepEqual(
    cards.map(({ kind, heading }) => [kind, heading]),
    [
      ['for', tripAudienceDefaults.forHeading],
      ['not-for', tripAudienceDefaults.notForHeading],
    ],
  )
})

test('trip audience: custom headings are trimmed and each side shows on its own', () => {
  const cards = resolveTripAudience({
    tripNotForHeading: '  Maybe skip this one if…  ',
    tripNotForDescription: copy('You dislike early starts'),
  })
  assert.equal(cards.length, 1)
  assert.equal(cards[0].kind, 'not-for')
  assert.equal(cards[0].heading, 'Maybe skip this one if…')
})
