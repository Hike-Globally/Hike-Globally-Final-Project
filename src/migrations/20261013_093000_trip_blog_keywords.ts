import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the SEO **Keywords** section to Trips and Blog (see `src/fields/keywords.ts`).
 *
 * A localized `text` field with `hasMany: true` is not a column in Postgres: Payload stores every
 * hasMany string of a collection in one shared `<table>_texts` table (`path` says which field a row
 * belongs to, `order` keeps the sequence, `locale` keeps it per language). Four tables appear
 * because both collections keep drafts, so each needs its versioned twin:
 *
 *   trips_texts / _trips_v_texts · blog_texts / _blog_v_texts
 *
 * The statements below are exactly what `payload migrate:create` produced for this config change —
 * nothing else in the schema moved, so no unrelated diff was trimmed out.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "trips_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );

  CREATE TABLE "_trips_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );

  CREATE TABLE "blog_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );

  CREATE TABLE "_blog_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );

  ALTER TABLE "trips_texts" ADD CONSTRAINT "trips_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trips_v_texts" ADD CONSTRAINT "_trips_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_trips_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_texts" ADD CONSTRAINT "blog_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_v_texts" ADD CONSTRAINT "_blog_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_blog_v"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "trips_texts_order_parent" ON "trips_texts" USING btree ("order","parent_id");
  CREATE INDEX "trips_texts_locale_parent" ON "trips_texts" USING btree ("locale","parent_id");
  CREATE INDEX "_trips_v_texts_order_parent" ON "_trips_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_trips_v_texts_locale_parent" ON "_trips_v_texts" USING btree ("locale","parent_id");
  CREATE INDEX "blog_texts_order_parent" ON "blog_texts" USING btree ("order","parent_id");
  CREATE INDEX "blog_texts_locale_parent" ON "blog_texts" USING btree ("locale","parent_id");
  CREATE INDEX "_blog_v_texts_order_parent" ON "_blog_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_blog_v_texts_locale_parent" ON "_blog_v_texts" USING btree ("locale","parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "_blog_v_texts_locale_parent";
  DROP INDEX IF EXISTS "_blog_v_texts_order_parent";
  DROP INDEX IF EXISTS "blog_texts_locale_parent";
  DROP INDEX IF EXISTS "blog_texts_order_parent";
  DROP INDEX IF EXISTS "_trips_v_texts_locale_parent";
  DROP INDEX IF EXISTS "_trips_v_texts_order_parent";
  DROP INDEX IF EXISTS "trips_texts_locale_parent";
  DROP INDEX IF EXISTS "trips_texts_order_parent";
  DROP TABLE IF EXISTS "_blog_v_texts";
  DROP TABLE IF EXISTS "blog_texts";
  DROP TABLE IF EXISTS "_trips_v_texts";
  DROP TABLE IF EXISTS "trips_texts";`)
}
