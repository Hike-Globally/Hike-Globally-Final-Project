import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * FAQs on blog posts — the same seven categorised lists as trips (`src/fields/faqs.ts`) — plus a
 * "FAQs" row in the blog's Page sections.
 *
 * 1. Tables: one localized question/answer array per FAQ category, each with its versioned twin.
 *    Exactly what `payload migrate:create` produced for the config change; nothing else moved.
 *
 * 2. Enums: `faqs` joins both blog page-section enums, after `content`. The generator emits
 *    `ALTER TYPE … ADD VALUE`, which older PostgreSQL rejects inside the migration's transaction
 *    and newer PostgreSQL will not let that same transaction use — and step 3 uses it. So each
 *    enum is rebuilt through `text` instead, as in 20261010_180000_trip_difficulty_levels. Every
 *    existing value is kept, so no row changes.
 *
 * 3. Backfill: a layout saved before this migration lists only the sections that existed then,
 *    so FAQs added to an older post would never appear. Every saved layout — live and versioned,
 *    per locale — gets a FAQs row right after the article body (at the end if the editor removed
 *    the body row). Nothing changes on screen: an empty FAQs section is not rendered. Removing
 *    the row afterwards hides the section, like any other. Posts that never saved a layout need
 *    nothing — they resolve to the defaults, which now include FAQs.
 *
 * `down` deletes those rows before narrowing the enums again (the cast would fail on them). The
 * gap they leave in `_order` is harmless: rows are read in `_order` order, and the next save
 * renumbers them.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "blog_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "blog_best_time_to_trek_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "blog_required_permits_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "blog_trekker_safety_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "blog_packing_list_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "blog_altitude_sickness_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "blog_accommodation_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

  CREATE TABLE "_blog_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "_blog_v_version_best_time_to_trek_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "_blog_v_version_required_permits_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "_blog_v_version_trekker_safety_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "_blog_v_version_packing_list_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "_blog_v_version_altitude_sickness_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "_blog_v_version_accommodation_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

  ALTER TABLE "blog_faqs" ADD CONSTRAINT "blog_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_best_time_to_trek_faqs" ADD CONSTRAINT "blog_best_time_to_trek_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_required_permits_faqs" ADD CONSTRAINT "blog_required_permits_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_trekker_safety_faqs" ADD CONSTRAINT "blog_trekker_safety_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_packing_list_faqs" ADD CONSTRAINT "blog_packing_list_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_altitude_sickness_faqs" ADD CONSTRAINT "blog_altitude_sickness_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_accommodation_faqs" ADD CONSTRAINT "blog_accommodation_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_version_faqs" ADD CONSTRAINT "_blog_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_version_best_time_to_trek_faqs" ADD CONSTRAINT "_blog_v_version_best_time_to_trek_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_version_required_permits_faqs" ADD CONSTRAINT "_blog_v_version_required_permits_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_version_trekker_safety_faqs" ADD CONSTRAINT "_blog_v_version_trekker_safety_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_version_packing_list_faqs" ADD CONSTRAINT "_blog_v_version_packing_list_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_version_altitude_sickness_faqs" ADD CONSTRAINT "_blog_v_version_altitude_sickness_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_version_accommodation_faqs" ADD CONSTRAINT "_blog_v_version_accommodation_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "blog_faqs_order_idx" ON "blog_faqs" USING btree ("_order");
  CREATE INDEX "blog_faqs_parent_id_idx" ON "blog_faqs" USING btree ("_parent_id");
  CREATE INDEX "blog_faqs_locale_idx" ON "blog_faqs" USING btree ("_locale");
  CREATE INDEX "blog_best_time_to_trek_faqs_order_idx" ON "blog_best_time_to_trek_faqs" USING btree ("_order");
  CREATE INDEX "blog_best_time_to_trek_faqs_parent_id_idx" ON "blog_best_time_to_trek_faqs" USING btree ("_parent_id");
  CREATE INDEX "blog_best_time_to_trek_faqs_locale_idx" ON "blog_best_time_to_trek_faqs" USING btree ("_locale");
  CREATE INDEX "blog_required_permits_faqs_order_idx" ON "blog_required_permits_faqs" USING btree ("_order");
  CREATE INDEX "blog_required_permits_faqs_parent_id_idx" ON "blog_required_permits_faqs" USING btree ("_parent_id");
  CREATE INDEX "blog_required_permits_faqs_locale_idx" ON "blog_required_permits_faqs" USING btree ("_locale");
  CREATE INDEX "blog_trekker_safety_faqs_order_idx" ON "blog_trekker_safety_faqs" USING btree ("_order");
  CREATE INDEX "blog_trekker_safety_faqs_parent_id_idx" ON "blog_trekker_safety_faqs" USING btree ("_parent_id");
  CREATE INDEX "blog_trekker_safety_faqs_locale_idx" ON "blog_trekker_safety_faqs" USING btree ("_locale");
  CREATE INDEX "blog_packing_list_faqs_order_idx" ON "blog_packing_list_faqs" USING btree ("_order");
  CREATE INDEX "blog_packing_list_faqs_parent_id_idx" ON "blog_packing_list_faqs" USING btree ("_parent_id");
  CREATE INDEX "blog_packing_list_faqs_locale_idx" ON "blog_packing_list_faqs" USING btree ("_locale");
  CREATE INDEX "blog_altitude_sickness_faqs_order_idx" ON "blog_altitude_sickness_faqs" USING btree ("_order");
  CREATE INDEX "blog_altitude_sickness_faqs_parent_id_idx" ON "blog_altitude_sickness_faqs" USING btree ("_parent_id");
  CREATE INDEX "blog_altitude_sickness_faqs_locale_idx" ON "blog_altitude_sickness_faqs" USING btree ("_locale");
  CREATE INDEX "blog_accommodation_faqs_order_idx" ON "blog_accommodation_faqs" USING btree ("_order");
  CREATE INDEX "blog_accommodation_faqs_parent_id_idx" ON "blog_accommodation_faqs" USING btree ("_parent_id");
  CREATE INDEX "blog_accommodation_faqs_locale_idx" ON "blog_accommodation_faqs" USING btree ("_locale");
  CREATE INDEX "_blog_v_version_faqs_order_idx" ON "_blog_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_blog_v_version_faqs_parent_id_idx" ON "_blog_v_version_faqs" USING btree ("_parent_id");
  CREATE INDEX "_blog_v_version_faqs_locale_idx" ON "_blog_v_version_faqs" USING btree ("_locale");
  CREATE INDEX "_blog_v_version_best_time_to_trek_faqs_order_idx" ON "_blog_v_version_best_time_to_trek_faqs" USING btree ("_order");
  CREATE INDEX "_blog_v_version_best_time_to_trek_faqs_parent_id_idx" ON "_blog_v_version_best_time_to_trek_faqs" USING btree ("_parent_id");
  CREATE INDEX "_blog_v_version_best_time_to_trek_faqs_locale_idx" ON "_blog_v_version_best_time_to_trek_faqs" USING btree ("_locale");
  CREATE INDEX "_blog_v_version_required_permits_faqs_order_idx" ON "_blog_v_version_required_permits_faqs" USING btree ("_order");
  CREATE INDEX "_blog_v_version_required_permits_faqs_parent_id_idx" ON "_blog_v_version_required_permits_faqs" USING btree ("_parent_id");
  CREATE INDEX "_blog_v_version_required_permits_faqs_locale_idx" ON "_blog_v_version_required_permits_faqs" USING btree ("_locale");
  CREATE INDEX "_blog_v_version_trekker_safety_faqs_order_idx" ON "_blog_v_version_trekker_safety_faqs" USING btree ("_order");
  CREATE INDEX "_blog_v_version_trekker_safety_faqs_parent_id_idx" ON "_blog_v_version_trekker_safety_faqs" USING btree ("_parent_id");
  CREATE INDEX "_blog_v_version_trekker_safety_faqs_locale_idx" ON "_blog_v_version_trekker_safety_faqs" USING btree ("_locale");
  CREATE INDEX "_blog_v_version_packing_list_faqs_order_idx" ON "_blog_v_version_packing_list_faqs" USING btree ("_order");
  CREATE INDEX "_blog_v_version_packing_list_faqs_parent_id_idx" ON "_blog_v_version_packing_list_faqs" USING btree ("_parent_id");
  CREATE INDEX "_blog_v_version_packing_list_faqs_locale_idx" ON "_blog_v_version_packing_list_faqs" USING btree ("_locale");
  CREATE INDEX "_blog_v_version_altitude_sickness_faqs_order_idx" ON "_blog_v_version_altitude_sickness_faqs" USING btree ("_order");
  CREATE INDEX "_blog_v_version_altitude_sickness_faqs_parent_id_idx" ON "_blog_v_version_altitude_sickness_faqs" USING btree ("_parent_id");
  CREATE INDEX "_blog_v_version_altitude_sickness_faqs_locale_idx" ON "_blog_v_version_altitude_sickness_faqs" USING btree ("_locale");
  CREATE INDEX "_blog_v_version_accommodation_faqs_order_idx" ON "_blog_v_version_accommodation_faqs" USING btree ("_order");
  CREATE INDEX "_blog_v_version_accommodation_faqs_parent_id_idx" ON "_blog_v_version_accommodation_faqs" USING btree ("_parent_id");
  CREATE INDEX "_blog_v_version_accommodation_faqs_locale_idx" ON "_blog_v_version_accommodation_faqs" USING btree ("_locale");

  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum_blog_page_sections_kind";
  CREATE TYPE "public"."enum_blog_page_sections_kind" AS ENUM('hero', 'content', 'faqs', 'author', 'navigation', 'planning', 'related', 'html');
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_blog_page_sections_kind";
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_blog_page_sections_kind" USING "kind"::"public"."enum_blog_page_sections_kind";
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum__blog_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__blog_v_version_page_sections_kind" AS ENUM('hero', 'content', 'faqs', 'author', 'navigation', 'planning', 'related', 'html');
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__blog_v_version_page_sections_kind";
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__blog_v_version_page_sections_kind" USING "kind"::"public"."enum__blog_v_version_page_sections_kind";

  UPDATE "blog_page_sections" AS "row"
  SET "_order" = "row"."_order" + 1
  FROM (
    SELECT "_parent_id", "_locale", MIN("_order") AS "_order"
    FROM "blog_page_sections"
    WHERE "kind" = 'content'
    GROUP BY "_parent_id", "_locale"
  ) AS "body"
  WHERE "row"."_parent_id" = "body"."_parent_id"
    AND "row"."_locale" = "body"."_locale"
    AND "row"."_order" > "body"."_order";

  INSERT INTO "blog_page_sections" ("_order", "_parent_id", "_locale", "id", "kind")
  SELECT
    COALESCE("body"."_order", "layout"."last_order") + 1,
    "layout"."_parent_id",
    "layout"."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24),
    'faqs'
  FROM (
    SELECT "_parent_id", "_locale", MAX("_order") AS "last_order"
    FROM "blog_page_sections"
    GROUP BY "_parent_id", "_locale"
  ) AS "layout"
  LEFT JOIN (
    SELECT "_parent_id", "_locale", MIN("_order") AS "_order"
    FROM "blog_page_sections"
    WHERE "kind" = 'content'
    GROUP BY "_parent_id", "_locale"
  ) AS "body"
    ON "body"."_parent_id" = "layout"."_parent_id" AND "body"."_locale" = "layout"."_locale";

  UPDATE "_blog_v_version_page_sections" AS "row"
  SET "_order" = "row"."_order" + 1
  FROM (
    SELECT "_parent_id", "_locale", MIN("_order") AS "_order"
    FROM "_blog_v_version_page_sections"
    WHERE "kind" = 'content'
    GROUP BY "_parent_id", "_locale"
  ) AS "body"
  WHERE "row"."_parent_id" = "body"."_parent_id"
    AND "row"."_locale" = "body"."_locale"
    AND "row"."_order" > "body"."_order";

  INSERT INTO "_blog_v_version_page_sections" ("_order", "_parent_id", "_locale", "_uuid", "kind")
  SELECT
    COALESCE("body"."_order", "layout"."last_order") + 1,
    "layout"."_parent_id",
    "layout"."_locale",
    substr(md5(random()::text || clock_timestamp()::text), 1, 24),
    'faqs'
  FROM (
    SELECT "_parent_id", "_locale", MAX("_order") AS "last_order"
    FROM "_blog_v_version_page_sections"
    GROUP BY "_parent_id", "_locale"
  ) AS "layout"
  LEFT JOIN (
    SELECT "_parent_id", "_locale", MIN("_order") AS "_order"
    FROM "_blog_v_version_page_sections"
    WHERE "kind" = 'content'
    GROUP BY "_parent_id", "_locale"
  ) AS "body"
    ON "body"."_parent_id" = "layout"."_parent_id" AND "body"."_locale" = "layout"."_locale";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DELETE FROM "blog_page_sections" WHERE "kind" = 'faqs';
  DELETE FROM "_blog_v_version_page_sections" WHERE "kind" = 'faqs';

  DROP TABLE "blog_faqs" CASCADE;
  DROP TABLE "blog_best_time_to_trek_faqs" CASCADE;
  DROP TABLE "blog_required_permits_faqs" CASCADE;
  DROP TABLE "blog_trekker_safety_faqs" CASCADE;
  DROP TABLE "blog_packing_list_faqs" CASCADE;
  DROP TABLE "blog_altitude_sickness_faqs" CASCADE;
  DROP TABLE "blog_accommodation_faqs" CASCADE;
  DROP TABLE "_blog_v_version_faqs" CASCADE;
  DROP TABLE "_blog_v_version_best_time_to_trek_faqs" CASCADE;
  DROP TABLE "_blog_v_version_required_permits_faqs" CASCADE;
  DROP TABLE "_blog_v_version_trekker_safety_faqs" CASCADE;
  DROP TABLE "_blog_v_version_packing_list_faqs" CASCADE;
  DROP TABLE "_blog_v_version_altitude_sickness_faqs" CASCADE;
  DROP TABLE "_blog_v_version_accommodation_faqs" CASCADE;

  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum_blog_page_sections_kind";
  CREATE TYPE "public"."enum_blog_page_sections_kind" AS ENUM('hero', 'content', 'author', 'navigation', 'planning', 'related', 'html');
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum_blog_page_sections_kind";
  ALTER TABLE "blog_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_blog_page_sections_kind" USING "kind"::"public"."enum_blog_page_sections_kind";
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::text;
  DROP TYPE "public"."enum__blog_v_version_page_sections_kind";
  CREATE TYPE "public"."enum__blog_v_version_page_sections_kind" AS ENUM('hero', 'content', 'author', 'navigation', 'planning', 'related', 'html');
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DEFAULT 'html'::"public"."enum__blog_v_version_page_sections_kind";
  ALTER TABLE "_blog_v_version_page_sections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum__blog_v_version_page_sections_kind" USING "kind"::"public"."enum__blog_v_version_page_sections_kind";`)
}
