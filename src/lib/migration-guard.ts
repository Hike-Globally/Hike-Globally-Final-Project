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
 * That is the whole fix. It is applied once, in `src/payload.config.ts`, so every migration — past
 * and future — is covered, and no individual migration file needs to know about concurrency.
 *
 * Only production (where `prodMigrations` is used) is wrapped. The `payload migrate` CLI reads the
 * migration files directly, so it keeps its own ordering and behaves exactly as before.
 */

/** Advisory-lock namespace for this repository's migrations ("HGMI" as a number). */
const MIGRATION_LOCK_NAMESPACE = 174_638_577

/** How long a booting process waits for another one to finish before giving up. */
const LOCK_TIMEOUT_MS = 120_000

/** Poll interval while another process holds the lock. */
const LOCK_POLL_MS = 200

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

type PayloadSql = (strings: TemplateStringsArray, ...values: unknown[]) => unknown

/** Payload's `sql` tag, injected so this module has no runtime dependency on drizzle. */
type SqlTag = PayloadSql

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Takes the advisory lock for one migration, polling instead of blocking so a stuck holder
 * produces a clear timeout instead of a build that hangs until the platform kills it.
 *
 * Returns a release function that is always safe to call.
 */
const acquireLock = async (
  db: MigrationDb,
  sql: SqlTag,
  name: string,
): Promise<() => Promise<void>> => {
  const deadline = Date.now() + LOCK_TIMEOUT_MS

  for (;;) {
    const result = await db.execute(
      sql`SELECT pg_try_advisory_lock(${MIGRATION_LOCK_NAMESPACE}::int, hashtext(${name})::int) AS locked`,
    )
    const locked = Boolean((result.rows?.[0] as { locked?: boolean } | undefined)?.locked)

    if (locked) {
      return async () => {
        try {
          await db.execute(
            sql`SELECT pg_advisory_unlock(${MIGRATION_LOCK_NAMESPACE}::int, hashtext(${name})::int)`,
          )
        } catch {
          // The lock is also released when the connection closes, so a failed unlock is never
          // worth failing a migration over.
        }
      }
    }

    if (Date.now() > deadline) {
      throw new Error(
        `Timed out after ${LOCK_TIMEOUT_MS / 1000}s waiting for another process to run migration ` +
          `"${name}". Another build or instance is migrating this database; retry once it has finished.`,
      )
    }

    await wait(LOCK_POLL_MS)
  }
}

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

/**
 * Wraps every migration so it runs at most once across processes booting at the same time.
 *
 * `sql` is Payload's own tag (`import { sql } from '@payloadcms/db-postgres'`), passed in rather
 * than imported so this file stays free of runtime dependencies and testable on its own.
 */
export const serialiseMigrations = <T extends Migration>(
  migrations: readonly T[],
  sql: SqlTag,
): T[] =>
  migrations.map((migration) => ({
    ...migration,
    up: async (args: MigrateUpArgs) => {
      const db = args.db as unknown as MigrationDb
      const release = await acquireLock(db, sql, migration.name)

      try {
        // Re-checked *inside* the lock: every process's earlier check ran before any of them
        // committed, so it cannot be trusted.
        if (await isRecorded(db, sql, migration.name)) return
        await migration.up(args)
      } finally {
        await release()
      }
    },
  }))
