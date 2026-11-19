import { contentEditor } from '../fields/content-editor'
import type { CollectionConfig } from 'payload'

import { adminOrEditor, publishedOrSignedIn } from '../access'
import { faqFields } from '../fields/faqs'
import { pageSectionsField } from '../fields/page-sections'
import { tripSectionOptions } from '../lib/page-sections'
import { internalLinkKeywordsSection } from '../fields/internal-link-keywords'
import { keywordsSection } from '../fields/keywords'
import { linkField } from '../fields/link'
import { metaField } from '../fields/meta'
import { slugField } from '../fields/slug'
import { viewLiveField } from '../fields/view-live'
import { revalidateTrip, revalidateTripDelete } from '../hooks/revalidate'
import { departureStatusOptions, toDateKey } from '../lib/departures'
import { difficultySelectOptions } from '../lib/difficulty'
import { buildLivePreviewURL, resolveLivePreviewPath } from '../lib/live-preview-url'
import { tripAudienceDefaults } from '../lib/trip-audience'

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
    defaultColumns: [
      'title',
      'destination',
      'durationDays',
      'priceFrom',
      'featured',
      'updatedAt',
      'viewLive',
    ],
    group: 'Content',
    components: {
      edit: {
        beforeDocumentControls: ['@/components/admin/view-live-button'],
        PreviewButton: '@/components/admin/trip-preview-button',
      },
    },
    // Use Payload's standalone preview, not the split-screen live-preview pane.
    preview: (data) => {
      const path = resolveLivePreviewPath({ collectionConfig: { slug: 'trips' }, data })
      return path ? buildLivePreviewURL(path) : null
    },
  },
  versions: {
    drafts: { autosave: { interval: 1500 } },
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
      name: 'guide',
      label: 'Itinerary expert',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'The person who wrote or maintains this itinerary. Their public bio and qualifications are shown on the trip page. This is not a guarantee that they will lead every departure. Leave blank until assigned.',
      },
    },
    pageSectionsField(tripSectionOptions),
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
      type: 'collapsible',
      label: 'Key Takeaways',
      fields: [
        {
          name: 'keyTakeaways',
          type: 'array',
          localized: true,
          labels: { singular: 'Takeaway', plural: 'Takeaways' },
          admin: {
            description:
              'Add one point per row before Overview. Wrap a phrase in **double asterisks** to make it bold. Drag to reorder; leave empty to hide the section.',
            components: { Field: '@/components/admin/instant-trip-array' },
          },
          fields: [{ name: 'text', type: 'textarea', required: true }],
        },
      ],
    },
    {
      name: 'description',
      type: 'richText',
      editor: contentEditor(),
      localized: true,
      label: 'Overview',
      admin: {
        description:
          'The main body of the trip page. Insert Link preview or Multi-URL Preview between paragraphs from the toolbar’s block menu (or type /multiUrlPreview). Headings, links, lists, images and tables remain available.',
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
       Trip Brochure — the downloadable PDF (or image) version of this itinerary.

       Deliberately placed directly under Pricing and left open, rather than in the run of
       optional panels at the bottom: on the live page the download button belongs to the
       booking card, so it is filled in at the same moment as the price. Fully optional — a
       trip with no file simply renders no button (see `TripBrochureButton` in
       `src/components/views/trip-detail.tsx`).
       -------------------------------------------------------------------------- */
    {
      type: 'collapsible',
      label: 'Trip Brochure',
      fields: [
        {
          name: 'brochureFile',
          type: 'upload',
          relationTo: 'media',
          label: 'Brochure file',
          // PDF is the printable document; an image covers a brochure exported or photographed
          // as a page. Video is excluded so the picker only offers something a visitor can read;
          // Media's own `mimeTypes` allow-list has the final say on what can be stored.
          filterOptions: { mimeType: { not_like: 'video/%' } },
          admin: {
            description:
              'Upload the downloadable version of this itinerary. A “Download Trip Brochure” button then appears under “Book This Trek” on the trip page. Leave empty to hide the button.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'brochureTitle',
              type: 'text',
              label: 'Button title',
              localized: true,
              admin: {
                width: '50%',
                placeholder: 'Download Trip Brochure',
                description: 'Optional. Replaces the default button text.',
              },
            },
            {
              name: 'brochureNote',
              type: 'text',
              label: 'Supporting note',
              localized: true,
              admin: {
                width: '50%',
                placeholder: 'PDF · day-by-day itinerary, map and packing list',
                description:
                  'Optional single line under the button. Defaults to the file type and size (e.g. “PDF · 2.3 MB”).',
              },
            },
          ],
        },
      ],
    },

    /* --------------------------------------------------------------------------
       Highlights & itinerary — the heart of a trip page, so they stay open
       -------------------------------------------------------------------------- */
    {
      type: 'collapsible',
      label: 'Highlights',
      fields: [
        {
          name: 'highlights',
          type: 'array',
          localized: true,
          labels: { singular: 'Highlight', plural: 'Highlights' },
          admin: {
            description:
              'One bullet per row. Wrap a phrase in **double asterisks** to make it bold.',
            components: { Field: '@/components/admin/instant-trip-array' },
          },
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },

    /* --------------------------------------------------------------------------
       Who Is This Trip For / Not For — the honest "is this right for me?" pair.

       Two panels, one per side of the answer, each with an optional heading override and a
       rich-text description (paragraphs and bullet lists). On the live page they render as a
       matched pair of cards directly after Highlights (`TripAudienceSection` in
       `src/components/sections/trip-audience-section.tsx`), positioned by the single
       "Who is this trip for / not for" row in Page sections. A side with no description is
       hidden; when both are empty the whole section is.

       The `hg-trip-audience` classes give the two panels their accent glyph and rule in the
       admin (see `custom.scss` → "Trip audience panels").
       -------------------------------------------------------------------------- */
    {
      type: 'collapsible',
      label: 'Who Is This Trip For',
      admin: { className: 'hg-trip-audience hg-trip-audience--for' },
      fields: [
        {
          name: 'tripForHeading',
          type: 'text',
          label: 'Heading',
          localized: true,
          admin: {
            placeholder: tripAudienceDefaults.forHeading,
            description: `Optional. Leave empty to use “${tripAudienceDefaults.forHeading}”.`,
          },
        },
        {
          name: 'tripForDescription',
          type: 'richText',
          label: 'Description',
          localized: true,
          admin: {
            className: 'hg-trip-compact-editor',
            description:
              'Describe the travellers this trip suits best — fitness, experience, travel style. Bullet lists display with a check mark on each point. Leave empty to hide this card.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Who Is This Trip Not For',
      admin: { className: 'hg-trip-audience hg-trip-audience--not-for' },
      fields: [
        {
          name: 'tripNotForHeading',
          type: 'text',
          label: 'Heading',
          localized: true,
          admin: {
            placeholder: tripAudienceDefaults.notForHeading,
            description: `Optional. Leave empty to use “${tripAudienceDefaults.notForHeading}”.`,
          },
        },
        {
          name: 'tripNotForDescription',
          type: 'richText',
          label: 'Description',
          localized: true,
          admin: {
            className: 'hg-trip-compact-editor',
            description:
              'Be candid about who should choose a different trip — and why. Bullet lists display with a cross on each point. Leave empty to hide this card.',
          },
        },
      ],
    },

    {
      type: 'collapsible',
      label: 'Itinerary',
      fields: [
        {
          name: 'itinerary',
          type: 'array',
          localized: true,
          labels: { singular: 'Day', plural: 'Itinerary' },
          admin: {
            description: 'One entry per day. Day-level content is translated per language.',
            components: { Field: '@/components/admin/instant-trip-array' },
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
      ],
    },
    {
      type: 'collapsible',
      label: 'Essential Information',
      fields: [
        {
          name: 'contentSections',
          type: 'array',
          localized: true,
          labels: {
            singular: 'Essential Information section',
            plural: 'Essential Information sections',
          },
          admin: {
            description:
              'Add extra headed sections to the trip page. Their position is controlled by the Essential information row in Page sections; drag the entries here to reorder them within Essential Information.',
            components: { Field: '@/components/admin/instant-trip-array' },
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
              editor: contentEditor(),
              required: true,
              admin: {
                className: 'hg-trip-compact-editor',
                description:
                  'Insert Link preview or Multi-URL Preview from the toolbar’s block menu (or type /multiUrlPreview) to place one card or a collection of URLs among your text, with a layout and animation of your choice. Write the section content using the same rich-text editor and formatting options as the Overview — including tables. Use the toolbar’s “+” menu (or type /table) to insert one: rows and columns first, then the hover handles to add, remove, merge or resize. Handy for cost breakdowns, gear lists and season comparisons.',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Hotels Near Destination',
      fields: [
        {
          name: 'hotelsNearDestination',
          type: 'array',
          localized: true,
          labels: { singular: 'Hotel', plural: 'Hotels' },
          admin: {
            description:
              'Add one entry per nearby hotel. Each entry appears as an open accordion; include the location, facilities, and useful booking details in its content.',
            components: { Field: '@/components/admin/instant-trip-array' },
            initCollapsed: true,
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              label: 'Hotel name',
              required: true,
              admin: { description: 'Displayed as this hotel’s accordion heading.' },
            },
            {
              name: 'content',
              type: 'richText',
              editor: contentEditor(),
              required: true,
              admin: {
                className: 'hg-trip-compact-editor',
                description:
                  'Describe the hotel and its distance from the destination. Add Link preview or Multi-URL Preview blocks for booking links when useful.',
              },
            },
          ],
        },
      ],
    },

    {
      type: 'collapsible',
      label: 'Why Choose This Trek',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'whyChooseThisTrek',
          type: 'richText',
          editor: contentEditor(),
          localized: true,
          admin: {
            className: 'hg-trip-compact-editor',
            description: 'Reasons to choose this trek. Displayed before Highlights.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Original route map and altitude chart',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'routeMapContent',
          label: 'Route map and altitude chart content',
          type: 'richText',
          editor: contentEditor(),
          localized: true,
          admin: {
            className: 'hg-trip-compact-editor',
            description: 'Optional introduction or route notes. Displayed after Highlights.',
          },
        },
        {
          name: 'routeMap',
          label: 'Original route map',
          type: 'upload',
          relationTo: 'media',
          filterOptions: { mimeType: { contains: 'image/' } },
          admin: {
            description: 'Upload the original route map image. Add descriptive alt text in Media.',
          },
        },
        {
          name: 'altitudeChart',
          type: 'upload',
          relationTo: 'media',
          filterOptions: { mimeType: { contains: 'image/' } },
          admin: {
            description: 'Upload the altitude chart image. Add descriptive alt text in Media.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Departures',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'departureDates',
          label: 'Departure dates',
          type: 'array',
          labels: { singular: 'Departure date', plural: 'Departure dates' },
          admin: {
            description:
              'Pick departure dates directly on the calendar or add rows individually. Displayed as an interactive calendar and departure schedule after Detailed Itinerary.',
            components: {
              Field: '@/components/admin/departure-dates-field',
              RowLabel: '@/components/admin/departure-row-label',
            },
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'startDate',
                  label: 'Start date',
                  type: 'date',
                  required: true,
                  admin: {
                    width: '50%',
                    placeholder: 'Select start date…',
                    date: {
                      pickerAppearance: 'dayOnly',
                      displayFormat: 'd MMM yyyy',
                    },
                  },
                },
                {
                  name: 'endDate',
                  label: 'End date',
                  type: 'date',
                  validate: (value, { siblingData }) => {
                    if (!value) return true
                    const start = toDateKey(
                      (siblingData as { startDate?: string | Date | null } | undefined)?.startDate,
                    )
                    const end = toDateKey(value)
                    if (start && end && end < start) {
                      return 'End date cannot be earlier than the start date.'
                    }
                    return true
                  },
                  admin: {
                    width: '50%',
                    placeholder: 'Auto-calculated from trip days',
                    description: 'Optional — defaults to Start date + trip duration.',
                    date: {
                      pickerAppearance: 'dayOnly',
                      displayFormat: 'd MMM yyyy',
                    },
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'status',
                  label: 'Availability',
                  type: 'select',
                  required: true,
                  defaultValue: 'available',
                  options: [...departureStatusOptions],
                  admin: { width: '34%' },
                },
                {
                  name: 'price',
                  label: 'Price override',
                  type: 'number',
                  min: 0,
                  admin: {
                    width: '33%',
                    description: 'Optional — uses Pricing → Price From when blank.',
                  },
                },
                {
                  name: 'note',
                  label: 'Note',
                  type: 'text',
                  admin: {
                    width: '33%',
                    placeholder: 'e.g. 4 spots left',
                    description: 'Optional short badge or note.',
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'departures',
          label: 'Additional departure notes',
          type: 'richText',
          editor: contentEditor(),
          localized: true,
          admin: {
            description:
              'Optional notes displayed below the calendar and departure dates (e.g. private group departures, custom dates or seasonal notes).',
          },
        },
      ],
    },

    /* --------------------------------------------------------------------------
       Optional sections — closed until needed
       -------------------------------------------------------------------------- */
    {
      type: 'collapsible',
      label: 'Inclusions',
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
      ],
    },
    {
      type: 'collapsible',
      label: 'FAQs',
      admin: { initCollapsed: true },
      // Shared with Blog (src/fields/faqs.ts), so both pages render the same FAQ section.
      fields: faqFields(),
    },
    {
      type: 'collapsible',
      label: 'Packing list',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'packingList',
          type: 'array',
          localized: true,
          labels: { singular: 'Packing item', plural: 'Packing list items' },
          admin: {
            description:
              'Personal gear and essentials travellers should bring. Each item is filed under one of the three accordions on the trip page — Clothing and Footwear, Trekking Equipment, Personal Items.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'item',
                  type: 'text',
                  required: true,
                  admin: { width: '60%' },
                },
                {
                  name: 'category',
                  type: 'select',
                  // Optional in the schema (a localized required select would block saving a
                  // language until every row was re-tagged) but defaulted in the editor, so new
                  // rows are filed the moment they are added. Rows saved before categories
                  // existed fall into a group by keyword on the frontend — see
                  // src/lib/trip-packing.ts.
                  defaultValue: 'trekking-equipment',
                  options: [
                    { label: 'Clothing and Footwear', value: 'clothing-footwear' },
                    { label: 'Trekking Equipment', value: 'trekking-equipment' },
                    { label: 'Personal Items', value: 'personal-items' },
                  ],
                  admin: { width: '40%' },
                },
              ],
            },
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
    /* Which phrases should link to this trip from other pages — chosen by hand, not inferred
       from the SEO keywords above. See src/fields/internal-link-keywords.ts. */
    internalLinkKeywordsSection(),
    metaField(),
    viewLiveField(),
  ],
}
