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
      admin: { position: 'sidebar' },
    },
    linkField({ name: 'viewAllLink', label: '"View all" link' }),
  ],
}
