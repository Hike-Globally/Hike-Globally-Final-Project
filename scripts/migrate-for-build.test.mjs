/**
 * The build-time migration step.
 *
 * Two properties are worth locking down, because a deploy depends on both and neither is visible
 * in a unit test of `payload` itself:
 *
 *   1. a build with **no** database attached still succeeds — Preview deployments and a first deploy
 *      before env vars are set rely on it (`src/lib/data.ts` → `safeQuery` falls back to static
 *      content in exactly that state);
 *   2. a build with a database that is configured but unusable **fails**, so a deploy can never
 *      quietly ship against an outdated schema.
 *
 * The second one runs the real script and the real `npm run migrate`, against a port nothing is
 * listening on, rather than a re-implementation of the decision.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { resolveDatabaseUri } from './migrate-for-build.mjs'

const script = fileURLToPath(new URL('./migrate-for-build.mjs', import.meta.url))

/** Runs the script for real, with a database environment we control. */
const runScript = (env) =>
  spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URI: '', DATABASE_URL: '', POSTGRES_URL: '', ...env },
  })

test('no connection string means no database', () => {
  assert.equal(resolveDatabaseUri({}), null)
  assert.equal(resolveDatabaseUri({ DATABASE_URI: '   ' }), null)
})

test('the .env.example placeholder is not a database', () => {
  assert.equal(resolveDatabaseUri({ DATABASE_URI: 'postgres://user:password@host:5432/db' }), null)
})

test('the three connection-string conventions are all accepted', () => {
  assert.equal(resolveDatabaseUri({ DATABASE_URI: 'postgres://a@b/db' }), 'postgres://a@b/db')
  assert.equal(resolveDatabaseUri({ DATABASE_URL: 'postgres://a@b/db' }), 'postgres://a@b/db')
  assert.equal(resolveDatabaseUri({ POSTGRES_URL: 'postgres://a@b/db' }), 'postgres://a@b/db')
  assert.equal(
    resolveDatabaseUri({ DATABASE_URI: 'postgres://first@b/db', DATABASE_URL: 'postgres://second@b/db' }),
    'postgres://first@b/db',
    'Payload’s own variable wins, matching src/lib/payload.ts',
  )
})

test('a build with no database configured skips migrations and succeeds', () => {
  const result = runScript({})

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /No database configured/)
  assert.match(result.stdout, /skipping migrations/)
})

test('a configured but unreachable database fails the build', () => {
  // Port 1 on localhost: nothing is listening, so `payload migrate` cannot connect.
  const result = runScript({ DATABASE_URI: 'postgres://postgres:postgres@127.0.0.1:1/hike_globally' })

  assert.notEqual(result.status, 0, 'a deploy must not continue on an unusable database')
  assert.match(`${result.stdout}${result.stderr}`, /Migrations failed/)
})
