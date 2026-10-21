import type { Block } from 'payload'

import { linkField } from '../fields/link'

export const LatestPosts: Block = {
  slug: 'latestPosts',
  interfaceName: 'LatestPostsBlock',
  labels: { singular: 'Latest posts', plural: 'Latest posts' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: {
        position: 'sidebar',
        // The homepage ignores this: its journal board is always one lead plate plus
        // three index rows (see src/components/sections/latest-blogs-limits.ts).
        description:
          'Posts shown by this block on regular pages. The homepage journal is fixed at one lead story plus three index rows.',
      },
    },
    linkField({ name: 'viewAllLink', label: '"View all" link' }),
  ],
}
