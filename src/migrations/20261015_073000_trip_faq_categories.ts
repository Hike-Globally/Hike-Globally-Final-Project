import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Adds one localized, versioned FAQ array for each trip FAQ category except General Questions.
 * The existing `faqs` array remains the General Questions group, preserving current content. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "trips_best_time_to_trek_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "_trips_v_version_best_time_to_trek_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "trips_required_permits_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "_trips_v_version_required_permits_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "trips_trekker_safety_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "_trips_v_version_trekker_safety_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "trips_packing_list_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "_trips_v_version_packing_list_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "trips_altitude_sickness_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "_trips_v_version_altitude_sickness_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "trips_accommodation_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "_trips_v_version_accommodation_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  ALTER TABLE "trips_best_time_to_trek_faqs" ADD CONSTRAINT "trips_best_time_to_trek_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_best_time_to_trek_faqs" ADD CONSTRAINT "_trips_v_version_best_time_to_trek_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_required_permits_faqs" ADD CONSTRAINT "trips_required_permits_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_required_permits_faqs" ADD CONSTRAINT "_trips_v_version_required_permits_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_trekker_safety_faqs" ADD CONSTRAINT "trips_trekker_safety_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_trekker_safety_faqs" ADD CONSTRAINT "_trips_v_version_trekker_safety_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_packing_list_faqs" ADD CONSTRAINT "trips_packing_list_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_packing_list_faqs" ADD CONSTRAINT "_trips_v_version_packing_list_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_altitude_sickness_faqs" ADD CONSTRAINT "trips_altitude_sickness_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_altitude_sickness_faqs" ADD CONSTRAINT "_trips_v_version_altitude_sickness_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_accommodation_faqs" ADD CONSTRAINT "trips_accommodation_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_accommodation_faqs" ADD CONSTRAINT "_trips_v_version_accommodation_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "trips_best_time_to_trek_faqs_order_idx" ON "trips_best_time_to_trek_faqs" USING btree ("_order");
  CREATE INDEX "trips_best_time_to_trek_faqs_parent_id_idx" ON "trips_best_time_to_trek_faqs" USING btree ("_parent_id");
  CREATE INDEX "trips_best_time_to_trek_faqs_locale_idx" ON "trips_best_time_to_trek_faqs" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_best_time_to_trek_faqs_order_idx" ON "_trips_v_version_best_time_to_trek_faqs" USING btree ("_order");
  CREATE INDEX "_trips_v_version_best_time_to_trek_faqs_parent_id_idx" ON "_trips_v_version_best_time_to_trek_faqs" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_best_time_to_trek_faqs_locale_idx" ON "_trips_v_version_best_time_to_trek_faqs" USING btree ("_locale");
  CREATE INDEX "trips_required_permits_faqs_order_idx" ON "trips_required_permits_faqs" USING btree ("_order");
  CREATE INDEX "trips_required_permits_faqs_parent_id_idx" ON "trips_required_permits_faqs" USING btree ("_parent_id");
  CREATE INDEX "trips_required_permits_faqs_locale_idx" ON "trips_required_permits_faqs" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_required_permits_faqs_order_idx" ON "_trips_v_version_required_permits_faqs" USING btree ("_order");
  CREATE INDEX "_trips_v_version_required_permits_faqs_parent_id_idx" ON "_trips_v_version_required_permits_faqs" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_required_permits_faqs_locale_idx" ON "_trips_v_version_required_permits_faqs" USING btree ("_locale");
  CREATE INDEX "trips_trekker_safety_faqs_order_idx" ON "trips_trekker_safety_faqs" USING btree ("_order");
  CREATE INDEX "trips_trekker_safety_faqs_parent_id_idx" ON "trips_trekker_safety_faqs" USING btree ("_parent_id");
  CREATE INDEX "trips_trekker_safety_faqs_locale_idx" ON "trips_trekker_safety_faqs" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_trekker_safety_faqs_order_idx" ON "_trips_v_version_trekker_safety_faqs" USING btree ("_order");
  CREATE INDEX "_trips_v_version_trekker_safety_faqs_parent_id_idx" ON "_trips_v_version_trekker_safety_faqs" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_trekker_safety_faqs_locale_idx" ON "_trips_v_version_trekker_safety_faqs" USING btree ("_locale");
  CREATE INDEX "trips_packing_list_faqs_order_idx" ON "trips_packing_list_faqs" USING btree ("_order");
  CREATE INDEX "trips_packing_list_faqs_parent_id_idx" ON "trips_packing_list_faqs" USING btree ("_parent_id");
  CREATE INDEX "trips_packing_list_faqs_locale_idx" ON "trips_packing_list_faqs" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_packing_list_faqs_order_idx" ON "_trips_v_version_packing_list_faqs" USING btree ("_order");
  CREATE INDEX "_trips_v_version_packing_list_faqs_parent_id_idx" ON "_trips_v_version_packing_list_faqs" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_packing_list_faqs_locale_idx" ON "_trips_v_version_packing_list_faqs" USING btree ("_locale");
  CREATE INDEX "trips_altitude_sickness_faqs_order_idx" ON "trips_altitude_sickness_faqs" USING btree ("_order");
  CREATE INDEX "trips_altitude_sickness_faqs_parent_id_idx" ON "trips_altitude_sickness_faqs" USING btree ("_parent_id");
  CREATE INDEX "trips_altitude_sickness_faqs_locale_idx" ON "trips_altitude_sickness_faqs" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_altitude_sickness_faqs_order_idx" ON "_trips_v_version_altitude_sickness_faqs" USING btree ("_order");
  CREATE INDEX "_trips_v_version_altitude_sickness_faqs_parent_id_idx" ON "_trips_v_version_altitude_sickness_faqs" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_altitude_sickness_faqs_locale_idx" ON "_trips_v_version_altitude_sickness_faqs" USING btree ("_locale");
  CREATE INDEX "trips_accommodation_faqs_order_idx" ON "trips_accommodation_faqs" USING btree ("_order");
  CREATE INDEX "trips_accommodation_faqs_parent_id_idx" ON "trips_accommodation_faqs" USING btree ("_parent_id");
  CREATE INDEX "trips_accommodation_faqs_locale_idx" ON "trips_accommodation_faqs" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_accommodation_faqs_order_idx" ON "_trips_v_version_accommodation_faqs" USING btree ("_order");
  CREATE INDEX "_trips_v_version_accommodation_faqs_parent_id_idx" ON "_trips_v_version_accommodation_faqs" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_accommodation_faqs_locale_idx" ON "_trips_v_version_accommodation_faqs" USING btree ("_locale");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "_trips_v_version_accommodation_faqs" CASCADE;
  DROP TABLE "trips_accommodation_faqs" CASCADE;
  DROP TABLE "_trips_v_version_altitude_sickness_faqs" CASCADE;
  DROP TABLE "trips_altitude_sickness_faqs" CASCADE;
  DROP TABLE "_trips_v_version_packing_list_faqs" CASCADE;
  DROP TABLE "trips_packing_list_faqs" CASCADE;
  DROP TABLE "_trips_v_version_trekker_safety_faqs" CASCADE;
  DROP TABLE "trips_trekker_safety_faqs" CASCADE;
  DROP TABLE "_trips_v_version_required_permits_faqs" CASCADE;
  DROP TABLE "trips_required_permits_faqs" CASCADE;
  DROP TABLE "_trips_v_version_best_time_to_trek_faqs" CASCADE;
  DROP TABLE "trips_best_time_to_trek_faqs" CASCADE;`)
}
