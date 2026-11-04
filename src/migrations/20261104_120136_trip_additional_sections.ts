import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
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
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "trips" ADD COLUMN "route_map_id" integer;
  ALTER TABLE "trips" ADD COLUMN "altitude_chart_id" integer;
  ALTER TABLE "trips_locales" ADD COLUMN "why_choose_this_trek" jsonb;
  ALTER TABLE "trips_locales" ADD COLUMN "route_map_content" jsonb;
  ALTER TABLE "trips_locales" ADD COLUMN "departures" jsonb;
  ALTER TABLE "_trips_v" ADD COLUMN "version_route_map_id" integer;
  ALTER TABLE "_trips_v" ADD COLUMN "version_altitude_chart_id" integer;
  ALTER TABLE "_trips_v_locales" ADD COLUMN "version_why_choose_this_trek" jsonb;
  ALTER TABLE "_trips_v_locales" ADD COLUMN "version_route_map_content" jsonb;
  ALTER TABLE "_trips_v_locales" ADD COLUMN "version_departures" jsonb;
  ALTER TABLE "trips" ADD CONSTRAINT "trips_route_map_id_media_id_fk" FOREIGN KEY ("route_map_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trips" ADD CONSTRAINT "trips_altitude_chart_id_media_id_fk" FOREIGN KEY ("altitude_chart_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trips_v" ADD CONSTRAINT "_trips_v_version_route_map_id_media_id_fk" FOREIGN KEY ("version_route_map_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trips_v" ADD CONSTRAINT "_trips_v_version_altitude_chart_id_media_id_fk" FOREIGN KEY ("version_altitude_chart_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "trips_route_map_idx" ON "trips" USING btree ("route_map_id");
  CREATE INDEX "trips_altitude_chart_idx" ON "trips" USING btree ("altitude_chart_id");
  CREATE INDEX "_trips_v_version_version_route_map_idx" ON "_trips_v" USING btree ("version_route_map_id");
  CREATE INDEX "_trips_v_version_version_altitude_chart_idx" ON "_trips_v" USING btree ("version_altitude_chart_id");
  WITH positions AS (
    SELECT layout."_parent_id", layout."_locale", COALESCE(anchor.position + 0, layout.last_order + 1) AS position
    FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "trips_page_sections" GROUP BY "_parent_id", "_locale") layout
    LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "trips_page_sections" WHERE "kind" = 'highlights' GROUP BY "_parent_id", "_locale") anchor
      USING ("_parent_id", "_locale")
  )
  UPDATE "trips_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "trips_page_sections" ("_order", "_parent_id", "_locale", "id", "kind")
  SELECT COALESCE(anchor.position + -1, layout.last_order + 1), layout."_parent_id", layout."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'whyChoose'
  FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "trips_page_sections" GROUP BY "_parent_id", "_locale") layout
  LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "trips_page_sections" WHERE "kind" = 'highlights' GROUP BY "_parent_id", "_locale") anchor
    USING ("_parent_id", "_locale");

  WITH positions AS (
    SELECT layout."_parent_id", layout."_locale", COALESCE(anchor.position + 1, layout.last_order + 1) AS position
    FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "trips_page_sections" GROUP BY "_parent_id", "_locale") layout
    LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "trips_page_sections" WHERE "kind" = 'highlights' GROUP BY "_parent_id", "_locale") anchor
      USING ("_parent_id", "_locale")
  )
  UPDATE "trips_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "trips_page_sections" ("_order", "_parent_id", "_locale", "id", "kind")
  SELECT COALESCE(anchor.position + 1, layout.last_order + 1), layout."_parent_id", layout."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'routeMap'
  FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "trips_page_sections" GROUP BY "_parent_id", "_locale") layout
  LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "trips_page_sections" WHERE "kind" = 'highlights' GROUP BY "_parent_id", "_locale") anchor
    USING ("_parent_id", "_locale");

  WITH positions AS (
    SELECT layout."_parent_id", layout."_locale", COALESCE(anchor.position + 1, layout.last_order + 1) AS position
    FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "trips_page_sections" GROUP BY "_parent_id", "_locale") layout
    LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "trips_page_sections" WHERE "kind" = 'itinerary' GROUP BY "_parent_id", "_locale") anchor
      USING ("_parent_id", "_locale")
  )
  UPDATE "trips_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "trips_page_sections" ("_order", "_parent_id", "_locale", "id", "kind")
  SELECT COALESCE(anchor.position + 1, layout.last_order + 1), layout."_parent_id", layout."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'departures'
  FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "trips_page_sections" GROUP BY "_parent_id", "_locale") layout
  LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "trips_page_sections" WHERE "kind" = 'itinerary' GROUP BY "_parent_id", "_locale") anchor
    USING ("_parent_id", "_locale");

  WITH positions AS (
    SELECT layout."_parent_id", layout."_locale", COALESCE(anchor.position + 0, layout.last_order + 1) AS position
    FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale") layout
    LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "_trips_v_version_page_sections" WHERE "kind" = 'highlights' GROUP BY "_parent_id", "_locale") anchor
      USING ("_parent_id", "_locale")
  )
  UPDATE "_trips_v_version_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "_trips_v_version_page_sections" ("_order", "_parent_id", "_locale", "_uuid", "kind")
  SELECT COALESCE(anchor.position + -1, layout.last_order + 1), layout."_parent_id", layout."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'whyChoose'
  FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale") layout
  LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "_trips_v_version_page_sections" WHERE "kind" = 'highlights' GROUP BY "_parent_id", "_locale") anchor
    USING ("_parent_id", "_locale");

  WITH positions AS (
    SELECT layout."_parent_id", layout."_locale", COALESCE(anchor.position + 1, layout.last_order + 1) AS position
    FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale") layout
    LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "_trips_v_version_page_sections" WHERE "kind" = 'highlights' GROUP BY "_parent_id", "_locale") anchor
      USING ("_parent_id", "_locale")
  )
  UPDATE "_trips_v_version_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "_trips_v_version_page_sections" ("_order", "_parent_id", "_locale", "_uuid", "kind")
  SELECT COALESCE(anchor.position + 1, layout.last_order + 1), layout."_parent_id", layout."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'routeMap'
  FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale") layout
  LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "_trips_v_version_page_sections" WHERE "kind" = 'highlights' GROUP BY "_parent_id", "_locale") anchor
    USING ("_parent_id", "_locale");

  WITH positions AS (
    SELECT layout."_parent_id", layout."_locale", COALESCE(anchor.position + 1, layout.last_order + 1) AS position
    FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale") layout
    LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "_trips_v_version_page_sections" WHERE "kind" = 'itinerary' GROUP BY "_parent_id", "_locale") anchor
      USING ("_parent_id", "_locale")
  )
  UPDATE "_trips_v_version_page_sections" row SET "_order" = row."_order" + 1 FROM positions p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "_trips_v_version_page_sections" ("_order", "_parent_id", "_locale", "_uuid", "kind")
  SELECT COALESCE(anchor.position + 1, layout.last_order + 1), layout."_parent_id", layout."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'departures'
  FROM (SELECT "_parent_id", "_locale", MAX("_order") AS last_order FROM "_trips_v_version_page_sections" GROUP BY "_parent_id", "_locale") layout
  LEFT JOIN (SELECT "_parent_id", "_locale", MIN("_order") AS position FROM "_trips_v_version_page_sections" WHERE "kind" = 'itinerary' GROUP BY "_parent_id", "_locale") anchor
    USING ("_parent_id", "_locale");
