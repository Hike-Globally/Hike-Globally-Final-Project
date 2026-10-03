import type { GlobalConfig } from 'payload'

import { anyone, adminOrEditor } from '../access'
import { linkField } from '../fields/link'
import { revalidateGlobal } from '../hooks/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header & navigation',
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
      fields: [linkField({ name: 'link', label: 'Link', newTab: false })],
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
