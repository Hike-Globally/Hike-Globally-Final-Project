/**
 * The redirections migration is hand-written (a production database is not available to generate
 * it), so this test pins the things that must be in it: the table and its columns, the unique index
 * that makes duplicate sources impossible, and the lock-table column Payload needs in order to open
 * the edit view.
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import { PgDialect } from 'drizzle-orm/pg-core'

import { down, up } from '../20261108_150000_redirections'

const collect = async (run: (args: never) => Promise<void>): Promise<string> => {
  const statements: string[] = []
  const dialect = new PgDialect()

  await run({
    db: {
      execute: async (query: Parameters<PgDialect['sqlToQuery']>[0]) => {
        statements.push(dialect.sqlToQuery(query).sql)
      },
    },
  } as never)

  return statements.join('\n')
}

test('creates the redirections table with every column the collection uses', async () => {
  const sql = await collect(up as never)

  assert.match(sql, /CREATE TABLE IF NOT EXISTS "redirections"/)
  for (const column of [
    '"source_path" varchar NOT NULL',
    '"destination_url" varchar NOT NULL',
    '"status_code" "enum_redirections_status_code" DEFAULT \'301\' NOT NULL',
    '"is_active" boolean DEFAULT true',
    '"note" varchar',
    '"hit_count" numeric DEFAULT 0',
    '"last_hit_at" timestamp\\(3\\) with time zone',
    '"updated_at" timestamp\\(3\\) with time zone DEFAULT now\\(\\) NOT NULL',
    '"created_at" timestamp\\(3\\) with time zone DEFAULT now\\(\\) NOT NULL',
  ]) {
    assert.match(sql, new RegExp(column))
  }
})

test('creates the status-code enum before the table that uses it', async () => {
  const sql = await collect(up as never)

  const enumAt = sql.indexOf('CREATE TYPE "public"."enum_redirections_status_code"')
  const tableAt = sql.indexOf('CREATE TABLE IF NOT EXISTS "redirections"')

  assert.notEqual(enumAt, -1)
  assert.match(sql, /ENUM\('301', '302', '307', '308'\)/)
  assert.ok(enumAt < tableAt, 'the enum must exist before the column references it')
})

test('makes the source path unique and indexable', async () => {
  const sql = await collect(up as never)

  assert.match(
    sql,
    /CREATE UNIQUE INDEX IF NOT EXISTS "redirections_source_path_idx"\s+ON "redirections" USING btree \("source_path"\)/,
  )
  assert.match(sql, /CREATE INDEX IF NOT EXISTS "redirections_is_active_idx"/)
})

test('adds the locked-documents column, constraint and index Payload needs', async () => {
  const sql = await collect(up as never)

  assert.match(sql, /ALTER TABLE "payload_locked_documents_rels"\s+ADD COLUMN IF NOT EXISTS "redirections_id" integer/)
  assert.match(
    sql,
    /ADD CONSTRAINT "payload_locked_documents_rels_redirections_fk"[\s\S]*?REFERENCES "public"\."redirections"\("id"\)/,
  )
  assert.match(sql, /CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_redirections_id_idx"/)
})

test('is re-runnable: every statement is guarded', async () => {
  const sql = await collect(up as never)

  assert.match(sql, /EXCEPTION WHEN duplicate_object THEN null/)
  assert.ok(!/CREATE TABLE "redirections"/.test(sql), 'the table creation must be IF NOT EXISTS')
  assert.ok(!/CREATE TYPE "public"/.test(sql.replace(/DO \$\$ BEGIN[\s\S]*?END \$\$;/g, '')))
})

test('down reverses the schema change', async () => {
  const sql = await collect(down as never)

  assert.match(sql, /DROP INDEX IF EXISTS "payload_locked_documents_rels_redirections_id_idx"/)
  assert.match(sql, /DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_redirections_fk"/)
  assert.match(sql, /DROP COLUMN IF EXISTS "redirections_id"/)
  assert.match(sql, /DROP TABLE IF EXISTS "redirections" CASCADE/)
  assert.match(sql, /DROP TYPE IF EXISTS "public"\."enum_redirections_status_code"/)
})
