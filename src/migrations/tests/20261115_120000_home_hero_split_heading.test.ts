/**
 * The homepage hero heading is stored copy, and the seed only writes it once — so on a database that
 * already has a `home` page the new two-line heading has to arrive as a migration. This pins the
 * parts that could silently rot: the `<i>` marker the renderer understands, the narrow WHERE clause
 * (it may only touch the homepage's hero blocks, and only the shipped wordings), and the fact that
 * drafts are updated alongside the published rows.
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import { PgDialect } from 'drizzle-orm/pg-core'

import { down, up } from '../20261115_120000_home_hero_split_heading'

type Statement = { sql: string; params: unknown[] }

const NEW_HEADING = 'Discover Global <i>Adventures with Hike Globally</i>'

const collect = async (run: (args: never) => Promise<void>): Promise<Statement[]> => {
  const statements: Statement[] = []
  const dialect = new PgDialect()

  await run({
    db: {
      execute: async (query: Parameters<PgDialect['sqlToQuery']>[0]) => {
        const { sql, params } = dialect.sqlToQuery(query)
        statements.push({ sql, params })
      },
    },
  } as never)

  return statements
}

const sqlText = (statements: Statement[]) => statements.map((s) => s.sql).join('\n')

const paramsOf = (statements: Statement[]) => statements.flatMap((s) => s.params)

test('rewrites the homepage hero heading into the two-line, two-face form', async () => {
  const statements = await collect(up as never)

  for (const { sql, params } of statements) {
    assert.match(sql, /SET "heading" = \$1/)
    assert.equal(params[0], NEW_HEADING)
  }
})

test('touches both the published and the draft hero rows', async () => {
  const sqls = sqlText(await collect(up as never))

  assert.match(sqls, /UPDATE "pages_blocks_hero_locales"/)
  assert.match(sqls, /UPDATE "_pages_v_blocks_hero_locales"/)
})

test('only replaces the shipped wordings on the page whose slug is home', async () => {
  const statements = await collect(up as never)

  for (const { sql, params } of statements) {
    assert.match(sql, /"page_locale"\."slug" = 'home'/)
    assert.match(sql, /AND "locales"\."heading" IN \(\$\d+/)
    // The replacement is bound first, the wordings it may replace follow.
    assert.deepEqual(params.slice(1), [
      'Discover Global Adventures with Hike Globally',
      'Discover Global <br>Adventures with Hike Globally',
      'Discover Global<br>Adventures with Hike Globally',
    ])
  }
})

test('down() collapses the accent line back into the single-line wording', async () => {
  const statements = await collect(down as never)
  const sqls = sqlText(statements)

  assert.match(sqls, /UPDATE "pages_blocks_hero_locales"/)
  assert.match(sqls, /UPDATE "_pages_v_blocks_hero_locales"/)

  for (const { sql, params } of statements) {
    // The *written* value is the single-line wording — never the `<i>` form.
    assert.match(sql, /SET "heading" = \$1/)
    assert.equal(params[0], 'Discover Global Adventures with Hike Globally')
    // …and only the new two-line heading is eligible, so an editor's copy is untouched.
    assert.deepEqual(params.slice(1), [NEW_HEADING])
  }
})
