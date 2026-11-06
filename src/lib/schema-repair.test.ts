/**
 * The boot-time trip-brochure schema repair.
 *
 * This is the safety net for the database the failed 2026-11-06 production build left behind: the
 * brochure migration was *recorded* as applied, but only two of its six columns had been created, so
 * Payload would never re-run it. The tests pin the two behaviours that matter — a healthy database
 * costs one query and no DDL, and a half-migrated one is completed — plus the rule that a repair
 * problem must never fail a boot.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { ensureTripBrochureSchema } from './schema-repair'
import { TRIP_BROCHURE_COLUMNS } from './trip-brochure-schema'

type Row = Record<string, unknown>

/** A fake `pg.Pool` that records statements and answers the two catalogue queries. */
const fakePool = (options: {
  /** Columns that exist, as `table.column`. */
  columns?: string[]
  /** Columns that exist only until the first ALTER runs (simulating a *partial* migration). */
  lockResult?: boolean
  failAlter?: string
}) => {
  const statements: string[] = []
  const existing = new Set(options.columns ?? [])

  const pool = {
    query: async (text: string) => {
      statements.push(text)

      if (text.includes('FROM information_schema.columns')) {
        return {
          rows: Array.from(existing).map((key) => {
            const [table_name, column_name] = key.split('.')
            return { table_name, column_name } as Row
          }),
        }
      }

      if (text.includes('pg_try_advisory_lock')) {
        return { rows: [{ locked: options.lockResult ?? true }] as Row[] }
      }

      if (text.includes('pg_advisory_unlock')) return { rows: [] as Row[] }

      if (options.failAlter && text.includes(options.failAlter)) {
        throw new Error('permission denied for schema public')
      }

      // Record the column an ALTER would have created, so the test can assert on the result.
      const add = /ADD COLUMN IF NOT EXISTS "([^"]+)" (\w+)/.exec(text)
      if (add) {
        const table = /ALTER TABLE "([^"]+)"/.exec(text)?.[1] ?? ''
        existing.add(`${table}.${add[1]}`)
      }

      return { rows: [] as Row[] }
    },
  }

  return { pool, statements, existing }
}

const payloadWith = (
  pool: unknown,
  logs: { info: string[]; error: string[] } = { info: [], error: [] },
) =>
  ({
    db: { pool },
    logger: {
      info: (message: string) => logs.info.push(message),
      error: (message: string) => logs.error.push(message),
    },
  }) as never

const allColumns = TRIP_BROCHURE_COLUMNS.map(({ table, column }) => `${table}.${column}`)

test('a complete schema costs one catalogue query and no DDL', async () => {
  const { pool, statements } = fakePool({ columns: allColumns })

  await ensureTripBrochureSchema(payloadWith(pool))

  assert.equal(statements.length, 1)
  assert.match(statements[0]!, /information_schema\.columns/)
})

test('a database left half-migrated has every missing column added', async () => {
  // Exactly what the failed build produced: both `_id` columns, none of the localized ones.
  const { pool, existing } = fakePool({
    columns: ['trips.brochure_file_id', '_trips_v.version_brochure_file_id'],
  })

  await ensureTripBrochureSchema(payloadWith(pool))

  for (const column of allColumns) {
    assert.ok(existing.has(column), `${column} should have been created`)
  }
})

test('a never-migrated database is left to the migrations', async () => {
  const { pool, statements } = fakePool({ columns: [] })

  await ensureTripBrochureSchema(payloadWith(pool))

  assert.equal(statements.length, 1, 'only the catalogue query; no DDL before the first migration')
})

test('a repair problem is logged, not thrown — boot must survive it', async () => {
  const logs = { info: [], error: [] as string[] }
  const { pool } = fakePool({ columns: ['trips.brochure_file_id'], failAlter: 'ADD COLUMN' })

  await assert.doesNotReject(() => ensureTripBrochureSchema(payloadWith(pool, logs)))

  assert.equal(logs.error.length, 2)
  assert.match(logs.error[0]!, /could not add the missing trip brochure schema/)
  assert.match(logs.error[1]!, /20261106_120000_trip_brochure/)
})

test('an unreachable database does not stop the boot', async () => {
  const pool = {
    query: async () => {
      throw new Error('ECONNREFUSED')
    },
  }

  await assert.doesNotReject(() => ensureTripBrochureSchema(payloadWith(pool)))
})

test('when another boot holds the repair lock this one does no DDL', async () => {
  const { pool, statements } = fakePool({
    columns: ['trips.brochure_file_id'],
    lockResult: false,
  })

  await ensureTripBrochureSchema(payloadWith(pool))

  assert.deepEqual(
    statements.filter((s) => s.startsWith('ALTER')),
    [],
    'the process that did not get the lock must not race the one that did',
  )
})

test('a payload without a pool is ignored (build-time, no database)', async () => {
  await assert.doesNotReject(() => ensureTripBrochureSchema({ db: {} } as never))
})
