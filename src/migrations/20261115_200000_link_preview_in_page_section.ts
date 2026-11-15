import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The Link preview card's URL moves into the page section that places it.
 *
 * `20261115_180000_link_preview` put the card's fields in their own panel on the document
 * (`trips.link_preview_url`, `trips_locales.link_preview_title`, and their blog twins), and had an
 * editor pick the card's position with a separate **Link preview** row in Page sections. The row
 * therefore carried nothing but its Section select: on a trip or post the URL was somewhere else on
 * the form, and the row an editor had just added looked empty — or, while it was still set to
 * **Custom HTML**, like a code row.
 *
 * The fields belong to the row. A page section already owns its content (`heading`, `html`) in the
 * localized `pageSections` array, so the card's URL, title, description, rating, review count and
 * prices become ordinary row fields (`src/fields/link-preview.ts`, spread into the row by
 * `src/fields/page-sections.ts`). The admin shows the URL box inside the Link preview row itself,
 * the card is edited in the one place it is placed, and it is versioned and ordered with the rest of
 * the layout exactly like every other section.
 *
 * `pageSections` is localized, so a row's fields are columns on the section table itself
 * (`trips_page_sections`, one row per `_locale`), not in a `…_locales` sibling — the same shape
 * `20261003_081622_localize_arrays` established for `heading` / `html`. Version rows keep their
 * unprefixed column names on `_trips_v_version_page_sections`, as `heading` and `html` do. Nothing
 * else about the array changes; `kind` keeps the same enum values.
 *
 * The old document columns are **copied, then dropped**: values already typed in on live and
 * versioned trips and posts are carried into the matching `linkPreview` row of every locale, so no
 * card disappears on deploy. `down` copies them back and drops the row columns.
 *
 * Re-runnable: the columns use IF (NOT) EXISTS, and the copy runs only while the legacy columns are
 * still there — after the drop there is nothing left to move.
 */

/** The card's fields, in the order they appear in the row. */
const ROW_COLUMNS: { name: string; type: string }[] = [
  { name: 'link_preview_url', type: 'varchar' },
  { name: 'link_preview_title', type: 'varchar' },
  { name: 'link_preview_description', type: 'varchar' },
  { name: 'link_preview_rating', type: 'numeric' },
  { name: 'link_preview_review_count', type: 'numeric' },
  { name: 'link_preview_price', type: 'varchar' },
  { name: 'link_preview_original_price', type: 'varchar' },
]

type CollectionTables = {
  /** The live document table. */
  collection: string
  /** The live localized table: title, description, slug. */
  locales: string
  /** The live page-sections table (localized, one row per `_locale`). */
  sections: string
  /** The versions table. */
  version: string
  /** The versions' localized table. */
  versionLocales: string
  /** The versions' page-sections table. */
  versionSections: string
}

const TRIPS: CollectionTables = {
  collection: 'trips',
  locales: 'trips_locales',
  sections: 'trips_page_sections',
  version: '_trips_v',
  versionLocales: '_trips_v_locales',
  versionSections: '_trips_v_version_page_sections',
}

const BLOG: CollectionTables = {
  collection: 'blog',
  locales: 'blog_locales',
  sections: 'blog_page_sections',
  version: '_blog_v',
  versionLocales: '_blog_v_locales',
  versionSections: '_blog_v_version_page_sections',
}

/**
 * The document-level columns this migration retires, per table — the ones
 * `20261115_180000_link_preview` added. Version tables prefix their own fields with `version_`;
 * nested arrays do not.
 */
const LEGACY_COLUMNS: Record<string, string[]> = {
  trips: [
    'link_preview_url',
    'link_preview_rating',
    'link_preview_review_count',
    'link_preview_price',
    'link_preview_original_price',
  ],
  trips_locales: ['link_preview_title', 'link_preview_description'],
  _trips_v: [
    'version_link_preview_url',
    'version_link_preview_rating',
    'version_link_preview_review_count',
    'version_link_preview_price',
    'version_link_preview_original_price',
  ],
  _trips_v_locales: ['version_link_preview_title', 'version_link_preview_description'],
  blog: [
    'link_preview_url',
    'link_preview_rating',
    'link_preview_review_count',
    'link_preview_price',
    'link_preview_original_price',
  ],
  blog_locales: ['link_preview_title', 'link_preview_description'],
  _blog_v: [
    'version_link_preview_url',
    'version_link_preview_rating',
    'version_link_preview_review_count',
    'version_link_preview_price',
    'version_link_preview_original_price',
  ],
  _blog_v_locales: ['version_link_preview_title', 'version_link_preview_description'],
}

const addRowColumns = () =>
  [TRIPS.sections, TRIPS.versionSections, BLOG.sections, BLOG.versionSections]
    .map((table) =>
      ROW_COLUMNS.map(
        ({ name, type }) => `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${name}" ${type};`,
      ).join('\n  '),
    )
    .join('\n  ')

const dropRowColumns = () =>
  [TRIPS.sections, TRIPS.versionSections, BLOG.sections, BLOG.versionSections]
    .map((table) =>
      ROW_COLUMNS.map(({ name }) => `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${name}";`).join(
        '\n  ',
      ),
    )
    .join('\n  ')

const dropLegacyColumns = () =>
  Object.entries(LEGACY_COLUMNS)
    .flatMap(([table, columns]) =>
      columns.map((column) => `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}";`),
    )
    .join('\n  ')

const addLegacyColumns = () =>
  Object.entries(LEGACY_COLUMNS)
    .flatMap(([table, columns]) =>
      columns.map(
        (column) =>
          `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${
            column.includes('rating') || column.includes('review_count') ? 'numeric' : 'varchar'
          };`,
      ),
    )
    .join('\n  ')

