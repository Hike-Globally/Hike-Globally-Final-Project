import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PgDialect } from 'drizzle-orm/pg-core'

import { PLACE_CATEGORY_VALUES } from '../../lib/place-categories'
import { down, up } from '../20261121_134756_place_categories'
import { migrations } from '../index'

const TABLES = [
  'trips_place_categories',
  '_trips_v_version_place_categories',
  'blog_place_categories',
  '_blog_v_version_place_categories',
] as const

const ENUMS = [
  'enum_trips_place_categories',
  'enum__trips_v_version_place_categories',
  'enum_blog_place_categories',
  'enum__blog_v_version_place_categories',
] as const

const snapshot = (file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(new URL(`../${file}.json`, import.meta.url), 'utf8')) as Record<
    string,
    unknown
  >

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

test('Browse Places is registered and creates only the four has-many tables', async () => {
  const index = migrations.findIndex(
    (migration) => migration.name === '20261121_134756_place_categories',
  )
  assert.ok(index >= 0, 'the migration is registered')
  assert.equal(migrations[index]?.up, up)
  assert.equal(migrations[index]?.down, down)

  const sql = await sqlFor(up)
  for (const table of TABLES) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS "${table}"`))
    assert.match(sql, new RegExp(`"${table}_order_idx"`))
    assert.match(sql, new RegExp(`"${table}_parent_idx"`))
  }
  for (const enumType of ENUMS) {
    assert.match(sql, new RegExp(`CREATE TYPE "public"\\."${enumType}" AS ENUM`))
  }
  assert.equal((sql.match(/ON DELETE cascade ON UPDATE no action/g) ?? []).length, 4)
  assert.match(sql, /EXCEPTION WHEN duplicate_object THEN NULL/)
  assert.doesNotMatch(sql, /DROP TABLE|DROP TYPE|DROP COLUMN|DELETE FROM|UPDATE "/)
  assert.doesNotMatch(sql, /page_sections|multi_links|link_preview_image/)
})

test('rollback removes only the four category tables and their enum types', async () => {
  const sql = await sqlFor(down)
  for (const table of TABLES) {
    assert.match(sql, new RegExp(`DROP TABLE IF EXISTS "${table}" CASCADE`))
  }
  for (const enumType of ENUMS) {
    assert.match(sql, new RegExp(`DROP TYPE IF EXISTS "public"\\."${enumType}"`))
  }
  assert.doesNotMatch(sql, /DROP COLUMN|DELETE FROM|UPDATE "|page_sections|multi_links/)
})

test('the snapshot links to the previous migration and changes no unrelated schema', () => {
  const before = snapshot('20261120_190941_sitemap_video_thumbnail')
  const after = snapshot('20261121_134756_place_categories')
  assert.equal(after.prevId, before.id)

  type SnapshotTable = {
    columns: Record<string, { notNull?: boolean }>
    indexes: Record<string, unknown>
    foreignKeys: Record<string, { onDelete?: string }>
  }
  const tables = after.tables as Record<string, SnapshotTable>
  const enums = after.enums as Record<string, { values: string[] }>
  for (const table of TABLES) {
    const definition = tables[`public.${table}`]!
    assert.equal(definition.columns.order.notNull, true)
    assert.equal(definition.columns.parent_id.notNull, true)
    assert.equal(definition.columns.value.notNull, false)
    assert.ok(`${table}_order_idx` in definition.indexes)
    assert.ok(`${table}_parent_idx` in definition.indexes)
    assert.equal(
      definition.foreignKeys[`${table}_parent_fk`]!.onDelete,
      'cascade',
    )
  }
  for (const enumType of ENUMS) {
    assert.deepEqual(enums[`public.${enumType}`]!.values, [...PLACE_CATEGORY_VALUES])
  }

  const stripped = structuredClone(after) as {
    id: unknown
    prevId: unknown
    tables: Record<string, unknown>
    enums: Record<string, unknown>
  }
  for (const table of TABLES) delete stripped.tables[`public.${table}`]
  for (const enumType of ENUMS) delete stripped.enums[`public.${enumType}`]
  stripped.id = before.id
  stripped.prevId = before.prevId
  assert.deepEqual(stripped, before)
})

test('the shared CMS field is a multi-select on both trips and posts', () => {
  for (const collection of ['Trips', 'Blog']) {
    const source = readFileSync(
      new URL(`../../collections/${collection}.ts`, import.meta.url),
      'utf8',
    )
    assert.match(source, /placeCategoriesField\(\)/)
  }

  const field = readFileSync(new URL('../../fields/place-categories.ts', import.meta.url), 'utf8')
  assert.match(field, /type: 'select'/)
  assert.match(field, /hasMany: true/)
  assert.match(field, /options: placeCategoryOptions/)
})
