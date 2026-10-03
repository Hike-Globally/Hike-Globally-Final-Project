import type { CollectionConfig } from 'payload'

import { adminFieldLevel, adminOnly, adminOrSelf } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'Team',
  },
  auth: {
    tokenExpiration: 60 * 60 * 8, // 8 hours
    maxLoginAttempts: 8,
    lockTime: 1000 * 60 * 10,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  },
  access: {
    // Anyone with an account may open the admin panel; what they can see is scoped below.
    admin: ({ req: { user } }) => Boolean(user),
    read: adminOrSelf,
    create: adminOnly,
    update: adminOrSelf,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      // Only an admin may promote someone — otherwise an editor could make themselves admin.
      access: {
        create: adminFieldLevel,
        update: adminFieldLevel,
      },
      admin: {
        description:
          'Admins manage the whole site and users. Editors write and publish content only.',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      admin: { description: 'Short author bio shown on blog posts.' },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
  ],
  timestamps: true,
}
