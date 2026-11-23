import assert from 'node:assert/strict'
import test from 'node:test'

import { PgDialect } from 'drizzle-orm/pg-core'

import { down, up } from '../20261122_160000_itinerary_place'
import { migrations } from '../index'

async function sqlFor(migrate: typeof up | typeof down) {
  const statements: string[] = []
  const dialect = new PgDialect()
  await migrate({
    db: {
      execute: async (query: Parameters<PgDialect['sqlToQuery']>[0]) => {
        statements.push(dialect.sqlToQuery(query).sql)
      },
    },
  } as never)
  return statements.join('\n')
}

const tables = ['trips_itinerary', '_trips_v_version_itinerary'] as const

test('itinerary place sits between the coordinates and profile-slug migrations', () => {
  // Position is looked up by name rather than `at(-1)`, so adding a later migration does not
  // turn this into a false failure — it only needs to stay in chronological order.
  const index = migrations.findIndex(
    (migration) => migration.name === '20261122_160000_itinerary_place',
  )
  assert.ok(index >= 0, 'the migration is registered')
  assert.equal(migrations[index]?.up, up)
  assert.equal(migrations[index]?.down, down)
  assert.equal(migrations[index - 1]?.name, '20261122_140000_trip_coordinates')
  assert.equal(migrations[index + 1]?.name, '20261123_120000_user_profile_slug')
})

test('up adds one nullable varchar to the live and versioned itinerary tables', async () => {
  const sql = await sqlFor(up)

  for (const table of tables) {
    assert.ok(
      sql.includes(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "place" varchar`),
      table,
    )
  }

  assert.equal((sql.match(/ADD COLUMN/g) ?? []).length, 2)
  assert.doesNotMatch(sql, /NOT NULL|DEFAULT/, 'existing rows keep working with no place')
  assert.doesNotMatch(sql, /DROP|CREATE TABLE|ALTER COLUMN/, 'purely additive')

  // The chart falls back to "Day n" when place is empty — that contract lives in the collection
  // and the profile module, not in the database, so nothing here is required.
  assert.doesNotMatch(sql, /UNIQUE|REFERENCES|INDEX/)
})

test('down removes exactly what up added, in reverse order', async () => {
  const sql = await sqlFor(down)
  const statements = sql.split('\n').filter(Boolean)

  assert.deepEqual(
    statements,
    [...tables].reverse().map((table) => `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "place"`),
  )
  assert.doesNotMatch(sql, /DROP TABLE|CASCADE/)
})
