import type { GlobalConfig } from 'payload'

import { anyone, adminOrEditor } from '../access'
import { linkField } from '../fields/link'
import { revalidateGlobal } from '../hooks/revalidate'
import { siteLivePreviewURL } from '../lib/live-preview-url'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header & navigation',
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
    afterChange: [revalidateGlobal('header')],
  },
  fields: [
    {
      name: 'announcement',
      type: 'text',
      localized: true,
      admin: { description: 'Optional thin bar above the header. Leave empty to hide it.' },
    },
    {
      name: 'navItems',
      type: 'array',
      localized: true,
      maxRows: 8,
      labels: { singular: 'Nav item', plural: 'Navigation' },
      fields: [
        linkField({ name: 'link', label: 'Link', newTab: false }),
        {
          name: 'children',
          type: 'array',
          labels: { singular: 'Dropdown link', plural: 'Dropdown links' },
          admin: {
            description:
              'Optional. When present, the tab shows a dropdown panel with these links.',
          },
          fields: [linkField({ name: 'link', label: 'Link', newTab: false })],
        },
      ],
    },
    {
      name: 'actions',
      type: 'array',
      localized: true,
      maxRows: 2,
      labels: { singular: 'Button', plural: 'Header buttons' },
      fields: [linkField({ name: 'link', label: 'Button', newTab: false })],
    },
  ],
}
