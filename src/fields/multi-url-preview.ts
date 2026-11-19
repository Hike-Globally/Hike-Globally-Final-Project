import type { Field } from 'payload'

import {
  MAX_PREVIEW_LINKS,
  multiPreviewAnimations,
  multiPreviewLayouts,
  validateMultiPreviewUrl,
} from '../lib/multi-url-preview'
import { parseImageProxyUrl } from '../lib/link-preview-image'
import { linkPreviewSectionFields } from './link-preview'

/** Optional image source: either a site path or an absolute public http(s) URL. */
export function validateMultiPreviewImageUrl(value: unknown): true | string {
  if (value === null || value === undefined || value === '') return true
  if (typeof value !== 'string') return 'Enter an image URL.'
  const url = value.trim()
  if (!url || /[\\\u0000-\u001f\u007f]/.test(url)) return 'Enter a valid image URL.'
  if (url.startsWith('/') && !url.startsWith('//')) return true
  return parseImageProxyUrl(url)
    ? true
    : 'Use a public http:// or https:// image URL without a password or a custom port.'
}

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
        description: `Add up to ${MAX_PREVIEW_LINKS} URLs and drag to reorder. Each card uses the linked page’s image, title and description, with optional overrides. Set each image by uploading from your device or pasting a public image URL. No URLs means no section or empty space on the public page.`,
        components: { RowLabel: '@/components/admin/multi-preview-link-label' },
      },
      fields: [
        ...linkPreviewSectionFields({ conditional: false }).map((field) =>
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
        {
          type: 'row',
          fields: [
            {
              name: 'linkPreviewImage',
              label: 'Image (upload from device)',
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { like: 'image/%' } },
              admin: {
                width: '50%',
                description:
                  'Choose an image in the Media library or upload one from your device. This takes precedence over the image URL.',
              },
            },
            {
              name: 'linkPreviewImageUrl',
              label: 'Image URL (optional)',
              type: 'text',
              maxLength: 2048,
              validate: validateMultiPreviewImageUrl,
              admin: {
                width: '50%',
                placeholder: 'https://example.com/photo.webp',
                description:
                  'Alternative to uploading: paste a public image URL. Leave both image fields empty to use the linked page’s image.',
              },
            },
          ],
        },
      ],
    },
  ]
}
