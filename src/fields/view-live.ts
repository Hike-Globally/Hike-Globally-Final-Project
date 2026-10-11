import type { UIField } from 'payload'

/**
 * A virtual list-view column ("Live page") with a link that opens the public page in a new tab.
 * It stores nothing and renders nothing in the edit form (the editor has its own "View live page"
 * button next to the document controls).
 */
export const viewLiveField = (): UIField => ({
  name: 'viewLive',
  type: 'ui',
  label: 'Live page',
  admin: {
    components: {
      Cell: '@/components/admin/view-live-cell',
    },
    disableBulkEdit: true,
  },
})
