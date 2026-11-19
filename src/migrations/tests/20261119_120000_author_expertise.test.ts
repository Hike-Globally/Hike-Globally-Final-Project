import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { PgDialect } from 'drizzle-orm/pg-core'

import { down, up } from '../20261119_120000_author_expertise'
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

test('author expertise migration is registered after all existing migrations', () => {
  assert.equal(migrations.at(-1)?.name, '20261119_120000_author_expertise')
  assert.equal(migrations.at(-1)?.up, up)
  assert.equal(migrations.at(-1)?.down, down)
})

test('author expertise migration adds nullable facts and live/versioned guide relationships', async () => {
  const sql = await sqlFor(up)
  assert.match(sql, /ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "website" varchar;/)
  for (const field of ['job_title', 'education']) {
    assert.ok(
      sql.includes(`ALTER TABLE "users_locales" ADD COLUMN IF NOT EXISTS "${field}" varchar;`),
    )
  }
  for (const table of ['users_credentials', 'users_socials']) {
    assert.ok(sql.includes(`CREATE TABLE IF NOT EXISTS "${table}"`))
    assert.ok(sql.includes(`CONSTRAINT "${table}_parent_id_fk"`))
  }
  for (const [table, field] of [
    ['trips', 'guide_id'],
    ['_trips_v', 'version_guide_id'],
  ]) {
    assert.ok(sql.includes(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${field}" integer;`))
    assert.ok(
      sql.includes(`FOREIGN KEY ("${field}") REFERENCES "public"."users"("id") ON DELETE set null`),
    )
  }
  // Deploying must not assert qualifications or assign an author to existing content.
  assert.doesNotMatch(sql, /^\s*(?:UPDATE|INSERT|DELETE|DROP)\b/m)
})

test('rollback removes only the new expertise fields and relationship tables', async () => {
  const sql = await sqlFor(down)
  assert.match(sql, /ALTER TABLE "trips" DROP COLUMN IF EXISTS "guide_id"/)
  assert.match(sql, /ALTER TABLE "_trips_v" DROP COLUMN IF EXISTS "version_guide_id"/)
  assert.match(sql, /DROP TABLE IF EXISTS "users_credentials"/)
  assert.match(sql, /DROP TABLE IF EXISTS "users_socials"/)
  assert.doesNotMatch(sql, /DROP TABLE (?:IF EXISTS )?"(?:users|trips|_trips_v|blog)"/)
  assert.doesNotMatch(sql, /"(?:name|email|hash|salt|bio|avatar_id)"/)
})

test('the Payload snapshot includes the new tables, localized fields and draft guide column', () => {
  const snapshot = JSON.parse(
    readFileSync(new URL('../20261119_120000_author_expertise.json', import.meta.url), 'utf8'),
  )
  assert.equal(snapshot.tables['public.users'].columns.website.notNull, false)
  assert.equal(snapshot.tables['public.users_locales'].columns.job_title.notNull, false)
  assert.equal(snapshot.tables['public.users_locales'].columns.education.notNull, false)
  assert.equal(snapshot.tables['public.trips'].columns.guide_id.notNull, false)
  assert.equal(snapshot.tables['public._trips_v'].columns.version_guide_id.notNull, false)
  for (const table of ['users_credentials', 'users_socials']) {
    assert.equal(
      snapshot.tables[`public.${table}`].foreignKeys[`${table}_parent_id_fk`].onDelete,
      'cascade',
    )
  }
})
