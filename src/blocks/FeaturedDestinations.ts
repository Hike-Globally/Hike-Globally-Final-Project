import type { Block } from 'payload'

import { linkField } from '../fields/link'

export const FeaturedDestinations: Block = {
  slug: 'featuredDestinations',
  interfaceName: 'FeaturedDestinationsBlock',
  labels: { singular: 'Featured destinations', plural: 'Featured destinations' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'source',
      type: 'radio',
      defaultValue: 'featured',
      options: [
        { label: 'Show featured destinations automatically', value: 'featured' },
        { label: 'Pick specific destinations', value: 'manual' },
      ],
      admin: { layout: 'vertical' },
    },
    {
      name: 'destinations',
      type: 'relationship',
      relationTo: 'destinations',
      hasMany: true,
      maxDepth: 1,
      admin: {
        condition: (_data, siblings) => (siblings as { source?: string })?.source === 'manual',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: {
        position: 'sidebar',
        condition: (_data, siblings) => (siblings as { source?: string })?.source === 'featured',
      },
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Editorial (large + small)', value: 'editorial' },
      ],
      admin: { position: 'sidebar' },
    },
    linkField({ name: 'viewAllLink', label: '"View all" link' }),
  ],
}
