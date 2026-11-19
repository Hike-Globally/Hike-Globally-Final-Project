import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * **Keyword For Internal Linking** — the editorial allow-list behind automated internal linking
 * (see `src/fields/internal-link-keywords.ts` and `src/lib/internal-links.ts`).
 *
 * What changes:
 *
 *   - Destinations and Pages gain the panel, so they need the shared hasMany-string table the
 *     other two collections already have: `destinations_texts` / `_destinations_v_texts` and
 *     `pages_texts` / `_pages_v_texts`. Trips and Blog need **no DDL**: a localized `text` field
 *     with `hasMany: true` is not a column, it is a row in the existing `trips_texts` /
 *     `blog_texts` table whose `path` says which field it belongs to. A second hasMany field on the
 *     same collection is therefore just a second `path` value.
 *
 *   - Every trip and post that already has SEO **Keywords** gets those values copied into
 *     `internalLinkKeywords`. The new panel is the *only* phrase source — the title, the slug and
 *     the SEO keywords are no longer inferred into anchors — so without this backfill every
 *     existing trip/post auto-link would disappear on deploy. An editor can prune the copied list
 *     afterwards, and clearing it is the documented way to opt a page out.
 *
 *     Destinations and Pages never had a keyword list to copy, so their panel starts empty: an
 *     editor sets the anchors there. That is the intended behaviour of an exclusive list, not an
 *     oversight.
 *
 * The copy is guarded per document/locale, so a half-applied run can be run again without
 * duplicating rows, and a list an editor has already curated is never overwritten.
 */

const TEXTS_TABLES = [
  {
    table: 'destinations_texts',
    parent: 'destinations',
    orderIndex: 'destinations_texts_order_parent',
    localeIndex: 'destinations_texts_locale_parent',
    foreignKey: 'destinations_texts_parent_fk',
  },
  {
    table: '_destinations_v_texts',
    parent: '_destinations_v',
    orderIndex: '_destinations_v_texts_order_parent',
    localeIndex: '_destinations_v_texts_locale_parent',
    foreignKey: '_destinations_v_texts_parent_fk',
  },
  {
    table: 'pages_texts',
    parent: 'pages',
    orderIndex: 'pages_texts_order_parent',
    localeIndex: 'pages_texts_locale_parent',
    foreignKey: 'pages_texts_parent_fk',
  },
  {
    table: '_pages_v_texts',
    parent: '_pages_v',
    orderIndex: '_pages_v_texts_order_parent',
    localeIndex: '_pages_v_texts_locale_parent',
    foreignKey: '_pages_v_texts_parent_fk',
  },
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const { table, parent, orderIndex, localeIndex, foreignKey } of TEXTS_TABLES) {
    await db.execute(
      sql.raw(`
  CREATE TABLE IF NOT EXISTS "${table}" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "text" varchar,
    "locale" "_locales",
    CONSTRAINT "${foreignKey}" FOREIGN KEY ("parent_id") REFERENCES "public"."${parent}"("id") ON DELETE cascade ON UPDATE no action
  );

  CREATE INDEX IF NOT EXISTS "${orderIndex}" ON "${table}" USING btree ("order","parent_id");
  CREATE INDEX IF NOT EXISTS "${localeIndex}" ON "${table}" USING btree ("locale","parent_id");`),
    )
  }

  // Copy each existing SEO keyword list into the new panel, for the live document and every saved
  // draft. `NOT EXISTS` keeps the statement re-runnable and leaves a list an editor already filled
  // in untouched.
  for (const table of ['trips_texts', '_trips_v_texts', 'blog_texts', '_blog_v_texts'] as const) {
    await db.execute(
      sql.raw(`
  INSERT INTO "${table}" ("order", "parent_id", "path", "text", "locale")
  SELECT source."order", source."parent_id", 'internalLinkKeywords', source."text", source."locale"
  FROM "${table}" AS source
  WHERE source."path" = 'keywords'
    AND NOT EXISTS (
      SELECT 1 FROM "${table}" AS existing
      WHERE existing."parent_id" = source."parent_id"
        AND existing."path" = 'internalLinkKeywords'
        AND existing."locale" IS NOT DISTINCT FROM source."locale"
    );`),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of ['trips_texts', '_trips_v_texts', 'blog_texts', '_blog_v_texts'] as const) {
    await db.execute(sql.raw(`DELETE FROM "${table}" WHERE "path" = 'internalLinkKeywords';`))
  }

  for (const { table, orderIndex, localeIndex } of TEXTS_TABLES) {
    await db.execute(
      sql.raw(`
  DROP INDEX IF EXISTS "${orderIndex}";
  DROP INDEX IF EXISTS "${localeIndex}";
  DROP TABLE IF EXISTS "${table}";`),
    )
  }
}
