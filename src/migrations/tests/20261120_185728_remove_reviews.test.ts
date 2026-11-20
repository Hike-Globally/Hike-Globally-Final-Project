import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PgDialect } from 'drizzle-orm/pg-core'

import { down, up } from '../20261120_185728_remove_reviews'
import { migrations } from '../index'

const snapshot = (file: string) => JSON.parse(readFileSync(new URL(`../${file}.json`, import.meta.url), 'utf8'))
const before = snapshot('20261119_200000_multi_url_preview_images')
const after = snapshot('20261120_185728_remove_reviews')

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

test('review removal is registered after the image migration', () => {
  assert.equal(migrations.at(-2)?.name, '20261119_200000_multi_url_preview_images')
  assert.equal(migrations.at(-1)?.name, '20261120_185728_remove_reviews')
  assert.equal(migrations.at(-1)?.up, up)
  assert.equal(migrations.at(-1)?.down, down)
})

test('schema delta only removes testimonials and card rating/count columns', () => {
  const expected = structuredClone(before)
  expected.id = after.id
  expected.prevId = after.prevId
  assert.equal(after.prevId, before.id)
  let removedTables = 0
  let removedColumns = 0
  for (const [name, table] of Object.entries(expected.tables)) {
    if (name.includes('testimonials')) {
      delete expected.tables[name]
      removedTables++
    } else {
      const columns = (table as { columns: Record<string, unknown> }).columns
      for (const field of ['link_preview_rating', 'link_preview_review_count']) {
        if (field in columns) {
          delete columns[field]
          removedColumns++
        }
      }
    }
  }
  for (const name of Object.keys(expected.enums)) {
    if (name.includes('testimonials')) delete expected.enums[name]
  }
  assert.equal(removedTables, 4)
  assert.equal(removedColumns, 16)
  assert.deepEqual(after, expected)
})

test('migration removes live/versioned data and cleans inline JSON without changing prices or layout', async () => {
  const sql = await sqlFor(up)
  assert.equal((sql.match(/DROP TABLE/g) ?? []).length, 4)
  assert.equal((sql.match(/DROP COLUMN/g) ?? []).length, 16)
  assert.equal((sql.match(/DROP TYPE/g) ?? []).length, 4)
  for (const [name, table] of Object.entries(before.tables)) {
    const { columns } = table as { columns: Record<string, { type: string }> }
    if (name.includes('testimonials')) {
      assert.ok(sql.includes(`DROP TABLE "${name.replace('public.', '')}"`))
    }
    if (name.startsWith('public.payload_')) continue
    for (const [column, config] of Object.entries(columns)) {
      if (config.type === 'jsonb') {
        assert.ok(sql.includes(`UPDATE "${name.replace('public.', '')}" SET "${column}"`))
      }
    }
  }
  assert.match(sql, /node - 'linkPreviewRating' - 'linkPreviewReviewCount'/)
  assert.match(sql, /jsonb_array_elements\(node\) WITH ORDINALITY/)
  assert.match(sql, /ORDER BY ord/)
  assert.match(sql, /DELETE FROM "pages_blocks_stats_items"/)
  assert.match(sql, /DELETE FROM "_pages_v_blocks_stats_items"/)
  assert.doesNotMatch(sql, /DROP COLUMN "(?:link_preview_price|link_preview_url|kind)"|DROP CONSTRAINT/)
})

test('rollback restores only the removed schema, not fabricated review data', async () => {
  const sql = await sqlFor(down)
  assert.equal((sql.match(/CREATE TABLE/g) ?? []).length, 4)
  assert.equal((sql.match(/ADD COLUMN/g) ?? []).length, 16)
  assert.doesNotMatch(sql, /INSERT INTO|DROP TABLE/)
})
