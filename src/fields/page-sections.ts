import type { ArrayField } from 'payload'
import { array } from 'payload/shared'

import { defaultPageSections, validatePageSections } from '../lib/page-sections'

/** Payload arrays provide persisted drag handles, move controls, and draft/live-preview support. */
export function pageSectionsField(options: { label: string; value: string }[]): ArrayField {
  return {
    name: 'pageSections',
    label: 'Page sections',
    type: 'array',
    localized: true,
    minRows: 1,
    maxRows: 60,
    labels: { singular: 'Page section', plural: 'Page sections' },
    defaultValue: defaultPageSections(options),
    hooks: {
      // Also populate the editor for documents saved before page layouts existed.
      // Payload invokes localized field hooks once per locale, even for locale=all.
      afterRead: [({ value }) => (value?.length ? value : defaultPageSections(options))],
    },
    validate: (value, args) => {
      const result = validatePageSections(value)
      return result === true ? array(value, args) : result
    },
    admin: {
      initCollapsed: true,
      description:
        'Drag the row handles to set the order on this page, or use each row’s Move Up / Move Down controls. Add a Custom HTML row anywhere. Existing section content is edited in the fields below; empty sections do not display. Removing a row hides that section without deleting its content. The booking card and article outline stay beside their content.',
      components: { RowLabel: '@/components/admin/page-section-label' },
    },
    fields: [
      {
        name: 'kind',
        label: 'Section',
        type: 'select',
        required: true,
        defaultValue: 'html',
        options: [...options, { label: 'Custom HTML', value: 'html' }],
      },
      {
        name: 'heading',
        type: 'text',
        label: 'Section heading (optional)',
        admin: { condition: (_, siblingData) => siblingData.kind === 'html' },
      },
      {
        name: 'html',
        label: 'Custom HTML',
        type: 'code',
        required: true,
        admin: {
          language: 'html',
          condition: (_, siblingData) => siblingData.kind === 'html',
          description:
            'Paste an HTML fragment, not a full document. Headings, text, links, images, lists, tables and safe inline styles are supported. Scripts, event handlers, forms, embeds and unsafe URLs/styles are removed when displayed.',
        },
      },
    ],
  }
}
