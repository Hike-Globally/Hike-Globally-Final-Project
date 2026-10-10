import assert from 'node:assert/strict'
import test from 'node:test'

import { getArticleHeadings } from './article-headings'

test('extracts h2 and h3 headings with stable, unique anchor IDs', () => {
  const headings = getArticleHeadings({
    root: {
      children: [
        {
          type: 'heading',
          tag: 'h2',
          children: [{ type: 'text', text: 'Before the climb' }],
        },
        {
          type: 'heading',
          tag: 'h3',
          children: [
            { type: 'text', text: 'Finding ' },
            { type: 'text', text: 'your pace' },
          ],
        },
        {
          type: 'heading',
          tag: 'h2',
          children: [{ type: 'text', text: 'Before the climb' }],
        },
        {
          type: 'heading',
          tag: 'h4',
          children: [{ type: 'text', text: 'Not part of the outline' }],
        },
      ],
    },
  })

  assert.deepEqual(headings, [
    { id: 'story-before-the-climb', label: 'Before the climb', level: 2 },
    { id: 'story-finding-your-pace', label: 'Finding your pace', level: 3 },
    { id: 'story-before-the-climb-2', label: 'Before the climb', level: 2 },
  ])
})

test('normalizes unicode labels and reserves stable IDs for empty headings', () => {
  const headings = getArticleHeadings({
    root: {
      children: [
        { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Café & ice' }] },
        { type: 'heading', tag: 'h2', children: [{ type: 'text', text: '   ' }] },
        { type: 'paragraph', children: [{ type: 'text', text: 'Not a heading' }] },
        { type: 'heading', children: [{ type: 'text', text: 'Default level two' }] },
      ],
    },
  })

  assert.deepEqual(headings, [
    { id: 'story-cafe-ice', label: 'Café & ice', level: 2 },
    { id: 'story-section-2', label: '', level: 2 },
    { id: 'story-default-level-two', label: 'Default level two', level: 2 },
  ])
  assert.deepEqual(getArticleHeadings(null), [])
  assert.deepEqual(getArticleHeadings({}), [])
})
