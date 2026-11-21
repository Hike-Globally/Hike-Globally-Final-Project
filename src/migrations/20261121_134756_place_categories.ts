import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Browse Places categories for trips and posts.
 *
 * `payload migrate:create place_categories` generated the four enum types,
 * four has-many select tables, foreign keys and indexes. It also noticed older
 * snapshot drift around page-section enum order and a renamed image constraint;
 * those statements were intentionally trimmed here because they belong to
 * earlier migrations and are not part of this feature.
 *
 * The checked-in JSON snapshot is the generated one, so the next
 * `migrate:create` diffs against the schema this migration actually creates.
 * Statements are re-runnable for the safety net in `src/lib/migration-guard.ts`.
 */

const CATEGORY_VALUES =
  "'lakes', 'waterfalls', 'mountain-passes', 'canyons', 'base-camps', 'caves', 'bike-tours', 'mountain-peaks', 'temples'"

const TABLES = [
  {
    table: 'trips_place_categories',
    enumType: 'enum_trips_place_categories',
    parentTable: 'trips',
    constraint: 'trips_place_categories_parent_fk',
  },
  {
    table: '_trips_v_version_place_categories',
    enumType: 'enum__trips_v_version_place_categories',
    parentTable: '_trips_v',
    constraint: '_trips_v_version_place_categories_parent_fk',
  },
  {
    table: 'blog_place_categories',
    enumType: 'enum_blog_place_categories',
    parentTable: 'blog',
    constraint: 'blog_place_categories_parent_fk',
  },
  {
    table: '_blog_v_version_place_categories',
    enumType: 'enum__blog_v_version_place_categories',
    parentTable: '_blog_v',
    constraint: '_blog_v_version_place_categories_parent_fk',
  },
] as const

const createTypes = () =>
  TABLES.map(
    ({ enumType }) => `DO $$ BEGIN
      CREATE TYPE "public"."${enumType}" AS ENUM(${CATEGORY_VALUES});
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  ).join('\n')

const createTables = () =>
  TABLES.map(
    ({ table, enumType }) => `CREATE TABLE IF NOT EXISTS "${table}" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "public"."${enumType}",
      "id" serial PRIMARY KEY NOT NULL
    );`,
  ).join('\n')

const createForeignKeys = () =>
  TABLES.map(
    ({ table, parentTable, constraint }) => `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}";
    ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" FOREIGN KEY ("parent_id") REFERENCES "public"."${parentTable}"("id") ON DELETE cascade ON UPDATE no action;`,
  ).join('\n')

const createIndexes = () =>
  TABLES.flatMap(({ table }) => [
    `CREATE INDEX IF NOT EXISTS "${table}_order_idx" ON "${table}" USING btree ("order");`,
    `CREATE INDEX IF NOT EXISTS "${table}_parent_idx" ON "${table}" USING btree ("parent_id");`,
  ]).join('\n')

const dropTables = () =>
  TABLES.map(
    ({ table }) => `ALTER TABLE IF EXISTS "${table}" DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS "${table}" CASCADE;`,
  ).join('\n')

const dropTypes = () =>
  TABLES.map(({ enumType }) => `DROP TYPE IF EXISTS "public"."${enumType}";`).join('\n')

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(createTypes()))
  await db.execute(sql.raw(`${createTables()}\n${createForeignKeys()}\n${createIndexes()}`))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(`${dropTables()}\n${dropTypes()}`))
}
