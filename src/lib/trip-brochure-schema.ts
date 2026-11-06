/**
 * Boot-time schema repair for the trip brochure columns.
 *
 * Why this exists — the 2026-11-06 production build:
 *
 *   1. `next build` started three workers, each booting Payload;
 *   2. all three tried to run `20261106_120000_trip_brochure` at the same time;
 *   3. one won, the other two died with `column "brochure_file_id" already exists` and took the
 *      build with them (fixed by `src/lib/migration-guard.ts`).
 *
 * The winner had committed two `ADD COLUMN`s before the losers failed, so the version of that
 * migration that shipped created a **partial** schema: `trips.brochure_file_id` and
 * `_trips_v.version_brochure_file_id` existed, but the two localized columns
 * (`brochure_title`, `brochure_note`) did not. Payload had already recorded the migration as done,
 * so it will never re-run it on that database — every trips query would then fail with
 * `column trips__locales.brochure_title does not exist`, which does not fail at build time (the
 * migrations never finish) but *would* fail the moment the site boots.
 *
 * `ensureTripBrochureSchema` closes that gap the same way the media store closes its own
 * (`src/storage/database-adapter.ts` → `ensureMediaStorageSchema`): on boot, create anything that is
 * missing, then stop. Every statement is `IF NOT EXISTS`, so a database that is already complete —
 * the normal case, including every fresh deployment and every local database — does no work at all.
 *
 * The DDL here must stay identical in shape to `src/migrations/20261106_120000_trip_brochure.ts`.
 * It is duplicated rather than imported because a migration file is frozen history, while this
 * module describes the schema as it must exist *now*; a `CREATE TABLE IF NOT EXISTS`-style guard is
 * what lets the two be updated independently without ever fighting.
 */

/**
 * Columns the brochure feature needs, with the table that owns each one.
 *
 * `brochureFile` is an upload relationship, so its id lives on the main table; `brochureTitle` and
 * `brochureNote` are `localized: true`, so Payload stores them in the `_locales` table of the
 * collection (and of its drafts table, prefixed `version_`).
 */
export const TRIP_BROCHURE_COLUMNS: readonly { table: string; column: string; type: string }[] = [
  { table: 'trips', column: 'brochure_file_id', type: 'integer' },
  { table: 'trips_locales', column: 'brochure_title', type: 'varchar' },
  { table: 'trips_locales', column: 'brochure_note', type: 'varchar' },
  { table: '_trips_v', column: 'version_brochure_file_id', type: 'integer' },
  { table: '_trips_v_locales', column: 'version_brochure_title', type: 'varchar' },
  { table: '_trips_v_locales', column: 'version_brochure_note', type: 'varchar' },
]

/**
 * `ALTER TABLE … ADD COLUMN IF NOT EXISTS` for every missing column, plus the index and foreign key
 * the upload column needs. Safe to run on every boot: statements that have nothing to do are cheap
 * no-ops in Postgres.
 */
export const tripBrochureSchemaStatements: readonly string[] = [
  ...TRIP_BROCHURE_COLUMNS.map(
    ({ table, column, type }) =>
      `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${type}`,
  ),
  // `ADD CONSTRAINT` has no IF NOT EXISTS form, so the constraint is dropped first. It is a
  // `set null` relationship: no rows are touched, and re-creating it costs one catalog check.
  `ALTER TABLE "trips" DROP CONSTRAINT IF EXISTS "trips_brochure_file_id_media_id_fk"`,
  `ALTER TABLE "trips" ADD CONSTRAINT "trips_brochure_file_id_media_id_fk" FOREIGN KEY ("brochure_file_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action`,
  `ALTER TABLE "_trips_v" DROP CONSTRAINT IF EXISTS "_trips_v_version_version_brochure_file_id_media_id_fk"`,
  `ALTER TABLE "_trips_v" ADD CONSTRAINT "_trips_v_version_version_brochure_file_id_media_id_fk" FOREIGN KEY ("version_brochure_file_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action`,
  `CREATE INDEX IF NOT EXISTS "trips_brochure_file_idx" ON "trips" USING btree ("brochure_file_id")`,
  `CREATE INDEX IF NOT EXISTS "_trips_v_version_version_brochure_file_idx" ON "_trips_v" USING btree ("version_brochure_file_id")`,
]

/**
 * True when every brochure column already exists — the common case, and the one that must not cost
 * a boot anything.
 */
export const brochureSchemaIsComplete = (
  existing: ReadonlySet<string>, // "table.column" keys
): boolean => TRIP_BROCHURE_COLUMNS.every(({ table, column }) => existing.has(`${table}.${column}`))
