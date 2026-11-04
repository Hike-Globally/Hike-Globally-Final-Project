import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hasRichTextContent } from './rich-text-content'

test('empty editors do not display a content section', () => {
  for (const value of [
    null,
    undefined,
    {},
    { root: { children: [] } },
    { root: { children: [{ type: 'paragraph', children: [{ text: '  ' }] }] } },
  ]) {
    assert.equal(hasRichTextContent(value), false)
  }
})

test('copy, departure tables and uploaded images make a section visible', () => {
  for (const node of [
    { type: 'paragraph', children: [{ text: 'Local expert guides' }] },
    {
      type: 'table',
      children: [
        {
          type: 'tablerow',
          children: [
            {
              type: 'tablecell',
              children: [{ type: 'paragraph', children: [{ text: 'April 2027' }] }],
            },
          ],
        },
      ],
    },
    { type: 'upload', value: { id: 1 } },
  ]) {
    assert.equal(hasRichTextContent({ root: { children: [node] } }), true)
  }
})
