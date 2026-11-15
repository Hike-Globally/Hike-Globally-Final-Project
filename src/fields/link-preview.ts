import type { Field } from 'payload'

import { validateLinkPreviewUrl } from '../lib/link-preview'

/**
 * The "Link preview" panel on trips and blog posts. The matching **Link preview** row in Page
 * sections decides where the card appears; with no URL the row renders nothing.
 *
 * The fields are flat (`linkPreviewUrl`, …) rather than a group, so they are plain columns in the
 * database and in the version tables. Title and description are localized; the rest is shared
 * across locales, like prices and ratings elsewhere in the trip.
 */
export function linkPreviewPanel(): Field {
  return {
    type: 'collapsible',
    label: 'Link preview',
    admin: {
      initCollapsed: true,
      description:
        'Shows a link card on the public page wherever the Link preview row sits in Page sections. Paste a page address and the card fills in its image, title and description from that page. Rating and prices are typed in. Leave the URL empty to show nothing.',
    },
    fields: [
      {
        name: 'linkPreviewUrl',
        type: 'text',
        label: 'URL',
        validate: validateLinkPreviewUrl,
        admin: {
          placeholder: 'https://example.com/trips/annapurna-base-camp',
          description:
            'A full address, or a path on this site such as /trips/annapurna-base-camp. Pages on other sites open in a new tab.',
        },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'linkPreviewTitle',
            type: 'text',
            label: 'Title (optional)',
            localized: true,
            admin: {
              width: '50%',
              description: 'Leave empty to use the page’s own title.',
            },
          },
          {
            name: 'linkPreviewDescription',
            type: 'textarea',
            label: 'Description (optional)',
            localized: true,
            admin: {
              width: '50%',
              description: 'Leave empty to use the page’s own description. Shown on one line.',
            },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'linkPreviewRating',
            type: 'number',
            label: 'Rating',
            min: 0,
            max: 5,
            admin: {
              width: '25%',
              step: 0.1,
              description: 'Out of 5, e.g. 4.8. Leave empty to hide the stars.',
            },
          },
          {
            name: 'linkPreviewReviewCount',
            type: 'number',
            label: 'Number of reviews',
            min: 0,
            admin: { width: '25%' },
          },
          {
            name: 'linkPreviewPrice',
            type: 'text',
            label: 'Price',
            admin: {
              width: '25%',
              placeholder: 'US$ 700',
              description: 'Shown in bold. Written exactly as it should appear.',
            },
          },
          {
            name: 'linkPreviewOriginalPrice',
            type: 'text',
            label: 'Original price',
            admin: {
              width: '25%',
              placeholder: 'US$ 1150',
              description: 'Optional. Shown struck through before the price.',
            },
          },
        ],
      },
    ],
  }
}
