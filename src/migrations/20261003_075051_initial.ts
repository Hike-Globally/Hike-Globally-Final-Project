import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'de', 'fr');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_destinations_best_seasons" AS ENUM('spring', 'summer', 'autumn', 'winter');
  CREATE TYPE "public"."enum_destinations_region" AS ENUM('khumbu', 'annapurna', 'langtang', 'manaslu', 'mustang', 'dolpo', 'kanchenjunga', 'pokhara', 'kathmandu', 'other');
  CREATE TYPE "public"."enum_destinations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__destinations_v_version_best_seasons" AS ENUM('spring', 'summer', 'autumn', 'winter');
  CREATE TYPE "public"."enum__destinations_v_version_region" AS ENUM('khumbu', 'annapurna', 'langtang', 'manaslu', 'mustang', 'dolpo', 'kanchenjunga', 'pokhara', 'kathmandu', 'other');
  CREATE TYPE "public"."enum__destinations_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__destinations_v_published_locale" AS ENUM('en', 'de', 'fr');
  CREATE TYPE "public"."enum_trips_best_seasons" AS ENUM('spring', 'summer', 'autumn', 'winter');
  CREATE TYPE "public"."enum_trips_trip_type" AS ENUM('trekking', 'expedition', 'peak-climbing', 'cultural', 'heli', 'multi-sport');
  CREATE TYPE "public"."enum_trips_difficulty" AS ENUM('easy', 'moderate', 'challenging', 'strenuous', 'extreme');
  CREATE TYPE "public"."enum_trips_price_currency" AS ENUM('USD', 'EUR', 'NPR');
  CREATE TYPE "public"."enum_trips_price_unit" AS ENUM('per-person', 'per-group');
  CREATE TYPE "public"."enum_trips_booking_link_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_trips_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__trips_v_version_best_seasons" AS ENUM('spring', 'summer', 'autumn', 'winter');
  CREATE TYPE "public"."enum__trips_v_version_trip_type" AS ENUM('trekking', 'expedition', 'peak-climbing', 'cultural', 'heli', 'multi-sport');
  CREATE TYPE "public"."enum__trips_v_version_difficulty" AS ENUM('easy', 'moderate', 'challenging', 'strenuous', 'extreme');
  CREATE TYPE "public"."enum__trips_v_version_price_currency" AS ENUM('USD', 'EUR', 'NPR');
  CREATE TYPE "public"."enum__trips_v_version_price_unit" AS ENUM('per-person', 'per-group');
  CREATE TYPE "public"."enum__trips_v_version_booking_link_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__trips_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__trips_v_published_locale" AS ENUM('en', 'de', 'fr');
  CREATE TYPE "public"."enum_blog_categories" AS ENUM('trekking-guides', 'gear', 'destinations', 'culture', 'health-safety', 'sustainability', 'trip-reports', 'news');
  CREATE TYPE "public"."enum_blog_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__blog_v_version_categories" AS ENUM('trekking-guides', 'gear', 'destinations', 'culture', 'health-safety', 'sustainability', 'trip-reports', 'news');
  CREATE TYPE "public"."enum__blog_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__blog_v_published_locale" AS ENUM('en', 'de', 'fr');
  CREATE TYPE "public"."enum_pages_blocks_hero_primary_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_hero_secondary_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_hero_height" AS ENUM('full', 'tall', 'compact');
  CREATE TYPE "public"."enum_pages_blocks_hero_overlay" AS ENUM('strong', 'medium', 'none');
  CREATE TYPE "public"."enum_pages_blocks_rich_text_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum_pages_blocks_rich_text_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_pages_blocks_featured_trips_source" AS ENUM('featured', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_featured_trips_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_pages_blocks_featured_trips_view_all_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_featured_destinations_source" AS ENUM('featured', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_featured_destinations_layout" AS ENUM('grid', 'editorial');
  CREATE TYPE "public"."enum_pages_blocks_featured_destinations_view_all_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_latest_posts_view_all_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_stats_variant" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum_pages_blocks_gallery_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_pages_blocks_gallery_aspect_ratio" AS ENUM('4/3', '1/1', '3/4');
  CREATE TYPE "public"."enum_pages_blocks_testimonials_items_rating" AS ENUM('5', '4', '3');
  CREATE TYPE "public"."enum_pages_blocks_testimonials_variant" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum_pages_blocks_inquiry_variant" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum_pages_blocks_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_cta_variant" AS ENUM('dark', 'sage', 'light');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_primary_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_secondary_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_height" AS ENUM('full', 'tall', 'compact');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_overlay" AS ENUM('strong', 'medium', 'none');
  CREATE TYPE "public"."enum__pages_v_blocks_rich_text_width" AS ENUM('default', 'narrow');
  CREATE TYPE "public"."enum__pages_v_blocks_rich_text_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__pages_v_blocks_featured_trips_source" AS ENUM('featured', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_featured_trips_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum__pages_v_blocks_featured_trips_view_all_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_featured_destinations_source" AS ENUM('featured', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_featured_destinations_layout" AS ENUM('grid', 'editorial');
  CREATE TYPE "public"."enum__pages_v_blocks_featured_destinations_view_all_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_latest_posts_view_all_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_stats_variant" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__pages_v_blocks_gallery_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum__pages_v_blocks_gallery_aspect_ratio" AS ENUM('4/3', '1/1', '3/4');
  CREATE TYPE "public"."enum__pages_v_blocks_testimonials_items_rating" AS ENUM('5', '4', '3');
  CREATE TYPE "public"."enum__pages_v_blocks_testimonials_variant" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__pages_v_blocks_inquiry_variant" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_variant" AS ENUM('dark', 'sage', 'light');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('en', 'de', 'fr');
  CREATE TYPE "public"."enum_header_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_header_actions_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_footer_columns_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_footer_legal_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_settings_socials_platform" AS ENUM('instagram', 'facebook', 'youtube', 'tiktok', 'linkedin', 'x');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"avatar_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_locales" (
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_tablet_url" varchar,
  	"sizes_tablet_width" numeric,
  	"sizes_tablet_height" numeric,
  	"sizes_tablet_mime_type" varchar,
  	"sizes_tablet_filesize" numeric,
  	"sizes_tablet_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "destinations_best_seasons" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_destinations_best_seasons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "destinations_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "destinations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_image_id" integer,
  	"region" "enum_destinations_region",
  	"coordinates_latitude" numeric,
  	"coordinates_longitude" numeric,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_destinations_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "destinations_locales" (
  	"name" varchar,
  	"slug" varchar,
  	"tagline" varchar,
  	"description" jsonb,
  	"country" varchar,
  	"getting_there" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_destinations_v_version_best_seasons" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__destinations_v_version_best_seasons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_destinations_v_version_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_destinations_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_hero_image_id" integer,
  	"version_region" "enum__destinations_v_version_region",
  	"version_coordinates_latitude" numeric,
  	"version_coordinates_longitude" numeric,
  	"version_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__destinations_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__destinations_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_destinations_v_locales" (
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_tagline" varchar,
  	"version_description" jsonb,
  	"version_country" varchar,
  	"version_getting_there" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_no_index" boolean DEFAULT false,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "trips_best_seasons" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_trips_best_seasons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "trips_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "trips_itinerary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" numeric,
  	"altitude" numeric
  );
  
  CREATE TABLE "trips_itinerary_locales" (
  	"title" varchar,
  	"description" varchar,
  	"accommodation" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "trips_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "trips_not_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "trips_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "trips_faqs_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "trips_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "trips" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_image_id" integer,
  	"destination_id" integer,
  	"trip_type" "enum_trips_trip_type" DEFAULT 'trekking',
  	"duration_days" numeric,
  	"duration_nights" numeric,
  	"group_size_max" numeric,
  	"max_altitude" numeric,
  	"difficulty" "enum_trips_difficulty" DEFAULT 'moderate',
  	"price_from" numeric,
  	"price_currency" "enum_trips_price_currency" DEFAULT 'USD',
  	"price_unit" "enum_trips_price_unit" DEFAULT 'per-person',
  	"booking_link_link_type" "enum_trips_booking_link_link_type" DEFAULT 'reference',
  	"booking_link_link_url" varchar,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_trips_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "trips_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"description" jsonb,
  	"price_note" varchar,
  	"booking_link_link_label" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "trips_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"trips_id" integer,
  	"pages_id" integer,
  	"destinations_id" integer,
  	"blog_id" integer
  );
  
  CREATE TABLE "_trips_v_version_best_seasons" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__trips_v_version_best_seasons",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_trips_v_version_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_trips_v_version_itinerary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"day" numeric,
  	"altitude" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_trips_v_version_itinerary_locales" (
  	"title" varchar,
  	"description" varchar,
  	"accommodation" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_trips_v_version_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_trips_v_version_not_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_trips_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_trips_v_version_faqs_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_trips_v_version_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_trips_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_hero_image_id" integer,
  	"version_destination_id" integer,
  	"version_trip_type" "enum__trips_v_version_trip_type" DEFAULT 'trekking',
  	"version_duration_days" numeric,
  	"version_duration_nights" numeric,
  	"version_group_size_max" numeric,
  	"version_max_altitude" numeric,
  	"version_difficulty" "enum__trips_v_version_difficulty" DEFAULT 'moderate',
  	"version_price_from" numeric,
  	"version_price_currency" "enum__trips_v_version_price_currency" DEFAULT 'USD',
  	"version_price_unit" "enum__trips_v_version_price_unit" DEFAULT 'per-person',
  	"version_booking_link_link_type" "enum__trips_v_version_booking_link_link_type" DEFAULT 'reference',
  	"version_booking_link_link_url" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__trips_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__trips_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_trips_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_description" jsonb,
  	"version_price_note" varchar,
  	"version_booking_link_link_label" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_no_index" boolean DEFAULT false,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_trips_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"trips_id" integer,
  	"pages_id" integer,
  	"destinations_id" integer,
  	"blog_id" integer
  );
  
  CREATE TABLE "blog_categories" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_blog_categories",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "blog" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"featured_image_id" integer,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_blog_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "blog_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "blog_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"blog_id" integer
  );
  
  CREATE TABLE "_blog_v_version_categories" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__blog_v_version_categories",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_blog_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_featured_image_id" integer,
  	"version_author_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__blog_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__blog_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_blog_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_no_index" boolean DEFAULT false,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_blog_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"blog_id" integer
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_image_id" integer,
  	"primary_link_type" "enum_pages_blocks_hero_primary_link_type" DEFAULT 'reference',
  	"primary_link_url" varchar,
  	"primary_link_new_tab" boolean DEFAULT false,
  	"secondary_link_type" "enum_pages_blocks_hero_secondary_link_type" DEFAULT 'reference',
  	"secondary_link_url" varchar,
  	"secondary_link_new_tab" boolean DEFAULT false,
  	"height" "enum_pages_blocks_hero_height" DEFAULT 'tall',
  	"overlay" "enum_pages_blocks_hero_overlay" DEFAULT 'medium',
  	"block_name" varchar
  );
  
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
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width" "enum_pages_blocks_rich_text_width" DEFAULT 'default',
  	"align" "enum_pages_blocks_rich_text_align" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text_locales" (
  	"heading" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_featured_trips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source" "enum_pages_blocks_featured_trips_source" DEFAULT 'featured',
  	"limit" numeric DEFAULT 3,
  	"columns" "enum_pages_blocks_featured_trips_columns" DEFAULT '3',
  	"view_all_link_type" "enum_pages_blocks_featured_trips_view_all_link_type" DEFAULT 'reference',
  	"view_all_link_url" varchar,
  	"view_all_link_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_trips_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_featured_destinations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source" "enum_pages_blocks_featured_destinations_source" DEFAULT 'featured',
  	"limit" numeric DEFAULT 3,
  	"layout" "enum_pages_blocks_featured_destinations_layout" DEFAULT 'grid',
  	"view_all_link_type" "enum_pages_blocks_featured_destinations_view_all_link_type" DEFAULT 'reference',
  	"view_all_link_url" varchar,
  	"view_all_link_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_featured_destinations_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_latest_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 3,
  	"view_all_link_type" "enum_pages_blocks_latest_posts_view_all_link_type" DEFAULT 'reference',
  	"view_all_link_url" varchar,
  	"view_all_link_new_tab" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_latest_posts_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "pages_blocks_stats_items_locales" (
  	"label" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_stats_variant" DEFAULT 'light',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_stats_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "pages_blocks_gallery_images_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"columns" "enum_pages_blocks_gallery_columns" DEFAULT '3',
  	"aspect_ratio" "enum_pages_blocks_gallery_aspect_ratio" DEFAULT '4/3',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_gallery_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_testimonials_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"rating" "enum_pages_blocks_testimonials_items_rating" DEFAULT '5',
  	"avatar_id" integer,
  	"trip_id" integer
  );
  
  CREATE TABLE "pages_blocks_testimonials_items_locales" (
  	"quote" varchar,
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_testimonials_variant" DEFAULT 'light',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_testimonials_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_inquiry" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"trip_id" integer,
  	"variant" "enum_pages_blocks_inquiry_variant" DEFAULT 'light',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_inquiry_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_pages_blocks_cta_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"variant" "enum_pages_blocks_cta_variant" DEFAULT 'dark',
  	"block_name" varchar
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
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"trips_id" integer,
  	"destinations_id" integer,
  	"blog_id" integer
  );
  
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_image_id" integer,
  	"primary_link_type" "enum__pages_v_blocks_hero_primary_link_type" DEFAULT 'reference',
  	"primary_link_url" varchar,
  	"primary_link_new_tab" boolean DEFAULT false,
  	"secondary_link_type" "enum__pages_v_blocks_hero_secondary_link_type" DEFAULT 'reference',
  	"secondary_link_url" varchar,
  	"secondary_link_new_tab" boolean DEFAULT false,
  	"height" "enum__pages_v_blocks_hero_height" DEFAULT 'tall',
  	"overlay" "enum__pages_v_blocks_hero_overlay" DEFAULT 'medium',
  	"_uuid" varchar,
  	"block_name" varchar
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
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"width" "enum__pages_v_blocks_rich_text_width" DEFAULT 'default',
  	"align" "enum__pages_v_blocks_rich_text_align" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text_locales" (
  	"heading" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_featured_trips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"source" "enum__pages_v_blocks_featured_trips_source" DEFAULT 'featured',
  	"limit" numeric DEFAULT 3,
  	"columns" "enum__pages_v_blocks_featured_trips_columns" DEFAULT '3',
  	"view_all_link_type" "enum__pages_v_blocks_featured_trips_view_all_link_type" DEFAULT 'reference',
  	"view_all_link_url" varchar,
  	"view_all_link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_featured_trips_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_featured_destinations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"source" "enum__pages_v_blocks_featured_destinations_source" DEFAULT 'featured',
  	"limit" numeric DEFAULT 3,
  	"layout" "enum__pages_v_blocks_featured_destinations_layout" DEFAULT 'grid',
  	"view_all_link_type" "enum__pages_v_blocks_featured_destinations_view_all_link_type" DEFAULT 'reference',
  	"view_all_link_url" varchar,
  	"view_all_link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_featured_destinations_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_latest_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 3,
  	"view_all_link_type" "enum__pages_v_blocks_latest_posts_view_all_link_type" DEFAULT 'reference',
  	"view_all_link_url" varchar,
  	"view_all_link_new_tab" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_latest_posts_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"view_all_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats_items_locales" (
  	"label" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_stats_variant" DEFAULT 'light',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_images_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"columns" "enum__pages_v_blocks_gallery_columns" DEFAULT '3',
  	"aspect_ratio" "enum__pages_v_blocks_gallery_aspect_ratio" DEFAULT '4/3',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_testimonials_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"rating" "enum__pages_v_blocks_testimonials_items_rating" DEFAULT '5',
  	"avatar_id" integer,
  	"trip_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_testimonials_items_locales" (
  	"quote" varchar,
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_testimonials_variant" DEFAULT 'light',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_testimonials_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_inquiry" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"trip_id" integer,
  	"variant" "enum__pages_v_blocks_inquiry_variant" DEFAULT 'light',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_inquiry_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "enum__pages_v_blocks_cta_link_type" DEFAULT 'reference',
  	"link_url" varchar,
  	"variant" "enum__pages_v_blocks_cta_variant" DEFAULT 'dark',
  	"_uuid" varchar,
  	"block_name" varchar
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
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_no_index" boolean DEFAULT false,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"trips_id" integer,
  	"destinations_id" integer,
  	"blog_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"destinations_id" integer,
  	"trips_id" integer,
  	"blog_id" integer,
  	"pages_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "header_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_header_nav_items_link_type" DEFAULT 'reference',
  	"link_url" varchar
  );
  
  CREATE TABLE "header_nav_items_locales" (
  	"link_label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "header_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_header_actions_link_type" DEFAULT 'reference',
  	"link_url" varchar
  );
  
  CREATE TABLE "header_actions_locales" (
  	"link_label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "header" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "header_locales" (
  	"announcement" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "header_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"trips_id" integer,
  	"destinations_id" integer,
  	"blog_id" integer
  );
  
  CREATE TABLE "footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_footer_columns_links_link_type" DEFAULT 'reference',
  	"link_url" varchar
  );
  
  CREATE TABLE "footer_columns_links_locales" (
  	"link_label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "footer_columns_locales" (
  	"heading" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_footer_legal_links_link_type" DEFAULT 'reference',
  	"link_url" varchar
  );
  
  CREATE TABLE "footer_legal_links_locales" (
  	"link_label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "footer_locales" (
  	"introduction" varchar,
  	"copyright" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "footer_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"trips_id" integer,
  	"destinations_id" integer,
  	"blog_id" integer
  );
  
  CREATE TABLE "settings_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_settings_socials_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'Hike Globally' NOT NULL,
  	"logo_id" integer,
  	"default_og_image_id" integer,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"whatsapp" varchar,
  	"formsubmit_email" varchar,
  	"legal_name" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_locales" (
  	"tagline" varchar,
  	"address" varchar,
  	"response_time_note" varchar DEFAULT 'We reply to every enquiry within 24 hours.',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_locales" ADD CONSTRAINT "users_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "destinations_best_seasons" ADD CONSTRAINT "destinations_best_seasons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "destinations_gallery" ADD CONSTRAINT "destinations_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "destinations_gallery" ADD CONSTRAINT "destinations_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "destinations" ADD CONSTRAINT "destinations_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "destinations_locales" ADD CONSTRAINT "destinations_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "destinations_locales" ADD CONSTRAINT "destinations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_destinations_v_version_best_seasons" ADD CONSTRAINT "_destinations_v_version_best_seasons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_destinations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_destinations_v_version_gallery" ADD CONSTRAINT "_destinations_v_version_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_destinations_v_version_gallery" ADD CONSTRAINT "_destinations_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_destinations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_destinations_v" ADD CONSTRAINT "_destinations_v_parent_id_destinations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_destinations_v" ADD CONSTRAINT "_destinations_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_destinations_v_locales" ADD CONSTRAINT "_destinations_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_destinations_v_locales" ADD CONSTRAINT "_destinations_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_destinations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_best_seasons" ADD CONSTRAINT "trips_best_seasons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_highlights" ADD CONSTRAINT "trips_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_itinerary" ADD CONSTRAINT "trips_itinerary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_itinerary_locales" ADD CONSTRAINT "trips_itinerary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips_itinerary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_included" ADD CONSTRAINT "trips_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_not_included" ADD CONSTRAINT "trips_not_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_faqs" ADD CONSTRAINT "trips_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_faqs_locales" ADD CONSTRAINT "trips_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_gallery" ADD CONSTRAINT "trips_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trips_gallery" ADD CONSTRAINT "trips_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips" ADD CONSTRAINT "trips_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trips" ADD CONSTRAINT "trips_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trips_locales" ADD CONSTRAINT "trips_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trips_locales" ADD CONSTRAINT "trips_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_rels" ADD CONSTRAINT "trips_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_rels" ADD CONSTRAINT "trips_rels_trips_fk" FOREIGN KEY ("trips_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_rels" ADD CONSTRAINT "trips_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_rels" ADD CONSTRAINT "trips_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trips_rels" ADD CONSTRAINT "trips_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_best_seasons" ADD CONSTRAINT "_trips_v_version_best_seasons_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_highlights" ADD CONSTRAINT "_trips_v_version_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_itinerary" ADD CONSTRAINT "_trips_v_version_itinerary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_itinerary_locales" ADD CONSTRAINT "_trips_v_version_itinerary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v_version_itinerary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_included" ADD CONSTRAINT "_trips_v_version_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_not_included" ADD CONSTRAINT "_trips_v_version_not_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_faqs" ADD CONSTRAINT "_trips_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_faqs_locales" ADD CONSTRAINT "_trips_v_version_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v_version_faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_version_gallery" ADD CONSTRAINT "_trips_v_version_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trips_v_version_gallery" ADD CONSTRAINT "_trips_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v" ADD CONSTRAINT "_trips_v_parent_id_trips_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trips_v" ADD CONSTRAINT "_trips_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trips_v" ADD CONSTRAINT "_trips_v_version_destination_id_destinations_id_fk" FOREIGN KEY ("version_destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trips_v_locales" ADD CONSTRAINT "_trips_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_trips_v_locales" ADD CONSTRAINT "_trips_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_rels" ADD CONSTRAINT "_trips_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_rels" ADD CONSTRAINT "_trips_v_rels_trips_fk" FOREIGN KEY ("trips_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_rels" ADD CONSTRAINT "_trips_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_rels" ADD CONSTRAINT "_trips_v_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_rels" ADD CONSTRAINT "_trips_v_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog" ADD CONSTRAINT "blog_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog" ADD CONSTRAINT "blog_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_locales" ADD CONSTRAINT "blog_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_locales" ADD CONSTRAINT "blog_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_rels" ADD CONSTRAINT "blog_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_rels" ADD CONSTRAINT "blog_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_version_categories" ADD CONSTRAINT "_blog_v_version_categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v" ADD CONSTRAINT "_blog_v_parent_id_blog_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_v" ADD CONSTRAINT "_blog_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_v" ADD CONSTRAINT "_blog_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_v_locales" ADD CONSTRAINT "_blog_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_v_locales" ADD CONSTRAINT "_blog_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_rels" ADD CONSTRAINT "_blog_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_rels" ADD CONSTRAINT "_blog_v_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_locales" ADD CONSTRAINT "pages_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text_locales" ADD CONSTRAINT "pages_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_trips" ADD CONSTRAINT "pages_blocks_featured_trips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_trips_locales" ADD CONSTRAINT "pages_blocks_featured_trips_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_featured_trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_destinations" ADD CONSTRAINT "pages_blocks_featured_destinations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_featured_destinations_locales" ADD CONSTRAINT "pages_blocks_featured_destinations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_featured_destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_latest_posts" ADD CONSTRAINT "pages_blocks_latest_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_latest_posts_locales" ADD CONSTRAINT "pages_blocks_latest_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_latest_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_items" ADD CONSTRAINT "pages_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_items_locales" ADD CONSTRAINT "pages_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats" ADD CONSTRAINT "pages_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_locales" ADD CONSTRAINT "pages_blocks_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_images" ADD CONSTRAINT "pages_blocks_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_images" ADD CONSTRAINT "pages_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_images_locales" ADD CONSTRAINT "pages_blocks_gallery_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_locales" ADD CONSTRAINT "pages_blocks_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_items" ADD CONSTRAINT "pages_blocks_testimonials_items_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_items" ADD CONSTRAINT "pages_blocks_testimonials_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_items" ADD CONSTRAINT "pages_blocks_testimonials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_items_locales" ADD CONSTRAINT "pages_blocks_testimonials_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_testimonials_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_locales" ADD CONSTRAINT "pages_blocks_testimonials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items_locales" ADD CONSTRAINT "pages_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_locales" ADD CONSTRAINT "pages_blocks_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_inquiry" ADD CONSTRAINT "pages_blocks_inquiry_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_inquiry" ADD CONSTRAINT "pages_blocks_inquiry_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_inquiry_locales" ADD CONSTRAINT "pages_blocks_inquiry_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_inquiry"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_locales" ADD CONSTRAINT "pages_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_trips_fk" FOREIGN KEY ("trips_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_locales" ADD CONSTRAINT "_pages_v_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text_locales" ADD CONSTRAINT "_pages_v_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_trips" ADD CONSTRAINT "_pages_v_blocks_featured_trips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_trips_locales" ADD CONSTRAINT "_pages_v_blocks_featured_trips_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_featured_trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_destinations" ADD CONSTRAINT "_pages_v_blocks_featured_destinations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_featured_destinations_locales" ADD CONSTRAINT "_pages_v_blocks_featured_destinations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_featured_destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_latest_posts" ADD CONSTRAINT "_pages_v_blocks_latest_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_latest_posts_locales" ADD CONSTRAINT "_pages_v_blocks_latest_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_latest_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_items" ADD CONSTRAINT "_pages_v_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_items_locales" ADD CONSTRAINT "_pages_v_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats" ADD CONSTRAINT "_pages_v_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_locales" ADD CONSTRAINT "_pages_v_blocks_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_images" ADD CONSTRAINT "_pages_v_blocks_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_images" ADD CONSTRAINT "_pages_v_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_images_locales" ADD CONSTRAINT "_pages_v_blocks_gallery_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_gallery_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_locales" ADD CONSTRAINT "_pages_v_blocks_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_items" ADD CONSTRAINT "_pages_v_blocks_testimonials_items_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_items" ADD CONSTRAINT "_pages_v_blocks_testimonials_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_items" ADD CONSTRAINT "_pages_v_blocks_testimonials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_items_locales" ADD CONSTRAINT "_pages_v_blocks_testimonials_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_testimonials_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials" ADD CONSTRAINT "_pages_v_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_locales" ADD CONSTRAINT "_pages_v_blocks_testimonials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items_locales" ADD CONSTRAINT "_pages_v_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_locales" ADD CONSTRAINT "_pages_v_blocks_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_inquiry" ADD CONSTRAINT "_pages_v_blocks_inquiry_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_inquiry" ADD CONSTRAINT "_pages_v_blocks_inquiry_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_inquiry_locales" ADD CONSTRAINT "_pages_v_blocks_inquiry_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_inquiry"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_locales" ADD CONSTRAINT "_pages_v_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_trips_fk" FOREIGN KEY ("trips_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trips_fk" FOREIGN KEY ("trips_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_items" ADD CONSTRAINT "header_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_items_locales" ADD CONSTRAINT "header_nav_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_actions" ADD CONSTRAINT "header_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_actions_locales" ADD CONSTRAINT "header_actions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_actions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_locales" ADD CONSTRAINT "header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_trips_fk" FOREIGN KEY ("trips_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_links" ADD CONSTRAINT "footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_links_locales" ADD CONSTRAINT "footer_columns_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns" ADD CONSTRAINT "footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_locales" ADD CONSTRAINT "footer_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_legal_links" ADD CONSTRAINT "footer_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_legal_links_locales" ADD CONSTRAINT "footer_legal_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_legal_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_locales" ADD CONSTRAINT "footer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_trips_fk" FOREIGN KEY ("trips_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_destinations_fk" FOREIGN KEY ("destinations_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_socials" ADD CONSTRAINT "settings_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings" ADD CONSTRAINT "settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "settings" ADD CONSTRAINT "settings_default_og_image_id_media_id_fk" FOREIGN KEY ("default_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "settings_locales" ADD CONSTRAINT "settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "users_locales_locale_parent_id_unique" ON "users_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_tablet_sizes_tablet_filename_idx" ON "media" USING btree ("sizes_tablet_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "destinations_best_seasons_order_idx" ON "destinations_best_seasons" USING btree ("order");
  CREATE INDEX "destinations_best_seasons_parent_idx" ON "destinations_best_seasons" USING btree ("parent_id");
  CREATE INDEX "destinations_gallery_order_idx" ON "destinations_gallery" USING btree ("_order");
  CREATE INDEX "destinations_gallery_parent_id_idx" ON "destinations_gallery" USING btree ("_parent_id");
  CREATE INDEX "destinations_gallery_locale_idx" ON "destinations_gallery" USING btree ("_locale");
  CREATE INDEX "destinations_gallery_image_idx" ON "destinations_gallery" USING btree ("image_id");
  CREATE INDEX "destinations_hero_image_idx" ON "destinations" USING btree ("hero_image_id");
  CREATE INDEX "destinations_updated_at_idx" ON "destinations" USING btree ("updated_at");
  CREATE INDEX "destinations_created_at_idx" ON "destinations" USING btree ("created_at");
  CREATE INDEX "destinations__status_idx" ON "destinations" USING btree ("_status");
  CREATE INDEX "destinations_slug_idx" ON "destinations_locales" USING btree ("slug","_locale");
  CREATE INDEX "destinations_meta_meta_image_idx" ON "destinations_locales" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "destinations_locales_locale_parent_id_unique" ON "destinations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_destinations_v_version_best_seasons_order_idx" ON "_destinations_v_version_best_seasons" USING btree ("order");
  CREATE INDEX "_destinations_v_version_best_seasons_parent_idx" ON "_destinations_v_version_best_seasons" USING btree ("parent_id");
  CREATE INDEX "_destinations_v_version_gallery_order_idx" ON "_destinations_v_version_gallery" USING btree ("_order");
  CREATE INDEX "_destinations_v_version_gallery_parent_id_idx" ON "_destinations_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX "_destinations_v_version_gallery_locale_idx" ON "_destinations_v_version_gallery" USING btree ("_locale");
  CREATE INDEX "_destinations_v_version_gallery_image_idx" ON "_destinations_v_version_gallery" USING btree ("image_id");
  CREATE INDEX "_destinations_v_parent_idx" ON "_destinations_v" USING btree ("parent_id");
  CREATE INDEX "_destinations_v_version_version_hero_image_idx" ON "_destinations_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_destinations_v_version_version_updated_at_idx" ON "_destinations_v" USING btree ("version_updated_at");
  CREATE INDEX "_destinations_v_version_version_created_at_idx" ON "_destinations_v" USING btree ("version_created_at");
  CREATE INDEX "_destinations_v_version_version__status_idx" ON "_destinations_v" USING btree ("version__status");
  CREATE INDEX "_destinations_v_created_at_idx" ON "_destinations_v" USING btree ("created_at");
  CREATE INDEX "_destinations_v_updated_at_idx" ON "_destinations_v" USING btree ("updated_at");
  CREATE INDEX "_destinations_v_snapshot_idx" ON "_destinations_v" USING btree ("snapshot");
  CREATE INDEX "_destinations_v_published_locale_idx" ON "_destinations_v" USING btree ("published_locale");
  CREATE INDEX "_destinations_v_latest_idx" ON "_destinations_v" USING btree ("latest");
  CREATE INDEX "_destinations_v_autosave_idx" ON "_destinations_v" USING btree ("autosave");
  CREATE INDEX "_destinations_v_version_version_slug_idx" ON "_destinations_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_destinations_v_version_meta_version_meta_image_idx" ON "_destinations_v_locales" USING btree ("version_meta_image_id");
  CREATE UNIQUE INDEX "_destinations_v_locales_locale_parent_id_unique" ON "_destinations_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "trips_best_seasons_order_idx" ON "trips_best_seasons" USING btree ("order");
  CREATE INDEX "trips_best_seasons_parent_idx" ON "trips_best_seasons" USING btree ("parent_id");
  CREATE INDEX "trips_highlights_order_idx" ON "trips_highlights" USING btree ("_order");
  CREATE INDEX "trips_highlights_parent_id_idx" ON "trips_highlights" USING btree ("_parent_id");
  CREATE INDEX "trips_highlights_locale_idx" ON "trips_highlights" USING btree ("_locale");
  CREATE INDEX "trips_itinerary_order_idx" ON "trips_itinerary" USING btree ("_order");
  CREATE INDEX "trips_itinerary_parent_id_idx" ON "trips_itinerary" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "trips_itinerary_locales_locale_parent_id_unique" ON "trips_itinerary_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "trips_included_order_idx" ON "trips_included" USING btree ("_order");
  CREATE INDEX "trips_included_parent_id_idx" ON "trips_included" USING btree ("_parent_id");
  CREATE INDEX "trips_included_locale_idx" ON "trips_included" USING btree ("_locale");
  CREATE INDEX "trips_not_included_order_idx" ON "trips_not_included" USING btree ("_order");
  CREATE INDEX "trips_not_included_parent_id_idx" ON "trips_not_included" USING btree ("_parent_id");
  CREATE INDEX "trips_not_included_locale_idx" ON "trips_not_included" USING btree ("_locale");
  CREATE INDEX "trips_faqs_order_idx" ON "trips_faqs" USING btree ("_order");
  CREATE INDEX "trips_faqs_parent_id_idx" ON "trips_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "trips_faqs_locales_locale_parent_id_unique" ON "trips_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "trips_gallery_order_idx" ON "trips_gallery" USING btree ("_order");
  CREATE INDEX "trips_gallery_parent_id_idx" ON "trips_gallery" USING btree ("_parent_id");
  CREATE INDEX "trips_gallery_locale_idx" ON "trips_gallery" USING btree ("_locale");
  CREATE INDEX "trips_gallery_image_idx" ON "trips_gallery" USING btree ("image_id");
  CREATE INDEX "trips_hero_image_idx" ON "trips" USING btree ("hero_image_id");
  CREATE INDEX "trips_destination_idx" ON "trips" USING btree ("destination_id");
  CREATE INDEX "trips_updated_at_idx" ON "trips" USING btree ("updated_at");
  CREATE INDEX "trips_created_at_idx" ON "trips" USING btree ("created_at");
  CREATE INDEX "trips__status_idx" ON "trips" USING btree ("_status");
  CREATE INDEX "trips_slug_idx" ON "trips_locales" USING btree ("slug","_locale");
  CREATE INDEX "trips_meta_meta_image_idx" ON "trips_locales" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "trips_locales_locale_parent_id_unique" ON "trips_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "trips_rels_order_idx" ON "trips_rels" USING btree ("order");
  CREATE INDEX "trips_rels_parent_idx" ON "trips_rels" USING btree ("parent_id");
  CREATE INDEX "trips_rels_path_idx" ON "trips_rels" USING btree ("path");
  CREATE INDEX "trips_rels_trips_id_idx" ON "trips_rels" USING btree ("trips_id");
  CREATE INDEX "trips_rels_pages_id_idx" ON "trips_rels" USING btree ("pages_id");
  CREATE INDEX "trips_rels_destinations_id_idx" ON "trips_rels" USING btree ("destinations_id");
  CREATE INDEX "trips_rels_blog_id_idx" ON "trips_rels" USING btree ("blog_id");
  CREATE INDEX "_trips_v_version_best_seasons_order_idx" ON "_trips_v_version_best_seasons" USING btree ("order");
  CREATE INDEX "_trips_v_version_best_seasons_parent_idx" ON "_trips_v_version_best_seasons" USING btree ("parent_id");
  CREATE INDEX "_trips_v_version_highlights_order_idx" ON "_trips_v_version_highlights" USING btree ("_order");
  CREATE INDEX "_trips_v_version_highlights_parent_id_idx" ON "_trips_v_version_highlights" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_highlights_locale_idx" ON "_trips_v_version_highlights" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_itinerary_order_idx" ON "_trips_v_version_itinerary" USING btree ("_order");
  CREATE INDEX "_trips_v_version_itinerary_parent_id_idx" ON "_trips_v_version_itinerary" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_trips_v_version_itinerary_locales_locale_parent_id_unique" ON "_trips_v_version_itinerary_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_trips_v_version_included_order_idx" ON "_trips_v_version_included" USING btree ("_order");
  CREATE INDEX "_trips_v_version_included_parent_id_idx" ON "_trips_v_version_included" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_included_locale_idx" ON "_trips_v_version_included" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_not_included_order_idx" ON "_trips_v_version_not_included" USING btree ("_order");
  CREATE INDEX "_trips_v_version_not_included_parent_id_idx" ON "_trips_v_version_not_included" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_not_included_locale_idx" ON "_trips_v_version_not_included" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_faqs_order_idx" ON "_trips_v_version_faqs" USING btree ("_order");
  CREATE INDEX "_trips_v_version_faqs_parent_id_idx" ON "_trips_v_version_faqs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_trips_v_version_faqs_locales_locale_parent_id_unique" ON "_trips_v_version_faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_trips_v_version_gallery_order_idx" ON "_trips_v_version_gallery" USING btree ("_order");
  CREATE INDEX "_trips_v_version_gallery_parent_id_idx" ON "_trips_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX "_trips_v_version_gallery_locale_idx" ON "_trips_v_version_gallery" USING btree ("_locale");
  CREATE INDEX "_trips_v_version_gallery_image_idx" ON "_trips_v_version_gallery" USING btree ("image_id");
  CREATE INDEX "_trips_v_parent_idx" ON "_trips_v" USING btree ("parent_id");
  CREATE INDEX "_trips_v_version_version_hero_image_idx" ON "_trips_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_trips_v_version_version_destination_idx" ON "_trips_v" USING btree ("version_destination_id");
  CREATE INDEX "_trips_v_version_version_updated_at_idx" ON "_trips_v" USING btree ("version_updated_at");
  CREATE INDEX "_trips_v_version_version_created_at_idx" ON "_trips_v" USING btree ("version_created_at");
  CREATE INDEX "_trips_v_version_version__status_idx" ON "_trips_v" USING btree ("version__status");
  CREATE INDEX "_trips_v_created_at_idx" ON "_trips_v" USING btree ("created_at");
  CREATE INDEX "_trips_v_updated_at_idx" ON "_trips_v" USING btree ("updated_at");
  CREATE INDEX "_trips_v_snapshot_idx" ON "_trips_v" USING btree ("snapshot");
  CREATE INDEX "_trips_v_published_locale_idx" ON "_trips_v" USING btree ("published_locale");
  CREATE INDEX "_trips_v_latest_idx" ON "_trips_v" USING btree ("latest");
  CREATE INDEX "_trips_v_autosave_idx" ON "_trips_v" USING btree ("autosave");
  CREATE INDEX "_trips_v_version_version_slug_idx" ON "_trips_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_trips_v_version_meta_version_meta_image_idx" ON "_trips_v_locales" USING btree ("version_meta_image_id");
  CREATE UNIQUE INDEX "_trips_v_locales_locale_parent_id_unique" ON "_trips_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_trips_v_rels_order_idx" ON "_trips_v_rels" USING btree ("order");
  CREATE INDEX "_trips_v_rels_parent_idx" ON "_trips_v_rels" USING btree ("parent_id");
  CREATE INDEX "_trips_v_rels_path_idx" ON "_trips_v_rels" USING btree ("path");
  CREATE INDEX "_trips_v_rels_trips_id_idx" ON "_trips_v_rels" USING btree ("trips_id");
  CREATE INDEX "_trips_v_rels_pages_id_idx" ON "_trips_v_rels" USING btree ("pages_id");
  CREATE INDEX "_trips_v_rels_destinations_id_idx" ON "_trips_v_rels" USING btree ("destinations_id");
  CREATE INDEX "_trips_v_rels_blog_id_idx" ON "_trips_v_rels" USING btree ("blog_id");
  CREATE INDEX "blog_categories_order_idx" ON "blog_categories" USING btree ("order");
  CREATE INDEX "blog_categories_parent_idx" ON "blog_categories" USING btree ("parent_id");
  CREATE INDEX "blog_featured_image_idx" ON "blog" USING btree ("featured_image_id");
  CREATE INDEX "blog_author_idx" ON "blog" USING btree ("author_id");
  CREATE INDEX "blog_updated_at_idx" ON "blog" USING btree ("updated_at");
  CREATE INDEX "blog_created_at_idx" ON "blog" USING btree ("created_at");
  CREATE INDEX "blog__status_idx" ON "blog" USING btree ("_status");
  CREATE INDEX "blog_slug_idx" ON "blog_locales" USING btree ("slug","_locale");
  CREATE INDEX "blog_meta_meta_image_idx" ON "blog_locales" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "blog_locales_locale_parent_id_unique" ON "blog_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "blog_rels_order_idx" ON "blog_rels" USING btree ("order");
  CREATE INDEX "blog_rels_parent_idx" ON "blog_rels" USING btree ("parent_id");
  CREATE INDEX "blog_rels_path_idx" ON "blog_rels" USING btree ("path");
  CREATE INDEX "blog_rels_blog_id_idx" ON "blog_rels" USING btree ("blog_id");
  CREATE INDEX "_blog_v_version_categories_order_idx" ON "_blog_v_version_categories" USING btree ("order");
  CREATE INDEX "_blog_v_version_categories_parent_idx" ON "_blog_v_version_categories" USING btree ("parent_id");
  CREATE INDEX "_blog_v_parent_idx" ON "_blog_v" USING btree ("parent_id");
  CREATE INDEX "_blog_v_version_version_featured_image_idx" ON "_blog_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_blog_v_version_version_author_idx" ON "_blog_v" USING btree ("version_author_id");
  CREATE INDEX "_blog_v_version_version_updated_at_idx" ON "_blog_v" USING btree ("version_updated_at");
  CREATE INDEX "_blog_v_version_version_created_at_idx" ON "_blog_v" USING btree ("version_created_at");
  CREATE INDEX "_blog_v_version_version__status_idx" ON "_blog_v" USING btree ("version__status");
  CREATE INDEX "_blog_v_created_at_idx" ON "_blog_v" USING btree ("created_at");
  CREATE INDEX "_blog_v_updated_at_idx" ON "_blog_v" USING btree ("updated_at");
  CREATE INDEX "_blog_v_snapshot_idx" ON "_blog_v" USING btree ("snapshot");
  CREATE INDEX "_blog_v_published_locale_idx" ON "_blog_v" USING btree ("published_locale");
  CREATE INDEX "_blog_v_latest_idx" ON "_blog_v" USING btree ("latest");
  CREATE INDEX "_blog_v_autosave_idx" ON "_blog_v" USING btree ("autosave");
  CREATE INDEX "_blog_v_version_version_slug_idx" ON "_blog_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_blog_v_version_meta_version_meta_image_idx" ON "_blog_v_locales" USING btree ("version_meta_image_id");
  CREATE UNIQUE INDEX "_blog_v_locales_locale_parent_id_unique" ON "_blog_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_blog_v_rels_order_idx" ON "_blog_v_rels" USING btree ("order");
  CREATE INDEX "_blog_v_rels_parent_idx" ON "_blog_v_rels" USING btree ("parent_id");
  CREATE INDEX "_blog_v_rels_path_idx" ON "_blog_v_rels" USING btree ("path");
  CREATE INDEX "_blog_v_rels_blog_id_idx" ON "_blog_v_rels" USING btree ("blog_id");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_background_image_idx" ON "pages_blocks_hero" USING btree ("background_image_id");
  CREATE UNIQUE INDEX "pages_blocks_hero_locales_locale_parent_id_unique" ON "pages_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_rich_text_locales_locale_parent_id_unique" ON "pages_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_featured_trips_order_idx" ON "pages_blocks_featured_trips" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_trips_parent_id_idx" ON "pages_blocks_featured_trips" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_trips_path_idx" ON "pages_blocks_featured_trips" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_featured_trips_locales_locale_parent_id_unique" ON "pages_blocks_featured_trips_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_featured_destinations_order_idx" ON "pages_blocks_featured_destinations" USING btree ("_order");
  CREATE INDEX "pages_blocks_featured_destinations_parent_id_idx" ON "pages_blocks_featured_destinations" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_featured_destinations_path_idx" ON "pages_blocks_featured_destinations" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_featured_destinations_locales_locale_parent_id_" ON "pages_blocks_featured_destinations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_latest_posts_order_idx" ON "pages_blocks_latest_posts" USING btree ("_order");
  CREATE INDEX "pages_blocks_latest_posts_parent_id_idx" ON "pages_blocks_latest_posts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_latest_posts_path_idx" ON "pages_blocks_latest_posts" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_latest_posts_locales_locale_parent_id_unique" ON "pages_blocks_latest_posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_stats_items_order_idx" ON "pages_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_items_parent_id_idx" ON "pages_blocks_stats_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_stats_items_locales_locale_parent_id_unique" ON "pages_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_stats_order_idx" ON "pages_blocks_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_parent_id_idx" ON "pages_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_path_idx" ON "pages_blocks_stats" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_stats_locales_locale_parent_id_unique" ON "pages_blocks_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_gallery_images_order_idx" ON "pages_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_images_parent_id_idx" ON "pages_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_images_image_idx" ON "pages_blocks_gallery_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "pages_blocks_gallery_images_locales_locale_parent_id_unique" ON "pages_blocks_gallery_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_gallery_order_idx" ON "pages_blocks_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_parent_id_idx" ON "pages_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_path_idx" ON "pages_blocks_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_gallery_locales_locale_parent_id_unique" ON "pages_blocks_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_testimonials_items_order_idx" ON "pages_blocks_testimonials_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_items_parent_id_idx" ON "pages_blocks_testimonials_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_items_avatar_idx" ON "pages_blocks_testimonials_items" USING btree ("avatar_id");
  CREATE INDEX "pages_blocks_testimonials_items_trip_idx" ON "pages_blocks_testimonials_items" USING btree ("trip_id");
  CREATE UNIQUE INDEX "pages_blocks_testimonials_items_locales_locale_parent_id_uni" ON "pages_blocks_testimonials_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_testimonials_order_idx" ON "pages_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_parent_id_idx" ON "pages_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_path_idx" ON "pages_blocks_testimonials" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_testimonials_locales_locale_parent_id_unique" ON "pages_blocks_testimonials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_faq_items_locales_locale_parent_id_unique" ON "pages_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_faq_locales_locale_parent_id_unique" ON "pages_blocks_faq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_inquiry_order_idx" ON "pages_blocks_inquiry" USING btree ("_order");
  CREATE INDEX "pages_blocks_inquiry_parent_id_idx" ON "pages_blocks_inquiry" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_inquiry_path_idx" ON "pages_blocks_inquiry" USING btree ("_path");
  CREATE INDEX "pages_blocks_inquiry_trip_idx" ON "pages_blocks_inquiry" USING btree ("trip_id");
  CREATE UNIQUE INDEX "pages_blocks_inquiry_locales_locale_parent_id_unique" ON "pages_blocks_inquiry_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_cta_locales_locale_parent_id_unique" ON "pages_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "pages_slug_idx" ON "pages_locales" USING btree ("slug","_locale");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages_locales" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_pages_id_idx" ON "pages_rels" USING btree ("pages_id");
  CREATE INDEX "pages_rels_trips_id_idx" ON "pages_rels" USING btree ("trips_id");
  CREATE INDEX "pages_rels_destinations_id_idx" ON "pages_rels" USING btree ("destinations_id");
  CREATE INDEX "pages_rels_blog_id_idx" ON "pages_rels" USING btree ("blog_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_background_image_idx" ON "_pages_v_blocks_hero" USING btree ("background_image_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_hero_locales_locale_parent_id_unique" ON "_pages_v_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_rich_text_locales_locale_parent_id_unique" ON "_pages_v_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_trips_order_idx" ON "_pages_v_blocks_featured_trips" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_featured_trips_parent_id_idx" ON "_pages_v_blocks_featured_trips" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_trips_path_idx" ON "_pages_v_blocks_featured_trips" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_featured_trips_locales_locale_parent_id_uniq" ON "_pages_v_blocks_featured_trips_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_destinations_order_idx" ON "_pages_v_blocks_featured_destinations" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_featured_destinations_parent_id_idx" ON "_pages_v_blocks_featured_destinations" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_featured_destinations_path_idx" ON "_pages_v_blocks_featured_destinations" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_featured_destinations_locales_locale_parent_" ON "_pages_v_blocks_featured_destinations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_latest_posts_order_idx" ON "_pages_v_blocks_latest_posts" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_latest_posts_parent_id_idx" ON "_pages_v_blocks_latest_posts" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_latest_posts_path_idx" ON "_pages_v_blocks_latest_posts" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_latest_posts_locales_locale_parent_id_unique" ON "_pages_v_blocks_latest_posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_items_order_idx" ON "_pages_v_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_items_parent_id_idx" ON "_pages_v_blocks_stats_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_stats_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_order_idx" ON "_pages_v_blocks_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_parent_id_idx" ON "_pages_v_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_path_idx" ON "_pages_v_blocks_stats" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_stats_locales_locale_parent_id_unique" ON "_pages_v_blocks_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_images_order_idx" ON "_pages_v_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_images_parent_id_idx" ON "_pages_v_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_images_image_idx" ON "_pages_v_blocks_gallery_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_gallery_images_locales_locale_parent_id_uniq" ON "_pages_v_blocks_gallery_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_order_idx" ON "_pages_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_parent_id_idx" ON "_pages_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_path_idx" ON "_pages_v_blocks_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_gallery_locales_locale_parent_id_unique" ON "_pages_v_blocks_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonials_items_order_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonials_items_parent_id_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonials_items_avatar_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("avatar_id");
  CREATE INDEX "_pages_v_blocks_testimonials_items_trip_idx" ON "_pages_v_blocks_testimonials_items" USING btree ("trip_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_testimonials_items_locales_locale_parent_id_" ON "_pages_v_blocks_testimonials_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonials_order_idx" ON "_pages_v_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_testimonials_parent_id_idx" ON "_pages_v_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_testimonials_path_idx" ON "_pages_v_blocks_testimonials" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_testimonials_locales_locale_parent_id_unique" ON "_pages_v_blocks_testimonials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_items_order_idx" ON "_pages_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_items_parent_id_idx" ON "_pages_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_faq_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "_pages_v_blocks_faq" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_faq_locales_locale_parent_id_unique" ON "_pages_v_blocks_faq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_inquiry_order_idx" ON "_pages_v_blocks_inquiry" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_inquiry_parent_id_idx" ON "_pages_v_blocks_inquiry" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_inquiry_path_idx" ON "_pages_v_blocks_inquiry" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_inquiry_trip_idx" ON "_pages_v_blocks_inquiry" USING btree ("trip_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_inquiry_locales_locale_parent_id_unique" ON "_pages_v_blocks_inquiry_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_cta_locales_locale_parent_id_unique" ON "_pages_v_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v_locales" USING btree ("version_meta_image_id");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_pages_id_idx" ON "_pages_v_rels" USING btree ("pages_id");
  CREATE INDEX "_pages_v_rels_trips_id_idx" ON "_pages_v_rels" USING btree ("trips_id");
  CREATE INDEX "_pages_v_rels_destinations_id_idx" ON "_pages_v_rels" USING btree ("destinations_id");
  CREATE INDEX "_pages_v_rels_blog_id_idx" ON "_pages_v_rels" USING btree ("blog_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_destinations_id_idx" ON "payload_locked_documents_rels" USING btree ("destinations_id");
  CREATE INDEX "payload_locked_documents_rels_trips_id_idx" ON "payload_locked_documents_rels" USING btree ("trips_id");
  CREATE INDEX "payload_locked_documents_rels_blog_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "header_nav_items_order_idx" ON "header_nav_items" USING btree ("_order");
  CREATE INDEX "header_nav_items_parent_id_idx" ON "header_nav_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "header_nav_items_locales_locale_parent_id_unique" ON "header_nav_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "header_actions_order_idx" ON "header_actions" USING btree ("_order");
  CREATE INDEX "header_actions_parent_id_idx" ON "header_actions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "header_actions_locales_locale_parent_id_unique" ON "header_actions_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "header_locales_locale_parent_id_unique" ON "header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "header_rels_order_idx" ON "header_rels" USING btree ("order");
  CREATE INDEX "header_rels_parent_idx" ON "header_rels" USING btree ("parent_id");
  CREATE INDEX "header_rels_path_idx" ON "header_rels" USING btree ("path");
  CREATE INDEX "header_rels_pages_id_idx" ON "header_rels" USING btree ("pages_id");
  CREATE INDEX "header_rels_trips_id_idx" ON "header_rels" USING btree ("trips_id");
  CREATE INDEX "header_rels_destinations_id_idx" ON "header_rels" USING btree ("destinations_id");
  CREATE INDEX "header_rels_blog_id_idx" ON "header_rels" USING btree ("blog_id");
  CREATE INDEX "footer_columns_links_order_idx" ON "footer_columns_links" USING btree ("_order");
  CREATE INDEX "footer_columns_links_parent_id_idx" ON "footer_columns_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_columns_links_locales_locale_parent_id_unique" ON "footer_columns_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_columns_order_idx" ON "footer_columns" USING btree ("_order");
  CREATE INDEX "footer_columns_parent_id_idx" ON "footer_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_columns_locales_locale_parent_id_unique" ON "footer_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_legal_links_order_idx" ON "footer_legal_links" USING btree ("_order");
  CREATE INDEX "footer_legal_links_parent_id_idx" ON "footer_legal_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_legal_links_locales_locale_parent_id_unique" ON "footer_legal_links_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "footer_locales_locale_parent_id_unique" ON "footer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_rels_order_idx" ON "footer_rels" USING btree ("order");
  CREATE INDEX "footer_rels_parent_idx" ON "footer_rels" USING btree ("parent_id");
  CREATE INDEX "footer_rels_path_idx" ON "footer_rels" USING btree ("path");
  CREATE INDEX "footer_rels_pages_id_idx" ON "footer_rels" USING btree ("pages_id");
  CREATE INDEX "footer_rels_trips_id_idx" ON "footer_rels" USING btree ("trips_id");
  CREATE INDEX "footer_rels_destinations_id_idx" ON "footer_rels" USING btree ("destinations_id");
  CREATE INDEX "footer_rels_blog_id_idx" ON "footer_rels" USING btree ("blog_id");
  CREATE INDEX "settings_socials_order_idx" ON "settings_socials" USING btree ("_order");
  CREATE INDEX "settings_socials_parent_id_idx" ON "settings_socials" USING btree ("_parent_id");
  CREATE INDEX "settings_logo_idx" ON "settings" USING btree ("logo_id");
  CREATE INDEX "settings_default_og_image_idx" ON "settings" USING btree ("default_og_image_id");
  CREATE UNIQUE INDEX "settings_locales_locale_parent_id_unique" ON "settings_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "destinations_best_seasons" CASCADE;
  DROP TABLE "destinations_gallery" CASCADE;
  DROP TABLE "destinations" CASCADE;
  DROP TABLE "destinations_locales" CASCADE;
  DROP TABLE "_destinations_v_version_best_seasons" CASCADE;
  DROP TABLE "_destinations_v_version_gallery" CASCADE;
  DROP TABLE "_destinations_v" CASCADE;
  DROP TABLE "_destinations_v_locales" CASCADE;
  DROP TABLE "trips_best_seasons" CASCADE;
  DROP TABLE "trips_highlights" CASCADE;
  DROP TABLE "trips_itinerary" CASCADE;
  DROP TABLE "trips_itinerary_locales" CASCADE;
  DROP TABLE "trips_included" CASCADE;
  DROP TABLE "trips_not_included" CASCADE;
  DROP TABLE "trips_faqs" CASCADE;
  DROP TABLE "trips_faqs_locales" CASCADE;
  DROP TABLE "trips_gallery" CASCADE;
  DROP TABLE "trips" CASCADE;
  DROP TABLE "trips_locales" CASCADE;
  DROP TABLE "trips_rels" CASCADE;
  DROP TABLE "_trips_v_version_best_seasons" CASCADE;
  DROP TABLE "_trips_v_version_highlights" CASCADE;
  DROP TABLE "_trips_v_version_itinerary" CASCADE;
  DROP TABLE "_trips_v_version_itinerary_locales" CASCADE;
  DROP TABLE "_trips_v_version_included" CASCADE;
  DROP TABLE "_trips_v_version_not_included" CASCADE;
  DROP TABLE "_trips_v_version_faqs" CASCADE;
  DROP TABLE "_trips_v_version_faqs_locales" CASCADE;
  DROP TABLE "_trips_v_version_gallery" CASCADE;
  DROP TABLE "_trips_v" CASCADE;
  DROP TABLE "_trips_v_locales" CASCADE;
  DROP TABLE "_trips_v_rels" CASCADE;
  DROP TABLE "blog_categories" CASCADE;
  DROP TABLE "blog" CASCADE;
  DROP TABLE "blog_locales" CASCADE;
  DROP TABLE "blog_rels" CASCADE;
  DROP TABLE "_blog_v_version_categories" CASCADE;
  DROP TABLE "_blog_v" CASCADE;
  DROP TABLE "_blog_v_locales" CASCADE;
  DROP TABLE "_blog_v_rels" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_hero_locales" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_rich_text_locales" CASCADE;
  DROP TABLE "pages_blocks_featured_trips" CASCADE;
  DROP TABLE "pages_blocks_featured_trips_locales" CASCADE;
  DROP TABLE "pages_blocks_featured_destinations" CASCADE;
  DROP TABLE "pages_blocks_featured_destinations_locales" CASCADE;
  DROP TABLE "pages_blocks_latest_posts" CASCADE;
  DROP TABLE "pages_blocks_latest_posts_locales" CASCADE;
  DROP TABLE "pages_blocks_stats_items" CASCADE;
  DROP TABLE "pages_blocks_stats_items_locales" CASCADE;
  DROP TABLE "pages_blocks_stats" CASCADE;
  DROP TABLE "pages_blocks_stats_locales" CASCADE;
  DROP TABLE "pages_blocks_gallery_images" CASCADE;
  DROP TABLE "pages_blocks_gallery_images_locales" CASCADE;
  DROP TABLE "pages_blocks_gallery" CASCADE;
  DROP TABLE "pages_blocks_gallery_locales" CASCADE;
  DROP TABLE "pages_blocks_testimonials_items" CASCADE;
  DROP TABLE "pages_blocks_testimonials_items_locales" CASCADE;
  DROP TABLE "pages_blocks_testimonials" CASCADE;
  DROP TABLE "pages_blocks_testimonials_locales" CASCADE;
  DROP TABLE "pages_blocks_faq_items" CASCADE;
  DROP TABLE "pages_blocks_faq_items_locales" CASCADE;
  DROP TABLE "pages_blocks_faq" CASCADE;
  DROP TABLE "pages_blocks_faq_locales" CASCADE;
  DROP TABLE "pages_blocks_inquiry" CASCADE;
  DROP TABLE "pages_blocks_inquiry_locales" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_cta_locales" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_trips" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_trips_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_destinations" CASCADE;
  DROP TABLE "_pages_v_blocks_featured_destinations_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_latest_posts" CASCADE;
  DROP TABLE "_pages_v_blocks_latest_posts_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_items" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_stats" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_images" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_images_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials_items" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials" CASCADE;
  DROP TABLE "_pages_v_blocks_testimonials_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faq" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_inquiry" CASCADE;
  DROP TABLE "_pages_v_blocks_inquiry_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_cta" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_locales" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "header_nav_items" CASCADE;
  DROP TABLE "header_nav_items_locales" CASCADE;
  DROP TABLE "header_actions" CASCADE;
  DROP TABLE "header_actions_locales" CASCADE;
  DROP TABLE "header" CASCADE;
  DROP TABLE "header_locales" CASCADE;
  DROP TABLE "header_rels" CASCADE;
  DROP TABLE "footer_columns_links" CASCADE;
  DROP TABLE "footer_columns_links_locales" CASCADE;
  DROP TABLE "footer_columns" CASCADE;
  DROP TABLE "footer_columns_locales" CASCADE;
  DROP TABLE "footer_legal_links" CASCADE;
  DROP TABLE "footer_legal_links_locales" CASCADE;
  DROP TABLE "footer" CASCADE;
  DROP TABLE "footer_locales" CASCADE;
  DROP TABLE "footer_rels" CASCADE;
  DROP TABLE "settings_socials" CASCADE;
  DROP TABLE "settings" CASCADE;
  DROP TABLE "settings_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_destinations_best_seasons";
  DROP TYPE "public"."enum_destinations_region";
  DROP TYPE "public"."enum_destinations_status";
  DROP TYPE "public"."enum__destinations_v_version_best_seasons";
  DROP TYPE "public"."enum__destinations_v_version_region";
  DROP TYPE "public"."enum__destinations_v_version_status";
  DROP TYPE "public"."enum__destinations_v_published_locale";
  DROP TYPE "public"."enum_trips_best_seasons";
  DROP TYPE "public"."enum_trips_trip_type";
  DROP TYPE "public"."enum_trips_difficulty";
  DROP TYPE "public"."enum_trips_price_currency";
  DROP TYPE "public"."enum_trips_price_unit";
  DROP TYPE "public"."enum_trips_booking_link_link_type";
  DROP TYPE "public"."enum_trips_status";
  DROP TYPE "public"."enum__trips_v_version_best_seasons";
  DROP TYPE "public"."enum__trips_v_version_trip_type";
  DROP TYPE "public"."enum__trips_v_version_difficulty";
  DROP TYPE "public"."enum__trips_v_version_price_currency";
  DROP TYPE "public"."enum__trips_v_version_price_unit";
  DROP TYPE "public"."enum__trips_v_version_booking_link_link_type";
  DROP TYPE "public"."enum__trips_v_version_status";
  DROP TYPE "public"."enum__trips_v_published_locale";
  DROP TYPE "public"."enum_blog_categories";
  DROP TYPE "public"."enum_blog_status";
  DROP TYPE "public"."enum__blog_v_version_categories";
  DROP TYPE "public"."enum__blog_v_version_status";
  DROP TYPE "public"."enum__blog_v_published_locale";
  DROP TYPE "public"."enum_pages_blocks_hero_primary_link_type";
  DROP TYPE "public"."enum_pages_blocks_hero_secondary_link_type";
  DROP TYPE "public"."enum_pages_blocks_hero_height";
  DROP TYPE "public"."enum_pages_blocks_hero_overlay";
  DROP TYPE "public"."enum_pages_blocks_rich_text_width";
  DROP TYPE "public"."enum_pages_blocks_rich_text_align";
  DROP TYPE "public"."enum_pages_blocks_featured_trips_source";
  DROP TYPE "public"."enum_pages_blocks_featured_trips_columns";
  DROP TYPE "public"."enum_pages_blocks_featured_trips_view_all_link_type";
  DROP TYPE "public"."enum_pages_blocks_featured_destinations_source";
  DROP TYPE "public"."enum_pages_blocks_featured_destinations_layout";
  DROP TYPE "public"."enum_pages_blocks_featured_destinations_view_all_link_type";
  DROP TYPE "public"."enum_pages_blocks_latest_posts_view_all_link_type";
  DROP TYPE "public"."enum_pages_blocks_stats_variant";
  DROP TYPE "public"."enum_pages_blocks_gallery_columns";
  DROP TYPE "public"."enum_pages_blocks_gallery_aspect_ratio";
  DROP TYPE "public"."enum_pages_blocks_testimonials_items_rating";
  DROP TYPE "public"."enum_pages_blocks_testimonials_variant";
  DROP TYPE "public"."enum_pages_blocks_inquiry_variant";
  DROP TYPE "public"."enum_pages_blocks_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_cta_variant";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_hero_primary_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_hero_secondary_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_hero_height";
  DROP TYPE "public"."enum__pages_v_blocks_hero_overlay";
  DROP TYPE "public"."enum__pages_v_blocks_rich_text_width";
  DROP TYPE "public"."enum__pages_v_blocks_rich_text_align";
  DROP TYPE "public"."enum__pages_v_blocks_featured_trips_source";
  DROP TYPE "public"."enum__pages_v_blocks_featured_trips_columns";
  DROP TYPE "public"."enum__pages_v_blocks_featured_trips_view_all_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_featured_destinations_source";
  DROP TYPE "public"."enum__pages_v_blocks_featured_destinations_layout";
  DROP TYPE "public"."enum__pages_v_blocks_featured_destinations_view_all_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_latest_posts_view_all_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_stats_variant";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_columns";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_aspect_ratio";
  DROP TYPE "public"."enum__pages_v_blocks_testimonials_items_rating";
  DROP TYPE "public"."enum__pages_v_blocks_testimonials_variant";
  DROP TYPE "public"."enum__pages_v_blocks_inquiry_variant";
  DROP TYPE "public"."enum__pages_v_blocks_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_cta_variant";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum_header_nav_items_link_type";
  DROP TYPE "public"."enum_header_actions_link_type";
  DROP TYPE "public"."enum_footer_columns_links_link_type";
  DROP TYPE "public"."enum_footer_legal_links_link_type";
  DROP TYPE "public"."enum_settings_socials_platform";`)
}
