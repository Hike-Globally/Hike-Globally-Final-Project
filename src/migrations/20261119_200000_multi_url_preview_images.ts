import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const relations = [
  {
    table: 'trips_page_sections_multi_links',
    index: 'trips_page_sections_multi_links_link_preview_image_idx',
    fk: 'trips_multi_links_image_media_fk',
  },
  {
    table: '_trips_page_sections_multi_links_v',
    index: '_trips_page_sections_multi_links_v_link_preview_image_idx',
    fk: '_trips_multi_links_v_image_media_fk',
  },
  {
    table: 'blog_page_sections_multi_links',
    index: 'blog_page_sections_multi_links_link_preview_image_idx',
    fk: 'blog_multi_links_image_media_fk',
  },
  {
    table: '_blog_page_sections_multi_links_v',
    index: '_blog_page_sections_multi_links_v_link_preview_image_idx',
    fk: '_blog_multi_links_v_image_media_fk',
  },
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "trips_page_sections_multi_links" ADD COLUMN "link_preview_image_id" integer;
    ALTER TABLE "trips_page_sections_multi_links" ADD COLUMN "link_preview_image_url" varchar;
    ALTER TABLE "_trips_page_sections_multi_links_v" ADD COLUMN "link_preview_image_id" integer;
    ALTER TABLE "_trips_page_sections_multi_links_v" ADD COLUMN "link_preview_image_url" varchar;
    ALTER TABLE "blog_page_sections_multi_links" ADD COLUMN "link_preview_image_id" integer;
    ALTER TABLE "blog_page_sections_multi_links" ADD COLUMN "link_preview_image_url" varchar;
    ALTER TABLE "_blog_page_sections_multi_links_v" ADD COLUMN "link_preview_image_id" integer;
    ALTER TABLE "_blog_page_sections_multi_links_v" ADD COLUMN "link_preview_image_url" varchar;

    CREATE INDEX "trips_page_sections_multi_links_link_preview_image_idx" ON "trips_page_sections_multi_links" USING btree ("link_preview_image_id");
    CREATE INDEX "_trips_page_sections_multi_links_v_link_preview_image_idx" ON "_trips_page_sections_multi_links_v" USING btree ("link_preview_image_id");
    CREATE INDEX "blog_page_sections_multi_links_link_preview_image_idx" ON "blog_page_sections_multi_links" USING btree ("link_preview_image_id");
    CREATE INDEX "_blog_page_sections_multi_links_v_link_preview_image_idx" ON "_blog_page_sections_multi_links_v" USING btree ("link_preview_image_id");

    ALTER TABLE "trips_page_sections_multi_links" ADD CONSTRAINT "trips_multi_links_image_media_fk" FOREIGN KEY ("link_preview_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_trips_page_sections_multi_links_v" ADD CONSTRAINT "_trips_multi_links_v_image_media_fk" FOREIGN KEY ("link_preview_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "blog_page_sections_multi_links" ADD CONSTRAINT "blog_multi_links_image_media_fk" FOREIGN KEY ("link_preview_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_blog_page_sections_multi_links_v" ADD CONSTRAINT "_blog_multi_links_v_image_media_fk" FOREIGN KEY ("link_preview_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const { table, index, fk } of relations) {
    await db.execute(sql.raw(`ALTER TABLE "${table}" DROP CONSTRAINT "${fk}"`))
    await db.execute(sql.raw(`DROP INDEX "${index}"`))
    await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN "link_preview_image_id"`))
    await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN "link_preview_image_url"`))
  }
}
