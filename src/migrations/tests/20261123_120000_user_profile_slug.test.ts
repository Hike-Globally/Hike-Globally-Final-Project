import assert from 'node:assert/strict'
import test from 'node:test'

import { PgDialect } from 'drizzle-orm/pg-core'

import { down, up } from '../20261123_120000_user_profile_slug'
import { migrations } from '../index'

/**
 * The stub records every statement *and* its bound parameters, because the interesting part of this
 * migration is not the SQL shape but the values it backfills — the slugs.
 */
async function run(migrate: typeof up | typeof down, selectRows: unknown[] = []) {
  const statements: { sql: string; params: unknown[] }[] = []
  const dialect = new PgDialect()

  await migrate({
    db: {
      execute: async (query: Parameters<PgDialect['sqlToQuery']>[0]) => {
        const compiled = dialect.sqlToQuery(query)
        statements.push({ sql: compiled.sql, params: compiled.params })
        return /^\s*SELECT/i.test(compiled.sql) ? selectRows : undefined
      },
    },
  } as never)

  return statements
}

const sqlOf = (statements: { sql: string; params: unknown[] }[]) => statements.map((s) => s.sql)

test('user profile slug migration is registered', () => {
  const entry = migrations.find((m) => m.name === '20261123_120000_user_profile_slug')
  assert.ok(entry, 'migration is present in the registry')
  assert.equal(entry?.up, up)
  assert.equal(entry?.down, down)
})

test('up adds the column, then the unique index that makes duplicates impossible', async () => {
  const statements = await run(up)
  const sql = sqlOf(statements).join('\n')

  assert.match(sql, /ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "slug" varchar/)
  // Payload names a field's unique index `<table>_<field>_idx` — the same shape as `users_email_idx`,
  // so a later schema check sees exactly what it expects.
  assert.match(
    sql,
    /CREATE UNIQUE INDEX IF NOT EXISTS "users_slug_idx" ON "users" USING btree \("slug"\)/,
  )
  assert.doesNotMatch(sql, /NOT NULL/, 'the column is nullable so the backfill can run first')
  assert.doesNotMatch(sql, /DROP|DELETE FROM|CREATE TABLE/, 'purely additive')
})

test('up backfills a readable, unique slug from each account name', async () => {
  const statements = await run(up, [
    { id: 1, name: 'Sarita Gurung', slug: null },
    { id: 2, name: 'Sarita Gurung', slug: null },
    { id: 3, name: 'Pemba Sherpa', slug: null },
  ])

  const updates = statements.filter((statement) => /^UPDATE "users"/.test(statement.sql))
  assert.deepEqual(
    updates.map(({ params }) => params),
    [
      ['sarita-gurung', 1],
      ['sarita-gurung-2', 2],
      ['pemba-sherpa', 3],
    ],
  )
})

test('up transliterates diacritics instead of mangling them into dashes', async () => {
  const statements = await run(up, [{ id: 1, name: 'André Götz', slug: null }])
  const updates = statements.filter((statement) => /^UPDATE "users"/.test(statement.sql))
  assert.deepEqual(updates.map(({ params }) => params), [['andre-gotz', 1]])
})

test('up leaves a slug that is already set alone, so live URLs never move', async () => {
  const statements = await run(up, [{ id: 1, name: 'Sarita Gurung', slug: 'keep-me' }])
  assert.equal(
    statements.filter((statement) => /^UPDATE "users"/.test(statement.sql)).length,
    0,
    'an existing slug must not be rewritten by the backfill',
  )
})

test('down removes exactly what up added', async () => {
  const sql = sqlOf(await run(down)).join('\n')
  assert.match(sql, /DROP INDEX IF EXISTS "users_slug_idx"/)
  assert.match(sql, /ALTER TABLE "users" DROP COLUMN IF EXISTS "slug"/)
  assert.doesNotMatch(sql, /DROP TABLE|CASCADE/)
})
