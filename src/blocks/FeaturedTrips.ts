import type { Block } from 'payload'

import { linkField } from '../fields/link'

export const FeaturedTrips: Block = {
  slug: 'featuredTrips',
  interfaceName: 'FeaturedTripsBlock',
  labels: { singular: 'Featured trips', plural: 'Featured trips' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'source',
      type: 'radio',
      defaultValue: 'featured',
      options: [
        { label: 'Show featured trips automatically', value: 'featured' },
        { label: 'Pick specific trips', value: 'manual' },
      ],
      admin: { layout: 'vertical' },
    },
    {
      name: 'trips',
      type: 'relationship',
      relationTo: 'trips',
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
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 columns', value: '2' },
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
      ],
      admin: { position: 'sidebar' },
    },
    linkField({ name: 'viewAllLink', label: '"View all" link' }),
  ],
}
