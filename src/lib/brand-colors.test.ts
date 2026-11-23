import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { BRAND } from './brand-colors'

const rootDir = process.cwd()
const read = (file: string) => readFileSync(path.join(rootDir, file), 'utf8')

const suppliedPalette = {
  paper: '#F5F0EA',
  ink: '#210516',
  haze: '#5E7993',
  earth: '#78510F',
  stone: '#BCB0B1',
  gold: '#CBAF35',
  blue: '#0393CD',
  coral: '#F53F1D',
} as const

test('the JavaScript brand palette preserves all eight supplied hex values', () => {
  const palette = Object.fromEntries(Object.entries(BRAND).filter(([name]) => name !== 'white'))
  assert.deepEqual(palette, suppliedPalette)
})

test('frontend, Payload and the site canvas stay aligned to the supplied palette', () => {
  const frontend = read('src/app/(frontend)/globals.css')
  const payload = read('src/app/(payload)/admin-theme.css')

  const frontendTokens: Record<keyof typeof suppliedPalette, string> = {
    paper: '--color-paper',
    ink: '--color-ink',
    haze: '--color-haze',
    earth: '--color-earth',
    stone: '--color-stone',
    gold: '--color-gold',
    blue: '--color-deep',
    coral: '--color-sage',
  }
  const payloadTokens: Record<keyof typeof suppliedPalette, string> = {
    paper: '--hg-paper',
    ink: '--hg-ink',
    haze: '--hg-blue-grey',
    earth: '--hg-earth',
    stone: '--hg-stone',
    gold: '--hg-gold',
    blue: '--hg-cyan',
    coral: '--hg-coral',
  }

  for (const [name, hex] of Object.entries(suppliedPalette) as [
    keyof typeof suppliedPalette,
    string,
  ][]) {
    assert.match(frontend, new RegExp(`${frontendTokens[name]}:\\s*${hex};`, 'i'))
    assert.match(payload, new RegExp(`${payloadTokens[name]}:\\s*${hex};`, 'i'))
  }

  assert.match(frontend, /--background:\s*var\(--color-paper\);/)
  assert.match(frontend, /--card:\s*var\(--color-paper\);/)
})
