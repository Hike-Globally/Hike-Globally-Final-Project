import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_trips_page_sections_multi_preview_layout" AS ENUM('list', 'slider', 'carousel');
  CREATE TYPE "public"."enum_trips_page_sections_multi_preview_animation" AS ENUM('fade', 'rise', 'slide', 'zoom', 'reveal', 'none');
  CREATE TYPE "public"."enum__trips_v_version_page_sections_multi_preview_layout" AS ENUM('list', 'slider', 'carousel');
  CREATE TYPE "public"."enum__trips_v_version_page_sections_multi_preview_animation" AS ENUM('fade', 'rise', 'slide', 'zoom', 'reveal', 'none');
  CREATE TYPE "public"."enum_blog_page_sections_multi_preview_layout" AS ENUM('list', 'slider', 'carousel');
  CREATE TYPE "public"."enum_blog_page_sections_multi_preview_animation" AS ENUM('fade', 'rise', 'slide', 'zoom', 'reveal', 'none');
  CREATE TYPE "public"."enum__blog_v_version_page_sections_multi_preview_layout" AS ENUM('list', 'slider', 'carousel');
  CREATE TYPE "public"."enum__blog_v_version_page_sections_multi_preview_animation" AS ENUM('fade', 'rise', 'slide', 'zoom', 'reveal', 'none');
  ALTER TYPE "public"."enum_trips_page_sections_kind" ADD VALUE 'multiUrlPreview' BEFORE 'routeMap';
  ALTER TYPE "public"."enum__trips_v_version_page_sections_kind" ADD VALUE 'multiUrlPreview' BEFORE 'routeMap';
  ALTER TYPE "public"."enum_blog_page_sections_kind" ADD VALUE 'multiUrlPreview' BEFORE 'faqs';
  ALTER TYPE "public"."enum__blog_v_version_page_sections_kind" ADD VALUE 'multiUrlPreview' BEFORE 'faqs';
  CREATE TABLE "trips_page_sections_multi_links" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "link_preview_url" varchar,
    "link_preview_title" varchar,
    "link_preview_description" varchar,
    "link_preview_rating" numeric,
    "link_preview_review_count" numeric,
    "link_preview_price" varchar,
    "link_preview_original_price" varchar
  );

  CREATE TABLE "_trips_page_sections_multi_links_v" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "link_preview_url" varchar,
    "link_preview_title" varchar,
    "link_preview_description" varchar,
    "link_preview_rating" numeric,
    "link_preview_review_count" numeric,
    "link_preview_price" varchar,
    "link_preview_original_price" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "blog_page_sections_multi_links" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "link_preview_url" varchar,
    "link_preview_title" varchar,
    "link_preview_description" varchar,
    "link_preview_rating" numeric,
    "link_preview_review_count" numeric,
    "link_preview_price" varchar,
    "link_preview_original_price" varchar
  );

  CREATE TABLE "_blog_page_sections_multi_links_v" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "link_preview_url" varchar,
    "link_preview_title" varchar,
    "link_preview_description" varchar,
    "link_preview_rating" numeric,
    "link_preview_review_count" numeric,
    "link_preview_price" varchar,
    "link_preview_original_price" varchar,
    "_uuid" varchar
  );

  ALTER TABLE "trips_page_sections" ADD COLUMN "multi_preview_heading" varchar;
  ALTER TABLE "trips_page_sections" ADD COLUMN "multi_preview_description" varchar;
  ALTER TABLE "trips_page_sections" ADD COLUMN "multi_preview_layout" "enum_trips_page_sections_multi_preview_layout" DEFAULT 'slider';
  ALTER TABLE "trips_page_sections" ADD COLUMN "multi_preview_animation" "enum_trips_page_sections_multi_preview_animation" DEFAULT 'rise';
  ALTER TABLE "_trips_v_version_page_sections" ADD COLUMN "multi_preview_heading" varchar;
  ALTER TABLE "_trips_v_version_page_sections" ADD COLUMN "multi_preview_description" varchar;
  ALTER TABLE "_trips_v_version_page_sections" ADD COLUMN "multi_preview_layout" "enum__trips_v_version_page_sections_multi_preview_layout" DEFAULT 'slider';
  ALTER TABLE "_trips_v_version_page_sections" ADD COLUMN "multi_preview_animation" "enum__trips_v_version_page_sections_multi_preview_animation" DEFAULT 'rise';
  ALTER TABLE "blog_page_sections" ADD COLUMN "multi_preview_heading" varchar;
  ALTER TABLE "blog_page_sections" ADD COLUMN "multi_preview_description" varchar;
  ALTER TABLE "blog_page_sections" ADD COLUMN "multi_preview_layout" "enum_blog_page_sections_multi_preview_layout" DEFAULT 'slider';
  ALTER TABLE "blog_page_sections" ADD COLUMN "multi_preview_animation" "enum_blog_page_sections_multi_preview_animation" DEFAULT 'rise';
  ALTER TABLE "_blog_v_version_page_sections" ADD COLUMN "multi_preview_heading" varchar;
  ALTER TABLE "_blog_v_version_page_sections" ADD COLUMN "multi_preview_description" varchar;
  ALTER TABLE "_blog_v_version_page_sections" ADD COLUMN "multi_preview_layout" "enum__blog_v_version_page_sections_multi_preview_layout" DEFAULT 'slider';
  ALTER TABLE "_blog_v_version_page_sections" ADD COLUMN "multi_preview_animation" "enum__blog_v_version_page_sections_multi_preview_animation" DEFAULT 'rise';
  ALTER TABLE "trips_page_sections_multi_links" ADD CONSTRAINT "trips_page_sections_multi_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips_page_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_page_sections_multi_links_v" ADD CONSTRAINT "_trips_page_sections_multi_links_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v_version_page_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_page_sections_multi_links" ADD CONSTRAINT "blog_page_sections_multi_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_page_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_page_sections_multi_links_v" ADD CONSTRAINT "_blog_page_sections_multi_links_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blog_v_version_page_sections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trips_page_sections_multi_links_order_idx" ON "trips_page_sections_multi_links" USING btree ("_order");
  CREATE INDEX "trips_page_sections_multi_links_parent_id_idx" ON "trips_page_sections_multi_links" USING btree ("_parent_id");
  CREATE INDEX "trips_page_sections_multi_links_locale_idx" ON "trips_page_sections_multi_links" USING btree ("_locale");
  CREATE INDEX "_trips_page_sections_multi_links_v_order_idx" ON "_trips_page_sections_multi_links_v" USING btree ("_order");
  CREATE INDEX "_trips_page_sections_multi_links_v_parent_id_idx" ON "_trips_page_sections_multi_links_v" USING btree ("_parent_id");
  CREATE INDEX "_trips_page_sections_multi_links_v_locale_idx" ON "_trips_page_sections_multi_links_v" USING btree ("_locale");
  CREATE INDEX "blog_page_sections_multi_links_order_idx" ON "blog_page_sections_multi_links" USING btree ("_order");
  CREATE INDEX "blog_page_sections_multi_links_parent_id_idx" ON "blog_page_sections_multi_links" USING btree ("_parent_id");
  CREATE INDEX "blog_page_sections_multi_links_locale_idx" ON "blog_page_sections_multi_links" USING btree ("_locale");
  CREATE INDEX "_blog_page_sections_multi_links_v_order_idx" ON "_blog_page_sections_multi_links_v" USING btree ("_order");
  CREATE INDEX "_blog_page_sections_multi_links_v_parent_id_idx" ON "_blog_page_sections_multi_links_v" USING btree ("_parent_id");
  CREATE INDEX "_blog_page_sections_multi_links_v_locale_idx" ON "_blog_page_sections_multi_links_v" USING btree ("_locale");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Remove only this feature's rows before narrowing the enums. All older content is retained.
  // Inline Lexical blocks are JSON and remain stored if the feature is re-enabled later.
  await db.execute(sql`
   DELETE FROM "trips_page_sections" WHERE "kind" = 'multiUrlPreview';
  DELETE FROM "_trips_v_version_page_sections" WHERE "kind" = 'multiUrlPreview';
  DELETE FROM "blog_page_sections" WHERE "kind" = 'multiUrlPreview';
  DELETE FROM "_blog_v_version_page_sections" WHERE "kind" = 'multiUrlPreview';
  DROP TABLE "trips_page_sections_multi_links" CASCADE;
  DROP TABLE "_trips_page_sections_multi_links_v" CASCADE;
  DROP TABLE "blog_page_sections_multi_links" CASCADE;
  DROP TABLE "_blog_page_sections_multi_links_v" CASCADE;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum_trips_page_sections_kind";
  CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM('hero', 'keyTakeaways', 'overview', 'whyChoose', 'highlights', 'audience', 'linkPreview', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "trips_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_trips_page_sections_kind" USING "kind"::"public"."enum_trips_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum__trips_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM('hero', 'keyTakeaways', 'overview', 'whyChoose', 'highlights', 'audience', 'linkPreview', 'routeMap', 'itinerary', 'departures', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "_trips_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__trips_v_version_page_sections_kind" USING "kind"::"public"."enum__trips_v_version_page_sections_kind";
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum_blog_page_sections_kind";
  CREATE TYPE "public"."enum_blog_page_sections_kind" AS ENUM('hero', 'content', 'linkPreview', 'faqs', 'author', 'navigation', 'planning', 'related', 'html');
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_blog_page_sections_kind";
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_blog_page_sections_kind" USING "kind"::"public"."enum_blog_page_sections_kind";
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum__blog_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__blog_v_version_page_sections_kind" AS ENUM('hero', 'content', 'linkPreview', 'faqs', 'author', 'navigation', 'planning', 'related', 'html');
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__blog_v_version_page_sections_kind";
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__blog_v_version_page_sections_kind" USING "kind"::"public"."enum__blog_v_version_page_sections_kind";
  ALTER TABLE "trips_page_sections" DROP COLUMN "multi_preview_heading";
  ALTER TABLE "trips_page_sections" DROP COLUMN "multi_preview_description";
  ALTER TABLE "trips_page_sections" DROP COLUMN "multi_preview_layout";
  ALTER TABLE "trips_page_sections" DROP COLUMN "multi_preview_animation";
  ALTER TABLE "_trips_v_version_page_sections" DROP COLUMN "multi_preview_heading";
  ALTER TABLE "_trips_v_version_page_sections" DROP COLUMN "multi_preview_description";
  ALTER TABLE "_trips_v_version_page_sections" DROP COLUMN "multi_preview_layout";
  ALTER TABLE "_trips_v_version_page_sections" DROP COLUMN "multi_preview_animation";
  ALTER TABLE "blog_page_sections" DROP COLUMN "multi_preview_heading";
  ALTER TABLE "blog_page_sections" DROP COLUMN "multi_preview_description";
  ALTER TABLE "blog_page_sections" DROP COLUMN "multi_preview_layout";
  ALTER TABLE "blog_page_sections" DROP COLUMN "multi_preview_animation";
  ALTER TABLE "_blog_v_version_page_sections" DROP COLUMN "multi_preview_heading";
  ALTER TABLE "_blog_v_version_page_sections" DROP COLUMN "multi_preview_description";
  ALTER TABLE "_blog_v_version_page_sections" DROP COLUMN "multi_preview_layout";
  ALTER TABLE "_blog_v_version_page_sections" DROP COLUMN "multi_preview_animation";
  DROP TYPE "public"."enum_trips_page_sections_multi_preview_layout";
  DROP TYPE "public"."enum_trips_page_sections_multi_preview_animation";
  DROP TYPE "public"."enum__trips_v_version_page_sections_multi_preview_layout";
  DROP TYPE "public"."enum__trips_v_version_page_sections_multi_preview_animation";
  DROP TYPE "public"."enum_blog_page_sections_multi_preview_layout";
  DROP TYPE "public"."enum_blog_page_sections_multi_preview_animation";
  DROP TYPE "public"."enum__blog_v_version_page_sections_multi_preview_layout";
  DROP TYPE "public"."enum__blog_v_version_page_sections_multi_preview_animation";`)
}
