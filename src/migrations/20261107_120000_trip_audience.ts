import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Who Is This Trip For / Who Is This Trip Not For.
 *
 * Adds, for the live document and its drafts:
 *   - `trips_locales.trip_for_heading` / `trip_for_description` and
 *     `trip_not_for_heading` / `trip_not_for_description` (all localized, so they live in the
 *     `_locales` tables — `version_`-prefixed on `_trips_v_locales`);
 *   - the `audience` value on both page-section `kind` enums;
 *   - an `audience` row in every page layout saved before this section existed, placed directly
 *     after Highlights (or, if Highlights was removed, after Why Choose This Trek, then Overview,
 *     then at the end). Without this, existing trips would have the fields in the editor but no
 *     row to render them. The section renders nothing until a description is filled in, so no
 *     live page changes on deploy.
 *
 * The enum is recreated (rather than `ALTER TYPE … ADD VALUE`) because Postgres refuses to use a
 * value added in the same transaction, and the layout rows below need it. This is the same shape
 * as the earlier page-section migrations.
 *
 * Older production schemas can contain the retired `whoFor` / `whoNotFor` layout kinds from a
 * pre-release version of the audience section. Normalize those to the single current `audience`
 * section before casting back to the new enum; otherwise PostgreSQL rejects the legacy label.
 * Duplicate audience rows are collapsed to the earliest layout position.
 *
 * Re-runnable: columns use IF (NOT) EXISTS and layouts that already hold an `audience` row are
 * skipped, so a half-applied run (see `20261106_120000_trip_brochure`) can simply be run again.
 * Concurrent boots are serialised by `src/lib/migration-guard.ts`.
 */

const KINDS_WITH_AUDIENCE = sql.raw(
  `'hero', 'keyTakeaways', 'overview', 'whyChoose', 'highlights', 'audience', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html'`,
)

