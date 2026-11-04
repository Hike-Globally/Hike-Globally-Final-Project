import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_trips_departure_dates_status" AS ENUM('available', 'guaranteed', 'limited', 'sold-out');
  CREATE TYPE "public"."enum__trips_v_version_departure_dates_status" AS ENUM('available', 'guaranteed', 'limited', 'sold-out');
  CREATE TABLE "trips_departure_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"status" "enum_trips_departure_dates_status" DEFAULT 'available',
  	"price" numeric,
  	"note" varchar
  );
  
  CREATE TABLE "_trips_v_version_departure_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"status" "enum__trips_v_version_departure_dates_status" DEFAULT 'available',
  	"price" numeric,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "trips_departure_dates" ADD CONSTRAINT "trips_departure_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_departure_dates" ADD CONSTRAINT "_trips_v_version_departure_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trips_departure_dates_order_idx" ON "trips_departure_dates" USING btree ("_order");
  CREATE INDEX "trips_departure_dates_parent_id_idx" ON "trips_departure_dates" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_departure_dates_order_idx" ON "_trips_v_version_departure_dates" USING btree ("_order");
  CREATE INDEX "_trips_v_version_departure_dates_parent_id_idx" ON "_trips_v_version_departure_dates" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "trips_departure_dates" CASCADE;
  DROP TABLE "_trips_v_version_departure_dates" CASCADE;
  DROP TYPE "public"."enum_trips_departure_dates_status";
  DROP TYPE "public"."enum__trips_v_version_departure_dates_status";`)
}
