/**
 * The three places the trip brochure columns are described must not drift apart:
 *
 *   1. `src/migrations/20261106_120000_trip_brochure.ts` — the migration a fresh database runs;
 *   2. `src/migrations/20261106_120000_trip_brochure.json` — the snapshot `migrate:create` diffs
 *      against, so the *next* migration does not try to re-add these columns;
 *   3. `src/lib/trip-brochure-schema.ts` — the boot-time repair.
 *
 * They already drifted once and it cost a production build: the shipping migration only created the
 * two `_id` columns while the collection declared two localized strings as well. Payload's dev-mode
 * push hid it locally, and production has no push.
 *
 * These tests read the files rather than importing the migration (which needs a database `sql` tag),
 * and they fail loudly if a column is missing from any of the three.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { TRIP_BROCHURE_COLUMNS } from './trip-brochure-schema'

const root = path.resolve(import.meta.dirname, '..', '..')
const migration = readFileSync(
  path.join(root, 'src/migrations/20261106_120000_trip_brochure.ts'),
  'utf8',
)
const snapshot = JSON.parse(
  readFileSync(path.join(root, 'src/migrations/20261106_120000_trip_brochure.json'), 'utf8'),
) as { tables: Record<string, { columns: Record<string, unknown> }> }

/** Columns in the snapshot, as `table.column` (the snapshot keys tables as `public.<name>`). */
const snapshotColumns = new Set(
  Object.entries(snapshot.tables).flatMap(([table, definition]) =>
    Object.keys(definition.columns ?? {}).map(
      (column) => `${table.replace(/^public\./, '')}.${column}`,
    ),
  ),
)

test('the migration creates every brochure column, and the snapshot knows about it', () => {
  for (const { table, column } of TRIP_BROCHURE_COLUMNS) {
    assert.match(
      migration,
      new RegExp(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}"`),
      `the migration is missing ${table}.${column}`,
    )
    assert.ok(
      snapshotColumns.has(`${table}.${column}`),
      `the snapshot is missing ${table}.${column} — the next migrate:create would try to re-add it`,
    )
  }
})

test('the migration can be reversed: every column it adds, it also drops', () => {
  const down = migration.slice(migration.indexOf('export async function down'))

  for (const { table, column } of TRIP_BROCHURE_COLUMNS) {
    assert.match(
      down,
      new RegExp(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}"`),
      `down() does not remove ${table}.${column}`,
    )
  }
})

test('every statement is idempotent, so re-running repairs rather than fails', () => {
  // `ALTER TABLE … ADD CONSTRAINT` is the one statement Postgres has no IF NOT EXISTS form for; it
  // is always preceded by the matching DROP … IF EXISTS, which is what makes it repeatable.
  const statements = migration
    .split('sql`')[1]
    ?.split('`')[0]
    ?.split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  assert.ok(statements && statements.length > 0, 'could not read the up() statements')

  for (const statement of statements) {
    const repeatable =
      /IF NOT EXISTS/.test(statement) ||
      /IF EXISTS/.test(statement) ||
      (/ADD CONSTRAINT/.test(statement) && /_media_id_fk/.test(statement))
    assert.ok(repeatable, `not idempotent: ${statement}`)
  }
})
