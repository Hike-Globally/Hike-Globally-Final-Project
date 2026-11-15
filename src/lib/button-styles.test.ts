import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { buttonVariants } from '../components/ui/button'
import { cn } from './utils'

const rootDir = process.cwd()

function readWorkspaceFile(relPath: string): string {
  return readFileSync(path.join(rootDir, relPath), 'utf8')
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const channels = [0, 2, 4].map((idx) => {
    const srgb = Number.parseInt(clean.slice(idx, idx + 2), 16) / 255
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex)
  const l2 = relativeLuminance(bgHex)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

test('Button variants enforce 7px border-radius on all sides and distinct semantic fills', () => {
  const variants = [
    'default',
    'sage',
    'paper',
    'haze',
    'outline',
    'outline-light',
    'ghost',
    'link',
    'destructive',
  ] as const

  const sizes = ['default', 'sm', 'lg', 'icon'] as const
  for (const variant of variants) {
    for (const size of sizes) {
      const classes = cn(buttonVariants({ variant, size }))
      assert.ok(classes.split(' ').includes('rounded-[7px]'), `${variant}/${size} must include rounded-[7px]`)
      assert.doesNotMatch(classes, /#206CA4/i, `${variant} must not fall back to flat #206CA4`)
    }
  }

  assert.match(cn(buttonVariants({ variant: 'default' })), /\bbg-btn-primary\b/)
  assert.match(cn(buttonVariants({ variant: 'sage' })), /\bbg-btn-accent\b/)
  assert.match(cn(buttonVariants({ variant: 'paper' })), /\bbg-paper\b/)
  assert.match(cn(buttonVariants({ variant: 'outline' })), /\bborder-ink\/25\b/)
  assert.match(cn(buttonVariants({ variant: 'outline-light' })), /\bborder-white\/45\b/)
})

test('cn() preserves button text colors alongside custom typography scale classes', () => {
  const defaultLg = cn(buttonVariants({ variant: 'default', size: 'lg' }))
  assert.match(defaultLg, /\btext-white\b/)
  assert.match(defaultLg, /\btext-ui\b/)

  const sageSm = cn(buttonVariants({ variant: 'sage', size: 'sm' }))
  assert.match(sageSm, /\btext-white\b/)
  assert.match(sageSm, /\btext-small\b/)

  const ctaPaper = cn(
    buttonVariants({ variant: 'paper', size: 'lg', className: 'cta-card__button text-body' }),
  )
  assert.match(ctaPaper, /\btext-ink\b/)
  assert.match(ctaPaper, /\btext-body\b/)
})

test('Button CSS tokens define 7px radius and meet WCAG AA contrast', () => {
  const globalsCss = readWorkspaceFile('src/app/(frontend)/globals.css')
  assert.match(globalsCss, /--radius-button:\s*7px;/)

  const tokenMatches = new Map<string, string>()
  for (const match of globalsCss.matchAll(/(--color-btn-[a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    tokenMatches.set(match[1], match[2])
  }

  const primary = tokenMatches.get('--color-btn-primary')
  const primaryHover = tokenMatches.get('--color-btn-primary-hover')
  const accent = tokenMatches.get('--color-btn-accent')
  const accentHover = tokenMatches.get('--color-btn-accent-hover')

  assert.ok(primary && contrastRatio('#ffffff', primary) >= 4.5, 'primary button AA contrast')
  assert.ok(
    primaryHover && contrastRatio('#ffffff', primaryHover) >= 4.5,
    'primary hover AA contrast',
  )
  assert.ok(accent && contrastRatio('#ffffff', accent) >= 4.5, 'accent button AA contrast')
  assert.ok(accentHover && contrastRatio('#ffffff', accentHover) >= 4.5, 'accent hover AA contrast')
})

test('Custom CSS and Payload admin button styles use 7px border-radius', () => {
  const pillNavCss = readWorkspaceFile('src/components/layout/pill-nav.css')
  assert.match(pillNavCss, /\.pn-cta\s*\{[\s\S]*?border-radius:\s*var\(--radius-button\);/)
  assert.match(pillNavCss, /\.pn-burger\s*\{[\s\S]*?border-radius:\s*var\(--radius-button\);/)
  assert.match(pillNavCss, /\.pn-expand\s*\{[\s\S]*?border-radius:\s*var\(--radius-button\);/)

  const infoCss = readWorkspaceFile('src/app/(frontend)/information.css')
  assert.match(infoCss, /\.info-button\s*\{[\s\S]*?border-radius:\s*var\(--radius-button\);/)

  const packingCss = readWorkspaceFile('src/components/sections/trip-packing-section.css')
  assert.match(
    packingCss,
    /#packing-list\s+\.packing-reset\s*\{[\s\S]*?border-radius:\s*var\(--radius-button\);/,
  )

  const adminThemeCss = readWorkspaceFile('src/app/(payload)/admin-theme.css')
  assert.match(adminThemeCss, /--hg-radius-control:\s*7px;/)
})
