import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trips_itinerary_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trips_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_trips_v_version_itinerary_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_trips_v_version_faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_stats_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_gallery_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_testimonials_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_stats_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_gallery_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_testimonials_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "trips_itinerary_locales" CASCADE;
  DROP TABLE "trips_faqs_locales" CASCADE;
  DROP TABLE "_trips_v_version_itinerary_locales" CASCADE;
  DROP TABLE "_trips_v_version_faqs_locales" CASCADE;
  DROP TABLE "pages_blocks_stats_items_locales" CASCADE;
  DROP TABLE "pages_blocks_gallery_images_locales" CASCADE;
  DROP TABLE "pages_blocks_testimonials_items_locales" CASCADE;
  DROP TABLE "pages_blocks_faq_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_images_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items_locales" CASCADE;
  DROP INDEX "destinations_gallery_locale_idx";
  DROP INDEX "_destinations_v_version_gallery_locale_idx";
  DROP INDEX "trips_gallery_locale_idx";
  DROP INDEX "_trips_v_version_gallery_locale_idx";
  ALTER TABLE "header_nav_items_locales" ALTER COLUMN "link_label" DROP NOT NULL;
  ALTER TABLE "header_actions_locales" ALTER COLUMN "link_label" DROP NOT NULL;
  ALTER TABLE "footer_columns_links_locales" ALTER COLUMN "link_label" DROP NOT NULL;
  ALTER TABLE "footer_legal_links_locales" ALTER COLUMN "link_label" DROP NOT NULL;
  ALTER TABLE "trips_itinerary" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "trips_itinerary" ADD COLUMN "title" varchar;
  ALTER TABLE "trips_itinerary" ADD COLUMN "description" varchar;
  ALTER TABLE "trips_itinerary" ADD COLUMN "accommodation" varchar;
  ALTER TABLE "trips_faqs" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "trips_faqs" ADD COLUMN "question" varchar;
  ALTER TABLE "trips_faqs" ADD COLUMN "answer" varchar;
  ALTER TABLE "_trips_v_version_itinerary" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_trips_v_version_itinerary" ADD COLUMN "title" varchar;
  ALTER TABLE "_trips_v_version_itinerary" ADD COLUMN "description" varchar;
  ALTER TABLE "_trips_v_version_itinerary" ADD COLUMN "accommodation" varchar;
  ALTER TABLE "_trips_v_version_faqs" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_trips_v_version_faqs" ADD COLUMN "question" varchar;
  ALTER TABLE "_trips_v_version_faqs" ADD COLUMN "answer" varchar;
  ALTER TABLE "pages_blocks_stats_items" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_stats_items" ADD COLUMN "label" varchar;
  ALTER TABLE "pages_blocks_stats_items" ADD COLUMN "description" varchar;
  ALTER TABLE "pages_blocks_gallery_images" ADD COLUMN "caption" varchar;
  ALTER TABLE "pages_blocks_testimonials_items" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_testimonials_items" ADD COLUMN "quote" varchar;
  ALTER TABLE "pages_blocks_testimonials_items" ADD COLUMN "role" varchar;
  ALTER TABLE "pages_blocks_faq_items" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "pages_blocks_faq_items" ADD COLUMN "question" varchar;
  ALTER TABLE "pages_blocks_faq_items" ADD COLUMN "answer" varchar;
  ALTER TABLE "_pages_v_blocks_stats_items" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_stats_items" ADD COLUMN "label" varchar;
  ALTER TABLE "_pages_v_blocks_stats_items" ADD COLUMN "description" varchar;
  ALTER TABLE "_pages_v_blocks_gallery_images" ADD COLUMN "caption" varchar;
  ALTER TABLE "_pages_v_blocks_testimonials_items" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_testimonials_items" ADD COLUMN "quote" varchar;
  ALTER TABLE "_pages_v_blocks_testimonials_items" ADD COLUMN "role" varchar;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD COLUMN "question" varchar;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD COLUMN "answer" varchar;
  CREATE INDEX "trips_itinerary_locale_idx" ON "trips_itinerary" USING btree ("_locale");
  CREATE INDEX "trips_faqs_locale_idx" ON "trips_faqs" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_itinerary_locale_idx" ON "_trips_v_version_itinerary" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_faqs_locale_idx" ON "_trips_v_version_faqs" USING btree ("_locale");
  CREATE INDEX "pages_blocks_stats_items_locale_idx" ON "pages_blocks_stats_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_testimonials_items_locale_idx" ON "pages_blocks_testimonials_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_faq_items_locale_idx" ON "pages_blocks_faq_items" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_stats_items_locale_idx" ON "_pages_v_blocks_stats_items" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_testimonials_items_locale_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("_locale");
  CREATE INDEX "_pages_v_blocks_faq_items_locale_idx" ON "_pages_v_blocks_faq_items" USING btree ("_locale");
  ALTER TABLE "destinations_gallery" DROP COLUMN "_locale";
  ALTER TABLE "_destinations_v_version_gallery" DROP COLUMN "_locale";
  ALTER TABLE "trips_gallery" DROP COLUMN "_locale";
  ALTER TABLE "_trips_v_version_gallery" DROP COLUMN "_locale";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "trips_itinerary_locales" (
  	"title" varchar,
  	"description" varchar,
  	"accommodation" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "trips_faqs_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_trips_v_version_itinerary_locales" (
  	"title" varchar,
  	"description" varchar,
  	"accommodation" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_trips_v_version_faqs_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_blocks_stats_items_locales" (
  	"label" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_gallery_images_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_testimonials_items_locales" (
  	"quote" varchar,
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_stats_items_locales" (
  	"label" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_images_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_testimonials_items_locales" (
  	"quote" varchar,
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  DROP INDEX "trips_itinerary_locale_idx";
  DROP INDEX "trips_faqs_locale_idx";
  DROP INDEX "_trips_v_version_itinerary_locale_idx";
  DROP INDEX "_trips_v_version_faqs_locale_idx";
  DROP INDEX "pages_blocks_stats_items_locale_idx";
  DROP INDEX "pages_blocks_testimonials_items_locale_idx";
  DROP INDEX "pages_blocks_faq_items_locale_idx";
  DROP INDEX "_pages_v_blocks_stats_items_locale_idx";
  DROP INDEX "_pages_v_blocks_testimonials_items_locale_idx";
  DROP INDEX "_pages_v_blocks_faq_items_locale_idx";
  ALTER TABLE "header_nav_items_locales" ALTER COLUMN "link_label" SET NOT NULL;
  ALTER TABLE "header_actions_locales" ALTER COLUMN "link_label" SET NOT NULL;
  ALTER TABLE "footer_columns_links_locales" ALTER COLUMN "link_label" SET NOT NULL;
  ALTER TABLE "footer_legal_links_locales" ALTER COLUMN "link_label" SET NOT NULL;
  ALTER TABLE "destinations_gallery" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_destinations_v_version_gallery" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "trips_gallery" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_trips_v_version_gallery" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "trips_itinerary_locales" ADD CONSTRAINT "trips_itinerary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips_itinerary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_faqs_locales" ADD CONSTRAINT "trips_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_itinerary_locales" ADD CONSTRAINT "_trips_v_version_itinerary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v_version_itinerary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_faqs_locales" ADD CONSTRAINT "_trips_v_version_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v_version_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_items_locales" ADD CONSTRAINT "pages_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_images_locales" ADD CONSTRAINT "pages_blocks_gallery_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_items_locales" ADD CONSTRAINT "pages_blocks_testimonials_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_testimonials_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items_locales" ADD CONSTRAINT "pages_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_items_locales" ADD CONSTRAINT "_pages_v_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_images_locales" ADD CONSTRAINT "_pages_v_blocks_gallery_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_gallery_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_items_locales" ADD CONSTRAINT "_pages_v_blocks_testimonials_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_testimonials_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items_locales" ADD CONSTRAINT "_pages_v_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "trips_itinerary_locales_locale_parent_id_unique" ON "trips_itinerary_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "trips_faqs_locales_locale_parent_id_unique" ON "trips_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_trips_v_version_itinerary_locales_locale_parent_id_unique" ON "_trips_v_version_itinerary_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_trips_v_version_faqs_locales_locale_parent_id_unique" ON "_trips_v_version_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_stats_items_locales_locale_parent_id_unique" ON "pages_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_gallery_images_locales_locale_parent_id_unique" ON "pages_blocks_gallery_images_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_testimonials_items_locales_locale_parent_id_uni" ON "pages_blocks_testimonials_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_faq_items_locales_locale_parent_id_unique" ON "pages_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_stats_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_gallery_images_locales_locale_parent_id_uniq" ON "_pages_v_blocks_gallery_images_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_testimonials_items_locales_locale_parent_id_" ON "_pages_v_blocks_testimonials_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_faq_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "destinations_gallery_locale_idx" ON "destinations_gallery" USING btree ("_locale");
  CREATE INDEX "_destinations_v_version_gallery_locale_idx" ON "_destinations_v_version_gallery" USING btree ("_locale");
  CREATE INDEX "trips_gallery_locale_idx" ON "trips_gallery" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_gallery_locale_idx" ON "_trips_v_version_gallery" USING btree ("_locale");
  ALTER TABLE "trips_itinerary" DROP COLUMN "_locale";
  ALTER TABLE "trips_itinerary" DROP COLUMN "title";
  ALTER TABLE "trips_itinerary" DROP COLUMN "description";
  ALTER TABLE "trips_itinerary" DROP COLUMN "accommodation";
  ALTER TABLE "trips_faqs" DROP COLUMN "_locale";
  ALTER TABLE "trips_faqs" DROP COLUMN "question";
  ALTER TABLE "trips_faqs" DROP COLUMN "answer";
  ALTER TABLE "_trips_v_version_itinerary" DROP COLUMN "_locale";
  ALTER TABLE "_trips_v_version_itinerary" DROP COLUMN "title";
  ALTER TABLE "_trips_v_version_itinerary" DROP COLUMN "description";
  ALTER TABLE "_trips_v_version_itinerary" DROP COLUMN "accommodation";
  ALTER TABLE "_trips_v_version_faqs" DROP COLUMN "_locale";
  ALTER TABLE "_trips_v_version_faqs" DROP COLUMN "question";
  ALTER TABLE "_trips_v_version_faqs" DROP COLUMN "answer";
  ALTER TABLE "pages_blocks_stats_items" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_stats_items" DROP COLUMN "label";
  ALTER TABLE "pages_blocks_stats_items" DROP COLUMN "description";
  ALTER TABLE "pages_blocks_gallery_images" DROP COLUMN "caption";
  ALTER TABLE "pages_blocks_testimonials_items" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_testimonials_items" DROP COLUMN "quote";
  ALTER TABLE "pages_blocks_testimonials_items" DROP COLUMN "role";
  ALTER TABLE "pages_blocks_faq_items" DROP COLUMN "_locale";
  ALTER TABLE "pages_blocks_faq_items" DROP COLUMN "question";
  ALTER TABLE "pages_blocks_faq_items" DROP COLUMN "answer";
  ALTER TABLE "_pages_v_blocks_stats_items" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_stats_items" DROP COLUMN "label";
  ALTER TABLE "_pages_v_blocks_stats_items" DROP COLUMN "description";
  ALTER TABLE "_pages_v_blocks_gallery_images" DROP COLUMN "caption";
  ALTER TABLE "_pages_v_blocks_testimonials_items" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_testimonials_items" DROP COLUMN "quote";
  ALTER TABLE "_pages_v_blocks_testimonials_items" DROP COLUMN "role";
  ALTER TABLE "_pages_v_blocks_faq_items" DROP COLUMN "_locale";
  ALTER TABLE "_pages_v_blocks_faq_items" DROP COLUMN "question";
  ALTER TABLE "_pages_v_blocks_faq_items" DROP COLUMN "answer";`)
}
