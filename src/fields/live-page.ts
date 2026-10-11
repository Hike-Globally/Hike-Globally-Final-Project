import type { UIField } from 'payload'

/**
 * A list-view column that links each row to its page on the live site.
 *
 * A `ui` field is Payload's presentational field type: it stores nothing, needs no migration, and
 * exists purely to give a component somewhere to render. Here it has only a `Cell`, which means it
 * shows up as a column in the list table and takes up no room in the edit form at all — so the
 * affordance lands exactly where it is wanted (next to each row) without adding anything to the
 * editor that already has its own "View live" control.
 *
 * Add `livePage` to the collection's `admin.defaultColumns` so the column is on by default. Users
 * who have already saved their own column preferences keep them, so
 * `src/migrations/…_live_page_column_preferences.ts` appends the column to those too.
 *
 * A `ui` field is also the only supported way to get content into a list row — Payload's table has
 * no per-row action slot.
 */
export const livePageField = (): UIField => ({
  name: 'livePage',
  type: 'ui',
  label: 'Live page',
  admin: {
    components: {
      Cell: '@/components/admin/live-page-cell',
    },
  },
})
