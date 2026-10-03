import type { Field, GroupField } from 'payload'

type LinkArgs = {
  /** Field name of the resulting group. */
  name?: string
  label?: string
  /** Which document types can be linked to. */
  relations?: ('pages' | 'trips' | 'destinations' | 'blog')[]
  /** Show the "open in new tab" checkbox. */
  newTab?: boolean
  overrides?: Partial<Omit<GroupField, 'name' | 'type' | 'fields'>>
}

/**
 * Internal-or-external link field.
 *
 * Editors pick either a document inside the CMS (so links survive slug changes) or a raw URL.
 * The frontend resolves it with `resolveLink()` in `src/lib/links.ts`.
 */
export const linkField = ({
  name = 'link',
  label = 'Link',
  relations = ['pages', 'trips', 'destinations', 'blog'],
  newTab = true,
  overrides = {},
}: LinkArgs = {}): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    {
      name: 'label',
      type: 'text',
      // Optional on purpose: groups are always present in the document, so a `required`
      // field here would block saving anything that merely *contains* an unused link.
      // If the label is empty, the frontend falls back to the linked document's title.
      admin: { description: 'Visible text of the link. Empty = use the linked document’s title.' },
    },
    {
      name: 'type',
      type: 'radio',
      defaultValue: 'reference',
      admin: { layout: 'horizontal' },
      options: [
        { label: 'Internal', value: 'reference' },
        { label: 'External URL', value: 'custom' },
      ],
    },
    {
      name: 'reference',
      type: 'relationship',
      relationTo: relations,
      label: 'Document',
      admin: {
        condition: (_data, siblings) => (siblings as { type?: string })?.type !== 'custom',
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'URL',
      admin: {
        condition: (_data, siblings) => (siblings as { type?: string })?.type === 'custom',
      },
    },
    ...(newTab
      ? [
          {
            name: 'newTab' as const,
            type: 'checkbox' as const,
            label: 'Open in a new tab',
            defaultValue: false,
          },
        ]
      : []),
  ],
  ...overrides,
})
