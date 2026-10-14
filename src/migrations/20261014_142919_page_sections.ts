import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_trips_page_sections_kind" AS ENUM('hero', 'overview', 'highlights', 'itinerary', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  CREATE TYPE "public"."enum__trips_v_version_page_sections_kind" AS ENUM('hero', 'overview', 'highlights', 'itinerary', 'information', 'inclusions', 'packing', 'faqs', 'gallery', 'inquiry', 'related', 'html');
  CREATE TYPE "public"."enum_blog_page_sections_kind" AS ENUM('hero', 'content', 'author', 'navigation', 'planning', 'related', 'html');
  CREATE TYPE "public"."enum__blog_v_version_page_sections_kind" AS ENUM('hero', 'content', 'author', 'navigation', 'planning', 'related', 'html');
  CREATE TABLE "trips_page_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_trips_page_sections_kind" DEFAULT 'html',
  	"heading" varchar,
  	"html" varchar
  );
  
  CREATE TABLE "_trips_v_version_page_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__trips_v_version_page_sections_kind" DEFAULT 'html',
  	"heading" varchar,
  	"html" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "blog_page_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_blog_page_sections_kind" DEFAULT 'html',
  	"heading" varchar,
  	"html" varchar
  );
  
  CREATE TABLE "_blog_v_version_page_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__blog_v_version_page_sections_kind" DEFAULT 'html',
  	"heading" varchar,
  	"html" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "trips_page_sections" ADD CONSTRAINT "trips_page_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_page_sections" ADD CONSTRAINT "_trips_v_version_page_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_page_sections" ADD CONSTRAINT "blog_page_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_version_page_sections" ADD CONSTRAINT "_blog_v_version_page_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trips_page_sections_order_idx" ON "trips_page_sections" USING btree ("_order");
  CREATE INDEX "trips_page_sections_parent_id_idx" ON "trips_page_sections" USING btree ("_parent_id");
  CREATE INDEX "trips_page_sections_locale_idx" ON "trips_page_sections" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_page_sections_order_idx" ON "_trips_v_version_page_sections" USING btree ("_order");
  CREATE INDEX "_trips_v_version_page_sections_parent_id_idx" ON "_trips_v_version_page_sections" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_page_sections_locale_idx" ON "_trips_v_version_page_sections" USING btree ("_locale");
  CREATE INDEX "blog_page_sections_order_idx" ON "blog_page_sections" USING btree ("_order");
  CREATE INDEX "blog_page_sections_parent_id_idx" ON "blog_page_sections" USING btree ("_parent_id");
  CREATE INDEX "blog_page_sections_locale_idx" ON "blog_page_sections" USING btree ("_locale");
  CREATE INDEX "_blog_v_version_page_sections_order_idx" ON "_blog_v_version_page_sections" USING btree ("_order");
  CREATE INDEX "_blog_v_version_page_sections_parent_id_idx" ON "_blog_v_version_page_sections" USING btree ("_parent_id");
  CREATE INDEX "_blog_v_version_page_sections_locale_idx" ON "_blog_v_version_page_sections" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "trips_page_sections" CASCADE;
  DROP TABLE "_trips_v_version_page_sections" CASCADE;
  DROP TABLE "blog_page_sections" CASCADE;
  DROP TABLE "_blog_v_version_page_sections" CASCADE;
  DROP TYPE "public"."enum_trips_page_sections_kind";
  DROP TYPE "public"."enum__trips_v_version_page_sections_kind";
  DROP TYPE "public"."enum_blog_page_sections_kind";
  DROP TYPE "public"."enum__blog_v_version_page_sections_kind";`)
}
