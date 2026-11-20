import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PgDialect } from 'drizzle-orm/pg-core'

import { Media } from '../../collections/Media'
import { revalidateMedia, revalidateMediaDelete } from '../../hooks/revalidate'
import { down, up } from '../20261120_190941_sitemap_video_thumbnail'
import { migrations } from '../index'

async function sqlFor(migrate: typeof up | typeof down) {
  const statements: string[] = []
  const dialect = new PgDialect()
  await migrate({ db: { execute: async (query: Parameters<PgDialect['sqlToQuery']>[0]) => {
    statements.push(dialect.sqlToQuery(query).sql)
  } } } as never)
  return statements.join('\n')
}

test('thumbnail migration is last and only adds an optional media relationship', async () => {
  assert.equal(migrations.at(-1)?.up, up)
  assert.equal(migrations.at(-1)?.down, down)
  const sql = await sqlFor(up)
  assert.match(sql, /ADD COLUMN "video_thumbnail_id" integer;/)
  assert.match(sql, /REFERENCES "public"."media"\("id"\) ON DELETE set null/)
  assert.match(sql, /CREATE INDEX "media_video_thumbnail_idx"/)
  assert.doesNotMatch(sql, /DROP|DELETE FROM|NOT NULL|UPDATE "/)
  const rollback = await sqlFor(down)
  assert.match(rollback, /DROP COLUMN "video_thumbnail_id"/)
  assert.doesNotMatch(rollback, /DROP TABLE|DELETE FROM/)
})

test('snapshot changes no unrelated schema, enum ordering or existing foreign keys', () => {
  const read = (file: string) => JSON.parse(readFileSync(new URL(`../${file}.json`, import.meta.url), 'utf8'))
  const before = read('20261120_185728_remove_reviews')
  const after = read('20261120_190941_sitemap_video_thumbnail')
  assert.equal(after.prevId, before.id)
  const media = after.tables['public.media']
  assert.equal(media.columns.video_thumbnail_id.notNull, false)
  assert.equal(media.foreignKeys.media_video_thumbnail_id_media_id_fk.tableTo, 'media')
  delete media.columns.video_thumbnail_id
  delete media.foreignKeys.media_video_thumbnail_id_media_id_fk
  delete media.indexes.media_video_thumbnail_idx
  after.id = before.id
  after.prevId = before.prevId
  assert.deepEqual(after, before)
})

test('media saves and deletes revalidate populated page and sitemap caches', () => {
  assert.ok(Media.hooks?.afterChange?.includes(revalidateMedia))
  assert.ok(Media.hooks?.afterDelete?.includes(revalidateMediaDelete))
  const field = Media.fields.find((field) => 'name' in field && field.name === 'videoThumbnail')
  assert.ok(field && field.type === 'upload')
  assert.equal(field.relationTo, 'media')
  assert.deepEqual(field.filterOptions, { mimeType: { contains: 'image/' } })
  assert.ok(!field.required)
})
