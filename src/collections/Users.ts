import type { CollectionConfig } from 'payload'

import { adminFieldLevel, adminOnly, adminOrSelf } from '../access'
import { formatSlugHook } from '../fields/slug'
import { socialsField } from '../fields/socials'
import { revalidateAuthor, revalidateAuthorDelete } from '../hooks/revalidate'
import { ensureUniqueUserSlug } from '../hooks/user-slug'
import { httpUrl } from '../lib/http-url'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'email', 'roles'],
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
  hooks: {
    // Runs before the row is written, so a name collision can never reach the `slug` unique index.
    beforeChange: [ensureUniqueUserSlug],
    afterChange: [revalidateAuthor],
    afterDelete: [revalidateAuthorDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      // The public profile page's URL segment: `/authors/<slug>`. Required and unique, so every
      // account — including ones created after the last deploy — has exactly one address.
      name: 'slug',
      type: 'text',
      label: 'Profile URL',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Auto-generated from the name. This is the public author page address: /authors/<slug>. Edit carefully — changing it changes the live URL.',
      },
      hooks: {
        // Fills it from the name on create, and keeps it in sync until an editor edits it by hand.
        beforeValidate: [formatSlugHook('name')],
      },
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
    // Public expertise details: shown in the profile card and Person structured data.
    // Leave unknown details blank; publishing a field does not verify a qualification.
    {
      name: 'jobTitle',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Role shown under the author’s name, e.g. "Senior Trekking Guide". Published as `jobTitle` in the author’s structured data.',
      },
    },
    {
      name: 'education',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Verified educational background, including the institution where applicable. Leave blank if not supplied by the author.',
      },
    },
    {
      name: 'credentials',
      type: 'array',
      labels: { singular: 'Credential', plural: 'Credentials' },
      admin: {
        description:
          'Only qualifications and licences the author actually holds — one per row. Include the issuing body where possible; leave blank when unverified.',
      },
      fields: [{ name: 'credential', type: 'text', required: true }],
    },
    {
      name: 'website',
      type: 'text',
      validate: (value: unknown) =>
        !value || Boolean(httpUrl(value)) || 'Enter a full http:// or https:// profile URL.',
      admin: {
        description:
          'Personal website or profile URL. Published as the author’s `url` in structured data — the link a reader can follow to verify who this person is.',
      },
    },
    // The author's `sameAs` — shared with Site settings (see src/fields/socials.ts).
    socialsField(),
  ],
  timestamps: true,
}
