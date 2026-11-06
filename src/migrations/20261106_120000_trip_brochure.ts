import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Trip Brochure.
 *
 * Adds the optional brochure file to a trip: two relationship columns (`brochure` is a `group`,
 * so its `file` upload lands beside the other uploads — `hero_image_id`, `route_map_id`, …),
 * their indexes, and the `set null` foreign keys into `media`, on both the published table and
 * the drafts table. Nothing else changes: the button on the trip page only renders when the
 * column is filled in, so existing trips keep their exact layout.
 *
 * The brochure itself lives in the `media` library, which is why `src/collections/Media.ts` now
 * accepts `application/pdf` — that collection already streams files through
 * `/api/media/file/<filename>` in every storage mode (disk, Vercel Blob, Postgres).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trips" ADD COLUMN "brochure_file_id" integer;
  ALTER TABLE "_trips_v" ADD COLUMN "version_brochure_file_id" integer;
  ALTER TABLE "trips" ADD CONSTRAINT "trips_brochure_file_id_media_id_fk" FOREIGN KEY ("brochure_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trips_v" ADD CONSTRAINT "_trips_v_version_version_brochure_file_id_media_id_fk" FOREIGN KEY ("version_brochure_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "trips_brochure_file_idx" ON "trips" USING btree ("brochure_file_id");
  CREATE INDEX "_trips_v_version_version_brochure_file_idx" ON "_trips_v" USING btree ("version_brochure_file_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trips" DROP CONSTRAINT "trips_brochure_file_id_media_id_fk";
  ALTER TABLE "_trips_v" DROP CONSTRAINT "_trips_v_version_version_brochure_file_id_media_id_fk";
  DROP INDEX "trips_brochure_file_idx";
  DROP INDEX "_trips_v_version_version_brochure_file_idx";
  ALTER TABLE "trips" DROP COLUMN "brochure_file_id";
  ALTER TABLE "_trips_v" DROP COLUMN "version_brochure_file_id";`)
}
