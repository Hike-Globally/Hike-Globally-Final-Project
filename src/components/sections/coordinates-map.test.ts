import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const read = (file: string): string => readFileSync(path.join(repoRoot, file), 'utf8')

const destinationDetail = read('src/components/views/destination-detail.tsx')
const tripDetail = read('src/components/views/trip-detail.tsx')
const map = read('src/components/sections/coordinates-map.tsx')
const coordinates = read('src/lib/coordinates.ts')
const seo = read('src/lib/seo.ts')
const destinations = read('src/collections/Destinations.ts')
const trips = read('src/collections/Trips.ts')

test('a destination with coordinates renders the map; one without renders nothing', () => {
  // The pin is validated once, then both the hero button and the map read the result. Guards that
  // test truthiness throw away real places on the equator / prime meridian, so the source must not
  // contain that check anywhere.
  assert.match(
    destinationDetail,
    /const coordinates = parseCoordinates\(destination\.coordinates\)/,
  )
  assert.match(destinationDetail, /\{coordinates \? \(\s*<div[^>]*>\s*<CoordinatesMap/)
  assert.doesNotMatch(destinationDetail, /coordinates\?\.latitude &&/)
  assert.doesNotMatch(destinationDetail, /\.latitude\s*&&/, 'no truthiness check on latitude')
  assert.doesNotMatch(seo, /coordinates\?\.latitude &&/, 'structured data uses the same guard')

  // Map placement: under the copy column, inside the same section as the body text, before trips.
  const mapIndex = destinationDetail.indexOf('<CoordinatesMap')
  assert.ok(
    mapIndex > destinationDetail.indexOf('<RichText content={destination.description}'),
    'after the copy',
  )
  assert.ok(mapIndex < destinationDetail.indexOf('id="trips"'), 'before the trips rail')
})

test('the trip page keeps the live map and itinerary chart, without the uploaded route images', () => {
  assert.match(tripDetail, /const coordinates = parseCoordinates\(trip\.coordinates\)/)
  assert.match(tripDetail, /const profile = altitudeProfile\(trip\.itinerary\)/)
  const items = tripDetail.slice(tripDetail.indexOf('const items = ['))
  const order = items.slice(0, items.indexOf('].filter'))
  assert.match(order, /mapCard,/)
  assert.match(order, /chartCard/)
  assert.doesNotMatch(tripDetail, /uploadedRouteMap|uploadedAltitudeChart|routeMap\[0\]/)
  assert.match(tripDetail, /zoom=\{9\}/)
  assert.match(tripDetail, /if \(!intro && !coordinates && !profile\) return null/)
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

test('both collections share one coordinates field, so the rules cannot drift apart', () => {
  // One factory in `coordinates.ts`; the collections only supply their own help text.
  assert.match(coordinates, /export const coordinatesField = /)
  assert.match(coordinates, /coordinatePairValidator\(other\)/)
  assert.match(destinations, /import \{ coordinatesField \} from '\.\.\/lib\/coordinates'/)
  assert.match(trips, /import \{ coordinatesField \} from '\.\.\/lib\/coordinates'/)
  assert.match(destinations, /coordinatesField\(\{/)
  assert.match(trips, /coordinatesField\(\{/)

  // Neither collection may re-declare the group by hand.
  assert.doesNotMatch(destinations, /name: 'coordinates',\s*\n\s*type: 'group'/)
  assert.doesNotMatch(trips, /name: 'coordinates',\s*\n\s*type: 'group'/)

  // The admin keeps itinerary-derived chart fields and coordinates, but no image uploads.
  const section = trips.slice(trips.indexOf("label: 'Route map, live map and altitude chart'"))
  const block = section.slice(0, section.indexOf("name: 'departureDates'"))
  assert.ok(block.includes('coordinatesField({'))
  assert.doesNotMatch(block, /name: '(routeMap|altitudeChart)'/)
})

test('the field rejects half a pin and the 0,0 pair, but keeps a real 0', () => {
  assert.match(coordinates, /name: 'latitude',[\s\S]*?min: -90,[\s\S]*?max: 90/)
  assert.match(coordinates, /name: 'longitude',[\s\S]*?min: -180,[\s\S]*?max: 180/)

  // The pair check compares against the sibling rather than truthiness — otherwise longitude 0
  // fails its own validation — and it distinguishes "missing partner" from "0,0".
  assert.match(coordinates, /thisSet !== otherSet/)
  assert.match(coordinates, /value === 0 && otherValue === 0/)
  assert.match(coordinates, /Enter both latitude and longitude/)
})

test('the trip JSON-LD carries the trailhead on an about Place, not on the trip itself', () => {
  assert.match(seo, /const trailhead = parseCoordinates\(trip\.coordinates\)/)
  // One `subjectOf` node only: a second spread key would silently win or lose at runtime.
  assert.equal((seo.match(/subjectOf: \{/g) ?? []).length, 1)
  const tripLd = seo.slice(seo.indexOf('export const touristTripJsonLd'))
  assert.match(tripLd, /about: \{\s*'@type': 'Place',/)
  assert.match(tripLd, /'@type': 'GeoCoordinates',\s*latitude: trailhead\.latitude/)
})

test('the destination page and the JSON-LD share the coordinate guard', () => {
  assert.match(seo, /import \{ parseCoordinates \} from '\.\/coordinates'/)
  assert.match(seo, /const coordinates = parseCoordinates\(destination\.coordinates\)/)
  assert.match(seo, /'@type': 'GeoCoordinates'/)
  assert.match(seo, /latitude: coordinates\.latitude/)
})
