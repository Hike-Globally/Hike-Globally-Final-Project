import assert from 'node:assert/strict'
import test from 'node:test'

import { splitInlineEmphasis } from './inline-emphasis'

test('splits the homepage hero heading into a plain and an emphasized segment', () => {
  assert.deepEqual(splitInlineEmphasis('Walk Where The <i>Map Runs Out of Names</i>'), [
    { text: 'Walk Where The ', emphasized: false },
    { text: 'Map Runs Out of Names', emphasized: true },
  ])
})

test('keeps copy with no markup as a single plain segment', () => {
  assert.deepEqual(splitInlineEmphasis('Walk where the map runs out of names.'), [
    { text: 'Walk where the map runs out of names.', emphasized: false },
  ])
})

test('treats <em> as a synonym of <i>, and matching as case-insensitive', () => {
  assert.deepEqual(splitInlineEmphasis('Before <EM>the</EM> climb <em>begins</em>'), [
    { text: 'Before ', emphasized: false },
    { text: 'the', emphasized: true },
    { text: ' climb ', emphasized: false },
    { text: 'begins', emphasized: true },
  ])
})

test('spans newlines inside a pair', () => {
  assert.deepEqual(splitInlineEmphasis('Walk Where The\n<i>Map Runs\nOut of Names</i>'), [
    { text: 'Walk Where The\n', emphasized: false },
    { text: 'Map Runs\nOut of Names', emphasized: true },
  ])
})

test('drops whitespace-only segments', () => {
  assert.deepEqual(splitInlineEmphasis('<i>Map Runs Out of Names</i>   '), [
    { text: 'Map Runs Out of Names', emphasized: true },
  ])
})

test('removes unbalanced tags instead of rendering them literally', () => {
  assert.deepEqual(splitInlineEmphasis('Walk Where The <i>Map Runs Out of Names'), [
    { text: 'Walk Where The Map Runs Out of Names', emphasized: false },
  ])

  // Mismatched nesting: the `<i>…</i>` pair wins, the tags inside it are stray, and
  // what follows the pair is plain copy again.
  assert.deepEqual(splitInlineEmphasis('Walk Where The <i>Map <em>Runs</i> Out</em>'), [
    { text: 'Walk Where The ', emphasized: false },
    { text: 'Map Runs', emphasized: true },
    { text: ' Out', emphasized: false },
  ])
})

test('leaves every other tag alone as plain text', () => {
  assert.deepEqual(splitInlineEmphasis('5 < 6 and <script>alert(1)</script>'), [
    { text: '5 < 6 and <script>alert(1)</script>', emphasized: false },
  ])
})

test('yields no segments for empty, null and undefined values', () => {
  assert.deepEqual(splitInlineEmphasis(''), [])
  assert.deepEqual(splitInlineEmphasis('   '), [])
  assert.deepEqual(splitInlineEmphasis(null), [])
  assert.deepEqual(splitInlineEmphasis(undefined), [])
})

test('is reusable — a shared global regex keeps no lastIndex between calls', () => {
  const value = 'Walk Where The <i>Map Runs Out of Names</i>'
  assert.deepEqual(splitInlineEmphasis(value), splitInlineEmphasis(value))
})
