import assert from 'node:assert/strict'
import test from 'node:test'

import { PgDialect } from 'drizzle-orm/pg-core'

import { up } from './20261107_120000_trip_audience'

test('trip audience migration normalizes legacy layout kinds before enum casts', async () => {
  const statements: string[] = []
  const dialect = new PgDialect()

  await up({
    db: {
      execute: async (query: Parameters<PgDialect['sqlToQuery']>[0]) => {
        statements.push(dialect.sqlToQuery(query).sql)
      },
    },
  } as never)

  const migrationSql = statements.join('\n')
  for (const table of ['trips_page_sections', '_trips_v_version_page_sections']) {
    const normalizeAt = migrationSql.indexOf(
      `UPDATE "${table}" SET "kind" = 'audience' WHERE "kind" IN ('whoFor', 'whoNotFor')`,
    )
    const castAt = migrationSql.indexOf(
      `ALTER TABLE "${table}" ALTER COLUMN "kind" SET DATA TYPE "public".`,
    )

    assert.notEqual(normalizeAt, -1, `${table} must map legacy audience values`)
    assert.notEqual(castAt, -1, `${table} must still restore the enum type`)
    assert.ok(normalizeAt < castAt, `${table} values must be normalized before the enum cast`)
  }

  assert.match(migrationSql, /PARTITION BY "_parent_id", "_locale" ORDER BY "_order"/)
  assert.match(migrationSql, /WHERE "kind" IN \('audience', 'whoFor', 'whoNotFor'\)/)
})