`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "trips_page_sections" WHERE "kind" IN ('whyChoose', 'routeMap', 'departures');
  DELETE FROM "_trips_v_version_page_sections" WHERE "kind" IN ('whyChoose', 'routeMap', 'departures');

   ALTER TABLE "trips" DROP CONSTRAINT "trips_route_map_id_media_id_fk";
  
  ALTER TABLE "trips" DROP CONSTRAINT "trips_altitude_chart_id_media_id_fk";
  
  ALTER TABLE "_trips_v" DROP CONSTRAINT "_trips_v_version_route_map_id_media_id_fk";
  
  ALTER TABLE "_trips_v" DROP CONSTRAINT "_trips_v_version_altitude_chart_id_media_id_fk";
  
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum_trips_page_sections_kind";
  CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM('hero', 'overview', 'highlights', 'itinerary', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_trips_page_sections_kind" USING "kind"::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum__trips_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM('hero', 'overview', 'highlights', 'itinerary', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";
  DROP INDEX "trips_route_map_idx";
  DROP INDEX "trips_altitude_chart_idx";
  DROP INDEX "_trips_v_version_version_route_map_idx";
  DROP INDEX "_trips_v_version_version_altitude_chart_idx";
  ALTER TABLE "trips" DROP COLUMN "route_map_id";
  ALTER TABLE "trips" DROP COLUMN "altitude_chart_id";
  ALTER TABLE "trips_locales" DROP COLUMN "why_choose_this_trek";
  ALTER TABLE "trips_locales" DROP COLUMN "route_map_content";
  ALTER TABLE "trips_locales" DROP COLUMN "departures";
  ALTER TABLE "_trips_v" DROP COLUMN "version_route_map_id";
  ALTER TABLE "_trips_v" DROP COLUMN "version_altitude_chart_id";
  ALTER TABLE "_trips_v_locales" DROP COLUMN "version_why_choose_this_trek";
  ALTER TABLE "_trips_v_locales" DROP COLUMN "version_route_map_content";
  ALTER TABLE "_trips_v_locales" DROP COLUMN "version_departures";`)
}