/** True while a table still holds `column` — i.e. the data has not been moved across yet. */
const hasColumn = (table: string, column: string) => `
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = '${table}'
      AND column_name = '${column}'
  ) THEN`

/**
 * Moves one collection's card from the document onto its section rows.
 *
 * The URL, rating, review count and prices were shared across locales, so they go to every locale's
 * row; the title and description were localized, so each row takes its own language's copy. The
 * `kind = 'linkPreview'` filter leaves every other section row untouched, and layouts without the
 * row (an editor removed it, or it never arrived) are simply skipped: the card then shows nothing
 * until the row is added back.
 */
const moveToRows = ({
  collection,
  locales,
  sections,
  version,
  versionLocales,
  versionSections,
}: CollectionTables) => `
    UPDATE "${sections}" AS "row"
    SET "link_preview_url" = "doc"."link_preview_url",
        "link_preview_rating" = "doc"."link_preview_rating",
        "link_preview_review_count" = "doc"."link_preview_review_count",
        "link_preview_price" = "doc"."link_preview_price",
        "link_preview_original_price" = "doc"."link_preview_original_price"
    FROM "${collection}" AS "doc"
    WHERE "row"."_parent_id" = "doc"."id"
      AND "row"."kind" = 'linkPreview';

    UPDATE "${sections}" AS "row"
    SET "link_preview_title" = "locale"."link_preview_title",
        "link_preview_description" = "locale"."link_preview_description"
    FROM "${locales}" AS "locale"
    WHERE "locale"."_parent_id" = "row"."_parent_id"
      AND "locale"."_locale" = "row"."_locale"
      AND "row"."kind" = 'linkPreview';

    UPDATE "${versionSections}" AS "row"
    SET "link_preview_url" = "doc"."version_link_preview_url",
        "link_preview_rating" = "doc"."version_link_preview_rating",
        "link_preview_review_count" = "doc"."version_link_preview_review_count",
        "link_preview_price" = "doc"."version_link_preview_price",
        "link_preview_original_price" = "doc"."version_link_preview_original_price"
    FROM "${version}" AS "doc"
    WHERE "row"."_parent_id" = "doc"."id"
      AND "row"."kind" = 'linkPreview';

    UPDATE "${versionSections}" AS "row"
    SET "link_preview_title" = "locale"."version_link_preview_title",
        "link_preview_description" = "locale"."version_link_preview_description"
    FROM "${versionLocales}" AS "locale"
    WHERE "locale"."_parent_id" = "row"."_parent_id"
      AND "locale"."_locale" = "row"."_locale"
      AND "row"."kind" = 'linkPreview';
  `

/**
 * The inverse: back to one document-level card per trip/post, taken from the document's first
 * `linkPreview` row (`_order`, so it is the one at the top of that layout).
 */
const moveToDocuments = ({
  collection,
  locales,
  sections,
  version,
  versionLocales,
  versionSections,
}: CollectionTables) => `
    UPDATE "${collection}" AS "doc"
    SET "link_preview_url" = "row"."link_preview_url",
        "link_preview_rating" = "row"."link_preview_rating",
        "link_preview_review_count" = "row"."link_preview_review_count",
        "link_preview_price" = "row"."link_preview_price",
        "link_preview_original_price" = "row"."link_preview_original_price"
    FROM (
      SELECT DISTINCT ON ("_parent_id") *
      FROM "${sections}"
      WHERE "kind" = 'linkPreview'
      ORDER BY "_parent_id", "_order"
    ) AS "row"
    WHERE "row"."_parent_id" = "doc"."id";

    UPDATE "${locales}" AS "locale"
    SET "link_preview_title" = "row"."link_preview_title",
        "link_preview_description" = "row"."link_preview_description"
    FROM "${sections}" AS "row"
    WHERE "row"."_parent_id" = "locale"."_parent_id"
      AND "row"."_locale" = "locale"."_locale"
      AND "row"."kind" = 'linkPreview';

    UPDATE "${version}" AS "doc"
    SET "version_link_preview_url" = "row"."link_preview_url",
        "version_link_preview_rating" = "row"."link_preview_rating",
        "version_link_preview_review_count" = "row"."link_preview_review_count",
        "version_link_preview_price" = "row"."link_preview_price",
        "version_link_preview_original_price" = "row"."link_preview_original_price"
    FROM (
      SELECT DISTINCT ON ("_parent_id") *
      FROM "${versionSections}"
      WHERE "kind" = 'linkPreview'
      ORDER BY "_parent_id", "_order"
    ) AS "row"
    WHERE "row"."_parent_id" = "doc"."id";

    UPDATE "${versionLocales}" AS "locale"
    SET "version_link_preview_title" = "row"."link_preview_title",
        "version_link_preview_description" = "row"."link_preview_description"
    FROM "${versionSections}" AS "row"
    WHERE "row"."_parent_id" = "locale"."_parent_id"
      AND "row"."_locale" = "locale"."_locale"
      AND "row"."kind" = 'linkPreview';
  `

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(addRowColumns()))

  await db.execute(
    sql.raw(`
  DO $$
  BEGIN${hasColumn('trips', 'link_preview_url')}
${moveToRows(TRIPS)}
  END IF;${hasColumn('blog', 'link_preview_url')}
${moveToRows(BLOG)}
  END IF;

  -- The document columns have done their job: the row owns the card from here on.
  ${dropLegacyColumns()}
  END $$;
  `),
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(addLegacyColumns()))

  await db.execute(
    sql.raw(`
  DO $$
  BEGIN
${moveToDocuments(TRIPS)}
${moveToDocuments(BLOG)}
  END $$;
  `),
  )

  await db.execute(sql.raw(dropRowColumns()))
}
