import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The homepage hero heading becomes two lines, set in two faces.
 *
 * The heading is a single `text` field; the second line is marked with `<i>…</i>`, which
 * `src/lib/inline-emphasis.ts` turns into its own block-level line. The homepage is the one hero
 * whose *first* line is not the display serif: `Hero` adds `hero-title--cal` there, so line one is
 * Cal Sans and the `<i>` line is Instrument Serif italic (see `src/app/(frontend)/globals.css`).
 *
 *     Discover Global                       ← Cal Sans
 *     Adventures with Hike Globally         ← Instrument Serif italic
 *
 * The seed only writes the homepage when it does not exist yet, so a deployment that has already
 * been seeded keeps whatever string was stored then. This migration rewrites that stored copy.
 * It is deliberately narrow:
 *
 *   · only the hero blocks of the page whose slug is `home`,
 *   · only a heading that still holds one of the shipped wordings (with or without the literal
 *     `<br>` an editor may have typed) — an editor's own rewrite is left alone,
 *   · both the published rows and the draft/version rows, so the admin and the live page agree.
 *
 * Re-runnable by construction: after the first run the heading no longer matches the guard.
 *
 * ---------------------------------------------------------------------------
 * Where the heading actually lives
 * ---------------------------------------------------------------------------
 * A block whose own fields are localised keeps them **on the block table**, one row per `_locale`
 * — there is no `pages_blocks_hero_locales` / `_pages_v_blocks_hero_locales` sibling. Those two
 * tables existed only in the first cut of the schema and were dropped by
 * `20261003_084733_localize_blocks`, which folded the columns back into `pages_blocks_hero` and
 * `_pages_v_blocks_hero` (see the `_locale` + `heading` columns in
 * `20261115_180000_link_preview.json`). This migration shipped addressing the dropped tables and
 * failed production builds with `relation "pages_blocks_hero_locales" does not exist`, so the
 * statements below target the block tables directly — the same rows Payload reads and writes.
 */

const NEW_HEADING = 'Discover Global <i>Adventures with Hike Globally</i>'

/** The wordings this migration is allowed to replace. */
const OLD_HEADINGS = [
  'Discover Global Adventures with Hike Globally',
  'Discover Global <br>Adventures with Hike Globally',
  'Discover Global<br>Adventures with Hike Globally',
]

/**
 * `EXISTS` rather than a join to `pages_locales` in the UPDATE's FROM list: it cannot match a hero
 * block twice — a duplicate `pages_locales` row would otherwise make `SET` pick an arbitrary one —
 * and it states the intent of the statement in one clause: "this block belongs to the home page".
 * `pages_blocks_hero._parent_id` is an integer FK to `pages.id`, so the correlation needs no cast.
 */
const IS_HOME_HERO = sql.raw(`
  EXISTS (
    SELECT 1
    FROM "pages_locales" AS "page_locale"
    WHERE "page_locale"."_parent_id" = "hero"."_parent_id"
      AND "page_locale"."slug" = 'home'
  )
`)

/**
 * Drafts are version rows: `_pages_v_blocks_hero._parent_id` points at a `_pages_v` row, and the
 * page it belongs to comes from `_pages_v.parent_id`. The version tables do not carry `slug`
 * themselves, so the home-page test has to go through `pages_locales` as well.
 */
const IS_VERSIONED_HOME_HERO = sql.raw(`
  EXISTS (
    SELECT 1
    FROM "_pages_v" AS "version"
    JOIN "pages_locales" AS "page_locale" ON "page_locale"."_parent_id" = "version"."parent_id"
    WHERE "version"."id" = "hero"."_parent_id"
      AND "page_locale"."slug" = 'home'
  )
`)

const oldHeadings = () =>
  sql.join(
    OLD_HEADINGS.map((heading) => sql`${heading}`),
    sql`, `,
  )

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "pages_blocks_hero" AS "hero"
    SET "heading" = ${NEW_HEADING}
    WHERE ${IS_HOME_HERO}
      AND "hero"."heading" IN (${oldHeadings()});
  `)

  await db.execute(sql`
    UPDATE "_pages_v_blocks_hero" AS "hero"
    SET "heading" = ${NEW_HEADING}
    WHERE ${IS_VERSIONED_HOME_HERO}
      AND "hero"."heading" IN (${oldHeadings()});
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  /* The plain wording, not the `<br>` variant: collapsing the two lines back into one line is the
     state this migration started from on the deployments that matter. */
  const previous = OLD_HEADINGS[0]!

  await db.execute(sql`
    UPDATE "pages_blocks_hero" AS "hero"
    SET "heading" = ${previous}
    WHERE ${IS_HOME_HERO}
      AND "hero"."heading" = ${NEW_HEADING};
  `)

  await db.execute(sql`
    UPDATE "_pages_v_blocks_hero" AS "hero"
    SET "heading" = ${previous}
    WHERE ${IS_VERSIONED_HOME_HERO}
      AND "hero"."heading" = ${NEW_HEADING};
  `)
}
