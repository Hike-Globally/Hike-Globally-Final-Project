import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `trips_itinerary.place` — the short place name printed under each day on the altitude chart
 * — plus its versioned twin on `_trips_v_version_itinerary`.
 *
 * Itinerary rows are localized (see `20261003_081622_localize_arrays`), so `place` is a localized
 * text column: one value per locale, on the same row, next to `title` and `description`. `varchar`
 * matches Payload's text field, and the 40-character `maxLength` in the collection is an admin
 * constraint, not a database one — no width is declared here, exactly like `title`.
 *
 * Nullable on purpose: every existing itinerary row keeps working, and the chart falls back to
 * "Day n" where `place` is empty. Additive only — no backfill, no table rewrite.
 */
const tables = ['trips_itinerary', '_trips_v_version_itinerary'] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of tables) {
    await db.execute(sql.raw(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "place" varchar`))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of [...tables].reverse()) {
    await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "place"`))
  }
}
