import type { Block } from 'payload'

import { linkField } from '../fields/link'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Hero' },
  fields: [
    { name: 'eyebrow', type: 'text', admin: { description: 'Small label above the heading.' } },
    {
      name: 'heading',
      type: 'text',
      required: true,
      admin: {
        description:
          'Wrap part of the heading in <i>…</i> to set it in the italic accent face. On the homepage that part becomes its own second line in Instrument Serif italic at 90px, under the first line at 120px — e.g. "Walk Where The <i>Map Runs Out of Names</i>". Anywhere else it stays inline italic. Only <i> and <em> are recognised; every other tag is shown as plain text.',
      },
    },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Landscape, at least 1920px wide. The original upload is served without recompression.',
      },
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
