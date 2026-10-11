import type { GlobalConfig } from 'payload'

import { adminOrEditor, anyone } from '../access'
import { linkField } from '../fields/link'
import { revalidateGlobal } from '../hooks/revalidate'
import { siteLivePreviewURL } from '../lib/live-preview-url'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    components: {
      elements: {
        beforeDocumentControls: [
          '@/components/admin/view-live-button',
          '@/components/admin/live-preview-toggle',
        ],
      },
    },
    livePreview: { url: siteLivePreviewURL },
  },
  access: {
    read: anyone,
    update: adminOrEditor,
  },
  hooks: {
    afterChange: [revalidateGlobal('footer')],
  },
  fields: [
    {
      name: 'introduction',
      type: 'textarea',
      localized: true,
      maxLength: 320,
      admin: { description: 'Short brand statement in the About section of the footer.' },
    },
    {
      name: 'columns',
      type: 'array',
      localized: true,
      maxRows: 4,
      labels: { singular: 'Column', plural: 'Link columns' },
      fields: [
        { name: 'heading', type: 'text', localized: true, required: true },
        {
          name: 'links',
          type: 'array',
          labels: { singular: 'Link', plural: 'Links' },
          fields: [linkField({ name: 'link', label: 'Link', newTab: false })],
        },
      ],
    },
    {
      name: 'legalLinks',
      type: 'array',
      localized: true,
      maxRows: 4,
      labels: { singular: 'Legal link', plural: 'Legal links' },
      fields: [linkField({ name: 'link', label: 'Link', newTab: false })],
    },
    {
      name: 'copyright',
      type: 'text',
      localized: true,
      admin: { description: 'Supports {year}, replaced with the current year.' },
    },
  ],
}
