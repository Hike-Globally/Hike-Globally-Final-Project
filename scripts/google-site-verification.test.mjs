import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

// Next.js serves public/<filename> at /<filename>, without a page layout or template.
test('Google Search Console verification file is published at the required root URL', () => {
  const filename = 'google782816e92a96df19.html'
  const content = readFileSync(new URL(`../public/${filename}`, import.meta.url), 'utf8')
  assert.equal(content, `google-site-verification: ${filename}`)
})

test('the public root layout includes the exact Google verification meta tag in head before body', () => {
  const layout = readFileSync(new URL('../src/app/(frontend)/layout.tsx', import.meta.url), 'utf8')
  const headStart = layout.lastIndexOf('<head>')
  const headEnd = layout.lastIndexOf('</head>')
  const bodyStart = layout.indexOf('<body ')
  assert.ok(headStart >= 0 && headEnd > headStart && bodyStart > headEnd)
  const head = layout.slice(headStart, headEnd)
  assert.match(head, /<meta\s+name="google-site-verification"\s+content="ifr0lQC0vSpJEnOHwV3BpQ6Zk4uYFFdI5tpkK0H7UG0"\s*\/>/)
  assert.equal((layout.match(/name="google-site-verification"/g) ?? []).length, 1)
})
