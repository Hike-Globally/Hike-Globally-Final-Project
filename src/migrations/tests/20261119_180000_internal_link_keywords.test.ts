import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { PgDialect } from 'drizzle-orm/pg-core'

import { down, up } from '../20261119_180000_internal_link_keywords'
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

const TEXTS_TABLES = [
  ['destinations_texts', 'destinations'],
  ['_destinations_v_texts', '_destinations_v'],
  ['pages_texts', 'pages'],
  ['_pages_v_texts', '_pages_v'],
] as const

test('the internal linking keyword migration is the newest registered migration', () => {
  assert.equal(migrations.at(-1)?.name, '20261119_180000_internal_link_keywords')
  assert.equal(migrations.at(-1)?.up, up)
  assert.equal(migrations.at(-1)?.down, down)
})

test('destinations and pages get the shared hasMany-string table, live and versioned', async () => {
  const sql = await sqlFor(up)

  for (const [table] of TEXTS_TABLES) {
    assert.ok(sql.includes(`CREATE TABLE IF NOT EXISTS "${table}"`), table)
    assert.ok(sql.includes(`"${table}_parent_fk"`), `${table} foreign key`)
    assert.ok(sql.includes(`"${table}_order_parent"`), `${table} order index`)
    assert.ok(sql.includes(`"${table}_locale_parent"`), `${table} locale index`)
    assert.ok(sql.includes(`"path" varchar NOT NULL`), `${table} path column`)
  }

  // Trips and Blog already own a `*_texts` table; a second hasMany field is just another `path`
  // value, so the migration must not try to create one again.
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS "(?:trips_texts|blog_texts)"/)
})

test('existing SEO keywords are copied into the panel without overwriting a curated list', async () => {
  const sql = await sqlFor(up)

  for (const table of ['trips_texts', '_trips_v_texts', 'blog_texts', '_blog_v_texts']) {
    assert.ok(sql.includes(`INSERT INTO "${table}"`), table)
  }
  assert.match(sql, /'internalLinkKeywords'/)
  assert.match(sql, /WHERE source\."path" = 'keywords'/)
  // Re-runnable: a document/locale that already has phrases is left alone.
  assert.match(sql, /NOT EXISTS/)
})

test('rollback removes only the copied phrases and the new tables', async () => {
  const sql = await sqlFor(down)

  for (const table of ['trips_texts', '_trips_v_texts', 'blog_texts', '_blog_v_texts']) {
    assert.ok(sql.includes(`DELETE FROM "${table}" WHERE "path" = 'internalLinkKeywords'`), table)
  }
  for (const [table] of TEXTS_TABLES) {
    assert.ok(sql.includes(`DROP TABLE IF EXISTS "${table}"`), table)
  }
  // The collection tables themselves predate this migration and must survive a rollback.
  assert.doesNotMatch(
    sql,
    /DROP TABLE IF EXISTS "(?:trips|blog|destinations|pages|_trips_v|_blog_v|_destinations_v|_pages_v)"/,
  )
})

test('the Payload snapshot includes the four new texts tables and their parent keys', () => {
  const snapshot = JSON.parse(
    readFileSync(
      new URL('../20261119_180000_internal_link_keywords.json', import.meta.url),
      'utf8',
    ),
  ) as {
    tables: Record<
      string,
      {
        foreignKeys: Record<string, { tableTo: string; onDelete: string }>
        indexes: Record<string, unknown>
      }
    >
  }

  for (const [table, parent] of TEXTS_TABLES) {
    const entry = snapshot.tables[`public.${table}`]
    assert.ok(entry, table)
    assert.equal(entry.foreignKeys[`${table}_parent_fk`]?.tableTo, parent)
    assert.equal(entry.foreignKeys[`${table}_parent_fk`]?.onDelete, 'cascade')
    assert.ok(entry.indexes[`${table}_order_parent`], `${table} order index`)
    assert.ok(entry.indexes[`${table}_locale_parent`], `${table} locale index`)
  }
})
