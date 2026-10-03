import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_featured_trips_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_featured_destinations_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_latest_posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_stats_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_gallery_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_testimonials_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_inquiry_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_featured_trips_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_featured_destinations_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_latest_posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_stats_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_gallery_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_testimonials_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_inquiry_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cta_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "header_nav_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "header_actions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "footer_columns_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "footer_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "footer_legal_links_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_hero_locales" CASCADE;
  DROP TABLE "pages_blocks_rich_text_locales" CASCADE;
  DROP TABLE "pages_blocks_featured_trips_locales" CASCADE;
  DROP TABLE "pages_blocks_featured_destinations_locales" CASCADE;
  DROP TABLE "pages_blocks_latest_posts_locales" CASCADE;
  DROP TABLE "pages_blocks_stats_locales" CASCADE;
  DROP TABLE "pages_blocks_gallery_locales" CASCADE;
  DROP TABLE "pages_blocks_testimonials_locales" CASCADE;
  DROP TABLE "pages_blocks_faq_locales" CASCADE;
  DROP TABLE "pages_blocks_inquiry_locales" CASCADE;
  DROP TABLE "pages_blocks_cta_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_trips_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_destinations_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_latest_posts_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_inquiry_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_locales" CASCADE;
  DROP TABLE "header_nav_items_locales" CASCADE;
  DROP TABLE "header_actions_locales" CASCADE;
  DROP TABLE "footer_columns_links_locales" CASCADE;
  DROP TABLE "footer_columns_locales" CASCADE;
  DROP TABLE "footer_legal_links_locales" CASCADE;
  DROP INDEX "pages_rels_pages_id_idx";
  DROP INDEX "pages_rels_trips_id_idx";
  DROP INDEX "pages_rels_destinations_id_idx";
  DROP INDEX "pages_rels_blog_id_idx";
  DROP INDEX "_pages_v_rels_pages_id_idx";
  DROP INDEX "_pages_v_rels_trips_id_idx";
  DROP INDEX "_pages_v_rels_destinations_id_idx";
  DROP INDEX "_pages_v_rels_blog_id_idx";
  DROP INDEX "header_rels_pages_id_idx";
  DROP INDEX "header_rels_trips_id_idx";
  DROP INDEX "header_rels_destinations_id_idx";
  DROP INDEX "header_rels_blog_id_idx";
  DROP INDEX "footer_rels_pages_id_idx";
  DROP INDEX "footer_rels_trips_id_idx";
  DROP INDEX "footer_rels_destinations_id_idx";
  DROP INDEX "footer_rels_blog_id_idx";
  ALTER TABLE "trips" ADD COLUMN "booking_link_link_label" varchar;
  ALTER TABLE "_trips_v" ADD COLUMN "version_booking_link_link_label" varchar;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "subheading" varchar;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "primary_link_label" varchar;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "secondary_link_label" varchar;
  ALTER TABLE "pages_blocks_rich_text" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_rich_text" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_rich_text" ADD COLUMN "content" jsonb;
  ALTER TABLE "pages_blocks_featured_trips" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_featured_trips" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_featured_trips" ADD COLUMN "subheading" varchar;
  ALTER TABLE "pages_blocks_featured_trips" ADD COLUMN "view_all_link_label" varchar;
  ALTER TABLE "pages_blocks_featured_destinations" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_featured_destinations" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_featured_destinations" ADD COLUMN "subheading" varchar;
  ALTER TABLE "pages_blocks_featured_destinations" ADD COLUMN "view_all_link_label" varchar;
  ALTER TABLE "pages_blocks_latest_posts" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_latest_posts" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_latest_posts" ADD COLUMN "subheading" varchar;
  ALTER TABLE "pages_blocks_latest_posts" ADD COLUMN "view_all_link_label" varchar;
  ALTER TABLE "pages_blocks_stats" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_stats" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_gallery_images" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_gallery" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_gallery" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_gallery" ADD COLUMN "subheading" varchar;
  ALTER TABLE "pages_blocks_testimonials" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_testimonials" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_testimonials" ADD COLUMN "subheading" varchar;
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "subheading" varchar;
  ALTER TABLE "pages_blocks_inquiry" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_inquiry" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_inquiry" ADD COLUMN "subheading" varchar;
  ALTER TABLE "pages_blocks_inquiry" ADD COLUMN "note" varchar;
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "heading" varchar;
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "text" varchar;
  ALTER TABLE "pages_blocks_cta" ADD COLUMN "link_label" varchar;
  ALTER TABLE "pages_rels" ADD COLUMN "locale" "_locales";
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "subheading" varchar;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "primary_link_label" varchar;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "secondary_link_label" varchar;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD COLUMN "content" jsonb;
  ALTER TABLE "_pages_v_blocks_featured_trips" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_featured_trips" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_featured_trips" ADD COLUMN "subheading" varchar;
  ALTER TABLE "_pages_v_blocks_featured_trips" ADD COLUMN "view_all_link_label" varchar;
  ALTER TABLE "_pages_v_blocks_featured_destinations" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_featured_destinations" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_featured_destinations" ADD COLUMN "subheading" varchar;
  ALTER TABLE "_pages_v_blocks_featured_destinations" ADD COLUMN "view_all_link_label" varchar;
  ALTER TABLE "_pages_v_blocks_latest_posts" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_latest_posts" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_latest_posts" ADD COLUMN "subheading" varchar;
  ALTER TABLE "_pages_v_blocks_latest_posts" ADD COLUMN "view_all_link_label" varchar;
  ALTER TABLE "_pages_v_blocks_stats" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_stats" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_gallery_images" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_gallery" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_gallery" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_gallery" ADD COLUMN "subheading" varchar;
  ALTER TABLE "_pages_v_blocks_testimonials" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_testimonials" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_testimonials" ADD COLUMN "subheading" varchar;
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "subheading" varchar;
  ALTER TABLE "_pages_v_blocks_inquiry" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_inquiry" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_inquiry" ADD COLUMN "subheading" varchar;
  ALTER TABLE "_pages_v_blocks_inquiry" ADD COLUMN "note" varchar;
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "heading" varchar;
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "text" varchar;
  ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "link_label" varchar;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "locale" "_locales";
  ALTER TABLE "header_nav_items" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "header_nav_items" ADD COLUMN "link_label" varchar;
  ALTER TABLE "header_actions" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "header_actions" ADD COLUMN "link_label" varchar;
  ALTER TABLE "header_rels" ADD COLUMN "locale" "_locales";
  ALTER TABLE "footer_columns_links" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "footer_columns_links" ADD COLUMN "link_label" varchar;
  ALTER TABLE "footer_columns" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "footer_columns" ADD COLUMN "heading" varchar NOT NULL;
  ALTER TABLE "footer_legal_links" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "footer_legal_links" ADD COLUMN "link_label" varchar;
  ALTER TABLE "footer_rels" ADD COLUMN "locale" "_locales";
  CREATE INDEX "pages_blocks_hero_locale_idx" ON "pages_blocks_hero" USING btree ("_locale");
  CREATE INDEX "pages_blocks_rich_text_locale_idx" ON "pages_blocks_rich_text" USING btree ("_locale");
  CREATE INDEX "pages_blocks_featured_trips_locale_idx" ON "pages_blocks_featured_trips" USING btree ("_locale");
  CREATE INDEX "pages_blocks_featured_destinations_locale_idx" ON "pages_blocks_featured_destinations" USING btree ("_locale");
  CREATE INDEX "pages_blocks_latest_posts_locale_idx" ON "pages_blocks_latest_posts" USING btree ("_locale");
  CREATE INDEX "pages_blocks_stats_locale_idx" ON "pages_blocks_stats" USING btree ("_locale");
  CREATE INDEX "pages_blocks_gallery_images_locale_idx" ON "pages_blocks_gallery_images" USING btree ("_locale");
  CREATE INDEX "pages_blocks_gallery_locale_idx" ON "pages_blocks_gallery" USING btree ("_locale");
  CREATE INDEX "pages_blocks_testimonials_locale_idx" ON "pages_blocks_testimonials" USING btree ("_locale");
  CREATE INDEX "pages_blocks_faq_locale_idx" ON "pages_blocks_faq" USING btree ("_locale");
  CREATE INDEX "pages_blocks_inquiry_locale_idx" ON "pages_blocks_inquiry" USING btree ("_locale");
  CREATE INDEX "pages_blocks_cta_locale_idx" ON "pages_blocks_cta" USING btree ("_locale");
  CREATE INDEX "pages_rels_locale_idx" ON "pages_rels" USING btree ("locale");
  CREATE INDEX "_pages_v_blocks_hero_locale_idx" ON "_pages_v_blocks_hero" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_rich_text_locale_idx" ON "_pages_v_blocks_rich_text" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_featured_trips_locale_idx" ON "_pages_v_blocks_featured_trips" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_featured_destinations_locale_idx" ON "_pages_v_blocks_featured_destinations" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_latest_posts_locale_idx" ON "_pages_v_blocks_latest_posts" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_stats_locale_idx" ON "_pages_v_blocks_stats" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_gallery_images_locale_idx" ON "_pages_v_blocks_gallery_images" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_gallery_locale_idx" ON "_pages_v_blocks_gallery" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_testimonials_locale_idx" ON "_pages_v_blocks_testimonials" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_faq_locale_idx" ON "_pages_v_blocks_faq" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_inquiry_locale_idx" ON "_pages_v_blocks_inquiry" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_cta_locale_idx" ON "_pages_v_blocks_cta" USING btree ("_locale");
  CREATE INDEX "_pages_v_rels_locale_idx" ON "_pages_v_rels" USING btree ("locale");
  CREATE INDEX "header_nav_items_locale_idx" ON "header_nav_items" USING btree ("_locale");
  CREATE INDEX "header_actions_locale_idx" ON "header_actions" USING btree ("_locale");
  CREATE INDEX "header_rels_locale_idx" ON "header_rels" USING btree ("locale");
  CREATE INDEX "footer_columns_links_locale_idx" ON "footer_columns_links" USING btree ("_locale");
  CREATE INDEX "footer_columns_locale_idx" ON "footer_columns" USING btree ("_locale");
  CREATE INDEX "footer_legal_links_locale_idx" ON "footer_legal_links" USING btree ("_locale");
  CREATE INDEX "footer_rels_locale_idx" ON "footer_rels" USING btree ("locale");
  CREATE INDEX "pages_rels_pages_id_idx" ON "pages_rels" USING btree ("pages_id","locale");
  CREATE INDEX "pages_rels_trips_id_idx" ON "pages_rels" USING btree ("trips_id","locale");
  CREATE INDEX "pages_rels_destinations_id_idx" ON "pages_rels" USING btree ("destinations_id","locale");
  CREATE INDEX "pages_rels_blog_id_idx" ON "pages_rels" USING btree ("blog_id","locale");
  CREATE INDEX "_pages_v_rels_pages_id_idx" ON "_pages_v_rels" USING btree ("pages_id","locale");
  CREATE INDEX "_pages_v_rels_trips_id_idx" ON "_pages_v_rels" USING btree ("trips_id","locale");
  CREATE INDEX "_pages_v_rels_destinations_id_idx" ON "_pages_v_rels" USING btree ("destinations_id","locale");
  CREATE INDEX "_pages_v_rels_blog_id_idx" ON "_pages_v_rels" USING btree ("blog_id","locale");
  CREATE INDEX "header_rels_pages_id_idx" ON "header_rels" USING btree ("pages_id","locale");
  CREATE INDEX "header_rels_trips_id_idx" ON "header_rels" USING btree ("trips_id","locale");
  CREATE INDEX "header_rels_destinations_id_idx" ON "header_rels" USING btree ("destinations_id","locale");
  CREATE INDEX "header_rels_blog_id_idx" ON "header_rels" USING btree ("blog_id","locale");
  CREATE INDEX "footer_rels_pages_id_idx" ON "footer_rels" USING btree ("pages_id","locale");
  CREATE INDEX "footer_rels_trips_id_idx" ON "footer_rels" USING btree ("trips_id","locale");
  CREATE INDEX "footer_rels_destinations_id_idx" ON "footer_rels" USING btree ("destinations_id","locale");
  CREATE INDEX "footer_rels_blog_id_idx" ON "footer_rels" USING btree ("blog_id","locale");
  ALTER TABLE "trips_locales" DROP COLUMN "booking_link_link_label";
  ALTER TABLE "_trips_v_locales" DROP COLUMN "version_booking_link_link_label";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_hero_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"subheading" varchar,
  	"primary_link_label" varchar,
  	"secondary_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_rich_text_locales" (
  	"heading" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_featured_trips_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_featured_destinations_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_latest_posts_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_stats_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_gallery_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_testimonials_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_inquiry_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cta_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_hero_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"subheading" varchar,
  	"primary_link_label" varchar,
  	"secondary_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text_locales" (
  	"heading" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_featured_trips_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_featured_destinations_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_latest_posts_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_stats_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_testimonials_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faq_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_inquiry_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_cta_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "header_nav_items_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "header_actions_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_columns_links_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_columns_locales" (
  	"heading" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_legal_links_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  DROP INDEX "pages_blocks_hero_locale_idx";
  DROP INDEX "pages_blocks_rich_text_locale_idx";
  DROP INDEX "pages_blocks_featured_trips_locale_idx";
  DROP INDEX "pages_blocks_featured_destinations_locale_idx";
  DROP INDEX "pages_blocks_latest_posts_locale_idx";
  DROP INDEX "pages_blocks_stats_locale_idx";
  DROP INDEX "pages_blocks_gallery_images_locale_idx";
  DROP INDEX "pages_blocks_gallery_locale_idx";
  DROP INDEX "pages_blocks_testimonials_locale_idx";
  DROP INDEX "pages_blocks_faq_locale_idx";
  DROP INDEX "pages_blocks_inquiry_locale_idx";
  DROP INDEX "pages_blocks_cta_locale_idx";
  DROP INDEX "pages_rels_locale_idx";
  DROP INDEX "_pages_v_blocks_hero_locale_idx";
  DROP INDEX "_pages_v_blocks_rich_text_locale_idx";
  DROP INDEX "_pages_v_blocks_featured_trips_locale_idx";
  DROP INDEX "_pages_v_blocks_featured_destinations_locale_idx";
  DROP INDEX "_pages_v_blocks_latest_posts_locale_idx";
  DROP INDEX "_pages_v_blocks_stats_locale_idx";
  DROP INDEX "_pages_v_blocks_gallery_images_locale_idx";
  DROP INDEX "_pages_v_blocks_gallery_locale_idx";
  DROP INDEX "_pages_v_blocks_testimonials_locale_idx";
  DROP INDEX "_pages_v_blocks_faq_locale_idx";
  DROP INDEX "_pages_v_blocks_inquiry_locale_idx";
  DROP INDEX "_pages_v_blocks_cta_locale_idx";
  DROP INDEX "_pages_v_rels_locale_idx";
  DROP INDEX "header_nav_items_locale_idx";
  DROP INDEX "header_actions_locale_idx";
  DROP INDEX "header_rels_locale_idx";
  DROP INDEX "footer_columns_links_locale_idx";
  DROP INDEX "footer_columns_locale_idx";
  DROP INDEX "footer_legal_links_locale_idx";
  DROP INDEX "footer_rels_locale_idx";
  DROP INDEX "pages_rels_pages_id_idx";
  DROP INDEX "pages_rels_trips_id_idx";
  DROP INDEX "pages_rels_destinations_id_idx";
  DROP INDEX "pages_rels_blog_id_idx";
  DROP INDEX "_pages_v_rels_pages_id_idx";
  DROP INDEX "_pages_v_rels_trips_id_idx";
  DROP INDEX "_pages_v_rels_destinations_id_idx";
  DROP INDEX "_pages_v_rels_blog_id_idx";
  DROP INDEX "header_rels_pages_id_idx";
  DROP INDEX "header_rels_trips_id_idx";
  DROP INDEX "header_rels_destinations_id_idx";
  DROP INDEX "header_rels_blog_id_idx";
  DROP INDEX "footer_rels_pages_id_idx";
  DROP INDEX "footer_rels_trips_id_idx";
  DROP INDEX "footer_rels_destinations_id_idx";
  DROP INDEX "footer_rels_blog_id_idx";
  ALTER TABLE "trips_locales" ADD COLUMN "booking_link_link_label" varchar;
  ALTER TABLE "_trips_v_locales" ADD COLUMN "version_booking_link_link_label" varchar;
  ALTER TABLE "pages_blocks_hero_locales" ADD CONSTRAINT "pages_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text_locales" ADD CONSTRAINT "pages_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_trips_locales" ADD CONSTRAINT "pages_blocks_featured_trips_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_featured_trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_destinations_locales" ADD CONSTRAINT "pages_blocks_featured_destinations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_featured_destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_latest_posts_locales" ADD CONSTRAINT "pages_blocks_latest_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_latest_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_locales" ADD CONSTRAINT "pages_blocks_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_locales" ADD CONSTRAINT "pages_blocks_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_locales" ADD CONSTRAINT "pages_blocks_testimonials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_locales" ADD CONSTRAINT "pages_blocks_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_inquiry_locales" ADD CONSTRAINT "pages_blocks_inquiry_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_inquiry"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_locales" ADD CONSTRAINT "pages_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_locales" ADD CONSTRAINT "_pages_v_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text_locales" ADD CONSTRAINT "_pages_v_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_trips_locales" ADD CONSTRAINT "_pages_v_blocks_featured_trips_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_featured_trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_destinations_locales" ADD CONSTRAINT "_pages_v_blocks_featured_destinations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_featured_destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_latest_posts_locales" ADD CONSTRAINT "_pages_v_blocks_latest_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_latest_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_locales" ADD CONSTRAINT "_pages_v_blocks_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_locales" ADD CONSTRAINT "_pages_v_blocks_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_locales" ADD CONSTRAINT "_pages_v_blocks_testimonials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_locales" ADD CONSTRAINT "_pages_v_blocks_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_inquiry_locales" ADD CONSTRAINT "_pages_v_blocks_inquiry_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_inquiry"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_locales" ADD CONSTRAINT "_pages_v_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_items_locales" ADD CONSTRAINT "header_nav_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_actions_locales" ADD CONSTRAINT "header_actions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_actions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_links_locales" ADD CONSTRAINT "footer_columns_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_locales" ADD CONSTRAINT "footer_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_legal_links_locales" ADD CONSTRAINT "footer_legal_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_legal_links"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "pages_blocks_hero_locales_locale_parent_id_unique" ON "pages_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_rich_text_locales_locale_parent_id_unique" ON "pages_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_featured_trips_locales_locale_parent_id_unique" ON "pages_blocks_featured_trips_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_featured_destinations_locales_locale_parent_id_" ON "pages_blocks_featured_destinations_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_latest_posts_locales_locale_parent_id_unique" ON "pages_blocks_latest_posts_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_stats_locales_locale_parent_id_unique" ON "pages_blocks_stats_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_gallery_locales_locale_parent_id_unique" ON "pages_blocks_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_testimonials_locales_locale_parent_id_unique" ON "pages_blocks_testimonials_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_faq_locales_locale_parent_id_unique" ON "pages_blocks_faq_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_inquiry_locales_locale_parent_id_unique" ON "pages_blocks_inquiry_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_cta_locales_locale_parent_id_unique" ON "pages_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_hero_locales_locale_parent_id_unique" ON "_pages_v_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_rich_text_locales_locale_parent_id_unique" ON "_pages_v_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_featured_trips_locales_locale_parent_id_uniq" ON "_pages_v_blocks_featured_trips_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_featured_destinations_locales_locale_parent_" ON "_pages_v_blocks_featured_destinations_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_latest_posts_locales_locale_parent_id_unique" ON "_pages_v_blocks_latest_posts_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_stats_locales_locale_parent_id_unique" ON "_pages_v_blocks_stats_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_gallery_locales_locale_parent_id_unique" ON "_pages_v_blocks_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_testimonials_locales_locale_parent_id_unique" ON "_pages_v_blocks_testimonials_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_faq_locales_locale_parent_id_unique" ON "_pages_v_blocks_faq_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_inquiry_locales_locale_parent_id_unique" ON "_pages_v_blocks_inquiry_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_cta_locales_locale_parent_id_unique" ON "_pages_v_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "header_nav_items_locales_locale_parent_id_unique" ON "header_nav_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "header_actions_locales_locale_parent_id_unique" ON "header_actions_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "footer_columns_links_locales_locale_parent_id_unique" ON "footer_columns_links_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "footer_columns_locales_locale_parent_id_unique" ON "footer_columns_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "footer_legal_links_locales_locale_parent_id_unique" ON "footer_legal_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_rels_pages_id_idx" ON "pages_rels" USING btree ("pages_id");
  CREATE INDEX "pages_rels_trips_id_idx" ON "pages_rels" USING btree ("trips_id");
  CREATE INDEX "pages_rels_destinations_id_idx" ON "pages_rels" USING btree ("destinations_id");
  CREATE INDEX "pages_rels_blog_id_idx" ON "pages_rels" USING btree ("blog_id");
  CREATE INDEX "_pages_v_rels_pages_id_idx" ON "_pages_v_rels" USING btree ("pages_id");
  CREATE INDEX "_pages_v_rels_trips_id_idx" ON "_pages_v_rels" USING btree ("trips_id");
  CREATE INDEX "_pages_v_rels_destinations_id_idx" ON "_pages_v_rels" USING btree ("destinations_id");
  CREATE INDEX "_pages_v_rels_blog_id_idx" ON "_pages_v_rels" USING btree ("blog_id");
  CREATE INDEX "header_rels_pages_id_idx" ON "header_rels" USING btree ("pages_id");
  CREATE INDEX "header_rels_trips_id_idx" ON "header_rels" USING btree ("trips_id");
  CREATE INDEX "header_rels_destinations_id_idx" ON "header_rels" USING btree ("destinations_id");
  CREATE INDEX "header_rels_blog_id_idx" ON "header_rels" USING btree ("blog_id");
  CREATE INDEX "footer_rels_pages_id_idx" ON "footer_rels" USING btree ("pages_id");
  CREATE INDEX "footer_rels_trips_id_idx" ON "footer_rels" USING btree ("trips_id");
  CREATE INDEX "footer_rels_destinations_id_idx" ON "footer_rels" USING btree ("destinations_id");
  CREATE INDEX "footer_rels_blog_id_idx" ON "footer_rels" USING btree ("blog_id");
  ALTER TABLE "trips" DROP COLUMN "booking_link_link_label";
  ALTER TABLE "_trips_v" DROP COLUMN "version_booking_link_link_label";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "subheading";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "primary_link_label";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "secondary_link_label";
  ALTER TABLE "pages_blocks_rich_text" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_rich_text" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_rich_text" DROP COLUMN "content";
  ALTER TABLE "pages_blocks_featured_trips" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_featured_trips" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_featured_trips" DROP COLUMN "subheading";
  ALTER TABLE "pages_blocks_featured_trips" DROP COLUMN "view_all_link_label";
  ALTER TABLE "pages_blocks_featured_destinations" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_featured_destinations" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_featured_destinations" DROP COLUMN "subheading";
  ALTER TABLE "pages_blocks_featured_destinations" DROP COLUMN "view_all_link_label";
  ALTER TABLE "pages_blocks_latest_posts" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_latest_posts" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_latest_posts" DROP COLUMN "subheading";
  ALTER TABLE "pages_blocks_latest_posts" DROP COLUMN "view_all_link_label";
  ALTER TABLE "pages_blocks_stats" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_stats" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_gallery_images" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_gallery" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_gallery" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_gallery" DROP COLUMN "subheading";
  ALTER TABLE "pages_blocks_testimonials" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_testimonials" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_testimonials" DROP COLUMN "subheading";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "subheading";
  ALTER TABLE "pages_blocks_inquiry" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_inquiry" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_inquiry" DROP COLUMN "subheading";
  ALTER TABLE "pages_blocks_inquiry" DROP COLUMN "note";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN "heading";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN "text";
  ALTER TABLE "pages_blocks_cta" DROP COLUMN "link_label";
  ALTER TABLE "pages_rels" DROP COLUMN "locale";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "subheading";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "primary_link_label";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "secondary_link_label";
  ALTER TABLE "_pages_v_blocks_rich_text" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_rich_text" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_rich_text" DROP COLUMN "content";
  ALTER TABLE "_pages_v_blocks_featured_trips" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_featured_trips" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_featured_trips" DROP COLUMN "subheading";
  ALTER TABLE "_pages_v_blocks_featured_trips" DROP COLUMN "view_all_link_label";
  ALTER TABLE "_pages_v_blocks_featured_destinations" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_featured_destinations" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_featured_destinations" DROP COLUMN "subheading";
  ALTER TABLE "_pages_v_blocks_featured_destinations" DROP COLUMN "view_all_link_label";
  ALTER TABLE "_pages_v_blocks_latest_posts" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_latest_posts" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_latest_posts" DROP COLUMN "subheading";
  ALTER TABLE "_pages_v_blocks_latest_posts" DROP COLUMN "view_all_link_label";
  ALTER TABLE "_pages_v_blocks_stats" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_stats" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_gallery_images" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_gallery" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_gallery" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_gallery" DROP COLUMN "subheading";
  ALTER TABLE "_pages_v_blocks_testimonials" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_testimonials" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_testimonials" DROP COLUMN "subheading";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "subheading";
  ALTER TABLE "_pages_v_blocks_inquiry" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_inquiry" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_inquiry" DROP COLUMN "subheading";
  ALTER TABLE "_pages_v_blocks_inquiry" DROP COLUMN "note";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "heading";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "text";
  ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN "link_label";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "locale";
  ALTER TABLE "header_nav_items" DROP COLUMN "_locale";
  ALTER TABLE "header_nav_items" DROP COLUMN "link_label";
  ALTER TABLE "header_actions" DROP COLUMN "_locale";
  ALTER TABLE "header_actions" DROP COLUMN "link_label";
  ALTER TABLE "header_rels" DROP COLUMN "locale";
  ALTER TABLE "footer_columns_links" DROP COLUMN "_locale";
  ALTER TABLE "footer_columns_links" DROP COLUMN "link_label";
  ALTER TABLE "footer_columns" DROP COLUMN "_locale";
  ALTER TABLE "footer_columns" DROP COLUMN "heading";
  ALTER TABLE "footer_legal_links" DROP COLUMN "_locale";
  ALTER TABLE "footer_legal_links" DROP COLUMN "link_label";
  ALTER TABLE "footer_rels" DROP COLUMN "locale";`)
}
