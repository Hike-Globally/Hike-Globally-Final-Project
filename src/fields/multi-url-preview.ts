import type { Field } from 'payload'

import {
  MAX_PREVIEW_LINKS,
  multiPreviewAnimations,
  multiPreviewLayouts,
  validateMultiPreviewUrl,
} from '../lib/multi-url-preview'
import { linkPreviewSectionFields } from './link-preview'

/** Exactly the same fields in the page-layout row and the rich-text block. */
export function multiUrlPreviewFields({
  conditional = true,
}: { conditional?: boolean } = {}): Field[] {
  const condition = conditional
    ? (_: unknown, siblingData: Record<string, unknown> | undefined) =>
        siblingData?.kind === 'multiUrlPreview'
    : undefined
  return [
    {
      name: 'multiPreviewHeading',
      label: 'Heading (optional)',
      type: 'text',
      maxLength: 120,
      admin: { condition, placeholder: 'More worth exploring' },
    },
    {
      name: 'multiPreviewDescription',
      label: 'Introduction (optional)',
      type: 'textarea',
      maxLength: 400,
      admin: { condition, description: 'A short introduction to this collection of links.' },
    },
    {
      type: 'row',
      admin: { condition },
      fields: [
        {
          name: 'multiPreviewLayout',
          label: 'Layout',
          type: 'select',
          defaultValue: 'slider',
          options: [...multiPreviewLayouts],
          admin: {
            width: '50%',
            description:
              'Stack the original cards, show a swipeable card slider, or a one-card carousel.',
          },
        },
        {
          name: 'multiPreviewAnimation',
          label: 'Animation',
          type: 'select',
          defaultValue: 'rise',
          options: [...multiPreviewAnimations],
          admin: {
            width: '50%',
            description:
              'Five restrained motion styles, or None. Always respects the visitor’s reduced-motion preference.',
          },
        },
      ],
    },
    {
      name: 'multiPreviewLinks',
      // Keep collection names distinct and version indexes below Postgres's 63-character limit.
      dbName: ({ tableName }) =>
        `${(tableName ?? 'preview').replace(/^_/, '').replace('_v_version', '')}_multi_links`,
      label: 'URLs',
      type: 'array',
      maxRows: MAX_PREVIEW_LINKS,
      labels: { singular: 'URL', plural: 'URLs' },
      admin: {
        condition,
        initCollapsed: true,
        description: `Add up to ${MAX_PREVIEW_LINKS} URLs and drag to reorder. Each card uses the linked page’s image, title and description, with the same optional overrides as Link preview. No URLs means no section or empty space on the public page.`,
        components: { RowLabel: '@/components/admin/multi-preview-link-label' },
      },
      fields: linkPreviewSectionFields({ conditional: false }).map((field) =>
        field.type === 'text' && field.name === 'linkPreviewUrl'
          ? {
              ...field,
              maxLength: 2048,
              validate: validateMultiPreviewUrl,
              admin: {
                ...field.admin,
                description:
                  'Paste a public https:// address, or a site path such as /trips/annapurna-base-camp. Blank rows are hidden. External links open in a new tab.',
              },
            }
          : field,
      ),
    },
  ]
}
