import type { Payload } from 'payload'

import {
  TRIP_BROCHURE_COLUMNS,
  brochureSchemaIsComplete,
  tripBrochureSchemaStatements,
} from './trip-brochure-schema'

/**
 * Boot-time schema repair for the trip brochure columns — see `src/lib/trip-brochure-schema.ts`
 * for why the production database can be missing them even though the migration is recorded as
 * applied.
 *
 * Design rules, borrowed from the media store's own boot check (`ensureMediaStorageSchema`):
 *
 *  - **Cheap when healthy.** One catalog query decides whether anything is missing; a complete
 *    database does no DDL at all. Boots are frequent, so the common path must not cost anything.
 *  - **Never fatal.** A role without DDL rights, or a transient connection problem, must not take
 *    the site down: the failure is logged with what to run by hand, and boot continues.
 *  - **Runs once per process.** `onInit` is called once per Payload instance; the promise is also
 *    memoised so a re-entrant boot (Payload CLI, tests) does not repeat the work.
 */

/** `pg.Pool`-shaped accessor — the adapter holds the pool, not this module. */
type Pool = { query: (text: string) => Promise<{ rows: Record<string, unknown>[] }> }

/**
 * Advisory-lock key for the repair, separate from the per-migration keys in
 * `src/lib/migration-guard.ts`. Boots are concurrent by nature (`next build` renders pages in
 * several workers), so two processes can find the same missing column and race to create it —
 * `ADD COLUMN IF NOT EXISTS` tolerates that, but the drop-then-add constraint pair does not.
 * Whoever gets the lock repairs; the others return and pick up the finished schema on their own
 * first query.
 */
const REPAIR_LOCK_KEY = 174_638_578

const poolOf = (payload: Payload): Pool | null => {
  const db = payload?.db as unknown as { pool?: Pool } | undefined
  return db?.pool ?? null
}

/** The `table.column` keys that currently exist in the `public` schema. */
const existingColumns = async (pool: Pool): Promise<Set<string>> => {
  const tables = Array.from(new Set(TRIP_BROCHURE_COLUMNS.map(({ table }) => table)))
  const { rows } = await pool.query(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN (${tables.map((t) => `'${t}'`).join(', ')})`,
  )

  return new Set(rows.map((row) => `${String(row.table_name)}.${String(row.column_name)}`))
}

/**
 * Creates any brochure column/constraint/index that is missing. Called from Payload's `onInit`, so
 * it runs after the connection is live and before the first query the site serves.
 */
export const ensureTripBrochureSchema = async (payload: Payload): Promise<void> => {
  const pool = poolOf(payload)
  if (!pool) return

  let existing: Set<string>
  try {
    existing = await existingColumns(pool)
  } catch {
    // No connection (build without a database, unreachable host): nothing to repair here. The
    // migration is the source of truth on a real deployment; this is only a repair for the state
    // the failed build left behind.
    return
  }

  // At least one of the tables must exist at all; if none do, this database has never been
  // migrated and the normal migration path owns the schema.
  if (existing.size === 0) return
  if (brochureSchemaIsComplete(existing)) return

  // Non-blocking: if another process is already repairing, this one just carries on booting.
  let held = false
  try {
    const lock = await pool.query(`SELECT pg_try_advisory_lock(${REPAIR_LOCK_KEY}::int) AS locked`)
    held = Boolean(lock.rows[0]?.locked)
  } catch {
    held = false
  }
  if (!held) return

  try {
    await applyStatements(payload, pool)
  } finally {
    await pool.query(`SELECT pg_advisory_unlock(${REPAIR_LOCK_KEY}::int)`).catch(() => {})
  }
}

const applyStatements = async (payload: Payload, pool: Pool): Promise<void> => {
  for (const statement of tripBrochureSchemaStatements) {
    try {
      await pool.query(statement)
    } catch (error) {
      payload.logger.error(
        `[schema] could not add the missing trip brochure schema automatically: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
      payload.logger.error(
        '[schema] run `npm run migrate` against this database, or apply ' +
          'src/migrations/20261106_120000_trip_brochure.ts by hand (it is idempotent), to finish ' +
          'the repair.',
      )
      return
    }
  }

  payload.logger.info('[schema] added the missing trip brochure columns.')
}
