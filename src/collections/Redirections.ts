import type { CollectionConfig } from 'payload'

import { canManageRedirections, manageRedirections } from '../access'
import {
  invalidateRedirectionsAfterChange,
  invalidateRedirectionsAfterDelete,
  validateRedirection,
} from '../hooks/redirections'
import { DEFAULT_REDIRECT_STATUS_CODE, REDIRECT_STATUS_OPTIONS } from '../lib/redirections'
import { redirectionEndpoints } from '../lib/redirections-endpoints'

/**
 * SEO → Redirections.
 *
 * One rule = "a request for `sourcePath` should be answered with `statusCode` and sent to
 * `destinationUrl`". The admin list is Payload's own list view (search, filters, sortable columns,
 * pagination) with three module-specific additions:
 *
 *   beforeListTable   quick filters, bulk activate/deactivate/delete, CSV import & export
 *   isActive cell     a switch that saves in place
 *   rowActions cell   edit + delete on every row
 *
 * The redirect itself is served by `src/proxy.ts`; nothing in this collection runs on public
 * traffic except the cached `/rules` read.
 *
 * Drafts are deliberately not enabled: a redirect either works or it does not, and a "draft
 * redirect" that silently does nothing is worse than an inactive one that says so.
 */
export const Redirections: CollectionConfig = {
  slug: 'redirections',
  labels: {
    singular: 'Redirection',
    plural: 'Redirections',
  },
  admin: {
    useAsTitle: 'sourcePath',
    group: 'SEO',
    description:
      'Send an old URL to its new home. Active rules are matched on the path only (a trailing slash is ignored) and the visitor’s query string is kept.',
    defaultColumns: [
      'sourcePath',
      'destinationUrl',
      'statusCode',
      'isActive',
      'hitCount',
      'lastHitAt',
      'createdAt',
      'rowActions',
    ],
    listSearchableFields: ['sourcePath', 'destinationUrl', 'note'],
    pagination: {
      defaultLimit: 25,
      limits: [10, 25, 50, 100],
    },
    components: {
      beforeListTable: ['@/components/admin/redirections-toolbar'],
    },
  },
  defaultSort: 'sourcePath',
  access: {
    // Role-based: `admin` is the only role that may manage redirects (see `src/access/index.ts`).
    admin: ({ req: { user } }) => canManageRedirections(user),
    read: manageRedirections,
    create: manageRedirections,
    update: manageRedirections,
    delete: manageRedirections,
  },
  endpoints: redirectionEndpoints,
  hooks: {
    beforeValidate: [validateRedirection],
    afterChange: [invalidateRedirectionsAfterChange],
    afterDelete: [invalidateRedirectionsAfterDelete],
  },
  fields: [
    {
      name: 'sourcePath',
      type: 'text',
      label: 'Source path',
      required: true,
      unique: true,
      index: true,
      admin: {
        placeholder: '/old-page',
        description:
          'The URL visitors still request. A pasted full URL is reduced to its path, and the value is lowercased; a trailing slash is ignored when matching.',
      },
      validate: (value: unknown) =>
        typeof value === 'string' && value.trim().length > 0
          ? true
          : 'Enter the path on this site to redirect, e.g. /old-page.',
    },
    {
      name: 'destinationUrl',
      type: 'text',
      label: 'Destination',
      required: true,
      admin: {
        placeholder: '/new-page or https://example.com/page',
        description: 'An internal path on this site, or a full http(s) URL.',
      },
    },
    {
      name: 'statusCode',
      type: 'select',
      label: 'Status code',
      required: true,
      defaultValue: String(DEFAULT_REDIRECT_STATUS_CODE),
      options: REDIRECT_STATUS_OPTIONS,
      admin: {
        description:
          '301 and 308 are permanent (search engines transfer the ranking); 302 and 307 are temporary. 307/308 keep the request method.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      index: true,
      admin: {
        description: 'Inactive rules are kept but never served.',
        components: {
          Cell: '@/components/admin/redirection-active-cell',
        },
      },
    },
    {
      name: 'redirectCheck',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/redirection-check-field',
        },
      },
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Note',
      maxLength: 500,
      admin: {
        description: 'Optional. For other admins only — never shown to visitors.',
        position: 'sidebar',
      },
    },
    {
      name: 'hitCount',
      type: 'number',
      label: 'Hits',
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'How many times the redirect has been served.',
      },
    },
    {
      name: 'lastHitAt',
      type: 'date',
      label: 'Last hit',
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'rowActions',
      type: 'ui',
      label: 'Actions',
      admin: {
        disableBulkEdit: true,
        components: {
          Cell: '@/components/admin/redirection-row-actions',
        },
      },
    },
  ],
  timestamps: true,
}
