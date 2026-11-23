import assert from 'node:assert/strict'
import { test } from 'node:test'

import { LAND_DOT_DATA } from './globe-data'
import { drawGlobe, GLOBE_INITIAL_YAW, GLOBE_TILT, type GlobeView } from './globe-renderer'

const SIZE = 448
const DEG = Math.PI / 180

type FakeGradient = {
  /** Outer radius (`r1`) the gradient was created with. */
  outerRadius: number
  stops: [offset: number, colour: string][]
  addColorStop: (offset: number, colour: string) => void
}

/**
 * Stands in for a 2D canvas context: has to answer every call `drawGlobe`
 * makes (gradients included) so the real projection and occlusion code runs
 * unmodified under Node. It also records gradient geometry/stops and arc
 * radii, so tests can prove the transparency contract below.
 */
function createFakeContext() {
  const calls = { arcs: 0, strokes: 0, fills: 0, fillRects: 0, clears: 0 }
  const gradients: FakeGradient[] = []
  const arcRadii: number[] = []

  const context = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    clearRect() {
      calls.clears += 1
    },
    fillRect() {
      calls.fillRects += 1
    },
    createRadialGradient: (
      _x0: number,
      _y0: number,
      _r0: number,
      _x1: number,
      _y1: number,
      r1: number,
    ) => {
      const gradient: FakeGradient = {
        outerRadius: r1,
        stops: [],
        addColorStop(offset, colour) {
          gradient.stops.push([offset, colour])
        },
      }
      gradients.push(gradient)
      return gradient
    },
    beginPath() {},
    arc(_x: number, _y: number, radius: number) {
      calls.arcs += 1
      arcRadii.push(radius)
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

  return {
    context: context as unknown as CanvasRenderingContext2D,
    calls,
    gradients,
    arcRadii,
  }
}

function draw(overrides: Partial<GlobeView> = {}) {
  const { context, calls, gradients, arcRadii } = createFakeContext()
  const markers = drawGlobe(context, {
    width: SIZE,
    height: SIZE,
    yaw: GLOBE_INITIAL_YAW,
    tilt: GLOBE_TILT,
    time: 0,
    ...overrides,
  })
  return { markers, calls, gradients, arcRadii }
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

test('the canvas stays transparent outside the sphere — no background wash reaches the edge', () => {
  // Regression: the atmosphere used to extend to 1.5× the sphere radius,
  // beyond the square canvas edge, where the browser clipped it mid-fade and
  // left a straight, contrasting line behind the globe.
  const { calls, gradients, arcRadii } = draw()
  const sphereRadius = (SIZE * 0.79) / 2

  assert.equal(calls.fillRects, 0, 'nothing may paint a full-canvas background rectangle')
  assert.ok(calls.clears >= 1, 'each frame is cleared to fully transparent')

  // The atmosphere is the first gradient drawn (before the ocean disc).
  const atmosphere = gradients[0]
  assert.ok(atmosphere, 'expected the atmosphere gradient to be drawn')
  assert.ok(
    atmosphere.outerRadius > sphereRadius,
    'the atmosphere should still glow just beyond the limb',
  )
  assert.ok(
    atmosphere.outerRadius < SIZE / 2,
    `the atmosphere must finish fading inside the canvas (r=${atmosphere.outerRadius}, edge=${SIZE / 2})`,
  )

  const lastStop = atmosphere.stops.at(-1)
  assert.ok(lastStop, 'expected the atmosphere to define colour stops')
  assert.ok(
    /,\s*0\)$/.test(lastStop[1]),
    `the atmosphere must fade to fully transparent, got "${lastStop[1]}"`,
  )
  assert.ok(
    atmosphere.stops.every(([, colour]) => colour.startsWith('rgba(94, 121, 147')),
    'the atmosphere is haze-only — no second wash tinting the square behind the globe',
  )

  // The painted discs themselves (atmosphere + ocean) are the largest arcs;
  // neither may touch the canvas edge, or it would be clipped into a line.
  assert.ok(Math.max(...arcRadii) < SIZE / 2, 'no painted disc may be clipped by the canvas edge')
})

test('a zero-size canvas is a no-op rather than a crash', () => {
  const { markers, calls } = draw({ width: 0, height: 0 })

  assert.deepEqual(markers, [])
  assert.equal(calls.fills, 0)
})
