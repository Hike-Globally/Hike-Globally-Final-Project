import type { CollectionConfig } from 'payload'

import { adminOrEditor, publishedOrSignedIn } from '../access'
import { keywordsSection } from '../fields/keywords'
import { linkField } from '../fields/link'
import { metaField } from '../fields/meta'
import { slugField } from '../fields/slug'
import { viewLiveField } from '../fields/view-live'
import { revalidateTrip, revalidateTripDelete } from '../hooks/revalidate'
import { difficultySelectOptions } from '../lib/difficulty'
import { siteLivePreviewURL } from '../lib/live-preview-url'

/**
 * Trips — the longest form in the CMS.
 *
 * Layout: the identity fields and the Overview editor sit above the fold (they are what a card
 * on /trips is built from, and what an editor reaches for first), and everything below is grouped
 * into titled collapsible panels — the same "stack of meta boxes under the content" shape the
 * WordPress editor uses — so a 20-field document reads as a handful of sections instead of one
 * endless scroll.
 *
 * `collapsible` is presentational only: it adds no name and therefore no data path, so the
 * grouping changes nothing in the database and needs no migration. Sections holding required
 * fields start open; optional ones start closed. Payload re-opens any panel containing a
 * validation error on save, so nothing can hide a missing required value.
 */
export const Trips: CollectionConfig = {
  slug: 'trips',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'destination', 'durationDays', 'priceFrom', 'featured', 'updatedAt', 'viewLive'],
    group: 'Content',
    components: {
      edit: {
        beforeDocumentControls: [
          '@/components/admin/view-live-button',
          '@/components/admin/live-preview-toggle',
        ],
      },
    },
    livePreview: { url: siteLivePreviewURL },
  },
  versions: {
    drafts: { autosave: { interval: 250 } },
    maxPerDoc: 25,
  },
  access: {
    read: publishedOrSignedIn,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOrEditor,
  },
  hooks: {
    afterChange: [revalidateTrip],
    afterDelete: [revalidateTripDelete],
  },
  fields: [
    /* --------------------------------------------------------------------------
       Above the fold — identity and the main body copy
       -------------------------------------------------------------------------- */
    { name: 'title', type: 'text', localized: true, required: true },
    // Rendered in the document sidebar, not here (see `slugField`).
    slugField('title'),
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      required: true,
      maxLength: 220,
      admin: {
        description:
          '2–3 sentences. Used on cards, in search results and as the meta description fallback.',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      label: 'Overview',
      admin: {
        description:
          'The main body of the trip page. The toolbar across the top of the box has headings, bold, links, lists and images.',
      },
    },

    /* --------------------------------------------------------------------------
       Trip facts — open by default: destination, type and duration are required
       -------------------------------------------------------------------------- */
    {
      type: 'collapsible',
      label: 'Trip facts',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'destination',
              type: 'relationship',
              relationTo: 'destinations',
              required: true,
              index: true,
              admin: { width: '50%' },
            },
            {
              name: 'tripType',
              type: 'select',
              required: true,
              defaultValue: 'trekking',
              options: [
                { label: 'Trekking', value: 'trekking' },
                { label: 'Expedition', value: 'expedition' },
                { label: 'Peak climbing', value: 'peak-climbing' },
                { label: 'Cultural tour', value: 'cultural' },
                { label: 'Helicopter tour', value: 'heli' },
                { label: 'Multi-sport', value: 'multi-sport' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'durationDays',
              type: 'number',
              label: 'Days',
              required: true,
              min: 1,
              admin: { width: '25%', description: 'Total days on the trip.' },
            },
            {
              name: 'durationNights',
              type: 'number',
              label: 'Nights',
              min: 0,
              admin: { width: '25%' },
            },
            {
              name: 'groupSizeMax',
              type: 'number',
              label: 'Max group size',
              min: 1,
              admin: { width: '25%' },
            },
            {
              name: 'maxAltitude',
              type: 'number',
              label: 'Max altitude',
              min: 0,
              admin: { width: '25%', description: 'Highest point, in metres.' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'difficulty',
              type: 'select',
              required: true,
              defaultValue: 'moderate',
              options: difficultySelectOptions,
              admin: {
                width: '50%',
                description:
                  'Nine rungs, from Easy to Extreme. The homepage slider after the hero groups published trips by this value.',
              },
            },
            {
              name: 'bestSeasons',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'Spring', value: 'spring' },
                { label: 'Summer', value: 'summer' },
                { label: 'Autumn', value: 'autumn' },
                { label: 'Winter', value: 'winter' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },

    /* --------------------------------------------------------------------------
       Pricing — open by default: price and currency are required
       -------------------------------------------------------------------------- */
    {
      type: 'collapsible',
      label: 'Pricing',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'priceFrom',
              type: 'number',
              required: true,
              min: 0,
              admin: {
                width: '33%',
                description: 'Lowest per-person price, no thousands separators.',
              },
            },
            {
              name: 'priceCurrency',
              type: 'select',
              required: true,
              defaultValue: 'USD',
              options: [
                { label: 'USD ($)', value: 'USD' },
                { label: 'EUR (€)', value: 'EUR' },
                { label: 'NPR (रू)', value: 'NPR' },
              ],
              admin: { width: '33%' },
            },
            {
              name: 'priceUnit',
              type: 'select',
              defaultValue: 'per-person',
              options: [
                { label: 'per person', value: 'per-person' },
                { label: 'per group', value: 'per-group' },
              ],
              admin: { width: '33%' },
            },
          ],
        },
        {
          name: 'priceNote',
          type: 'text',
          localized: true,
          admin: { description: 'Optional: "based on a group of 4", "single supplement +$320".' },
        },
      ],
    },

    /* --------------------------------------------------------------------------
       Highlights & itinerary — the heart of a trip page, so it stays open
       -------------------------------------------------------------------------- */
    {
      type: 'collapsible',
      label: 'Highlights & itinerary',
      fields: [
        {
          name: 'highlights',
          type: 'array',
          localized: true,
          labels: { singular: 'Highlight', plural: 'Highlights' },
          admin: { description: 'Short punchy bullets shown near the top of the trip page.' },
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        {
          name: 'itinerary',
          type: 'array',
          localized: true,
          labels: { singular: 'Day', plural: 'Itinerary' },
          admin: {
            description: 'One entry per day. Day-level content is translated per language.',
            initCollapsed: true,
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'day', type: 'number', required: true, min: 1, admin: { width: '20%' } },
                { name: 'title', type: 'text', required: true, admin: { width: '80%' } },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'accommodation',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'e.g. Teahouse in Namche Bazaar',
                  },
                },
                {
                  name: 'altitude',
                  type: 'number',
                  min: 0,
                  admin: { width: '25%', description: 'Metres' },
                },
                {
                  name: 'food',
                  type: 'select',
                  options: [
                    { label: 'Included', value: 'included' },
                    { label: 'Not included', value: 'not-included' },
                  ],
                  admin: {
                    width: '25%',
                    description: 'Are this day’s meals covered by the price?',
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'contentSections',
          type: 'array',
          localized: true,
          labels: { singular: 'Content section', plural: 'Content sections' },
          admin: {
            description:
              'Add extra headed sections to the trip page. These appear after the itinerary.',
            initCollapsed: true,
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              required: true,
              admin: { description: 'Displayed above this section’s content.' },
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
              admin: {
                description:
                  'Write the section content using the same rich-text editor and formatting options as the Overview.',
              },
            },
          ],
        },
      ],
    },

    /* --------------------------------------------------------------------------
       Optional sections — closed until needed
       -------------------------------------------------------------------------- */
    {
      type: 'collapsible',
      label: 'Inclusions & FAQs',
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'included',
              type: 'array',
              localized: true,
              labels: { singular: 'Included item', plural: "What's included" },
              admin: { width: '50%' },
              fields: [{ name: 'item', type: 'text', required: true }],
            },
            {
              name: 'notIncluded',
              type: 'array',
              localized: true,
              labels: { singular: 'Excluded item', plural: "What's not included" },
              admin: { width: '50%' },
              fields: [{ name: 'item', type: 'text', required: true }],
            },
          ],
        },
        {
          name: 'faqs',
          type: 'array',
          localized: true,
          labels: { singular: 'FAQ', plural: 'FAQs' },
          admin: { initCollapsed: true },
          fields: [
            { name: 'question', type: 'text', required: true },
            { name: 'answer', type: 'textarea', required: true },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Gallery & related trips',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'gallery',
          type: 'array',
          labels: { singular: 'Image', plural: 'Gallery' },
          fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
        },
        {
          name: 'relatedTrips',
          type: 'relationship',
          relationTo: 'trips',
          hasMany: true,
          filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
          admin: {
            description:
              'Shown in the "You may also like" rail. Leave empty to auto-fill from the same destination.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Booking & visibility',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'bookingLink',
          type: 'group',
          label: 'Booking CTA',
          admin: {
            description:
              'Optional external booking button (e.g. your booking engine). Leave empty to use the built-in inquiry form.',
          },
          fields: [linkField({ name: 'link', label: 'Booking link', newTab: false })],
        },
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Pinned first on /trips and picked by the homepage "Featured trips" section. With none ticked, the homepage falls back to the newest published trips rather than hiding the section.',
          },
        },
      ],
    },

    /* --------------------------------------------------------------------------
       Keywords & SEO — the keywords panel sits directly above the SEO group and
       opens by default (it is one short chip input), so the terms a trip is
       targeting are filled in while the page is being written, not after.
       -------------------------------------------------------------------------- */
    keywordsSection(),
    metaField(),
    viewLiveField(),
  ],
}
