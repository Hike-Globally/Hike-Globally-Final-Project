import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `trips.coordinates_latitude` / `trips.coordinates_longitude`, plus the versioned pair on
 * `_trips_v` so drafts and autosaves keep the pin.
 *
 * `numeric`, not `float`: the same type the Destinations `coordinates` group already uses (see
 * `20261003_075051_initial`), so both collections store and read coordinates identically. Payload's
 * `number` field is nullable by default here, and `ADD COLUMN` without a default is a cheap
 * metadata-only change in Postgres — no table rewrite, no backfill, and existing trips simply point
 * at nothing, which the page reads as "no map".
 *
 * Both tables already exist by this point in the chain, so this is additive only.
 */
const columns = [
  ['trips', 'coordinates_latitude'],
  ['trips', 'coordinates_longitude'],
  ['_trips_v', 'version_coordinates_latitude'],
  ['_trips_v', 'version_coordinates_longitude'],
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [table, column] of columns) {
    await db.execute(sql.raw(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" numeric`))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [table, column] of [...columns].reverse()) {
    await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}"`))
  }
}
