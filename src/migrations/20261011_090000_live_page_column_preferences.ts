import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Turns on the new "Live page" column for everyone who already has list preferences.
 *
 * The column is backed by a `ui` field, which stores nothing, so there is no schema to change —
 * the migration exists purely because of how list preferences work. Payload saves the visible
 * columns per user, the first time that user sorts, searches or pages a list. A column added later
 * to `admin.defaultColumns` is therefore only picked up by people who have never touched the list;
 * everyone else keeps the columns they saved and never sees the new one.
 *
 * So: append the column to the preferences that already exist and leave everything else in them
 * exactly as it was. Nothing is removed or reordered, and a preference with no saved columns at
 * all is left alone (Payload falls back to `defaultColumns` for those, which already includes the
 * new column). Users can still hide or drag the column afterwards, like any other.
 *
 * Writes go through `payload.db` rather than `payload.update` on purpose: the preferences
 * collection has a required `user` relationship, and updating through the Local API would mean
 * re-submitting it — and re-validating a document this migration has no business rewriting.
 */

/** The `livePage` column, in the shape Payload's column preferences use. */
const LIVE_PAGE_COLUMN = { accessor: 'livePage', active: true }

/** List-view preferences are stored under `collection-<slug>`. */
const PREFERENCE_KEYS = ['trips', 'blog', 'pages', 'destinations'].map(
  (slug) => `collection-${slug}`,
)

type ColumnPreference = { accessor?: unknown }
type ListPreferenceValue = { columns?: unknown } | null | undefined

/** The saved column list, or null when this preference has none. */
const readColumns = (value: ListPreferenceValue): ColumnPreference[] | null => {
  const columns = value?.columns
  if (!Array.isArray(columns)) return null

  return columns.filter(
    (column): column is ColumnPreference =>
      typeof column === 'object' && column !== null && !Array.isArray(column),
  )
}

const hasLivePageColumn = (columns: ColumnPreference[]): boolean =>
  columns.some((column) => column.accessor === LIVE_PAGE_COLUMN.accessor)

const findListPreferences = (payload: MigrateUpArgs['payload'] | MigrateDownArgs['payload']) =>
  payload.find({
    collection: 'payload-preferences',
    depth: 0,
    // `limit: 0` with `pagination: false` is how the Local API asks for every row.
    limit: 0,
    overrideAccess: true,
    pagination: false,
    where: { key: { in: PREFERENCE_KEYS } },
  })

/** Add the column to every list preference that already pins its own set of columns. */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  for (const preference of (await findListPreferences(payload)).docs) {
    const value = preference.value as ListPreferenceValue
    const columns = readColumns(value)
    if (!columns || hasLivePageColumn(columns)) continue

    await payload.db.updateOne({
      id: preference.id,
      collection: 'payload-preferences',
      data: { value: { ...(value ?? {}), columns: [...columns, LIVE_PAGE_COLUMN] } },
      returning: false,
    })
  }
}

/** Remove it again — the column can be re-enabled from the list's column picker. */
export async function down({ payload }: MigrateDownArgs): Promise<void> {
  for (const preference of (await findListPreferences(payload)).docs) {
    const value = preference.value as ListPreferenceValue
    const columns = readColumns(value)
    if (!columns || !hasLivePageColumn(columns)) continue

    await payload.db.updateOne({
      id: preference.id,
      collection: 'payload-preferences',
      data: {
        value: {
          ...(value ?? {}),
          columns: columns.filter((column) => column.accessor !== LIVE_PAGE_COLUMN.accessor),
        },
      },
      returning: false,
    })
  }
}
