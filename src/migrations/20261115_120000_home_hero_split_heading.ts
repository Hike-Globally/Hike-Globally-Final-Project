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
 */

const NEW_HEADING = 'Discover Global <i>Adventures with Hike Globally</i>'

/** The wordings this migration is allowed to replace. */
const OLD_HEADINGS = [
  'Discover Global Adventures with Hike Globally',
  'Discover Global <br>Adventures with Hike Globally',
  'Discover Global<br>Adventures with Hike Globally',
]

/**
 * `EXISTS` rather than a join to `pages_locales`: it cannot match a hero block twice, and it states
 * the intent — "this block belongs to the home page" — in one clause. The parent ids line up
 * without a cast (`pages_blocks_hero.id` / `pages_blocks_hero_locales._parent_id` are both varchar,
 * the versioned pair both integer), and keeping the localisation tables out of the UPDATE's FROM
 * list is what keeps the statement a single, obvious rewrite.
 */
const IS_HOME_HERO = sql.raw(`
  EXISTS (
    SELECT 1
    FROM "pages_blocks_hero" AS "hero"
    JOIN "pages" AS "page" ON "page"."id" = "hero"."_parent_id"
    JOIN "pages_locales" AS "page_locale" ON "page_locale"."_parent_id" = "page"."id"
    WHERE "hero"."id" = "locales"."_parent_id" AND "page_locale"."slug" = 'home'
  )
`)

const IS_VERSIONED_HOME_HERO = sql.raw(`
  EXISTS (
    SELECT 1
    FROM "_pages_v_blocks_hero" AS "hero"
    JOIN "_pages_v" AS "version" ON "version"."id" = "hero"."_parent_id"
    JOIN "pages" AS "page" ON "page"."id" = "version"."parent_id"
    JOIN "pages_locales" AS "page_locale" ON "page_locale"."_parent_id" = "page"."id"
    WHERE "hero"."id" = "locales"."_parent_id" AND "page_locale"."slug" = 'home'
  )
`)

const oldHeadings = () =>
  sql.join(
    OLD_HEADINGS.map((heading) => sql`${heading}`),
    sql`, `,
  )

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "pages_blocks_hero_locales" AS "locales"
    SET "heading" = ${NEW_HEADING}
    WHERE ${IS_HOME_HERO}
      AND "locales"."heading" IN (${oldHeadings()});
  `)

  await db.execute(sql`
    UPDATE "_pages_v_blocks_hero_locales" AS "locales"
    SET "heading" = ${NEW_HEADING}
    WHERE ${IS_VERSIONED_HOME_HERO}
      AND "locales"."heading" IN (${oldHeadings()});
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  /* The plain wording, not the `<br>` variant: collapsing the two lines back into one line is the
     state this migration started from on the deployments that matter. */
  const previous = OLD_HEADINGS[0]!

  await db.execute(sql`
    UPDATE "pages_blocks_hero_locales" AS "locales"
    SET "heading" = ${previous}
    WHERE ${IS_HOME_HERO}
      AND "locales"."heading" = ${NEW_HEADING};
  `)

  await db.execute(sql`
    UPDATE "_pages_v_blocks_hero_locales" AS "locales"
    SET "heading" = ${previous}
    WHERE ${IS_VERSIONED_HOME_HERO}
      AND "locales"."heading" = ${NEW_HEADING};
  `)
}
