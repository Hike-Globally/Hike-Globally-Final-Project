import assert from 'node:assert/strict'
import test from 'node:test'

import { PgDialect } from 'drizzle-orm/pg-core'

import { down, up } from '../20261122_140000_trip_coordinates'
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

/** Live table first, then the versioned pair — the order the migration declares them in. */
const columns = [
  ['trips', 'coordinates_latitude'],
  ['trips', 'coordinates_longitude'],
  ['_trips_v', 'version_coordinates_latitude'],
  ['_trips_v', 'version_coordinates_longitude'],
] as const

test('trip coordinates sits after the itinerary images and before the next migration', () => {
  // Not "the newest" any more — later migrations append below it, which is expected; what must not
  // change is its position, because the chain is applied in array order.
  const index = migrations.findIndex(({ name }) => name === '20261122_140000_trip_coordinates')
  assert.ok(index >= 0)
  assert.equal(migrations[index]?.up, up)
  assert.equal(migrations[index]?.down, down)
  assert.equal(migrations[index - 1]?.name, '20261122_120000_itinerary_images')
  assert.equal(migrations[index + 1]?.name, '20261122_160000_itinerary_place')
})

test('up adds the four columns as nullable numerics, on both the live and versioned tables', async () => {
  const sql = await sqlFor(up)

  for (const [table, column] of columns) {
    assert.ok(
      sql.includes(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" numeric`),
      `${table}.${column}`,
    )
  }

  // `numeric` matches destinations.coordinates_latitude, so both collections store the same type.
  assert.equal((sql.match(/ADD COLUMN/g) ?? []).length, 4)
  assert.doesNotMatch(sql, /NOT NULL|DEFAULT/, 'existing trips must keep their null coordinates')
  assert.doesNotMatch(sql, /DROP|CREATE TABLE|ALTER COLUMN/, 'purely additive')
})

test('down removes exactly what up added, in reverse order, and touches nothing else', async () => {
  const sql = await sqlFor(down)
  const statements = sql.split('\n').filter(Boolean)

  assert.equal(statements.length, 4)
  assert.deepEqual(
    statements,
    [...columns]
      .reverse()
      .map(([table, column]) => `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}"`),
  )
  assert.doesNotMatch(sql, /DROP TABLE|CASCADE/)
})
