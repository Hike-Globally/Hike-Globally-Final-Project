import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { faviconIcons } from './favicon'

const repoRoot = path.resolve(import.meta.dirname, '../..')
const asset = (url: string) => readFileSync(path.join(repoRoot, 'public', url))
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

test('the favicon uses the existing brand mark on a square, light backing', () => {
  const svg = asset('/favicon.svg').toString('utf8')
  const logo = asset('/images/logo.svg').toString('utf8')

  assert.match(svg, /viewBox="0 0 64 64"/)
  assert.match(svg, /<rect width="64" height="64"[^>]*fill="#F6F6F6"/)
  for (const [geometry] of logo.matchAll(/<path\b[^>]*\/>/g)) {
    assert.ok(svg.includes(geometry), 'the favicon must retain the original logo geometry')
  }
})

test('the ICO contains valid 16, 32 and 48 pixel fallback images', () => {
  const ico = asset('/favicon.ico')
  assert.equal(ico.readUInt16LE(0), 0)
  assert.equal(ico.readUInt16LE(2), 1)
  assert.equal(ico.readUInt16LE(4), 3)

  const sizes = []
  for (let index = 0; index < 3; index += 1) {
    const entry = 6 + index * 16
    const size = ico.readUInt8(entry)
    assert.equal(ico.readUInt8(entry + 1), size)
    const bytes = ico.readUInt32LE(entry + 8)
    const offset = ico.readUInt32LE(entry + 12)
    const image = ico.subarray(offset, offset + bytes)
    assert.ok(image.subarray(0, 8).equals(pngSignature))
    assert.equal(image.readUInt32BE(16), size)
    assert.equal(image.readUInt32BE(20), size)
    sizes.push(size)
  }
  assert.deepEqual(sizes, [16, 32, 48])
})

test('the Apple touch icon is a 180 pixel PNG', () => {
  const png = asset('/apple-touch-icon.png')
  assert.ok(png.subarray(0, 8).equals(pngSignature))
  assert.equal(png.readUInt32BE(16), 180)
  assert.equal(png.readUInt32BE(20), 180)
})

test('every declared icon exists and both apps share the same icon metadata', () => {
  for (const icon of [...faviconIcons.icon, ...faviconIcons.apple]) {
    assert.ok(asset(String(icon.url)).length > 0)
  }

  const frontend = readFileSync(path.join(repoRoot, 'src/app/(frontend)/layout.tsx'), 'utf8')
  const payload = readFileSync(path.join(repoRoot, 'src/payload.config.ts'), 'utf8')
  for (const source of [frontend, payload]) {
    assert.match(source, /import \{ faviconIcons \} from '(?:@\/lib|\.\/lib)\/favicon'/)
    assert.match(source, /icons:\s*faviconIcons/)
  }
})

test('the search icon is a 192 pixel PNG rendered from the same mark', () => {
  // Google shows a favicon beside a result only for a square icon whose size is a multiple of
  // 48px (or a valid SVG). The ICO tops out at 48 and the Apple icon is 180, so the 192px PNG is
  // the candidate that rule is about.
  const png = asset('/icon-192.png')
  assert.ok(png.subarray(0, 8).equals(pngSignature))
  assert.equal(png.readUInt32BE(16), 192)
  assert.equal(png.readUInt32BE(20), 192)

  const icons = [...faviconIcons.icon, ...faviconIcons.apple].map((icon) => String(icon.url))
  assert.ok(icons.includes('/icon-192.png'), 'the 192px icon must be declared')
  assert.ok(icons.includes('/favicon.svg'), 'the SVG stays declared for browsers')
})
