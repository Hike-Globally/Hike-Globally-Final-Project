import type { Field, GroupField } from 'payload'

/**
 * Reusable SEO group.
 *
 * The group itself is `localized: true`, which automatically localizes every child field
 * (title, description) — you never mark children localized inside a localized group.
 *
 * Fallback: `src/lib/seo.ts` falls back to the document title + excerpt when these are empty,
 * so an editor can publish without filling in SEO and still get a sane <title>/description.
 */
export const metaField = (overrides: Partial<Omit<GroupField, 'name' | 'type' | 'fields'>> = {}): Field => ({
  name: 'meta',
  type: 'group',
  label: 'SEO & social sharing',
  localized: true,
  admin: {
    description: 'Override the automatically generated title/description and social preview.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Meta title',
      admin: { description: 'Aim for 50–60 characters. Falls back to the page title.' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Meta description',
      maxLength: 170,
      admin: { description: 'Aim for 140–160 characters. Falls back to the excerpt/summary.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Social share image',
      admin: { description: '1200×630px recommended. Falls back to the hero/cover image.' },
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      label: 'Hide from search engines (noindex)',
      defaultValue: false,
    },
  ],
  ...overrides,
})
