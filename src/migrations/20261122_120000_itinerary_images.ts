import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Itinerary rows are localized; draft versions have their own parallel table.
const tables = ['trips_itinerary', '_trips_v_version_itinerary'] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of tables) {
    for (const number of [1, 2, 3]) {
      const column = `image${number}_id`
      await db.execute(sql.raw(`ALTER TABLE "${table}" ADD COLUMN "${column}" integer`))
      await db.execute(
        sql.raw(
          `ALTER TABLE "${table}" ADD CONSTRAINT "${table}_${column}_media_fk" FOREIGN KEY ("${column}") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action`,
        ),
      )
      await db.execute(
        sql.raw(
          `CREATE INDEX "${table}_image${number}_idx" ON "${table}" USING btree ("${column}")`,
        ),
      )
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of tables) {
    for (const number of [1, 2, 3]) {
      await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN "image${number}_id"`))
    }
  }
}
