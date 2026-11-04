import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum_trips_page_sections_kind";
  CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM('hero', 'keyTakeaways', 'overview', 'whyChoose', 'whoFor', 'whoNotFor', 'highlights', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_trips_page_sections_kind" USING "kind"::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum__trips_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM('hero', 'keyTakeaways', 'overview', 'whyChoose', 'whoFor', 'whoNotFor', 'highlights', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "trips_locales" ADD COLUMN "who_is_this_trek_for" jsonb;
  ALTER TABLE "trips_locales" ADD COLUMN "who_is_this_trek_not_for" jsonb;
  ALTER TABLE "_trips_v_locales" ADD COLUMN "version_who_is_this_trek_for" jsonb;
  ALTER TABLE "_trips_v_locales" ADD COLUMN "version_who_is_this_trek_not_for" jsonb;
  -- Insert Who Is This Trek For after Why Choose This Trek in every saved locale/layout,
  -- including draft history. If Why Choose This Trek was removed, append at the end.
  -- Layouts that already carry the row (dev-push databases) are left untouched.
  WITH positions AS (
    SELECT "_parent_id", "_locale", COALESCE(
      MIN("_order") FILTER (WHERE "kind" = 'whyChoose') + 1,
      MAX("_order") + 1
    ) AS position
    FROM "trips_page_sections" GROUP BY "_parent_id", "_locale"
    HAVING NOT BOOL_OR("kind" = 'whoFor')
  )
  UPDATE "trips_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "trips_page_sections" ("_order", "_parent_id", "_locale", "id", "kind")
  SELECT COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'whyChoose') + 1,
    MAX("_order") + 1
  ), "_parent_id", "_locale", substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'whoFor'
  FROM "trips_page_sections" GROUP BY "_parent_id", "_locale"
  HAVING NOT BOOL_OR("kind" = 'whoFor');

  -- Then Who Is This Trek Not For directly after Who Is This Trek For.
  WITH positions AS (
    SELECT "_parent_id", "_locale", COALESCE(
      MIN("_order") FILTER (WHERE "kind" = 'whoFor') + 1,
      MAX("_order") + 1
    ) AS position
    FROM "trips_page_sections" GROUP BY "_parent_id", "_locale"
    HAVING NOT BOOL_OR("kind" = 'whoNotFor')
  )
  UPDATE "trips_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "trips_page_sections" ("_order", "_parent_id", "_locale", "id", "kind")
  SELECT COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'whoFor') + 1,
    MAX("_order") + 1
  ), "_parent_id", "_locale", substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'whoNotFor'
  FROM "trips_page_sections" GROUP BY "_parent_id", "_locale"
  HAVING NOT BOOL_OR("kind" = 'whoNotFor');

  -- The same two rows in version history, so drafts and the live page agree.
  WITH positions AS (
    SELECT "_parent_id", "_locale", COALESCE(
      MIN("_order") FILTER (WHERE "kind" = 'whyChoose') + 1,
      MAX("_order") + 1
    ) AS position
    FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale"
    HAVING NOT BOOL_OR("kind" = 'whoFor')
  )
  UPDATE "_trips_v_version_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "_trips_v_version_page_sections" ("_order", "_parent_id", "_locale", "_uuid", "kind")
  SELECT COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'whyChoose') + 1,
    MAX("_order") + 1
  ), "_parent_id", "_locale", substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'whoFor'
  FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale"
  HAVING NOT BOOL_OR("kind" = 'whoFor');

  WITH positions AS (
    SELECT "_parent_id", "_locale", COALESCE(
      MIN("_order") FILTER (WHERE "kind" = 'whoFor') + 1,
      MAX("_order") + 1
    ) AS position
    FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale"
    HAVING NOT BOOL_OR("kind" = 'whoNotFor')
  )
  UPDATE "_trips_v_version_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "_trips_v_version_page_sections" ("_order", "_parent_id", "_locale", "_uuid", "kind")
  SELECT COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'whoFor') + 1,
    MAX("_order") + 1
  ), "_parent_id", "_locale", substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'whoNotFor'
  FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale"
  HAVING NOT BOOL_OR("kind" = 'whoNotFor');`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "trips_page_sections" WHERE "kind" IN ('whoFor', 'whoNotFor');
  DELETE FROM "_trips_v_version_page_sections" WHERE "kind" IN ('whoFor', 'whoNotFor');

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
  ALTER TABLE "trips_locales" DROP COLUMN "who_is_this_trek_for";
  ALTER TABLE "trips_locales" DROP COLUMN "who_is_this_trek_not_for";
  ALTER TABLE "_trips_v_locales" DROP COLUMN "version_who_is_this_trek_for";
  ALTER TABLE "_trips_v_locales" DROP COLUMN "version_who_is_this_trek_not_for";`)
}
