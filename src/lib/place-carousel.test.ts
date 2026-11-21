import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AUTO_SCROLL_SPEED,
  MAX_FRAME_MS,
  advanceLoopPosition,
  getArrowScroll,
  getAutoScrollDelta,
  getLoopWidth,
  getSlideDistance,
  normalizeLoopPosition,
} from './place-carousel'

const track = (offsets: number[], scrollWidth = 0): HTMLElement =>
  ({
    children: offsets.map((offsetLeft) => ({ offsetLeft })),
    scrollWidth,
  }) as unknown as HTMLElement

test('auto-scroll is proportional to elapsed time but capped after a background tab', () => {
  assert.equal(getAutoScrollDelta(16), 16 * AUTO_SCROLL_SPEED)
  assert.equal(getAutoScrollDelta(1000), MAX_FRAME_MS * AUTO_SCROLL_SPEED)
  assert.equal(getAutoScrollDelta(-5), 0)
})

test('loop width measures the first duplicated card, with an unlaid-out fallback', () => {
  assert.equal(getLoopWidth(track([12, 332, 652]), 2), 640)
  assert.equal(getLoopWidth(track([0, 0], 1000), 1), 500)
  assert.equal(getLoopWidth(track([]), 9), 0)
})

test('positions wrap seamlessly in either direction', () => {
  assert.equal(normalizeLoopPosition(650, 640), 10)
  assert.equal(normalizeLoopPosition(-10, 640), 630)
  assert.equal(normalizeLoopPosition(Number.NaN, 640), 0)
  assert.equal(normalizeLoopPosition(80, 0), 80)
  assert.equal(advanceLoopPosition(630, 20, 640), 10)
})

test('one arrow step is one card plus its gap, respecting direction and safe defaults', () => {
  assert.equal(getSlideDistance(300, 20, 1), 320)
  assert.equal(getSlideDistance(300, 20, -1), -320)
  assert.equal(getSlideDistance(300, 20, 2), 640)
  assert.equal(getSlideDistance(0, Number.NaN, 1), 340)
})

test('arrow navigation prepares negative wraps and never animates backwards across the track', () => {
  assert.deepEqual(getArrowScroll(20, -320, 640), { prepared: 660, target: 340 })
  assert.deepEqual(getArrowScroll(600, 320, 640), { prepared: 600, target: 920 })
  assert.deepEqual(getArrowScroll(Number.NaN, 320, 0), { prepared: 0, target: 320 })
})
