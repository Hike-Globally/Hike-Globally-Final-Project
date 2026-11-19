import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/** The existing trip page-section kinds plus the new hotel section. */
const KINDS_WITH_HOTELS = sql.raw(
  `'hero', 'keyTakeaways', 'overview', 'whyChoose', 'highlights', 'audience', 'linkPreview', 'multiUrlPreview', 'routeMap', 'itinerary', 'departures', 'information', 'hotelsNearDestination', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html'`,
)

const KINDS_WITHOUT_HOTELS = sql.raw(
  `'hero', 'keyTakeaways', 'overview', 'whyChoose', 'highlights', 'audience', 'linkPreview', 'multiUrlPreview', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html'`,
)

/**
 * Adds the Hotels Near Destination accordion array and its Page sections row for trips.
 *
 * Existing saved layouts (live and versioned, per locale) receive the row after Essential
 * Information, or after the itinerary/overview when the editor has hidden that section. New and
 * unsaved layouts get the row from `tripSectionOptions`. Empty hotel arrays render nothing.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum_trips_page_sections_kind";
  CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM(${KINDS_WITH_HOTELS});
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_trips_page_sections_kind" USING "kind"::"public"."enum_trips_page_sections_kind";

  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum__trips_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM(${KINDS_WITH_HOTELS});
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";

  CREATE TABLE "trips_hotels_near_destination" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "content" jsonb
  );
  CREATE TABLE "_trips_v_version_hotels_near_destination" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar,
    "content" jsonb,
    "_uuid" varchar
  );

  ALTER TABLE "trips_hotels_near_destination" ADD CONSTRAINT "trips_hotels_near_destination_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_hotels_near_destination" ADD CONSTRAINT "_trips_v_version_hotels_near_destination_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trips_hotels_near_destination_order_idx" ON "trips_hotels_near_destination" USING btree ("_order");
  CREATE INDEX "trips_hotels_near_destination_parent_id_idx" ON "trips_hotels_near_destination" USING btree ("_parent_id");
  CREATE INDEX "trips_hotels_near_destination_locale_idx" ON "trips_hotels_near_destination" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_hotels_near_destination_order_idx" ON "_trips_v_version_hotels_near_destination" USING btree ("_order");
  CREATE INDEX "_trips_v_version_hotels_near_destination_parent_id_idx" ON "_trips_v_version_hotels_near_destination" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_hotels_near_destination_locale_idx" ON "_trips_v_version_hotels_near_destination" USING btree ("_locale");

  -- Live layouts: put the row after Essential Information where it exists, otherwise after the
  -- itinerary or overview, and finally at the end. A removed section stays removed.
  DROP TABLE IF EXISTS "hg_hotels_near_destination_positions";
  CREATE TEMP TABLE "hg_hotels_near_destination_positions" AS
  SELECT "_parent_id", "_locale", COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'information') + 1,
    MIN("_order") FILTER (WHERE "kind" = 'itinerary') + 1,
    MIN("_order") FILTER (WHERE "kind" = 'overview') + 1,
    MAX("_order") + 1
  ) AS position
  FROM "trips_page_sections"
  GROUP BY "_parent_id", "_locale"
  HAVING COUNT(*) FILTER (WHERE "kind" = 'hotelsNearDestination') = 0;

  UPDATE "trips_page_sections" row SET "_order" = row."_order" + 1
  FROM "hg_hotels_near_destination_positions" p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "trips_page_sections" ("_order", "_parent_id", "_locale", "id", "kind")
  SELECT p.position, p."_parent_id", p."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'hotelsNearDestination'
  FROM "hg_hotels_near_destination_positions" p;
  DROP TABLE "hg_hotels_near_destination_positions";

  -- Draft/version history: make the same addition in each saved version and locale.
  DROP TABLE IF EXISTS "hg_hotels_near_destination_version_positions";
  CREATE TEMP TABLE "hg_hotels_near_destination_version_positions" AS
  SELECT "_parent_id", "_locale", COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'information') + 1,
    MIN("_order") FILTER (WHERE "kind" = 'itinerary') + 1,
    MIN("_order") FILTER (WHERE "kind" = 'overview') + 1,
    MAX("_order") + 1
  ) AS position
  FROM "_trips_v_version_page_sections"
  GROUP BY "_parent_id", "_locale"
  HAVING COUNT(*) FILTER (WHERE "kind" = 'hotelsNearDestination') = 0;

  UPDATE "_trips_v_version_page_sections" row SET "_order" = row."_order" + 1
  FROM "hg_hotels_near_destination_version_positions" p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "_trips_v_version_page_sections" ("_order", "_parent_id", "_locale", "_uuid", "kind")
  SELECT p.position, p."_parent_id", p."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'hotelsNearDestination'
  FROM "hg_hotels_near_destination_version_positions" p;
  DROP TABLE "hg_hotels_near_destination_version_positions";
`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "trips_page_sections" WHERE "kind" = 'hotelsNearDestination';
  DELETE FROM "_trips_v_version_page_sections" WHERE "kind" = 'hotelsNearDestination';

  DROP TABLE "trips_hotels_near_destination" CASCADE;
  DROP TABLE "_trips_v_version_hotels_near_destination" CASCADE;

  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum_trips_page_sections_kind";
  CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM(${KINDS_WITHOUT_HOTELS});
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_trips_page_sections_kind" USING "kind"::"public"."enum_trips_page_sections_kind";

  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum__trips_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM(${KINDS_WITHOUT_HOTELS});
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";
`)
}
