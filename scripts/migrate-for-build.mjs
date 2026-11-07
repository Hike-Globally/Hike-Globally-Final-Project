#!/usr/bin/env node
/**
 * Applies pending Payload migrations as part of `npm run build`, *before* `next build` starts.
 *
 * Why it is a separate step rather than something `next build` does on its own: Payload applies
 * `prodMigrations` on every production boot, and `next build` boots Payload once per page-data
 * worker. Three workers therefore set out to run the same `ALTER TABLE` at once, which failed a
 * production build with `column "…" already exists` (2026-11-06) and then with two workers burning
 * the full 120s advisory-lock timeout and exiting 1 (2026-11-07, migration
 * `20261107_120000_trip_audience`). Running the migration here — one process, no worker reading the
 * same tables — means the workers find nothing pending and take no lock at all.
 *
 * It is a step in the build command rather than an unconditional `payload migrate` because a build
 * must still work with **no database attached**: `src/lib/data.ts` → `safeQuery` deliberately falls
 * back to static content when `isDatabaseConfigured()` is false ("so builds (e.g. initial Vercel
 * deploy before env vars/DB are attached) and unseeded environments never crash"), and Preview
 * deployments are exactly that case. So:
 *
 *   - no connection string (or the `.env.example` placeholder) → skip, exit 0, and say so;
 *   - a connection string that is configured but unreachable, or a migration that errors → exit
 *     non-zero, so a deploy can never silently ship against an outdated schema.
 *
 * Usage: node scripts/migrate-for-build.mjs   (invoked by `npm run build`)
 */
import { spawnSync } from 'node:child_process'
import { resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The configured Postgres connection string, or `null` when there is none.
 *
 * Mirrors `isDatabaseConfigured()` in `src/lib/payload.ts` — the same three variable names, the same
 * placeholder rejection — so the build and the data layer agree on what "a database is attached"
 * means. Kept as a few lines here rather than imported, because pulling in `src/lib/payload.ts`
 * evaluates the whole Payload config just to read an environment variable.
 */
export const resolveDatabaseUri = (env = process.env) => {
  const uri = (env.DATABASE_URI || env.DATABASE_URL || env.POSTGRES_URL || '').trim()

  if (!uri) return null
  if (uri.includes('@host:') || uri.includes('user:password@host')) return null
  return uri
}

export const main = (env = process.env) => {
  if (!resolveDatabaseUri(env)) {
    console.log(
      '[migrate-for-build] No database configured (DATABASE_URI / DATABASE_URL / POSTGRES_URL) — ' +
        'skipping migrations. The frontend falls back to static content in this state ' +
        '(src/lib/data.ts), so the build can carry on.',
    )
    return 0
  }

  console.log('[migrate-for-build] Applying pending migrations before next build')

  // `npm run migrate` rather than the binary directly, so "how this project migrates" stays defined
  // in one place (package.json) and keeps working on Windows.
  const result = spawnSync('npm', ['run', 'migrate'], {
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  })

  if (result.error) {
    console.error(`[migrate-for-build] Could not run the migration step: ${result.error.message}`)
    return 1
  }

  if (result.status !== 0) {
    console.error(
      `[migrate-for-build] Migrations failed (exit ${result.status}). Refusing to build against ` +
        'an outdated schema — fix the migration or the database and rebuild.',
    )
    return result.status ?? 1
  }

  return 0
}

// Run only when executed directly, so the test file can import the helpers above.
const isDirectRun = process.argv[1]
  ? fileURLToPath(import.meta.url) === resolvePath(process.argv[1])
  : false

if (isDirectRun) process.exitCode = main()
