import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "trips_content_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"content" jsonb
  );
  
  CREATE TABLE "_trips_v_version_content_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"content" jsonb,
  	"_uuid" varchar
  );
  
  ALTER TABLE "trips_content_sections" ADD CONSTRAINT "trips_content_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_content_sections" ADD CONSTRAINT "_trips_v_version_content_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trips_content_sections_order_idx" ON "trips_content_sections" USING btree ("_order");
  CREATE INDEX "trips_content_sections_parent_id_idx" ON "trips_content_sections" USING btree ("_parent_id");
  CREATE INDEX "trips_content_sections_locale_idx" ON "trips_content_sections" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_content_sections_order_idx" ON "_trips_v_version_content_sections" USING btree ("_order");
  CREATE INDEX "_trips_v_version_content_sections_parent_id_idx" ON "_trips_v_version_content_sections" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_content_sections_locale_idx" ON "_trips_v_version_content_sections" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "trips_content_sections" CASCADE;
  DROP TABLE "_trips_v_version_content_sections" CASCADE;`)
}
