import type { Block } from 'payload'

export const Stats: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  labels: { singular: 'Stats / trust bar', plural: 'Stats / trust bars' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      labels: { singular: 'Stat', plural: 'Stats' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'value', type: 'text', required: true, admin: { width: '35%', description: 'e.g. 18, 4.9, 12k+' } },
            { name: 'label', type: 'text', required: true, admin: { width: '65%' } },
          ],
        },
        { name: 'description', type: 'text' },
      ],
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'light',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
