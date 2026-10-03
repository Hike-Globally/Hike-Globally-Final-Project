import type { Block } from 'payload'

import { linkField } from '../fields/link'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Hero' },
  fields: [
    { name: 'eyebrow', type: 'text', admin: { description: 'Small label above the heading.' } },
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Landscape, at least 1920px wide. Images are served as AVIF/WebP automatically.' },
    },
    linkField({ name: 'primaryLink', label: 'Primary button' }),
    linkField({ name: 'secondaryLink', label: 'Secondary button' }),
    {
      name: 'height',
      type: 'select',
      defaultValue: 'tall',
      options: [
        { label: 'Full screen', value: 'full' },
        { label: 'Tall', value: 'tall' },
        { label: 'Compact', value: 'compact' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'overlay',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Strong (best for light photos)', value: 'strong' },
        { label: 'Medium', value: 'medium' },
        { label: 'None', value: 'none' },
      ],
      admin: { position: 'sidebar', description: 'Dark scrim behind the text, for legibility.' },
    },
  ],
}
