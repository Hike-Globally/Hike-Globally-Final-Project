import assert from 'node:assert/strict'
import test from 'node:test'
import { PgDialect } from 'drizzle-orm/pg-core'
import { up } from '../20261120_200000_home_seo_defaults'
import { migrations } from '../index'

test('only unpins exact old SEO fields on English home pages and their current drafts', async () => {
  const index = migrations.findIndex((migration) => migration.up === up)
  assert.equal(migrations[index - 1]?.name, '20261120_190941_sitemap_video_thumbnail')
  const dialect = new PgDialect()
  const statements: string[] = []
  await up({ db: { execute: async (query: Parameters<PgDialect['sqlToQuery']>[0]) => {
    const { sql, params } = dialect.sqlToQuery(query)
    assert.match(String(params[0]), /Family Tours/)
    assert.match(String(params[1]), /^Discover family tours/)
    assert.deepEqual(params.slice(2), params.slice(0, 2))
    statements.push(sql.replace(/\s+/g, ' '))
  } } } as never)
  assert.equal(statements.length, 2)
  for (const [index, prefix] of ['', 'version_'].entries()) {
    const statement = statements[index]
    for (const [i, field] of ['meta_title','meta_description'].entries()) {
      assert.ok(statement.includes(`${prefix}${field} = NULLIF(${prefix}${field}, $${i + 1})`))
    }
    assert.ok(statement.includes(`WHERE _locale = 'en' AND ${prefix}slug = 'home'`))
  }
  assert.match(statements[1], /SELECT id FROM _pages_v WHERE latest = true/)
})
