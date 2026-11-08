import assert from 'node:assert/strict'
import test from 'node:test'

import { PgDialect } from 'drizzle-orm/pg-core'

import { up } from './20261108_120000_trip_packing_categories'

/**
 * The packing-category migration is the deploy-critical half of the packing-list accordions: if the
 * `category` column never appears, every packed item renders as "unfiled" (the frontend still
 * groups it by keyword, but an editor would have to re-tag the list by hand). These assertions pin
 * the three things that could silently rot — the enum values, the back-fill, and the order of the
 * two — without needing a live Postgres.
 */
const collect = async () => {
  const statements: string[] = []
  const dialect = new PgDialect()

  await up({
    db: {
      execute: async (query: Parameters<PgDialect['sqlToQuery']>[0]) => {
        statements.push(
          typeof query === 'string' ? query : dialect.sqlToQuery(query as never).sql,
        )
      },
    },
  } as never)

  return statements.join('\n')
}

test('both packing tables get a category column, guarded for re-runs', async () => {
  const sqlText = await collect()

  for (const table of ['trips_packing_list', '_trips_v_version_packing_list']) {
    assert.match(
      sqlText,
      new RegExp(`ALTER TABLE "${table}"[\\s\\S]*?ADD COLUMN IF NOT EXISTS "category"`),
      `${table} must gain a nullable category column, safely re-runnable`,
    )
  }
})

test('the three accordion values exist as real enum members', async () => {
  const sqlText = await collect()

  for (const type of [
    'enum_trips_packing_list_category',
    'enum__trips_v_version_packing_list_category',
  ]) {
    assert.match(sqlText, new RegExp(`CREATE TYPE "public"\\."${type}" AS ENUM`))
  }

  for (const value of ['clothing-footwear', 'trekking-equipment', 'personal-items']) {
    assert.ok(sqlText.includes(`'${value}'`), `${value} must be a valid stored category`)
  }
})

test('existing rows are back-filled, and only where the category is still null', async () => {
  const sqlText = await collect()

  for (const table of ['trips_packing_list', '_trips_v_version_packing_list']) {
    const update = new RegExp(`UPDATE "${table}"[\\s\\S]*?WHERE "category" IS NULL`)
    assert.match(sqlText, update, `${table} must be back-filled for rows saved before today`)
  }

  // Nothing may be left null by the back-fill: the CASE always ends in a real category.
  assert.match(sqlText, /ELSE 'trekking-equipment'/)
})

test('the tables are created before they are updated', async () => {
  const sqlText = await collect()

  const createAt = sqlText.indexOf('CREATE TYPE "public"."enum_trips_packing_list_category"')
  const updateAt = sqlText.indexOf('UPDATE "trips_packing_list"')

  assert.notEqual(createAt, -1)
  assert.notEqual(updateAt, -1)
  assert.ok(createAt < updateAt, 'the enum must exist before a column can use it')
})
