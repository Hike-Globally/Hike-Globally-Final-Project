import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  formatCoordinates,
  hasCoordinates,
  mapEmbedUrl,
  mapPageUrl,
  mapViewport,
  parseCoordinates,
} from './coordinates'

test('coordinates: a complete pair parses; missing, malformed or out-of-range halves do not', () => {
  assert.deepEqual(parseCoordinates({ latitude: 27.7172, longitude: 85.324 }), {
    latitude: 27.7172,
    longitude: 85.324,
  })

  for (const input of [
    null,
    undefined,
    {},
    { latitude: 27.7 },
    { latitude: 27.7, longitude: null },
    { latitude: Number.NaN, longitude: 85 },
    { latitude: 91, longitude: 85 },
    { latitude: -90.5, longitude: 85 },
    { latitude: 27.7, longitude: 180.5 },
    { latitude: '27.7' as unknown as number, longitude: 85 },
  ]) {
    assert.equal(parseCoordinates(input), null, `${JSON.stringify(input)} has no usable pin`)
  }
})

test('coordinates: 0 is a real coordinate, not "empty"', () => {
  // The equator and the Greenwich meridian must keep their maps. A truthiness check loses these.
  assert.deepEqual(parseCoordinates({ latitude: 0, longitude: 30 }), { latitude: 0, longitude: 30 })
  assert.deepEqual(parseCoordinates({ latitude: 51.48, longitude: 0 }), {
    latitude: 51.48,
    longitude: 0,
  })
  assert.equal(hasCoordinates({ latitude: 0, longitude: 30 }), true)
  assert.equal(hasCoordinates({ latitude: -0, longitude: -0 }), false, '0,0 is Null Island')
})

test('coordinates: the viewport centres on the pin and spans half as much at each zoom level', () => {
  const coords = { latitude: 27.7172, longitude: 85.324 }
  const region = mapViewport({ coords })
  const [minLon, minLat, maxLon, maxLat] = region.bbox

  assert.equal(region.zoom, 5)
  assert.equal(minLon + (maxLon - minLon) / 2, coords.longitude)
  assert.equal(minLat + (maxLat - minLat) / 2, coords.latitude)
  assert.equal(maxLon - minLon, 360 / 2 ** 5)

  // Three levels further in is eight times narrower (2³).
  const closer = mapViewport({ coords, zoom: 8 })
  assert.equal(closer.bbox[2] - closer.bbox[0], (maxLon - minLon) / 8)

  // Out-of-range input falls back instead of emitting a broken bbox.
  assert.equal(mapViewport({ coords, zoom: 99 }).zoom, 12)
  assert.equal(mapViewport({ coords, zoom: 0 }).zoom, 1)
  assert.equal(mapViewport({ coords, zoom: Number.NaN }).zoom, 5)
})

test('coordinates: the viewport never leaves the Web Mercator world', () => {
  const north = mapViewport({ coords: { latitude: 78, longitude: 15 }, zoom: 3 })
  assert.equal(north.bbox[3], 85.05, 'north edge clamps at 85.05°')

  const south = mapViewport({ coords: { latitude: -78, longitude: 15 }, zoom: 3 })
  assert.equal(south.bbox[1], -85.05, 'south edge clamps at -85.05°')
})

test('coordinates: the embed URL frames the pin, marker in lat,lon and bbox in lon,lat', () => {
  const url = new URL(
    mapEmbedUrl({
      coords: { latitude: 27.9881, longitude: 86.925 },
      label: 'Everest Base Camp & Kala Patthar',
    }),
  )

  assert.equal(url.origin + url.pathname, 'https://www.openstreetmap.org/export/embed.html')
  assert.equal(url.searchParams.get('layer'), 'mapnik')
  assert.equal(url.searchParams.get('marker'), '27.9881,86.925')

  const bbox = url.searchParams.get('bbox')?.split(',').map(Number) ?? []
  assert.equal(bbox.length, 4)
  assert.ok(bbox[0]! < 86.925 && 86.925 < bbox[2]!, 'longitude is inside the horizontal span')
  assert.ok(bbox[1]! < 27.9881 && 27.9881 < bbox[3]!, 'latitude is inside the vertical span')

  // `&` would split the embed's own query parsing, so it is dropped from the popup title.
  assert.equal(url.searchParams.get('title'), 'Everest Base Camp and Kala Patthar')

  // The commas must survive unencoded: the embed splits bbox and marker on them.
  assert.match(
    mapEmbedUrl({ coords: { latitude: 1.5, longitude: 2.5 } }),
    /bbox=[-\d.]+,[-\d.]+,[-\d.]+,[-\d.]+&/,
  )
  assert.match(mapEmbedUrl({ coords: { latitude: 1.5, longitude: 2.5 } }), /marker=1\.5,2\.5$/)
  assert.doesNotMatch(mapEmbedUrl({ coords: { latitude: 1.5, longitude: 2.5 } }), /%2C/i)
})

test('coordinates: the public map page keeps OSM’s lat/lon convention and rounding', () => {
  assert.equal(
    mapPageUrl({ latitude: 27.98812345, longitude: 86.9250123 }),
    'https://www.openstreetmap.org/?mlat=27.988123&mlon=86.925012#map=9/27.988123/86.925012',
  )
})

test('coordinates: the caption is fixed-precision and copy/paste friendly', () => {
  assert.equal(formatCoordinates({ latitude: 27.7172, longitude: 85.324 }), '27.7172, 85.3240')
  assert.equal(formatCoordinates({ latitude: 0, longitude: 0 }), '0.0000, 0.0000')
  assert.equal(formatCoordinates({ latitude: 27.71728, longitude: 85.32 }, 2), '27.72, 85.32')
})
