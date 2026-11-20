import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

// Next.js serves public/<filename> at /<filename>, without a page layout or template.
test('Google Search Console verification file is published at the required root URL', () => {
  const filename = 'google782816e92a96df19.html'
  const content = readFileSync(new URL(`../public/${filename}`, import.meta.url), 'utf8')
  assert.equal(content, `google-site-verification: ${filename}`)
})
