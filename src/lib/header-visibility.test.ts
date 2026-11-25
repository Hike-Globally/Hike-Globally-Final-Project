import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const frame = readFileSync(new URL('../components/layout/header-frame.tsx', import.meta.url), 'utf8')

test('moving the cursor to the top or hovering the header cannot reveal or pin it', () => {
  assert.doesNotMatch(frame, /PEEK_ZONE|setPeeking|setHovering/)
  assert.doesNotMatch(frame, /addEventListener\(['"]pointer(?:move|leave|out)/)
  assert.doesNotMatch(frame, /onPointer(?:Enter|Leave)=/)
  assert.match(frame, /const revealed = focused \|\| scrollRevealed \|\| menuOpen \|\| panelOpen/)
  assert.match(frame, /const hidden = !inHero && !revealed/)
})

test('hero visibility, touch scroll-up, focus, and open menus remain supported', () => {
  assert.match(frame, /const HERO_MARKER = '\[data-header-hero\]'/)
  assert.match(frame, /const REVEAL_ON_SCROLL_UP: .+ = 'touch'/)
  assert.match(frame, /if \(revealOnScrollUp && y < previous\) setScrollRevealed\(true\)/)
  assert.match(frame, /else if \(y > previous\) setScrollRevealed\(false\)/)
  assert.match(frame, /onFocus=\{onFocus\}/)
  assert.match(frame, /data-panel-open/)
  assert.match(frame, /inert=\{hidden\}/)
})
