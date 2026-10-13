import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "trips_packing_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "_trips_v_version_packing_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "trips_packing_list" ADD CONSTRAINT "trips_packing_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_packing_list" ADD CONSTRAINT "_trips_v_version_packing_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trips_packing_list_order_idx" ON "trips_packing_list" USING btree ("_order");
  CREATE INDEX "trips_packing_list_parent_id_idx" ON "trips_packing_list" USING btree ("_parent_id");
  CREATE INDEX "trips_packing_list_locale_idx" ON "trips_packing_list" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_packing_list_order_idx" ON "_trips_v_version_packing_list" USING btree ("_order");
  CREATE INDEX "_trips_v_version_packing_list_parent_id_idx" ON "_trips_v_version_packing_list" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_packing_list_locale_idx" ON "_trips_v_version_packing_list" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "trips_packing_list" CASCADE;
  DROP TABLE "_trips_v_version_packing_list" CASCADE;`)
}
