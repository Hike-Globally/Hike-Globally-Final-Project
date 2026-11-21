import type { Field } from 'payload'

import {
  MAX_PREVIEW_LINKS,
  multiPreviewAnimations,
  multiPreviewLayouts,
  validateMultiPreviewUrl,
} from '../lib/multi-url-preview'
import { parseImageProxyUrl } from '../lib/link-preview-image'

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

/**
 * Exactly the same persisted fields in the page-layout row and the rich-text block.
 *
 * The admin UI deliberately starts small: the section copy and presentation controls are
 * collapsed, URL rows are collapsed, and each row exposes only its URL until the editor opens
 * "Optional card details". These are presentational `collapsible`/`row` fields — they do not add
 * a nesting key to the saved document — so the frontend resolver and every field name, default,
 * condition, validation and database table remain unchanged.
 */
export function multiUrlPreviewFields({
  conditional = true,
}: { conditional?: boolean } = {}): Field[] {
  const condition = conditional
    ? (_: unknown, siblingData: Record<string, unknown> | undefined) =>
        siblingData?.kind === 'multiUrlPreview'
    : undefined
  return [
    {
      type: 'collapsible',
      label: 'Heading & intro',
      admin: {
        condition,
        className: 'hg-multi-url-preview__copy',
        initCollapsed: true,
        description: 'Optional. Shown above the URL cards.',
      },
      fields: [
        {
          name: 'multiPreviewHeading',
          label: 'Heading',
          type: 'text',
          maxLength: 120,
          admin: { condition, placeholder: 'More worth exploring' },
        },
        {
          name: 'multiPreviewDescription',
          label: 'Introduction',
          type: 'textarea',
          maxLength: 400,
          admin: { condition },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Layout & motion',
      admin: {
        condition,
        className: 'hg-multi-url-preview__display',
        initCollapsed: true,
        description: 'Optional. Defaults to Slider and Rise.',
      },
      fields: [
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
              admin: { width: '50%' },
            },
            {
              name: 'multiPreviewAnimation',
              label: 'Animation',
              type: 'select',
              defaultValue: 'rise',
              options: [...multiPreviewAnimations],
              admin: { width: '50%' },
            },
          ],
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
        className: 'hg-multi-url-preview__links',
        initCollapsed: true,
        description: `Add up to ${MAX_PREVIEW_LINKS} URLs, then drag to reorder. Blank rows are hidden.`,
        components: { RowLabel: '@/components/admin/multi-preview-link-label' },
      },
      fields: [
        {
          name: 'linkPreviewUrl',
          label: 'URL',
          type: 'text',
          maxLength: 2048,
          validate: validateMultiPreviewUrl,
          admin: {
            className: 'hg-multi-url-preview__url',
            placeholder: '/trips/annapurna-base-camp or https://example.com/guide',
            description:
              'Use a site path or a public https:// address. The linked page supplies the card details.',
          },
        },
        {
          type: 'collapsible',
          label: 'Optional card details',
          admin: {
            className: 'hg-multi-url-preview__overrides',
            initCollapsed: true,
            description:
              'Leave blank to use the linked page’s content. Uploaded images take precedence over image URLs.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'linkPreviewTitle',
                  type: 'text',
                  label: 'Title',
                  admin: { width: '50%' },
                },
                {
                  name: 'linkPreviewDescription',
                  type: 'textarea',
                  label: 'Description',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'linkPreviewPrice',
                  type: 'text',
                  label: 'Price',
                  admin: { width: '50%', placeholder: 'US$ 700' },
                },
                {
                  name: 'linkPreviewOriginalPrice',
                  type: 'text',
                  label: 'Original price',
                  admin: { width: '50%', placeholder: 'US$ 1150' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'linkPreviewImage',
                  label: 'Upload image',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: { mimeType: { like: 'image/%' } },
                  admin: { width: '50%' },
                },
                {
                  name: 'linkPreviewImageUrl',
                  label: 'Image URL',
                  type: 'text',
                  maxLength: 2048,
                  validate: validateMultiPreviewImageUrl,
                  admin: {
                    width: '50%',
                    placeholder: 'https://example.com/photo.webp',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ]
}
