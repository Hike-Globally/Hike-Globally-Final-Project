import type { Block } from 'payload'

import { contentEditor } from '../fields/content-editor'

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Rich text', plural: 'Rich text' },
  fields: [
    { name: 'heading', type: 'text' },
    // The shared content editor, so a flexible Page carries the same block menu as a Trip or a
    // post — including Boxed Content. Without it the field falls back to the global editor in
    // `payload.config.ts`, which is a different, feature-reduced ribbon.
    { name: 'content', type: 'richText', editor: contentEditor(), required: true },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default (wide)', value: 'default' },
        { label: 'Narrow (readable)', value: 'narrow' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'align',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Centered', value: 'center' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
