import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const board = readFileSync(new URL('./blog-dispatch-board.tsx', import.meta.url), 'utf8')
const sectionCSS = readFileSync(new URL('./latest-blogs-section.css', import.meta.url), 'utf8')
const archiveCSS = readFileSync(new URL('../../app/(frontend)/blog/blog.css', import.meta.url), 'utf8')

test('homepage blog links retain inline images without a cursor-following popup', () => {
  assert.doesNotMatch(board, /lb-preview|plateEnabled|placePlate|useSpring|useMotionValue/)
  assert.doesNotMatch(board, /onPointerMove|onPointerEnter|handleRowFocus/)
  assert.doesNotMatch(sectionCSS, /lb-preview/)
  assert.match(board, /href=\{postHref\(lead\)\}/)
  assert.match(board, /href=\{postHref\(post\)\}/)
  assert.match(board, /media=\{lead\.featuredImage\}/)
  assert.match(board, /media=\{post\.featuredImage\}/)
})

test('featured archive headline uses the existing Cal Sans face at its native weight', () => {
  const rule = archiveCSS.match(/\.blog-archive-feature h2\s*\{([^}]+)\}/)?.[1]
  assert.ok(rule)
  assert.match(rule, /font-family:\s*var\(--font-cal\)/)
  assert.match(rule, /font-weight:\s*400/)
})
