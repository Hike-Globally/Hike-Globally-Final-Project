import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const css = readFileSync(new URL('../components/layout/pill-nav.css', import.meta.url), 'utf8')
const nav = readFileSync(new URL('../components/layout/pill-nav.tsx', import.meta.url), 'utf8')

/** Read a flat CSS rule inside a particular responsive section. */
function rule(section: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = section.match(new RegExp(`${escaped}\\s*\\{([^{}]*)\\}`))
  assert.ok(match, `missing CSS rule: ${selector}`)
  return match[1]
}

const mobileStart = css.indexOf('@media (max-width: 809.98px) {')
const shortScreenStart = css.indexOf('@media (max-width: 809.98px) and (max-height: 300px) {')
const desktopStart = css.indexOf('@media (min-width: 810px) and (max-width: 1024px) {')
const mobile = css.slice(mobileStart, shortScreenStart)
const shortScreen = css.slice(shortScreenStart, desktopStart)

test('the open mobile menu covers the viewport rather than expanding into a rounded pill', () => {
  const sheet = rule(mobile, ".pn-viewport[data-open='true']")
  assert.match(sheet, /position:\s*fixed;/)
  assert.match(sheet, /inset:\s*0;/)
  assert.match(sheet, /width:\s*100%;/)
  assert.match(sheet, /max-width:\s*none;/)
  assert.match(sheet, /height:\s*100vh;\s*height:\s*100dvh;/)
  assert.match(sheet, /background-color:\s*var\(--color-ink\);/)
  assert.match(sheet, /safe-area-inset-bottom/)

  const track = rule(mobile, ".pn-track[data-open='true']")
  assert.match(track, /width:\s*100%;/)
  assert.match(track, /border-radius:\s*0;/)
  assert.doesNotMatch(track, /316px/)
})

test('long mobile menus scroll and very short screens can also reach the CTA', () => {
  const links = rule(mobile, ".pn-track[data-open='true'] .pn-links")
  assert.match(links, /min-height:\s*0;/)
  assert.match(links, /overflow-y:\s*auto;/)
  assert.match(links, /overscroll-behavior:\s*contain;/)

  const shortTrack = rule(shortScreen, ".pn-track[data-open='true']")
  const shortLinks = rule(shortScreen, ".pn-track[data-open='true'] .pn-links")
  assert.match(shortTrack, /overflow-y:\s*auto;/)
  assert.match(shortLinks, /flex:\s*0 0 auto;/)
})

test('a moving header cannot shift the fixed sheet away from the viewport', () => {
  for (const selector of [
    ".hg-header[data-menu-open='true']",
    ".hg-header:has(.pn-track[data-open='true'])",
  ]) {
    assert.match(rule(mobile, selector), /transform:\s*none\s*!important;/)
  }
})

test('the mobile menu exposes modal semantics and releases page scrolling on close', () => {
  assert.match(nav, /role=\{mobileOpen \? 'dialog' : undefined\}/)
  assert.match(nav, /aria-modal=\{mobileOpen \? true : undefined\}/)
  assert.match(nav, /event\.key === 'Escape'/)
  assert.match(nav, /html\.style\.overflow = 'hidden'/)
  assert.match(nav, /body\.style\.overflow = 'hidden'/)
  assert.match(nav, /html\.style\.overflow = htmlOverflow/)
  assert.match(nav, /body\.style\.overflow = bodyOverflow/)
  assert.match(nav, /if \(resumeLenis\) lenis\.stop\(\)/)
  assert.match(nav, /if \(resumeLenis\) lenis\.start\(\)/)
})
