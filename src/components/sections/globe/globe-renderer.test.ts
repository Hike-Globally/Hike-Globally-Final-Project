import assert from 'node:assert/strict'
import { test } from 'node:test'

import { LAND_DOT_DATA } from './globe-data'
import { drawGlobe, GLOBE_INITIAL_YAW, GLOBE_TILT, type GlobeView } from './globe-renderer'

const SIZE = 448
const DEG = Math.PI / 180

/**
 * Stands in for a 2D canvas context: records nothing, but has to answer every
 * call `drawGlobe` makes (gradients included) so the real projection and
 * occlusion code runs unmodified under Node.
 */
function createFakeContext() {
  const gradient = { addColorStop() {} }
  const calls = { arcs: 0, strokes: 0, fills: 0 }

  const context = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    clearRect() {},
    createRadialGradient: () => gradient,
    beginPath() {},
    arc() {
      calls.arcs += 1
    },
    moveTo() {},
    lineTo() {},
    fill() {
      calls.fills += 1
    },
    stroke() {
      calls.strokes += 1
    },
  }

  return { context: context as unknown as CanvasRenderingContext2D, calls }
}

function draw(overrides: Partial<GlobeView> = {}) {
  const { context, calls } = createFakeContext()
  const markers = drawGlobe(context, {
    width: SIZE,
    height: SIZE,
    yaw: GLOBE_INITIAL_YAW,
    tilt: GLOBE_TILT,
    time: 0,
    ...overrides,
  })
  return { markers, calls }
}

const marker = (markers: ReturnType<typeof draw>['markers'], id: string) =>
  markers.find((entry) => entry.id === id)

test('packed land dots decode to valid 0.1° coordinates', () => {
  assert.ok(LAND_DOT_DATA.length > 4000, 'expected a dense dot field')

  for (const packed of LAND_DOT_DATA) {
    const latIndex = Math.floor(packed / 3600)
    const lngIndex = packed % 3600

    assert.ok(latIndex >= 0 && latIndex <= 1800, `${packed} decodes above +90° / below -90°`)
    assert.ok(lngIndex >= 0 && lngIndex < 3600, `${packed} decodes outside ±180°`)
  }
})

test('the default view puts the Himalaya front and centre and hides the far side', () => {
  const { markers } = draw()

  const nepal = marker(markers, 'nepal')
  assert.ok(nepal, 'Nepal should be visible in the opening view')
  assert.ok(nepal.depth > 0.7, 'Nepal should sit well inside the horizon')
  assert.ok(nepal.x > SIZE * 0.55 && nepal.x < SIZE, 'Nepal should sit in the eastern half')

  assert.equal(marker(markers, 'peru'), undefined, 'Peru is on the far side of the opening view')
  assert.equal(marker(markers, 'patagonia'), undefined)
})

test('markers behind the horizon are dropped, never wrapped to the near side', () => {
  const { markers } = draw({ yaw: 0, tilt: 0 })

  assert.ok(marker(markers, 'tanzania'), 'Tanzania faces the viewer at zero yaw')
  assert.equal(marker(markers, 'japan'), undefined, 'Japan is antimeridian-adjacent of the view')
  assert.equal(marker(markers, 'new-zealand'), undefined)

  for (const entry of markers) {
    assert.ok(entry.depth > 0.02, `${entry.id} was reported while behind the horizon`)
    assert.ok(entry.x >= 0 && entry.x <= SIZE)
    assert.ok(entry.y >= 0 && entry.y <= SIZE)
  }
})

test('yaw rotates the requested longitude to the centre line', () => {
  // Tanzania sits at 35.7°E: spinning the globe by -35.7° should face it to us.
  const { markers } = draw({ yaw: -35.7 * DEG, tilt: 0 })
  const tanzania = marker(markers, 'tanzania')

  assert.ok(tanzania)
  assert.ok(Math.abs(tanzania.x - SIZE / 2) < 1, 'expected it on the vertical centre line')
  assert.ok(tanzania.depth > 0.99)
  assert.ok(tanzania.y > SIZE / 2, 'a southern latitude should sit below the equator')
})

test('tilting the north pole toward the viewer exposes it and hides the south cap', () => {
  const northUp = draw({ tilt: 1.2 }).markers
  const southUp = draw({ tilt: -1.2 }).markers

  assert.ok(marker(northUp, 'iceland'), 'Iceland is visible at full northern tilt')
  assert.ok(!marker(southUp, 'iceland'), 'Iceland falls behind the horizon when tilted away')
})

test('a zero-size canvas is a no-op rather than a crash', () => {
  const { markers, calls } = draw({ width: 0, height: 0 })

  assert.deepEqual(markers, [])
  assert.equal(calls.fills, 0)
})
