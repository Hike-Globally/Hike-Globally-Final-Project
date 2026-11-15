import type { Field } from 'payload'

import { validateLinkPreviewUrl } from '../lib/link-preview'

/**
 * The fields of a **Link preview** row in Page sections (trips and blog posts).
 *
 * They live in the section row itself, so an editor who adds a Link preview row gets the URL box
 * right there — next to the row's Section select — instead of having to find a separate panel
 * elsewhere on the document. That is also where Payload stores them: the row is part of the
 * (localized) page-sections array, so its content is per-page, ordered with the rest of the layout,
 * part of version history, and translated per language.
 *
 * Only the URL really matters — with no URL the row renders nothing, and the card's image, title
 * and description come from the linked page's own metadata (Open Graph / Twitter / `<title>`).
 * Rating, review count and prices are typed in, since no page's metadata carries them.
 */

/** Every field in a Link preview row shares one condition: the row's Section is Link preview. */
const whenLinkPreview = (_: unknown, siblingData: Record<string, unknown> | undefined) =>
  siblingData?.kind === 'linkPreview'

export function linkPreviewSectionFields(): Field[] {
  return [
    {
      name: 'linkPreviewUrl',
      type: 'text',
      label: 'URL',
      validate: validateLinkPreviewUrl,
      admin: {
        condition: whenLinkPreview,
        placeholder: 'https://example.com/trips/annapurna-base-camp',
        description:
          'The page this card links to — the only field that matters here. Paste a full address, or a path on this site such as /trips/annapurna-base-camp. Image, title and description are read from that page. Leave it empty and the row renders nothing. Pages on other sites open in a new tab.',
      },
    },
    {
      type: 'row',
      admin: { condition: whenLinkPreview },
      fields: [
        {
          name: 'linkPreviewTitle',
          type: 'text',
          label: 'Title (optional)',
          admin: {
            width: '50%',
            description: 'Leave empty to use the page’s own title.',
          },
        },
        {
          name: 'linkPreviewDescription',
          type: 'textarea',
          label: 'Description (optional)',
          admin: {
            width: '50%',
            description: 'Leave empty to use the page’s own description. Shown on one line.',
          },
        },
      ],
    },
    {
      type: 'row',
      admin: { condition: whenLinkPreview },
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
  ]
}
