/**
 * Tests for the destination copy dedupe guard.
 *
 * The contract under test: a destination page never renders the same sentence twice. The live
 * Eastern Nepal page fills its tagline, its About body and its "Getting there" field with one
 * identical sentence, so the page reads as full while saying almost nothing — and the "Getting
 * there" heading promises content the block then repeats.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { destinationCopyVisibility } from './destination-copy'

/** A Lexical document whose plain text is `text`. */
const richText = (text: string): unknown => ({
  root: {
    children: [{ type: 'paragraph', children: [{ type: 'text', text }] }],
  },
})

const EASTERN_NEPAL =
  'Explore Eastern Nepal, renowned for Mount Kanchenjunga, tea gardens, lush hills, scenic trekking trails, and rich cultural experiences.'

test('the Eastern Nepal defect: one sentence in three fields renders once', () => {
  const visibility = destinationCopyVisibility({
    tagline: EASTERN_NEPAL,
    description: richText(EASTERN_NEPAL),
    gettingThere: richText(EASTERN_NEPAL),
  })

  // The About body keeps the sentence (and its H2); the hero lead and the Getting there block go.
  assert.equal(visibility.showDescription, true)
  assert.equal(visibility.showTagline, false)
  assert.equal(visibility.showGettingThere, false)
})

test('well-written copy is untouched', () => {
  const visibility = destinationCopyVisibility({
    tagline: 'Tea gardens and Kanchenjunga.',
    description: richText('Eastern Nepal is the far side of the country, reached from Taplejung.'),
    gettingThere: richText('Fly to Bhadrapur, then drive to Taplejung over two days.'),
  })

  assert.deepEqual(visibility, {
    showTagline: true,
    showDescription: true,
    showGettingThere: true,
  })
})

test('a retyped repeat still counts as a repeat', () => {
  const visibility = destinationCopyVisibility({
    tagline: 'Eastern Nepal: tea gardens, lush hills, scenic trails!',
    description: richText('eastern nepal tea gardens lush hills scenic trails'),
  })

  assert.equal(visibility.showTagline, false)
})

test('an empty description hides the About block but not the rest', () => {
  const visibility = destinationCopyVisibility({
    tagline: 'A region page.',
    description: null,
    gettingThere: richText('Take the bus from Ilam.'),
  })

  assert.equal(visibility.showDescription, false)
  assert.equal(visibility.showGettingThere, true)
  assert.equal(visibility.showTagline, true)
})

test('a Getting there block that repeats only the About body is dropped', () => {
  const visibility = destinationCopyVisibility({
    tagline: 'Tea country.',
    description: richText('Eastern Nepal runs from the Terai to Kanchenjunga.'),
    gettingThere: richText('Eastern Nepal runs from the Terai to Kanchenjunga.'),
  })

  assert.equal(visibility.showGettingThere, false)
  assert.equal(visibility.showDescription, true)
})

test('a block with no text at all is never shown', () => {
  const visibility = destinationCopyVisibility({
    tagline: '  ',
    description: richText(''),
    gettingThere: { root: { children: [] } },
  })

  assert.deepEqual(visibility, { showTagline: false, showDescription: false, showGettingThere: false })
})
