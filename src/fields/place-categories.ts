import type { Field } from 'payload'

import { placeCategoryOptions } from '../lib/place-categories'

/**
 * One reusable Payload admin section for trips and posts.
 *
 * `hasMany: true` gives editors the multi-select dropdown; the collapsible keeps
 * the long single-document forms readable. It is deliberately not a localized
 * field: the categories are a frontend taxonomy, while Payload stays single-locale.
 */
export const placeCategoriesField = (): Field => ({
  type: 'collapsible',
  label: 'Browse Places',
  admin: {
    initCollapsed: true,
    description:
      'Tag this content with the landscapes used by the homepage Browse Places carousel and the dedicated /places pages.',
  },
  fields: [
    {
      name: 'placeCategories',
      type: 'select',
      label: 'Browse Places categories',
      hasMany: true,
      options: placeCategoryOptions,
      admin: {
        isClearable: true,
        description:
          'Choose one or more categories. Tagged trips and articles appear on the matching place pages; leave empty to exclude this document.',
      },
    },
  ],
})
