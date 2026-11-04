import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum_trips_page_sections_kind";
  CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM('hero', 'keyTakeaways', 'overview', 'whyChoose', 'highlights', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_trips_page_sections_kind" USING "kind"::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum__trips_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM('hero', 'keyTakeaways', 'overview', 'whyChoose', 'highlights', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";
  CREATE TABLE "trips_key_takeaways" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_trips_v_version_key_takeaways" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "trips_key_takeaways" ADD CONSTRAINT "trips_key_takeaways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_key_takeaways" ADD CONSTRAINT "_trips_v_version_key_takeaways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trips_key_takeaways_order_idx" ON "trips_key_takeaways" USING btree ("_order");
  CREATE INDEX "trips_key_takeaways_parent_id_idx" ON "trips_key_takeaways" USING btree ("_parent_id");
  CREATE INDEX "trips_key_takeaways_locale_idx" ON "trips_key_takeaways" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_key_takeaways_order_idx" ON "_trips_v_version_key_takeaways" USING btree ("_order");
  CREATE INDEX "_trips_v_version_key_takeaways_parent_id_idx" ON "_trips_v_version_key_takeaways" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_key_takeaways_locale_idx" ON "_trips_v_version_key_takeaways" USING btree ("_locale");
  -- Insert before Overview in every saved locale/layout, including draft history.
  -- If Overview was hidden, put the summary immediately after the hero (or first).
  WITH positions AS (
    SELECT "_parent_id", "_locale", COALESCE(
      MIN("_order") FILTER (WHERE "kind" = 'overview'),
      MIN("_order") FILTER (WHERE "kind" = 'hero') + 1,
      MIN("_order")
    ) AS position
    FROM "trips_page_sections" GROUP BY "_parent_id", "_locale"
  )
  UPDATE "trips_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "trips_page_sections" ("_order", "_parent_id", "_locale", "id", "kind")
  SELECT COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'overview') - 1,
    MIN("_order") FILTER (WHERE "kind" = 'hero') + 1,
    MIN("_order") - 1
  ), "_parent_id", "_locale", substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'keyTakeaways'
  FROM "trips_page_sections" GROUP BY "_parent_id", "_locale";

  -- Insert before Overview in every saved locale/layout, including draft history.
  -- If Overview was hidden, put the summary immediately after the hero (or first).
  WITH positions AS (
    SELECT "_parent_id", "_locale", COALESCE(
      MIN("_order") FILTER (WHERE "kind" = 'overview'),
      MIN("_order") FILTER (WHERE "kind" = 'hero') + 1,
      MIN("_order")
    ) AS position
    FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale"
  )
  UPDATE "_trips_v_version_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "_trips_v_version_page_sections" ("_order", "_parent_id", "_locale", "_uuid", "kind")
  SELECT COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'overview') - 1,
    MIN("_order") FILTER (WHERE "kind" = 'hero') + 1,
    MIN("_order") - 1
  ), "_parent_id", "_locale", substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'keyTakeaways'
  FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale";
`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "trips_page_sections" WHERE "kind" = 'keyTakeaways';
  DELETE FROM "_trips_v_version_page_sections" WHERE "kind" = 'keyTakeaways';

   DROP TABLE "trips_key_takeaways" CASCADE;
  DROP TABLE "_trips_v_version_key_takeaways" CASCADE;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum_trips_page_sections_kind";
  CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM('hero', 'overview', 'whyChoose', 'highlights', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_trips_page_sections_kind" USING "kind"::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum__trips_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM('hero', 'overview', 'whyChoose', 'highlights', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";`)
}
