import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Link preview — a card for another page (a trip, a post, or any address) on trips and blog posts.
 *
 * 1. Columns. On trips and blog posts, the URL, rating, review count, price and original price are
 *    plain columns on the document, and title and description are localized (`*_locales`). Every
 *    one has a `version_` twin for drafts (`_trips_v`, `_trips_v_locales`, `_blog_v`,
 *    `_blog_v_locales`). Nothing existing is changed or dropped.
 *
 * 2. Enums. `linkPreview` joins both page-section `kind` enums on both collections: after
 *    `audience` on trips and after `content` on blog posts. As in `20261107_120000_trip_audience`,
 *    each enum is rebuilt through `text`. `ALTER TYPE … ADD VALUE` cannot be used here, because the
 *    backfill below writes the new value in the same transaction, and PostgreSQL refuses that.
 *
 * 3. Backfill. A layout saved before this migration has no Link preview row, so the editor would
 *    have the URL field but no row to place it. Every saved layout, live and versioned, gets one:
 *    on trips directly after the audience pair (or after Highlights / Why Choose / Overview if
 *    that is missing, else at the end); on blog posts directly after the article body. The row
 *    renders nothing until a URL is entered, so no live page changes on deploy.
 *
 * `down` removes those rows and the columns, then narrows the enums again.
 *
 * Re-runnable: columns use IF (NOT) EXISTS, the enums are rebuilt from scratch, and layouts that
 * already hold a `linkPreview` row are skipped. Concurrent boots are serialised by
 * `src/lib/migration-guard.ts`.
 */

const TRIP_KINDS = sql.raw(
  `'hero', 'keyTakeaways', 'overview', 'whyChoose', 'highlights', 'audience', 'linkPreview', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html'`,
)

const TRIP_KINDS_WITHOUT = sql.raw(
  `'hero', 'keyTakeaways', 'overview', 'whyChoose', 'highlights', 'audience', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html'`,
)

const BLOG_KINDS = sql.raw(
  `'hero', 'content', 'linkPreview', 'faqs', 'author', 'navigation', 'planning', 'related', 'html'`,
)

