import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Trip Brochure.
 *
 * Adds the brochure to a trip:
 *   - `trips.brochure_file_id` — the upload (brochureFile);
 *   - `trips_locales.brochure_title` / `brochure_note` — the two optional, localized button overrides;
 *   - the same three on the drafts tables (`_trips_v`, `_trips_v_locales`);
 *   - the indexes and `set null` foreign keys into `media` for the upload.
 *
 * Nothing else changes: the button on the trip page only renders when the column is filled in, so
 * existing trips keep their exact layout.
 *
 * ── Why every statement is written with IF (NOT) EXISTS ─────────────────────────────────────────
 * The first version of this migration created only the two `_id` columns and was already recorded
 * in production when the build failed, leaving exactly that half-applied state behind. That
 * database reports this migration as "done", so Payload will never re-run `up` for it there — the
 * localized columns have to come from somewhere else (see the boot-time schema repair in
 * `src/lib/migration-guard.ts`), but running this file by hand (`npm run migrate` on a fresh
 * clone, or `payload migrate:down` then up) must still be able to finish the job on a database in
 * that state. Writing it idempotently is what makes "run it again" a safe, complete repair.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "brochure_file_id" integer;
  ALTER TABLE "trips_locales" ADD COLUMN IF NOT EXISTS "brochure_title" varchar;
  ALTER TABLE "trips_locales" ADD COLUMN IF NOT EXISTS "brochure_note" varchar;
  ALTER TABLE "_trips_v" ADD COLUMN IF NOT EXISTS "version_brochure_file_id" integer;
  ALTER TABLE "_trips_v_locales" ADD COLUMN IF NOT EXISTS "version_brochure_title" varchar;
  ALTER TABLE "_trips_v_locales" ADD COLUMN IF NOT EXISTS "version_brochure_note" varchar;
  ALTER TABLE "trips" DROP CONSTRAINT IF EXISTS "trips_brochure_file_id_media_id_fk";
  ALTER TABLE "_trips_v" DROP CONSTRAINT IF EXISTS "_trips_v_version_version_brochure_file_id_media_id_fk";
  ALTER TABLE "trips" ADD CONSTRAINT "trips_brochure_file_id_media_id_fk" FOREIGN KEY ("brochure_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trips_v" ADD CONSTRAINT "_trips_v_version_version_brochure_file_id_media_id_fk" FOREIGN KEY ("version_brochure_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "trips_brochure_file_idx" ON "trips" USING btree ("brochure_file_id");
  CREATE INDEX IF NOT EXISTS "_trips_v_version_version_brochure_file_idx" ON "_trips_v" USING btree ("version_brochure_file_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trips" DROP CONSTRAINT IF EXISTS "trips_brochure_file_id_media_id_fk";
  ALTER TABLE "_trips_v" DROP CONSTRAINT IF EXISTS "_trips_v_version_version_brochure_file_id_media_id_fk";
  DROP INDEX IF EXISTS "trips_brochure_file_idx";
  DROP INDEX IF EXISTS "_trips_v_version_version_brochure_file_idx";
  ALTER TABLE "trips" DROP COLUMN IF EXISTS "brochure_file_id";
  ALTER TABLE "trips_locales" DROP COLUMN IF EXISTS "brochure_title";
  ALTER TABLE "trips_locales" DROP COLUMN IF EXISTS "brochure_note";
  ALTER TABLE "_trips_v" DROP COLUMN IF EXISTS "version_brochure_file_id";
  ALTER TABLE "_trips_v_locales" DROP COLUMN IF EXISTS "version_brochure_title";
  ALTER TABLE "_trips_v_locales" DROP COLUMN IF EXISTS "version_brochure_note";`)
}
