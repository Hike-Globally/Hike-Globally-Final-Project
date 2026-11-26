import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Creates the `news` collection tables (mirrors the `blog` collection): the article table and
 * its localized row table, the relationship / category join tables, the drafts version tables, and
 * every supporting table the News fields need (page sections, FAQs, keywords, internal-link
 * keywords). Generated with `payload migrate:create` against a config containing only this
 * collection, then trimmed to the news-only statements. Runs once: Payload records it in
 * `payload_migrations` and never re-applies it, so the plain CREATE statements are safe.
 */

const upSQL = `CREATE TYPE "public"."enum_news_page_sections_kind" AS ENUM('hero', 'content', 'linkPreview', 'multiUrlPreview', 'faqs', 'related', 'html');

CREATE TYPE "public"."enum_news_page_sections_multi_preview_layout" AS ENUM('list', 'slider', 'carousel');

CREATE TYPE "public"."enum_news_page_sections_multi_preview_animation" AS ENUM('fade', 'rise', 'slide', 'zoom', 'reveal', 'none');

CREATE TYPE "public"."enum_news_categories" AS ENUM('world-news', 'travel', 'adventure', 'culture', 'wildlife', 'sustainability', 'industry');

CREATE TYPE "public"."enum_news_status" AS ENUM('draft', 'published');

CREATE TYPE "public"."enum__news_v_version_page_sections_kind" AS ENUM('hero', 'content', 'linkPreview', 'multiUrlPreview', 'faqs', 'related', 'html');

CREATE TYPE "public"."enum__news_v_version_page_sections_multi_preview_layout" AS ENUM('list', 'slider', 'carousel');

CREATE TYPE "public"."enum__news_v_version_page_sections_multi_preview_animation" AS ENUM('fade', 'rise', 'slide', 'zoom', 'reveal', 'none');

CREATE TYPE "public"."enum__news_v_version_categories" AS ENUM('world-news', 'travel', 'adventure', 'culture', 'wildlife', 'sustainability', 'industry');

CREATE TYPE "public"."enum__news_v_version_status" AS ENUM('draft', 'published');

CREATE TABLE "news_page_sections_multi_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_preview_url" varchar,
  	"link_preview_title" varchar,
  	"link_preview_description" varchar,
  	"link_preview_price" varchar,
  	"link_preview_original_price" varchar,
  	"link_preview_image_id" integer,
  	"link_preview_image_url" varchar
  );

CREATE TABLE "news_page_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_news_page_sections_kind" DEFAULT 'html',
  	"heading" varchar,
  	"html" varchar,
  	"link_preview_url" varchar,
  	"link_preview_title" varchar,
  	"link_preview_description" varchar,
  	"link_preview_price" varchar,
  	"link_preview_original_price" varchar,
  	"multi_preview_heading" varchar,
  	"multi_preview_description" varchar,
  	"multi_preview_layout" "enum_news_page_sections_multi_preview_layout" DEFAULT 'slider',
  	"multi_preview_animation" "enum_news_page_sections_multi_preview_animation" DEFAULT 'rise'
  );

CREATE TABLE "news_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

CREATE TABLE "news_best_time_to_trek_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

CREATE TABLE "news_required_permits_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

CREATE TABLE "news_trekker_safety_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

CREATE TABLE "news_packing_list_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

CREATE TABLE "news_altitude_sickness_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

CREATE TABLE "news_accommodation_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );

CREATE TABLE "news_categories" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_news_categories",
  	"id" serial PRIMARY KEY NOT NULL
  );

CREATE TABLE "news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
  	"featured_image_id" integer,
  	"content" jsonb,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_status" DEFAULT 'draft'
  );

CREATE TABLE "news_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );

CREATE TABLE "news_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"news_id" integer
  );

CREATE TABLE "_news_page_sections_multi_links_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_preview_url" varchar,
  	"link_preview_title" varchar,
  	"link_preview_description" varchar,
  	"link_preview_price" varchar,
  	"link_preview_original_price" varchar,
  	"link_preview_image_id" integer,
  	"link_preview_image_url" varchar,
  	"_uuid" varchar
  );

CREATE TABLE "_news_v_version_page_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__news_v_version_page_sections_kind" DEFAULT 'html',
  	"heading" varchar,
  	"html" varchar,
  	"link_preview_url" varchar,
  	"link_preview_title" varchar,
  	"link_preview_description" varchar,
  	"link_preview_price" varchar,
  	"link_preview_original_price" varchar,
  	"multi_preview_heading" varchar,
  	"multi_preview_description" varchar,
  	"multi_preview_layout" "enum__news_v_version_page_sections_multi_preview_layout" DEFAULT 'slider',
  	"multi_preview_animation" "enum__news_v_version_page_sections_multi_preview_animation" DEFAULT 'rise',
  	"_uuid" varchar
  );

CREATE TABLE "_news_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

CREATE TABLE "_news_v_version_best_time_to_trek_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

CREATE TABLE "_news_v_version_required_permits_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

CREATE TABLE "_news_v_version_trekker_safety_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

CREATE TABLE "_news_v_version_packing_list_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

CREATE TABLE "_news_v_version_altitude_sickness_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

CREATE TABLE "_news_v_version_accommodation_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );

CREATE TABLE "_news_v_version_categories" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__news_v_version_categories",
  	"id" serial PRIMARY KEY NOT NULL
  );

CREATE TABLE "_news_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_featured_image_id" integer,
  	"version_content" jsonb,
  	"version_author_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_featured" boolean DEFAULT false,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );

CREATE TABLE "_news_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );

CREATE TABLE "_news_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"news_id" integer
  );

CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"news_id" integer
  );

ALTER TABLE "news_page_sections_multi_links" ADD CONSTRAINT "news_page_sections_multi_links_link_preview_image_id_media_id_fk" FOREIGN KEY ("link_preview_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "news_page_sections_multi_links" ADD CONSTRAINT "news_page_sections_multi_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_page_sections"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news_page_sections" ADD CONSTRAINT "news_page_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news_faqs" ADD CONSTRAINT "news_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news_best_time_to_trek_faqs" ADD CONSTRAINT "news_best_time_to_trek_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news_required_permits_faqs" ADD CONSTRAINT "news_required_permits_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news_trekker_safety_faqs" ADD CONSTRAINT "news_trekker_safety_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news_packing_list_faqs" ADD CONSTRAINT "news_packing_list_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news_altitude_sickness_faqs" ADD CONSTRAINT "news_altitude_sickness_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news_accommodation_faqs" ADD CONSTRAINT "news_accommodation_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news_categories" ADD CONSTRAINT "news_categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news" ADD CONSTRAINT "news_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "news" ADD CONSTRAINT "news_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "news" ADD CONSTRAINT "news_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "news_texts" ADD CONSTRAINT "news_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_page_sections_multi_links_v" ADD CONSTRAINT "_news_page_sections_multi_links_v_link_preview_image_id_media_id_fk" FOREIGN KEY ("link_preview_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "_news_page_sections_multi_links_v" ADD CONSTRAINT "_news_page_sections_multi_links_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v_version_page_sections"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v_version_page_sections" ADD CONSTRAINT "_news_v_version_page_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v_version_faqs" ADD CONSTRAINT "_news_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v_version_best_time_to_trek_faqs" ADD CONSTRAINT "_news_v_version_best_time_to_trek_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v_version_required_permits_faqs" ADD CONSTRAINT "_news_v_version_required_permits_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v_version_trekker_safety_faqs" ADD CONSTRAINT "_news_v_version_trekker_safety_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v_version_packing_list_faqs" ADD CONSTRAINT "_news_v_version_packing_list_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v_version_altitude_sickness_faqs" ADD CONSTRAINT "_news_v_version_altitude_sickness_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v_version_accommodation_faqs" ADD CONSTRAINT "_news_v_version_accommodation_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v_version_categories" ADD CONSTRAINT "_news_v_version_categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "_news_v_texts" ADD CONSTRAINT "_news_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "news_page_sections_multi_links_order_idx" ON "news_page_sections_multi_links" USING btree ("_order");

CREATE INDEX "news_page_sections_multi_links_parent_id_idx" ON "news_page_sections_multi_links" USING btree ("_parent_id");

CREATE INDEX "news_page_sections_multi_links_link_preview_image_idx" ON "news_page_sections_multi_links" USING btree ("link_preview_image_id");

CREATE INDEX "news_page_sections_order_idx" ON "news_page_sections" USING btree ("_order");

CREATE INDEX "news_page_sections_parent_id_idx" ON "news_page_sections" USING btree ("_parent_id");

CREATE INDEX "news_faqs_order_idx" ON "news_faqs" USING btree ("_order");

CREATE INDEX "news_faqs_parent_id_idx" ON "news_faqs" USING btree ("_parent_id");

CREATE INDEX "news_best_time_to_trek_faqs_order_idx" ON "news_best_time_to_trek_faqs" USING btree ("_order");

CREATE INDEX "news_best_time_to_trek_faqs_parent_id_idx" ON "news_best_time_to_trek_faqs" USING btree ("_parent_id");

CREATE INDEX "news_required_permits_faqs_order_idx" ON "news_required_permits_faqs" USING btree ("_order");

CREATE INDEX "news_required_permits_faqs_parent_id_idx" ON "news_required_permits_faqs" USING btree ("_parent_id");

CREATE INDEX "news_trekker_safety_faqs_order_idx" ON "news_trekker_safety_faqs" USING btree ("_order");

CREATE INDEX "news_trekker_safety_faqs_parent_id_idx" ON "news_trekker_safety_faqs" USING btree ("_parent_id");

CREATE INDEX "news_packing_list_faqs_order_idx" ON "news_packing_list_faqs" USING btree ("_order");

CREATE INDEX "news_packing_list_faqs_parent_id_idx" ON "news_packing_list_faqs" USING btree ("_parent_id");

CREATE INDEX "news_altitude_sickness_faqs_order_idx" ON "news_altitude_sickness_faqs" USING btree ("_order");

CREATE INDEX "news_altitude_sickness_faqs_parent_id_idx" ON "news_altitude_sickness_faqs" USING btree ("_parent_id");

CREATE INDEX "news_accommodation_faqs_order_idx" ON "news_accommodation_faqs" USING btree ("_order");

CREATE INDEX "news_accommodation_faqs_parent_id_idx" ON "news_accommodation_faqs" USING btree ("_parent_id");

CREATE INDEX "news_categories_order_idx" ON "news_categories" USING btree ("order");

CREATE INDEX "news_categories_parent_idx" ON "news_categories" USING btree ("parent_id");

CREATE INDEX "news_slug_idx" ON "news" USING btree ("slug");

CREATE INDEX "news_featured_image_idx" ON "news" USING btree ("featured_image_id");

CREATE INDEX "news_author_idx" ON "news" USING btree ("author_id");

CREATE INDEX "news_meta_meta_image_idx" ON "news" USING btree ("meta_image_id");

CREATE INDEX "news_updated_at_idx" ON "news" USING btree ("updated_at");

CREATE INDEX "news_created_at_idx" ON "news" USING btree ("created_at");

CREATE INDEX "news__status_idx" ON "news" USING btree ("_status");

CREATE INDEX "news_texts_order_parent" ON "news_texts" USING btree ("order","parent_id");

CREATE INDEX "news_rels_order_idx" ON "news_rels" USING btree ("order");

CREATE INDEX "news_rels_parent_idx" ON "news_rels" USING btree ("parent_id");

CREATE INDEX "news_rels_path_idx" ON "news_rels" USING btree ("path");

CREATE INDEX "news_rels_news_id_idx" ON "news_rels" USING btree ("news_id");

CREATE INDEX "_news_page_sections_multi_links_v_order_idx" ON "_news_page_sections_multi_links_v" USING btree ("_order");

CREATE INDEX "_news_page_sections_multi_links_v_parent_id_idx" ON "_news_page_sections_multi_links_v" USING btree ("_parent_id");

CREATE INDEX "_news_page_sections_multi_links_v_link_preview_image_idx" ON "_news_page_sections_multi_links_v" USING btree ("link_preview_image_id");

CREATE INDEX "_news_v_version_page_sections_order_idx" ON "_news_v_version_page_sections" USING btree ("_order");

CREATE INDEX "_news_v_version_page_sections_parent_id_idx" ON "_news_v_version_page_sections" USING btree ("_parent_id");

CREATE INDEX "_news_v_version_faqs_order_idx" ON "_news_v_version_faqs" USING btree ("_order");

CREATE INDEX "_news_v_version_faqs_parent_id_idx" ON "_news_v_version_faqs" USING btree ("_parent_id");

CREATE INDEX "_news_v_version_best_time_to_trek_faqs_order_idx" ON "_news_v_version_best_time_to_trek_faqs" USING btree ("_order");

CREATE INDEX "_news_v_version_best_time_to_trek_faqs_parent_id_idx" ON "_news_v_version_best_time_to_trek_faqs" USING btree ("_parent_id");

CREATE INDEX "_news_v_version_required_permits_faqs_order_idx" ON "_news_v_version_required_permits_faqs" USING btree ("_order");

CREATE INDEX "_news_v_version_required_permits_faqs_parent_id_idx" ON "_news_v_version_required_permits_faqs" USING btree ("_parent_id");

CREATE INDEX "_news_v_version_trekker_safety_faqs_order_idx" ON "_news_v_version_trekker_safety_faqs" USING btree ("_order");

CREATE INDEX "_news_v_version_trekker_safety_faqs_parent_id_idx" ON "_news_v_version_trekker_safety_faqs" USING btree ("_parent_id");

CREATE INDEX "_news_v_version_packing_list_faqs_order_idx" ON "_news_v_version_packing_list_faqs" USING btree ("_order");

CREATE INDEX "_news_v_version_packing_list_faqs_parent_id_idx" ON "_news_v_version_packing_list_faqs" USING btree ("_parent_id");

CREATE INDEX "_news_v_version_altitude_sickness_faqs_order_idx" ON "_news_v_version_altitude_sickness_faqs" USING btree ("_order");

CREATE INDEX "_news_v_version_altitude_sickness_faqs_parent_id_idx" ON "_news_v_version_altitude_sickness_faqs" USING btree ("_parent_id");

CREATE INDEX "_news_v_version_accommodation_faqs_order_idx" ON "_news_v_version_accommodation_faqs" USING btree ("_order");

CREATE INDEX "_news_v_version_accommodation_faqs_parent_id_idx" ON "_news_v_version_accommodation_faqs" USING btree ("_parent_id");

CREATE INDEX "_news_v_version_categories_order_idx" ON "_news_v_version_categories" USING btree ("order");

CREATE INDEX "_news_v_version_categories_parent_idx" ON "_news_v_version_categories" USING btree ("parent_id");

CREATE INDEX "_news_v_parent_idx" ON "_news_v" USING btree ("parent_id");

CREATE INDEX "_news_v_version_version_slug_idx" ON "_news_v" USING btree ("version_slug");

CREATE INDEX "_news_v_version_version_featured_image_idx" ON "_news_v" USING btree ("version_featured_image_id");

CREATE INDEX "_news_v_version_version_author_idx" ON "_news_v" USING btree ("version_author_id");

CREATE INDEX "_news_v_version_meta_version_meta_image_idx" ON "_news_v" USING btree ("version_meta_image_id");

CREATE INDEX "_news_v_version_version_updated_at_idx" ON "_news_v" USING btree ("version_updated_at");

CREATE INDEX "_news_v_version_version_created_at_idx" ON "_news_v" USING btree ("version_created_at");

CREATE INDEX "_news_v_version_version__status_idx" ON "_news_v" USING btree ("version__status");

CREATE INDEX "_news_v_created_at_idx" ON "_news_v" USING btree ("created_at");

CREATE INDEX "_news_v_updated_at_idx" ON "_news_v" USING btree ("updated_at");

CREATE INDEX "_news_v_latest_idx" ON "_news_v" USING btree ("latest");

CREATE INDEX "_news_v_autosave_idx" ON "_news_v" USING btree ("autosave");

CREATE INDEX "_news_v_texts_order_parent" ON "_news_v_texts" USING btree ("order","parent_id");

CREATE INDEX "_news_v_rels_order_idx" ON "_news_v_rels" USING btree ("order");

CREATE INDEX "_news_v_rels_parent_idx" ON "_news_v_rels" USING btree ("parent_id");

CREATE INDEX "_news_v_rels_path_idx" ON "_news_v_rels" USING btree ("path");

CREATE INDEX "_news_v_rels_news_id_idx" ON "_news_v_rels" USING btree ("news_id");

CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload_locked_documents_rels" USING btree ("news_id");
`
const downSQL = `DROP TABLE "news_page_sections_multi_links" CASCADE;

DROP TABLE "news_page_sections" CASCADE;

DROP TABLE "news_faqs" CASCADE;

DROP TABLE "news_best_time_to_trek_faqs" CASCADE;

DROP TABLE "news_required_permits_faqs" CASCADE;

DROP TABLE "news_trekker_safety_faqs" CASCADE;

DROP TABLE "news_packing_list_faqs" CASCADE;

DROP TABLE "news_altitude_sickness_faqs" CASCADE;

DROP TABLE "news_accommodation_faqs" CASCADE;

DROP TABLE "news_categories" CASCADE;

DROP TABLE "news" CASCADE;

DROP TABLE "news_texts" CASCADE;

DROP TABLE "news_rels" CASCADE;

DROP TABLE "_news_page_sections_multi_links_v" CASCADE;

DROP TABLE "_news_v_version_page_sections" CASCADE;

DROP TABLE "_news_v_version_faqs" CASCADE;

DROP TABLE "_news_v_version_best_time_to_trek_faqs" CASCADE;

DROP TABLE "_news_v_version_required_permits_faqs" CASCADE;

DROP TABLE "_news_v_version_trekker_safety_faqs" CASCADE;

DROP TABLE "_news_v_version_packing_list_faqs" CASCADE;

DROP TABLE "_news_v_version_altitude_sickness_faqs" CASCADE;

DROP TABLE "_news_v_version_accommodation_faqs" CASCADE;

DROP TABLE "_news_v_version_categories" CASCADE;

DROP TABLE "_news_v" CASCADE;

DROP TABLE "_news_v_texts" CASCADE;

DROP TABLE "_news_v_rels" CASCADE;

DROP TYPE "public"."enum_news_page_sections_kind";

DROP TYPE "public"."enum_news_page_sections_multi_preview_layout";

DROP TYPE "public"."enum_news_page_sections_multi_preview_animation";

DROP TYPE "public"."enum_news_categories";

DROP TYPE "public"."enum_news_status";

DROP TYPE "public"."enum__news_v_version_page_sections_kind";

DROP TYPE "public"."enum__news_v_version_page_sections_multi_preview_layout";

DROP TYPE "public"."enum__news_v_version_page_sections_multi_preview_animation";

DROP TYPE "public"."enum__news_v_version_categories";

DROP TYPE "public"."enum__news_v_version_status";
`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(upSQL))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(downSQL))
}
