import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * ============================================================================
 * Serialised production migrations.
 * ============================================================================
 *
 * Payload applies `prodMigrations` **on boot** whenever `NODE_ENV === 'production'`
 * (`@payloadcms/db-postgres` → `connect()`), and a boot is not a one-off event:
 *
 *   - `next build` collects page data with several workers, and every worker that renders a page
 *     which queries Payload opens its own connection — so three migrations run at once;
 *   - a fresh deployment's first requests can also land on more than one instance.
 *
 * `@payloadcms/drizzle` migrates by *reading* `payload_migrations`, skipping the names already
 * recorded, then inserting a row when a migration finishes. Processes that boot together all see
 * the same "not yet migrated" list, all run the same DDL, and the losers die with
 * `column "…" already exists` / `duplicate key value violates unique constraint
 * "pg_type_typname_nsp_index"` — which fails the whole build (the "Vercel build failed at page data
 * collection" failure of 2026-11-06). The transaction each migration runs in does not help: it
 * hides the winner's uncommitted work from the loser, and the winner commits first anyway.
 *
 * `serialiseMigrations` wraps every migration's `up` in a Postgres **advisory lock** keyed on the
 * migration's name, then re-checks `payload_migrations` *inside* the lock. So:
 *
 *   - the first process to take the lock migrates and records the row;
 *   - the others wait, then see the row and return without touching the schema.
 *
 * It is applied once, in `src/payload.config.ts`, so every migration — past and future — is
 * covered, and no individual migration file needs to know about concurrency. Only production
 * (where `prodMigrations` is used) is wrapped. The `payload migrate` CLI reads the migration files
 * directly, so it keeps its own ordering and behaves exactly as before.
 *
 * The guard is the safety net, **not** the plan: `npm run build` now runs `payload migrate` itself,
 * in one process, before `next build` starts its workers, so on a normal deploy the workers find
 * nothing pending and never take a lock at all.
 *
 * ---------------------------------------------------------------------------
 * The lock is transaction-scoped, and that is the whole subtlety
 * ---------------------------------------------------------------------------
 *
 * `@payloadcms/drizzle` runs every migration like this (`dist/migrate.js` → `runMigrationFile`):
 *
 *     await initTransaction(req)                        // BEGIN, on one dedicated connection
 *     const db = await getTransaction(payload.db, req)  // that connection, as a drizzle tx
 *     await migration.up({ db, payload, req })          // ← the wrapped `up` runs in here
 *     await payload.create({ collection: 'payload-migrations', …, req })
 *     await commitTransaction(req)                      // COMMIT
 *
 * The row that says "this migration has run" is written *after* `up` returns, and only becomes
 * visible to other processes when the transaction commits. A **session**-level advisory lock
 * (`pg_try_advisory_lock`) released inside `up` is therefore released too early: the next process
 * takes the lock, re-checks `payload_migrations`, cannot see the uncommitted row, and runs the same
 * DDL a second time.
 *
 * `pg_try_advisory_xact_lock` is held until *this transaction* ends — precisely the window that has
 * to be protected — and Postgres drops it on its own at COMMIT or ROLLBACK. So there is nothing to
 * unlock, nothing to leak, and a rolled-back migration frees the lock for the next process without
 * anyone remembering to release it. (This relies on `up` running inside that transaction, which is
 * what the source above shows; `payload migrate` and `prodMigrations` share `runMigrationFile`.)
 *
 * A process that cannot take the lock does not merely wait for it either: every poll re-checks
 * `payload_migrations` and returns the moment the row appears. The window we are waiting for is
 * "somebody else committed", not "the lock object is free", so a lock that is stuck for an
 * unrelated reason — a long DDL, a dead session, a leaked lock from an older build — costs one poll
 * round instead of the whole timeout. That is what failed the 2026-11-07 build: three workers
 * raced, two of them spent 120s unable to take the lock and exited, taking the build with them.
 */

/** Advisory-lock namespace for this repository's migrations ("HGMI" as a number). */
const MIGRATION_LOCK_NAMESPACE = 174_638_577

/** How long a booting process waits for another one to finish before giving up. */
const DEFAULT_LOCK_TIMEOUT_MS = 120_000

/** Poll interval while another process holds the lock. */
const DEFAULT_LOCK_POLL_MS = 200

/** A migration as Payload's `prodMigrations` expects it. */
export type Migration = {
  up: (args: MigrateUpArgs) => Promise<void>
  down: (args: MigrateDownArgs) => Promise<void>
  name: string
}

/**
 * The handful of things this module needs from Payload's database adapter. Kept structural so the
 * helper can be unit-tested with a fake connection.
 */
export type MigrationDb = {
  execute: (
    query: unknown,
    params?: Record<string, unknown>,
  ) => Promise<{ rows?: Record<string, unknown>[] }>
}

/**
 * Injectable so the tests can drive the timeout path in milliseconds instead of the two minutes
 * production waits. Production takes the defaults by passing nothing.
 */
export type SerialiseOptions = {
  lockTimeoutMs?: number
  lockPollMs?: number
}

type PayloadSql = (strings: TemplateStringsArray, ...values: unknown[]) => unknown

/** Payload's `sql` tag, injected so this module has no runtime dependency on drizzle. */
type SqlTag = PayloadSql

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * True when `payload_migrations` already records this migration.
 *
 * A database that has never been migrated has no such table — the first migration creates it — so
 * a missing table means "nothing has run yet", never an error.
 */
const isRecorded = async (db: MigrationDb, sql: SqlTag, name: string): Promise<boolean> => {
  const table = await db.execute(sql`SELECT to_regclass('public.payload_migrations') AS name`)
  if (!(table.rows?.[0] as { name?: string | null } | undefined)?.name) return false

  // `${name}` is bound as a parameter by the template tag: this is an equality check, not SQL
  // string concatenation.
  const rows = await db.execute(sql`SELECT 1 FROM payload_migrations WHERE name = ${name} LIMIT 1`)
  return Boolean(rows.rows?.length)
}

/** One non-blocking attempt at the migration's transaction-scoped advisory lock. */
const tryLock = async (db: MigrationDb, sql: SqlTag, name: string): Promise<boolean> => {
  const result = await db.execute(
    sql`SELECT pg_try_advisory_xact_lock(${MIGRATION_LOCK_NAMESPACE}::int, hashtext(${name})::int) AS locked`,
  )
  return Boolean((result.rows?.[0] as { locked?: boolean } | undefined)?.locked)
}

/**
 * Blocks until this process may run the migration: either it holds the lock, or another process
 * has committed the row (at which point there is nothing left to do).
 *
 * Polling rather than blocking keeps a stuck holder producing a clear timeout instead of a build
 * that hangs until the platform kills it. Nothing is returned to release — the lock belongs to the
 * transaction and Postgres frees it at COMMIT/ROLLBACK.
 */
const waitForOurTurn = async (
  db: MigrationDb,
  sql: SqlTag,
  name: string,
  { lockTimeoutMs, lockPollMs }: Required<SerialiseOptions>,
): Promise<void> => {
  const deadline = Date.now() + lockTimeoutMs

  for (;;) {
    if (await tryLock(db, sql, name)) return

    // The holder can commit while we are polling. That is the answer we actually wanted, and it
    // does not need the lock — so a lock that never frees up no longer costs us the whole timeout.
    if (await isRecorded(db, sql, name)) return

    if (Date.now() > deadline) {
      throw new Error(
        `Timed out after ${lockTimeoutMs / 1000}s waiting for another process to run migration ` +
          `"${name}". Another build or instance is migrating this database; retry once it has ` +
          `finished.`,
      )
    }

    await wait(lockPollMs)
  }
}

/**
 * Wraps every migration so it runs at most once across processes booting at the same time.
 *
 * `sql` is Payload's own tag (`import { sql } from '@payloadcms/db-postgres'`), passed in rather
 * than imported so this file stays free of runtime dependencies and testable on its own.
 */
export const serialiseMigrations = <T extends Migration>(
  migrations: readonly T[],
  sql: SqlTag,
  options: SerialiseOptions = {},
): T[] => {
  const timing: Required<SerialiseOptions> = {
    lockTimeoutMs: options.lockTimeoutMs ?? DEFAULT_LOCK_TIMEOUT_MS,
    lockPollMs: options.lockPollMs ?? DEFAULT_LOCK_POLL_MS,
  }

  return migrations.map((migration) => ({
    ...migration,
    up: async (args: MigrateUpArgs) => {
      const db = args.db as unknown as MigrationDb

      // The normal case for every boot after the first: another process recorded it long ago.
      // Checked before touching the lock, so an up-to-date database takes no lock at all.
      if (await isRecorded(db, sql, migration.name)) return

      await waitForOurTurn(db, sql, migration.name, timing)

      // Re-checked now that our turn is settled: every process's first check ran before any of
      // them committed, so it cannot be trusted.
      if (await isRecorded(db, sql, migration.name)) return

      await migration.up(args)
    },
  }))
}
