import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PgDialect } from 'drizzle-orm/pg-core'

import { down, up } from '../20261119_200000_multi_url_preview_images'
import { migrations } from '../index'

const links = [
  ['trips_page_sections_multi_links', 'trips_multi_links_image_media_fk'],
  ['_trips_page_sections_multi_links_v', '_trips_multi_links_v_image_media_fk'],
  ['blog_page_sections_multi_links', 'blog_multi_links_image_media_fk'],
  ['_blog_page_sections_multi_links_v', '_blog_multi_links_v_image_media_fk'],
] as const

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

test('Multi-URL Preview image migration remains registered before review removal', () => {
  const index = migrations.findIndex(({ name }) => name === '20261119_200000_multi_url_preview_images')
  assert.ok(index >= 0)
  assert.equal(migrations[index]?.up, up)
  assert.equal(migrations[index]?.down, down)
  assert.equal(migrations[index + 1]?.name, '20261120_185728_remove_reviews')
})

test('image uploads and URL overrides are added to all localized and versioned URL rows', async () => {
  const sql = await sqlFor(up)
  for (const [table, foreignKey] of links) {
    assert.ok(sql.includes(`ALTER TABLE "${table}" ADD COLUMN "link_preview_image_id" integer`))
    assert.ok(sql.includes(`ALTER TABLE "${table}" ADD COLUMN "link_preview_image_url" varchar`))
    assert.ok(sql.includes(`CREATE INDEX "${table}_link_preview_image_idx"`))
    assert.ok(sql.includes(`ADD CONSTRAINT "${foreignKey}"`))
    assert.ok(sql.includes('REFERENCES "public"."media"("id") ON DELETE set null'))
  }
})

test('rollback removes only the two new image fields and their relations', async () => {
  const sql = await sqlFor(down)
  assert.equal((sql.match(/DROP COLUMN/g) ?? []).length, 8)
  assert.equal((sql.match(/DROP CONSTRAINT/g) ?? []).length, 4)
  assert.equal((sql.match(/DROP INDEX/g) ?? []).length, 4)
  assert.doesNotMatch(sql, /DROP TABLE|DELETE FROM/)
})

test('snapshot includes image upload relations and URL fields on all four link tables', () => {
  const snapshot = JSON.parse(
    readFileSync(
      new URL('../20261119_200000_multi_url_preview_images.json', import.meta.url),
      'utf8',
    ),
  )
  for (const [name, foreignKey] of links) {
    const table = snapshot.tables[`public.${name}`]
    assert.equal(table.columns.link_preview_image_id.type, 'integer')
    assert.equal(table.columns.link_preview_image_url.type, 'varchar')
    assert.equal(table.foreignKeys[foreignKey].tableTo, 'media')
    assert.ok(Object.keys(table.indexes).some((index) => index.endsWith('_link_preview_image_idx')))
  }
})
