import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PgDialect } from 'drizzle-orm/pg-core'

import { down, up } from '../20261119_170704_multi_url_preview'
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
const sections = [
  'trips_page_sections',
  '_trips_v_version_page_sections',
  'blog_page_sections',
  '_blog_v_version_page_sections',
]
const pairs = [
  ['trips_page_sections_multi_links', 'trips_page_sections'],
  ['_trips_page_sections_multi_links_v', '_trips_v_version_page_sections'],
  ['blog_page_sections_multi_links', 'blog_page_sections'],
  ['_blog_page_sections_multi_links_v', '_blog_v_version_page_sections'],
]

test('Multi-URL Preview migration follows the author expertise baseline', () => {
  const index = migrations.findIndex(({ name }) => name === '20261119_170704_multi_url_preview')
  assert.ok(index > migrations.findIndex(({ name }) => name === '20261119_120000_author_expertise'))
  assert.equal(migrations[index]?.up, up)
  assert.equal(migrations[index]?.down, down)
})

test('the additive migration keeps existing content and adds four independent localized link tables', async () => {
  const sql = await sqlFor(up)
  assert.doesNotMatch(sql, /^\s*(UPDATE|DELETE|INSERT|DROP)\b/m)
  for (const [links, parent] of pairs) {
    assert.ok(sql.includes(`CREATE TABLE "${links}"`))
    assert.ok(sql.includes(`REFERENCES "public"."${parent}"("id") ON DELETE cascade`))
    assert.ok(sql.includes(`CREATE INDEX "${links}_locale_idx"`))
    assert.ok(sql.includes(`CREATE INDEX "${links}_order_idx"`))
  }
  for (const table of sections) {
    assert.ok(sql.includes(`ALTER TYPE "public"."enum_${table}_kind" ADD VALUE 'multiUrlPreview'`))
    for (const field of ['heading', 'description', 'layout', 'animation']) {
      assert.ok(sql.includes(`ALTER TABLE "${table}" ADD COLUMN "multi_preview_${field}"`))
    }
  }
})

test('rollback removes only new page rows before shrinking enums and leaves all older content alone', async () => {
  const sql = await sqlFor(down)
  for (const table of sections) {
    const remove = `DELETE FROM "${table}" WHERE "kind" = 'multiUrlPreview';`
    assert.ok(sql.includes(remove))
    assert.ok(sql.indexOf(remove) < sql.indexOf(`DROP TYPE "public"."enum_${table}_kind"`))
  }
  assert.equal((sql.match(/DELETE FROM/g) ?? []).length, 4)
  assert.doesNotMatch(sql, /DROP COLUMN "(?:html|link_preview_\w+)"/)
  assert.doesNotMatch(sql, /DROP TABLE "(?:trips|blog|_trips_v|_blog_v|\w*page_sections)"/)
})

test('snapshot preserves every old section kind and contains the three layouts and five animations plus None', () => {
  const snapshot = JSON.parse(
    readFileSync(new URL('../20261119_170704_multi_url_preview.json', import.meta.url), 'utf8'),
  )
  const baseline = JSON.parse(
    readFileSync(new URL('../20261119_120000_author_expertise.json', import.meta.url), 'utf8'),
  )
  for (const table of sections) {
    const kinds = snapshot.enums[`public.enum_${table}_kind`].values as string[]
    assert.deepEqual(
      kinds.filter((kind) => kind !== 'multiUrlPreview'),
      baseline.enums[`public.enum_${table}_kind`].values,
    )
    assert.deepEqual(snapshot.enums[`public.enum_${table}_multi_preview_layout`].values, [
      'list',
      'slider',
      'carousel',
    ])
    assert.deepEqual(snapshot.enums[`public.enum_${table}_multi_preview_animation`].values, [
      'fade',
      'rise',
      'slide',
      'zoom',
      'reveal',
      'none',
    ])
    assert.equal(snapshot.tables[`public.${table}`].columns.multi_preview_heading.notNull, false)
  }
})

test('snapshot foreign keys match the right live/version parent and use untruncated identifiers', () => {
  const snapshot = JSON.parse(
    readFileSync(new URL('../20261119_170704_multi_url_preview.json', import.meta.url), 'utf8'),
  )
  for (const [links, parent] of pairs) {
    const table = snapshot.tables[`public.${links}`]
    assert.ok(table)
    assert.equal(table.columns._locale.notNull, true)
    assert.equal(table.foreignKeys[`${links}_parent_id_fk`].tableTo, parent)
    assert.equal(table.foreignKeys[`${links}_parent_id_fk`].onDelete, 'cascade')
    for (const identifier of [...Object.keys(table.indexes), ...Object.keys(table.foreignKeys)]) {
      assert.ok(identifier.length <= 63, identifier)
    }
  }
})
