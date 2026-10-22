/**
 * Regenerates `LAND_DOT_DATA` in src/components/sections/globe/globe-data.ts.
 *
 * The globe draws its continents as a field of dots. This script builds that
 * field:
 *
 *   1. Start from a Fibonacci sphere (~even spacing at every latitude, no pole
 *      clustering) with a little seeded jitter so the dots read as an organic
 *      stipple rather than a visible spiral.
 *   2. Keep the points that fall on land, using Natural Earth 1:50m polygons
 *      from `world-atlas` and `d3-geo`'s point-in-polygon test.
 *   3. Pack each surviving lat/lng onto a 0.1° grid as a single integer and
 *      rewrite the array at the bottom of `globe-data.ts`.
 *
 * Run with: npm run generate:globe-dots
 *
 * The curated destinations and routes at the top of `globe-data.ts` are left
 * untouched.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { geoContains } from 'd3-geo'
import { feature } from 'topojson-client'

const require = createRequire(import.meta.url)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dataFile = resolve(root, 'src/components/sections/globe/globe-data.ts')

/** Sphere points to sample. ~29% land → roughly 4.5k dots. */
const POINTS = 16000

/** Trim the pole caps where the dots would bunch into a bright blob. */
const MAX_LATITUDE = 84
const MIN_LATITUDE = -83

/** Maximum random displacement, in degrees. About half the dot spacing. */
const JITTER = 0.8

/** Seeded LCG so every run produces byte-identical output. */
function createRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

const topo = JSON.parse(readFileSync(require.resolve('world-atlas/land-50m.json'), 'utf8'))
const land = feature(topo, topo.objects.land)

const random = createRandom(0x48494b45)
const golden = Math.PI * (3 - Math.sqrt(5))
const points = []

for (let i = 0; i < POINTS; i++) {
  // Fibonacci sphere: y walks uniformly from north to south, and each point
  // takes the next golden-angle step around the axis.
  const y = 1 - (i / (POINTS - 1)) * 2
  const theta = golden * i

  let lat = (Math.asin(y) * 180) / Math.PI
  let lng = (((theta * 180) / Math.PI + 180) % 360) - 180

  if (lat > MAX_LATITUDE || lat < MIN_LATITUDE) continue

  // Jitter before the land test, so points near a coastline can move either way.
  lat += (random() - 0.5) * 2 * JITTER
  lng += (random() - 0.5) * 2 * JITTER

  if (geoContains(land, [lng, lat])) points.push([lat, lng])
}

/** ((lat + 90) × 10) × 3600 + (lng + 180) × 10 — see globe-data.ts for the decoder. */
const pack = ([lat, lng]) => Math.round((lat + 90) * 10) * 3600 + Math.round((lng + 180) * 10)

const packed = points.map(pack)
const rows = []

for (let i = 0; i < packed.length; i += 14) {
  rows.push(`  ${packed.slice(i, i + 14).join(', ')},`)
}

const source = readFileSync(dataFile, 'utf8')
const marker = 'export const LAND_DOT_DATA: readonly number[] = ['
const markerIndex = source.indexOf(marker)

if (markerIndex === -1) {
  throw new Error(`Could not find "${marker}" in ${dataFile}`)
}

const head = source.slice(0, markerIndex)
writeFileSync(dataFile, `${head}${marker}\n${rows.join('\n')}\n]\n`)

console.log(
  `Wrote ${packed.length} land dots (${POINTS} sphere samples, ${JITTER}° jitter) to ${dataFile}`,
)
