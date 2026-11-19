import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { PgDialect } from 'drizzle-orm/pg-core'

import { down, up } from '../20261119_190000_hotels_near_destination'
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

const pageSectionTables = ['trips_page_sections', '_trips_v_version_page_sections'] as const
const hotelTables = [
  ['trips_hotels_near_destination', 'trips'],
  ['_trips_v_version_hotels_near_destination', '_trips_v'],
] as const

test('Hotels Near Destination migration is the newest registered migration', () => {
  assert.equal(migrations.at(-1)?.name, '20261119_190000_hotels_near_destination')
  assert.equal(migrations.at(-1)?.up, up)
  assert.equal(migrations.at(-1)?.down, down)
})

test('migration creates localized, versioned hotel entries and backfills each trip layout', async () => {
  const sql = await sqlFor(up)

  for (const [table, parent] of hotelTables) {
    assert.ok(sql.includes(`CREATE TABLE "${table}"`), table)
    assert.ok(sql.includes(`REFERENCES "public"."${parent}"("id") ON DELETE cascade`), table)
    assert.ok(sql.includes(`CREATE INDEX "${table}_order_idx"`), table)
    assert.ok(sql.includes(`CREATE INDEX "${table}_parent_id_idx"`), table)
    assert.ok(sql.includes(`CREATE INDEX "${table}_locale_idx"`), table)
  }
  assert.match(sql, /"heading" varchar,\s+"content" jsonb/)
  assert.match(sql, /'hotelsNearDestination'/)

  for (const table of pageSectionTables) {
    assert.ok(sql.includes(`INSERT INTO "${table}"`), table)
    assert.ok(sql.includes(`FROM "${table}"`), table)
  }
  assert.equal(
    (sql.match(/INSERT INTO "(?:trips_page_sections|_trips_v_version_page_sections)"/g) ?? [])
      .length,
    2,
  )
  assert.equal(
    (sql.match(/HAVING COUNT\(\*\) FILTER \(WHERE "kind" = 'hotelsNearDestination'\) = 0/g) ?? [])
      .length,
    2,
  )
  assert.match(sql, /MIN\("_order"\) FILTER \(WHERE "kind" = 'information'\) \+ 1/)
})

test('rollback removes only the new rows/tables before restoring the original enums', async () => {
  const sql = await sqlFor(down)

  for (const table of pageSectionTables) {
    const remove = `DELETE FROM "${table}" WHERE "kind" = 'hotelsNearDestination';`
    assert.ok(sql.includes(remove))
    assert.ok(sql.indexOf(remove) < sql.indexOf(`DROP TYPE "public"."enum_${table}_kind"`))
  }
  for (const [table] of hotelTables) assert.ok(sql.includes(`DROP TABLE "${table}" CASCADE`))
  assert.equal((sql.match(/DELETE FROM/g) ?? []).length, 2)
  assert.doesNotMatch(
    sql,
    /DROP TABLE "(?:trips|_trips_v|trips_page_sections|_trips_v_version_page_sections)"/,
  )
})

test('snapshot preserves previous trip section kinds and describes the localized hotel tables', () => {
  const snapshot = JSON.parse(
    readFileSync(
      new URL('../20261119_190000_hotels_near_destination.json', import.meta.url),
      'utf8',
    ),
  )
  const baseline = JSON.parse(
    readFileSync(
      new URL('../20261119_180000_internal_link_keywords.json', import.meta.url),
      'utf8',
    ),
  )

  for (const table of pageSectionTables) {
    const kinds = snapshot.enums[`public.enum_${table}_kind`].values as string[]
    assert.deepEqual(
      kinds.filter((kind) => kind !== 'hotelsNearDestination'),
      baseline.enums[`public.enum_${table}_kind`].values,
    )
  }

  for (const [table, parent] of hotelTables) {
    const definition = snapshot.tables[`public.${table}`]
    assert.ok(definition, table)
    assert.equal(definition.columns._locale.notNull, true)
    assert.equal(definition.columns.heading.type, 'varchar')
    assert.equal(definition.columns.content.type, 'jsonb')
    assert.equal(definition.foreignKeys[`${table}_parent_id_fk`].tableTo, parent)
    assert.equal(definition.foreignKeys[`${table}_parent_id_fk`].onDelete, 'cascade')
    for (const identifier of [
      ...Object.keys(definition.indexes),
      ...Object.keys(definition.foreignKeys),
    ]) {
      assert.ok(identifier.length <= 63, identifier)
    }
  }
})
