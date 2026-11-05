import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Every hero is a full-screen band.
 *
 * The hero block's editor-side `height` select (Full screen / Tall / Compact) is gone: the
 * site's heroes all render at exactly one viewport tall (`--hero-min-height` in
 * `src/app/(frontend)/globals.css`), so the field no longer has anything to control. Dropping
 * the column — and its two enums — matches `src/blocks/Hero.ts`.
 *
 * Existing content is untouched apart from that column; the down migration restores the
 * column with its previous `tall` default, so a rollback is lossless in structure.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" DROP COLUMN "height";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "height";
  DROP TYPE "public"."enum_pages_blocks_hero_height";
  DROP TYPE "public"."enum__pages_v_blocks_hero_height";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_height" AS ENUM('full', 'tall', 'compact');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_height" AS ENUM('full', 'tall', 'compact');
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "height" "enum_pages_blocks_hero_height" DEFAULT 'tall';
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "height" "enum__pages_v_blocks_hero_height" DEFAULT 'tall';`)
}
