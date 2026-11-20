import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Intentionally deletes testimonial blocks and card ratings, including drafts/version history.
 * Back up the database before deployment. `down` restores the schema, NOT the deleted data.
 * Existing migration files remain unchanged so older databases can still migrate forward.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`

    CREATE FUNCTION pg_temp.strip_card_reviews(node jsonb) RETURNS jsonb
    LANGUAGE plpgsql AS $function$
    DECLARE cleaned jsonb;
    BEGIN
      IF jsonb_typeof(node) = 'object' THEN
        IF node ? 'linkPreviewUrl' OR node->>'blockType' = 'linkPreview' THEN
          node := node - 'linkPreviewRating' - 'linkPreviewReviewCount';
        END IF;
        SELECT COALESCE(jsonb_object_agg(key, pg_temp.strip_card_reviews(value)), '{}'::jsonb)
          INTO cleaned FROM jsonb_each(node);
        RETURN cleaned;
      ELSIF jsonb_typeof(node) = 'array' THEN
        SELECT COALESCE(jsonb_agg(pg_temp.strip_card_reviews(value) ORDER BY ord), '[]'::jsonb)
          INTO cleaned FROM jsonb_array_elements(node) WITH ORDINALITY AS item(value, ord);
        RETURN cleaned;
      END IF;
      RETURN node;
    END;
    $function$;
    UPDATE "destinations_locales" SET "description" = pg_temp.strip_card_reviews("description")
      WHERE "description" IS NOT NULL AND "description"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "destinations_locales" SET "getting_there" = pg_temp.strip_card_reviews("getting_there")
      WHERE "getting_there" IS NOT NULL AND "getting_there"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_destinations_v_locales" SET "version_description" = pg_temp.strip_card_reviews("version_description")
      WHERE "version_description" IS NOT NULL AND "version_description"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_destinations_v_locales" SET "version_getting_there" = pg_temp.strip_card_reviews("version_getting_there")
      WHERE "version_getting_there" IS NOT NULL AND "version_getting_there"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "trips_content_sections" SET "content" = pg_temp.strip_card_reviews("content")
      WHERE "content" IS NOT NULL AND "content"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "trips_locales" SET "description" = pg_temp.strip_card_reviews("description")
      WHERE "description" IS NOT NULL AND "description"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "trips_locales" SET "trip_for_description" = pg_temp.strip_card_reviews("trip_for_description")
      WHERE "trip_for_description" IS NOT NULL AND "trip_for_description"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "trips_locales" SET "trip_not_for_description" = pg_temp.strip_card_reviews("trip_not_for_description")
      WHERE "trip_not_for_description" IS NOT NULL AND "trip_not_for_description"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "trips_locales" SET "why_choose_this_trek" = pg_temp.strip_card_reviews("why_choose_this_trek")
      WHERE "why_choose_this_trek" IS NOT NULL AND "why_choose_this_trek"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "trips_locales" SET "route_map_content" = pg_temp.strip_card_reviews("route_map_content")
      WHERE "route_map_content" IS NOT NULL AND "route_map_content"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "trips_locales" SET "departures" = pg_temp.strip_card_reviews("departures")
      WHERE "departures" IS NOT NULL AND "departures"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_trips_v_version_content_sections" SET "content" = pg_temp.strip_card_reviews("content")
      WHERE "content" IS NOT NULL AND "content"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_trips_v_locales" SET "version_description" = pg_temp.strip_card_reviews("version_description")
      WHERE "version_description" IS NOT NULL AND "version_description"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_trips_v_locales" SET "version_trip_for_description" = pg_temp.strip_card_reviews("version_trip_for_description")
      WHERE "version_trip_for_description" IS NOT NULL AND "version_trip_for_description"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_trips_v_locales" SET "version_trip_not_for_description" = pg_temp.strip_card_reviews("version_trip_not_for_description")
      WHERE "version_trip_not_for_description" IS NOT NULL AND "version_trip_not_for_description"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_trips_v_locales" SET "version_why_choose_this_trek" = pg_temp.strip_card_reviews("version_why_choose_this_trek")
      WHERE "version_why_choose_this_trek" IS NOT NULL AND "version_why_choose_this_trek"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_trips_v_locales" SET "version_route_map_content" = pg_temp.strip_card_reviews("version_route_map_content")
      WHERE "version_route_map_content" IS NOT NULL AND "version_route_map_content"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_trips_v_locales" SET "version_departures" = pg_temp.strip_card_reviews("version_departures")
      WHERE "version_departures" IS NOT NULL AND "version_departures"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "blog_locales" SET "content" = pg_temp.strip_card_reviews("content")
      WHERE "content" IS NOT NULL AND "content"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_blog_v_locales" SET "version_content" = pg_temp.strip_card_reviews("version_content")
      WHERE "version_content" IS NOT NULL AND "version_content"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "pages_blocks_rich_text" SET "content" = pg_temp.strip_card_reviews("content")
      WHERE "content" IS NOT NULL AND "content"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_pages_v_blocks_rich_text" SET "content" = pg_temp.strip_card_reviews("content")
      WHERE "content" IS NOT NULL AND "content"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "trips_hotels_near_destination" SET "content" = pg_temp.strip_card_reviews("content")
      WHERE "content" IS NOT NULL AND "content"::text ~ '"linkPreview(Rating|ReviewCount)"';
    UPDATE "_trips_v_version_hotels_near_destination" SET "content" = pg_temp.strip_card_reviews("content")
      WHERE "content" IS NOT NULL AND "content"::text ~ '"linkPreview(Rating|ReviewCount)"';
    DROP FUNCTION pg_temp.strip_card_reviews(jsonb);

    -- Remove the old seeded review statistic without touching unrelated statistics.
    DELETE FROM "pages_blocks_stats_items" WHERE lower(trim("label")) = 'average rating';
    DELETE FROM "_pages_v_blocks_stats_items" WHERE lower(trim("label")) = 'average rating';
  ALTER TABLE "pages_blocks_testimonials_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_testimonials_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_testimonials" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_testimonials_items" CASCADE;
  DROP TABLE "pages_blocks_testimonials" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials_items" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials" CASCADE;

  ALTER TABLE "trips_page_sections_multi_links" DROP COLUMN "link_preview_rating";
  ALTER TABLE "trips_page_sections_multi_links" DROP COLUMN "link_preview_review_count";
  ALTER TABLE "trips_page_sections" DROP COLUMN "link_preview_rating";
  ALTER TABLE "trips_page_sections" DROP COLUMN "link_preview_review_count";
  ALTER TABLE "_trips_page_sections_multi_links_v" DROP COLUMN "link_preview_rating";
  ALTER TABLE "_trips_page_sections_multi_links_v" DROP COLUMN "link_preview_review_count";
  ALTER TABLE "_trips_v_version_page_sections" DROP COLUMN "link_preview_rating";
  ALTER TABLE "_trips_v_version_page_sections" DROP COLUMN "link_preview_review_count";
  ALTER TABLE "blog_page_sections_multi_links" DROP COLUMN "link_preview_rating";
  ALTER TABLE "blog_page_sections_multi_links" DROP COLUMN "link_preview_review_count";
  ALTER TABLE "blog_page_sections" DROP COLUMN "link_preview_rating";
  ALTER TABLE "blog_page_sections" DROP COLUMN "link_preview_review_count";
  ALTER TABLE "_blog_page_sections_multi_links_v" DROP COLUMN "link_preview_rating";
  ALTER TABLE "_blog_page_sections_multi_links_v" DROP COLUMN "link_preview_review_count";
  ALTER TABLE "_blog_v_version_page_sections" DROP COLUMN "link_preview_rating";
  ALTER TABLE "_blog_v_version_page_sections" DROP COLUMN "link_preview_review_count";
  DROP TYPE "public"."enum_pages_blocks_testimonials_items_rating";
  DROP TYPE "public"."enum_pages_blocks_testimonials_variant";
  DROP TYPE "public"."enum__pages_v_blocks_testimonials_items_rating";
  DROP TYPE "public"."enum__pages_v_blocks_testimonials_variant";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_pages_blocks_testimonials_items_rating" AS ENUM('5', '4', '3');
  CREATE TYPE "public"."enum_pages_blocks_testimonials_variant" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__pages_v_blocks_testimonials_items_rating" AS ENUM('5', '4', '3');
  CREATE TYPE "public"."enum__pages_v_blocks_testimonials_variant" AS ENUM('light', 'dark');
  CREATE TABLE "pages_blocks_testimonials_items" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "quote" varchar,
    "name" varchar,
    "role" varchar,
    "rating" "enum_pages_blocks_testimonials_items_rating" DEFAULT '5',
    "avatar_id" integer,
    "trip_id" integer
  );

  CREATE TABLE "pages_blocks_testimonials" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "subheading" varchar,
    "variant" "enum_pages_blocks_testimonials_variant" DEFAULT 'light',
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_testimonials_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "quote" varchar,
    "name" varchar,
    "role" varchar,
    "rating" "enum__pages_v_blocks_testimonials_items_rating" DEFAULT '5',
    "avatar_id" integer,
    "trip_id" integer,
    "_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_testimonials" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar,
    "subheading" varchar,
    "variant" "enum__pages_v_blocks_testimonials_variant" DEFAULT 'light',
    "_uuid" varchar,
    "block_name" varchar
  );

  ALTER TABLE "trips_page_sections_multi_links" ADD COLUMN "link_preview_rating" numeric;
  ALTER TABLE "trips_page_sections_multi_links" ADD COLUMN "link_preview_review_count" numeric;
  ALTER TABLE "trips_page_sections" ADD COLUMN "link_preview_rating" numeric;
  ALTER TABLE "trips_page_sections" ADD COLUMN "link_preview_review_count" numeric;
  ALTER TABLE "_trips_page_sections_multi_links_v" ADD COLUMN "link_preview_rating" numeric;
  ALTER TABLE "_trips_page_sections_multi_links_v" ADD COLUMN "link_preview_review_count" numeric;
  ALTER TABLE "_trips_v_version_page_sections" ADD COLUMN "link_preview_rating" numeric;
  ALTER TABLE "_trips_v_version_page_sections" ADD COLUMN "link_preview_review_count" numeric;
  ALTER TABLE "blog_page_sections_multi_links" ADD COLUMN "link_preview_rating" numeric;
  ALTER TABLE "blog_page_sections_multi_links" ADD COLUMN "link_preview_review_count" numeric;
  ALTER TABLE "blog_page_sections" ADD COLUMN "link_preview_rating" numeric;
  ALTER TABLE "blog_page_sections" ADD COLUMN "link_preview_review_count" numeric;
  ALTER TABLE "_blog_page_sections_multi_links_v" ADD COLUMN "link_preview_rating" numeric;
  ALTER TABLE "_blog_page_sections_multi_links_v" ADD COLUMN "link_preview_review_count" numeric;
  ALTER TABLE "_blog_v_version_page_sections" ADD COLUMN "link_preview_rating" numeric;
  ALTER TABLE "_blog_v_version_page_sections" ADD COLUMN "link_preview_review_count" numeric;
  ALTER TABLE "pages_blocks_testimonials_items" ADD CONSTRAINT "pages_blocks_testimonials_items_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_items" ADD CONSTRAINT "pages_blocks_testimonials_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_items" ADD CONSTRAINT "pages_blocks_testimonials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_items" ADD CONSTRAINT "_pages_v_blocks_testimonials_items_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_items" ADD CONSTRAINT "_pages_v_blocks_testimonials_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_items" ADD CONSTRAINT "_pages_v_blocks_testimonials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials" ADD CONSTRAINT "_pages_v_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_testimonials_items_order_idx" ON "pages_blocks_testimonials_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_items_parent_id_idx" ON "pages_blocks_testimonials_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_items_locale_idx" ON "pages_blocks_testimonials_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_testimonials_items_avatar_idx" ON "pages_blocks_testimonials_items" USING btree ("avatar_id");
  CREATE INDEX "pages_blocks_testimonials_items_trip_idx" ON "pages_blocks_testimonials_items" USING btree ("trip_id");
  CREATE INDEX "pages_blocks_testimonials_order_idx" ON "pages_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_parent_id_idx" ON "pages_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_path_idx" ON "pages_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "pages_blocks_testimonials_locale_idx" ON "pages_blocks_testimonials" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_testimonials_items_order_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonials_items_parent_id_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonials_items_locale_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_testimonials_items_avatar_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("avatar_id");
  CREATE INDEX "_pages_v_blocks_testimonials_items_trip_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("trip_id");
  CREATE INDEX "_pages_v_blocks_testimonials_order_idx" ON "_pages_v_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonials_parent_id_idx" ON "_pages_v_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonials_path_idx" ON "_pages_v_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_testimonials_locale_idx" ON "_pages_v_blocks_testimonials" USING btree ("_locale");
  `)
}
