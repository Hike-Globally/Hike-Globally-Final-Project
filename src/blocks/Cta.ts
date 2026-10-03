import type { Block } from 'payload'

import { linkField } from '../fields/link'

export const Cta: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  labels: { singular: 'Call to action', plural: 'Calls to action' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    linkField({ name: 'link', label: 'Button', newTab: false }),
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'dark',
      options: [
        { label: 'Dark', value: 'dark' },
        { label: 'Sage', value: 'sage' },
        { label: 'Light', value: 'light' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