const KINDS_WITHOUT_AUDIENCE = sql.raw(
  `'hero', 'keyTakeaways', 'overview', 'whyChoose', 'highlights', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html'`,
)

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum_trips_page_sections_kind";
  CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM(${KINDS_WITH_AUDIENCE});

  -- Older preview schemas used two layout keys for the same audience panel.
  -- Keep the earliest row per document/locale, then map it to the current key.
  WITH ranked AS (
    SELECT "id", ROW_NUMBER() OVER (
      PARTITION BY "_parent_id", "_locale" ORDER BY "_order", "id"
    ) AS rn
    FROM "trips_page_sections"
    WHERE "kind" IN ('audience', 'whoFor', 'whoNotFor')
  )
  DELETE FROM "trips_page_sections" AS section
  USING ranked
  WHERE section."id" = ranked."id" AND ranked.rn > 1;
  UPDATE "trips_page_sections" SET "kind" = 'audience' WHERE "kind" IN ('whoFor', 'whoNotFor');

  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_trips_page_sections_kind" USING "kind"::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum__trips_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM(${KINDS_WITH_AUDIENCE});

  WITH ranked AS (
    SELECT "_uuid", ROW_NUMBER() OVER (
      PARTITION BY "_parent_id", "_locale" ORDER BY "_order", "_uuid"
    ) AS rn
    FROM "_trips_v_version_page_sections"
    WHERE "kind" IN ('audience', 'whoFor', 'whoNotFor')
  )
  DELETE FROM "_trips_v_version_page_sections" AS section
  USING ranked
  WHERE section."_uuid" = ranked."_uuid" AND ranked.rn > 1;
  UPDATE "_trips_v_version_page_sections" SET "kind" = 'audience' WHERE "kind" IN ('whoFor', 'whoNotFor');

  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";

  ALTER TABLE "trips_locales" ADD COLUMN IF NOT EXISTS "trip_for_heading" varchar;
  ALTER TABLE "trips_locales" ADD COLUMN IF NOT EXISTS "trip_for_description" jsonb;
  ALTER TABLE "trips_locales" ADD COLUMN IF NOT EXISTS "trip_not_for_heading" varchar;
  ALTER TABLE "trips_locales" ADD COLUMN IF NOT EXISTS "trip_not_for_description" jsonb;
  ALTER TABLE "_trips_v_locales" ADD COLUMN IF NOT EXISTS "version_trip_for_heading" varchar;
  ALTER TABLE "_trips_v_locales" ADD COLUMN IF NOT EXISTS "version_trip_for_description" jsonb;
  ALTER TABLE "_trips_v_locales" ADD COLUMN IF NOT EXISTS "version_trip_not_for_heading" varchar;
  ALTER TABLE "_trips_v_locales" ADD COLUMN IF NOT EXISTS "version_trip_not_for_description" jsonb;

  -- Live layouts: open a gap right after the anchor section, then fill it.
  DROP TABLE IF EXISTS "hg_audience_positions";
  CREATE TEMP TABLE "hg_audience_positions" AS
  SELECT "_parent_id", "_locale", COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'highlights'),
    MIN("_order") FILTER (WHERE "kind" = 'whyChoose'),
    MIN("_order") FILTER (WHERE "kind" = 'overview'),
    MAX("_order")
  ) + 1 AS position
  FROM "trips_page_sections"
  GROUP BY "_parent_id", "_locale"
  HAVING COUNT(*) FILTER (WHERE "kind" = 'audience') = 0;

  UPDATE "trips_page_sections" row SET "_order" = row."_order" + 1 FROM "hg_audience_positions" p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "trips_page_sections" ("_order", "_parent_id", "_locale", "id", "kind")
  SELECT p.position, p."_parent_id", p."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'audience'
  FROM "hg_audience_positions" p;

  -- Draft/version history: same placement, so restoring an older version keeps the section.
  DROP TABLE IF EXISTS "hg_audience_version_positions";
  CREATE TEMP TABLE "hg_audience_version_positions" AS
  SELECT "_parent_id", "_locale", COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'highlights'),
    MIN("_order") FILTER (WHERE "kind" = 'whyChoose'),
    MIN("_order") FILTER (WHERE "kind" = 'overview'),
    MAX("_order")
  ) + 1 AS position
  FROM "_trips_v_version_page_sections"
  GROUP BY "_parent_id", "_locale"
  HAVING COUNT(*) FILTER (WHERE "kind" = 'audience') = 0;

  UPDATE "_trips_v_version_page_sections" row SET "_order" = row."_order" + 1 FROM "hg_audience_version_positions" p
  WHERE row."_parent_id" = p."_parent_id" AND row."_locale" = p."_locale" AND row."_order" >= p.position;

  INSERT INTO "_trips_v_version_page_sections" ("_order", "_parent_id", "_locale", "_uuid", "kind")
  SELECT p.position, p."_parent_id", p."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'audience'
  FROM "hg_audience_version_positions" p;

  DROP TABLE "hg_audience_positions";
  DROP TABLE "hg_audience_version_positions";
`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "trips_page_sections" WHERE "kind" = 'audience';
  DELETE FROM "_trips_v_version_page_sections" WHERE "kind" = 'audience';

  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum_trips_page_sections_kind";
  CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM(${KINDS_WITHOUT_AUDIENCE});
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_trips_page_sections_kind" USING "kind"::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum__trips_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM(${KINDS_WITHOUT_AUDIENCE});
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";

  ALTER TABLE "trips_locales" DROP COLUMN IF EXISTS "trip_for_heading";
  ALTER TABLE "trips_locales" DROP COLUMN IF EXISTS "trip_for_description";
  ALTER TABLE "trips_locales" DROP COLUMN IF EXISTS "trip_not_for_heading";
  ALTER TABLE "trips_locales" DROP COLUMN IF EXISTS "trip_not_for_description";
  ALTER TABLE "_trips_v_locales" DROP COLUMN IF EXISTS "version_trip_for_heading";
  ALTER TABLE "_trips_v_locales" DROP COLUMN IF EXISTS "version_trip_for_description";
  ALTER TABLE "_trips_v_locales" DROP COLUMN IF EXISTS "version_trip_not_for_heading";
  ALTER TABLE "_trips_v_locales" DROP COLUMN IF EXISTS "version_trip_not_for_description";`)
}
