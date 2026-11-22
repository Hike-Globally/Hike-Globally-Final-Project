import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const read = (file: string): string => readFileSync(path.join(repoRoot, file), 'utf8')

const detail = read('src/components/views/destination-detail.tsx')
const map = read('src/components/sections/destination-map.tsx')
const seo = read('src/lib/seo.ts')
const collection = read('src/collections/Destinations.ts')

test('a destination with coordinates renders the map; one without renders nothing', () => {
  // The pin is validated once, then both the hero button and the map read the result. Guards that
  // test truthiness throw away real places on the equator / prime meridian, so the source must not
  // contain that check anywhere.
  assert.match(detail, /const coordinates = parseCoordinates\(destination\.coordinates\)/)
  assert.match(detail, /\{coordinates \? \(\s*<div[^>]*>\s*<DestinationMap/)
  assert.doesNotMatch(detail, /coordinates\?\.latitude &&/)
  assert.doesNotMatch(detail, /\.latitude\s*&&/, 'no truthiness check may survive on latitude')
  assert.doesNotMatch(seo, /coordinates\?\.latitude &&/, 'structured data uses the same guard')

  // Map placement: under the copy column, inside the same section as the body text, before trips.
  const mapIndex = detail.indexOf('<DestinationMap')
  assert.ok(
    mapIndex > detail.indexOf('<RichText content={destination.description}'),
    'after the copy',
  )
  assert.ok(mapIndex < detail.indexOf('id="trips"'), 'before the trips rail')
})

test('the map is server-rendered: no client boundary, no map library, no API key', () => {
  // Column zero of line one: the module directive, not the prose that mentions it.
  assert.doesNotMatch(map, /^'use client'/m, 'an iframe needs no client boundary')
  assert.doesNotMatch(map, /from '(react-leaflet|leaflet|mapbox-gl|maplibre-gl|@vis\.gl)/)
  assert.match(map, /<iframe/)
  assert.match(map, /loading="lazy"/, 'the embed must not block the hero paint')
  assert.match(map, /title=\{`Map of \$\{name\}`\}/, 'the iframe needs an accessible name')
  assert.match(map, /key=\{src\}/, 'a new coordinate must rebuild the frame')
  assert.match(map, /openstreetmap\.org\/copyright/, 'ODbL attribution is mandatory')
})

test('the admin rejects half a pin and the 0,0 pair, but accepts a real 0', () => {
  assert.match(collection, /name: 'latitude',[\s\S]*?min: -90,\s*max: 90/)
  assert.match(collection, /name: 'longitude',[\s\S]*?min: -180,\s*max: 180/)
  assert.equal(
    (collection.match(/validate: coordinatePairValidator\('(latitude|longitude)'\)/g) ?? []).length,
    2,
    'each half validates the pair, so the field filled last raises the error',
  )
  // The message must distinguish "missing partner" from "0,0", and the pair check must compare
  // against the sibling rather than truthiness — otherwise longitude 0 fails its own validation.
  assert.match(collection, /thisSet !== otherSet/)
  assert.match(collection, /value === 0 && otherValue === 0/)
  assert.match(collection, /Enter both latitude and longitude/)
})

test('the destination page’s metadata path and the JSON-LD share the coordinate guard', () => {
  assert.match(seo, /import \{ parseCoordinates \} from '\.\/coordinates'/)
  assert.match(seo, /const coordinates = parseCoordinates\(destination\.coordinates\)/)
  assert.match(seo, /'@type': 'GeoCoordinates'/)
  assert.match(seo, /latitude: coordinates\.latitude/)
})