const BLOG_KINDS_WITHOUT = sql.raw(
  `'hero', 'content', 'faqs', 'author', 'navigation', 'planning', 'related', 'html'`,
)

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- 1. Columns -------------------------------------------------------------------------------
  ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "link_preview_url" varchar;
  ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "link_preview_rating" numeric;
  ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "link_preview_review_count" numeric;
  ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "link_preview_price" varchar;
  ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "link_preview_original_price" varchar;
  ALTER TABLE "trips_locales" ADD COLUMN IF NOT EXISTS "link_preview_title" varchar;
  ALTER TABLE "trips_locales" ADD COLUMN IF NOT EXISTS "link_preview_description" varchar;
  ALTER TABLE "_trips_v" ADD COLUMN IF NOT EXISTS "version_link_preview_url" varchar;
  ALTER TABLE "_trips_v" ADD COLUMN IF NOT EXISTS "version_link_preview_rating" numeric;
  ALTER TABLE "_trips_v" ADD COLUMN IF NOT EXISTS "version_link_preview_review_count" numeric;
  ALTER TABLE "_trips_v" ADD COLUMN IF NOT EXISTS "version_link_preview_price" varchar;
  ALTER TABLE "_trips_v" ADD COLUMN IF NOT EXISTS "version_link_preview_original_price" varchar;
  ALTER TABLE "_trips_v_locales" ADD COLUMN IF NOT EXISTS "version_link_preview_title" varchar;
  ALTER TABLE "_trips_v_locales" ADD COLUMN IF NOT EXISTS "version_link_preview_description" varchar;

  ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "link_preview_url" varchar;
  ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "link_preview_rating" numeric;
  ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "link_preview_review_count" numeric;
  ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "link_preview_price" varchar;
  ALTER TABLE "blog" ADD COLUMN IF NOT EXISTS "link_preview_original_price" varchar;
  ALTER TABLE "blog_locales" ADD COLUMN IF NOT EXISTS "link_preview_title" varchar;
  ALTER TABLE "blog_locales" ADD COLUMN IF NOT EXISTS "link_preview_description" varchar;
  ALTER TABLE "_blog_v" ADD COLUMN IF NOT EXISTS "version_link_preview_url" varchar;
  ALTER TABLE "_blog_v" ADD COLUMN IF NOT EXISTS "version_link_preview_rating" numeric;
  ALTER TABLE "_blog_v" ADD COLUMN IF NOT EXISTS "version_link_preview_review_count" numeric;
  ALTER TABLE "_blog_v" ADD COLUMN IF NOT EXISTS "version_link_preview_price" varchar;
  ALTER TABLE "_blog_v" ADD COLUMN IF NOT EXISTS "version_link_preview_original_price" varchar;
  ALTER TABLE "_blog_v_locales" ADD COLUMN IF NOT EXISTS "version_link_preview_title" varchar;
  ALTER TABLE "_blog_v_locales" ADD COLUMN IF NOT EXISTS "version_link_preview_description" varchar;

  -- 2. Enums (rebuilt through text, see the header) -----------------------------------------
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum_trips_page_sections_kind";
  CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM(${TRIP_KINDS});
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_trips_page_sections_kind" USING "kind"::"public"."enum_trips_page_sections_kind";

  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum__trips_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM(${TRIP_KINDS});
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";

  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum_blog_page_sections_kind";
  CREATE TYPE "public"."enum_blog_page_sections_kind" AS ENUM(${BLOG_KINDS});
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_blog_page_sections_kind";
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_blog_page_sections_kind" USING "kind"::"public"."enum_blog_page_sections_kind";

  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum__blog_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__blog_v_version_page_sections_kind" AS ENUM(${BLOG_KINDS});
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__blog_v_version_page_sections_kind";
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__blog_v_version_page_sections_kind" USING "kind"::"public"."enum__blog_v_version_page_sections_kind";

  -- 3. Backfill: one Link preview row per saved layout (live, then versions) ----------------
  -- Trips: right after the audience pair, else Highlights / Why Choose / Overview, else the end.
  DROP TABLE IF EXISTS "hg_link_preview_positions";
  CREATE TEMP TABLE "hg_link_preview_positions" AS
  SELECT "_parent_id", "_locale", COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'audience'),
    MIN("_order") FILTER (WHERE "kind" = 'highlights'),
    MIN("_order") FILTER (WHERE "kind" = 'whyChoose'),
    MIN("_order") FILTER (WHERE "kind" = 'overview'),
    MAX("_order")
  ) + 1 AS position
  FROM "trips_page_sections"
  GROUP BY "_parent_id", "_locale"
  HAVING COUNT(*) FILTER (WHERE "kind" = 'linkPreview') = 0;

  UPDATE "trips_page_sections" AS "row" SET "_order" = "row"."_order" + 1
  FROM "hg_link_preview_positions" AS "p"
  WHERE "row"."_parent_id" = "p"."_parent_id" AND "row"."_locale" = "p"."_locale" AND "row"."_order" >= "p"."position";

  INSERT INTO "trips_page_sections" ("_order", "_parent_id", "_locale", "id", "kind")
  SELECT "p"."position", "p"."_parent_id", "p"."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'linkPreview'
  FROM "hg_link_preview_positions" AS "p";

  DROP TABLE "hg_link_preview_positions";

  DROP TABLE IF EXISTS "hg_link_preview_version_positions";
  CREATE TEMP TABLE "hg_link_preview_version_positions" AS
  SELECT "_parent_id", "_locale", COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'audience'),
    MIN("_order") FILTER (WHERE "kind" = 'highlights'),
    MIN("_order") FILTER (WHERE "kind" = 'whyChoose'),
    MIN("_order") FILTER (WHERE "kind" = 'overview'),
    MAX("_order")
  ) + 1 AS position
  FROM "_trips_v_version_page_sections"
  GROUP BY "_parent_id", "_locale"
  HAVING COUNT(*) FILTER (WHERE "kind" = 'linkPreview') = 0;

  UPDATE "_trips_v_version_page_sections" AS "row" SET "_order" = "row"."_order" + 1
  FROM "hg_link_preview_version_positions" AS "p"
  WHERE "row"."_parent_id" = "p"."_parent_id" AND "row"."_locale" = "p"."_locale" AND "row"."_order" >= "p"."position";

  INSERT INTO "_trips_v_version_page_sections" ("_order", "_parent_id", "_locale", "_uuid", "kind")
  SELECT "p"."position", "p"."_parent_id", "p"."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'linkPreview'
  FROM "hg_link_preview_version_positions" AS "p";

  DROP TABLE "hg_link_preview_version_positions";

  -- Blog posts: straight after the article body, else at the end.
  DROP TABLE IF EXISTS "hg_link_preview_blog_positions";
  CREATE TEMP TABLE "hg_link_preview_blog_positions" AS
  SELECT "_parent_id", "_locale", COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'content'),
    MAX("_order")
  ) + 1 AS position
  FROM "blog_page_sections"
  GROUP BY "_parent_id", "_locale"
  HAVING COUNT(*) FILTER (WHERE "kind" = 'linkPreview') = 0;

  UPDATE "blog_page_sections" AS "row" SET "_order" = "row"."_order" + 1
  FROM "hg_link_preview_blog_positions" AS "p"
  WHERE "row"."_parent_id" = "p"."_parent_id" AND "row"."_locale" = "p"."_locale" AND "row"."_order" >= "p"."position";

  INSERT INTO "blog_page_sections" ("_order", "_parent_id", "_locale", "id", "kind")
  SELECT "p"."position", "p"."_parent_id", "p"."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'linkPreview'
  FROM "hg_link_preview_blog_positions" AS "p";

  DROP TABLE "hg_link_preview_blog_positions";

  DROP TABLE IF EXISTS "hg_link_preview_blog_version_positions";
  CREATE TEMP TABLE "hg_link_preview_blog_version_positions" AS
  SELECT "_parent_id", "_locale", COALESCE(
    MIN("_order") FILTER (WHERE "kind" = 'content'),
    MAX("_order")
  ) + 1 AS position
  FROM "_blog_v_version_page_sections"
  GROUP BY "_parent_id", "_locale"
  HAVING COUNT(*) FILTER (WHERE "kind" = 'linkPreview') = 0;

  UPDATE "_blog_v_version_page_sections" AS "row" SET "_order" = "row"."_order" + 1
  FROM "hg_link_preview_blog_version_positions" AS "p"
  WHERE "row"."_parent_id" = "p"."_parent_id" AND "row"."_locale" = "p"."_locale" AND "row"."_order" >= "p"."position";

  INSERT INTO "_blog_v_version_page_sections" ("_order", "_parent_id", "_locale", "_uuid", "kind")
  SELECT "p"."position", "p"."_parent_id", "p"."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24), 'linkPreview'
  FROM "hg_link_preview_blog_version_positions" AS "p";

  DROP TABLE "hg_link_preview_blog_version_positions";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "trips_page_sections" WHERE "kind" = 'linkPreview';
  DELETE FROM "_trips_v_version_page_sections" WHERE "kind" = 'linkPreview';
  DELETE FROM "blog_page_sections" WHERE "kind" = 'linkPreview';
  DELETE FROM "_blog_v_version_page_sections" WHERE "kind" = 'linkPreview';

  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum_trips_page_sections_kind";
  CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM(${TRIP_KINDS_WITHOUT});
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_trips_page_sections_kind" USING "kind"::"public"."enum_trips_page_sections_kind";

  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum__trips_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM(${TRIP_KINDS_WITHOUT});
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";

  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum_blog_page_sections_kind";
  CREATE TYPE "public"."enum_blog_page_sections_kind" AS ENUM(${BLOG_KINDS_WITHOUT});
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_blog_page_sections_kind";
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_blog_page_sections_kind" USING "kind"::"public"."enum_blog_page_sections_kind";

  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE IF EXISTS "public"."enum__blog_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__blog_v_version_page_sections_kind" AS ENUM(${BLOG_KINDS_WITHOUT});
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__blog_v_version_page_sections_kind";
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__blog_v_version_page_sections_kind" USING "kind"::"public"."enum__blog_v_version_page_sections_kind";

  ALTER TABLE "trips" DROP COLUMN IF EXISTS "link_preview_url";
  ALTER TABLE "trips" DROP COLUMN IF EXISTS "link_preview_rating";
  ALTER TABLE "trips" DROP COLUMN IF EXISTS "link_preview_review_count";
  ALTER TABLE "trips" DROP COLUMN IF EXISTS "link_preview_price";
  ALTER TABLE "trips" DROP COLUMN IF EXISTS "link_preview_original_price";
  ALTER TABLE "trips_locales" DROP COLUMN IF EXISTS "link_preview_title";
  ALTER TABLE "trips_locales" DROP COLUMN IF EXISTS "link_preview_description";
  ALTER TABLE "_trips_v" DROP COLUMN IF EXISTS "version_link_preview_url";
  ALTER TABLE "_trips_v" DROP COLUMN IF EXISTS "version_link_preview_rating";
  ALTER TABLE "_trips_v" DROP COLUMN IF EXISTS "version_link_preview_review_count";
  ALTER TABLE "_trips_v" DROP COLUMN IF EXISTS "version_link_preview_price";
  ALTER TABLE "_trips_v" DROP COLUMN IF EXISTS "version_link_preview_original_price";
  ALTER TABLE "_trips_v_locales" DROP COLUMN IF EXISTS "version_link_preview_title";
  ALTER TABLE "_trips_v_locales" DROP COLUMN IF EXISTS "version_link_preview_description";

  ALTER TABLE "blog" DROP COLUMN IF EXISTS "link_preview_url";
  ALTER TABLE "blog" DROP COLUMN IF EXISTS "link_preview_rating";
  ALTER TABLE "blog" DROP COLUMN IF EXISTS "link_preview_review_count";
  ALTER TABLE "blog" DROP COLUMN IF EXISTS "link_preview_price";
  ALTER TABLE "blog" DROP COLUMN IF EXISTS "link_preview_original_price";
  ALTER TABLE "blog_locales" DROP COLUMN IF EXISTS "link_preview_title";
  ALTER TABLE "blog_locales" DROP COLUMN IF EXISTS "link_preview_description";
  ALTER TABLE "_blog_v" DROP COLUMN IF EXISTS "version_link_preview_url";
  ALTER TABLE "_blog_v" DROP COLUMN IF EXISTS "version_link_preview_rating";
  ALTER TABLE "_blog_v" DROP COLUMN IF EXISTS "version_link_preview_review_count";
  ALTER TABLE "_blog_v" DROP COLUMN IF EXISTS "version_link_preview_price";
  ALTER TABLE "_blog_v" DROP COLUMN IF EXISTS "version_link_preview_original_price";
  ALTER TABLE "_blog_v_locales" DROP COLUMN IF EXISTS "version_link_preview_title";
  ALTER TABLE "_blog_v_locales" DROP COLUMN IF EXISTS "version_link_preview_description";
  `)
}
