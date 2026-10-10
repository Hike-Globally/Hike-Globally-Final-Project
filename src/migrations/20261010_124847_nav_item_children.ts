import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_header_nav_items_children_link_type" AS ENUM('reference', 'custom');
  CREATE TABLE "header_nav_items_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_label" varchar,
  	"link_type" "enum_header_nav_items_children_link_type" DEFAULT 'reference',
  	"link_url" varchar
  );
  
  ALTER TABLE "pages_blocks_featured_destinations" ALTER COLUMN "limit" SET DEFAULT 6;
  ALTER TABLE "_pages_v_blocks_featured_destinations" ALTER COLUMN "limit" SET DEFAULT 6;
  ALTER TABLE "header_nav_items_children" ADD CONSTRAINT "header_nav_items_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "header_nav_items_children_order_idx" ON "header_nav_items_children" USING btree ("_order");
  CREATE INDEX "header_nav_items_children_parent_id_idx" ON "header_nav_items_children" USING btree ("_parent_id");
  CREATE INDEX "header_nav_items_children_locale_idx" ON "header_nav_items_children" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "header_nav_items_children" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "header_nav_items_children" CASCADE;
  ALTER TABLE "pages_blocks_featured_destinations" ALTER COLUMN "limit" SET DEFAULT 3;
  ALTER TABLE "_pages_v_blocks_featured_destinations" ALTER COLUMN "limit" SET DEFAULT 3;
  DROP TYPE "public"."enum_header_nav_items_children_link_type";`)
}
