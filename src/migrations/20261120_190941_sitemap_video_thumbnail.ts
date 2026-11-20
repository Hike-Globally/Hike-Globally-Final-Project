import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Optional video poster; existing uploads and content are untouched. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN "video_thumbnail_id" integer;
    ALTER TABLE "media" ADD CONSTRAINT "media_video_thumbnail_id_media_id_fk"
      FOREIGN KEY ("video_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX "media_video_thumbnail_idx" ON "media" USING btree ("video_thumbnail_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" DROP CONSTRAINT "media_video_thumbnail_id_media_id_fk";
    DROP INDEX "media_video_thumbnail_idx";
    ALTER TABLE "media" DROP COLUMN "video_thumbnail_id";
  `)
}
