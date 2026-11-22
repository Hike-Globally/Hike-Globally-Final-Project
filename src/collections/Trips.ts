import type { CollectionConfig } from 'payload'

import { adminOrEditor, publishedOrSignedIn } from '../access'
import { contentEditor } from '../fields/content-editor'
import { faqFields } from '../fields/faqs'
import { pageSectionsField } from '../fields/page-sections'
import { tripSectionOptions } from '../lib/page-sections'
import { internalLinkKeywordsSection } from '../fields/internal-link-keywords'
import { keywordsSection } from '../fields/keywords'
import { linkField } from '../fields/link'
import { metaField } from '../fields/meta'
import { placeCategoriesField } from '../fields/place-categories'
import { slugField } from '../fields/slug'
import { viewLiveField } from '../fields/view-live'
import { revalidateTrip, revalidateTripDelete } from '../hooks/revalidate'
import { coordinatesField } from '../lib/coordinates'
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
      },
    },
    pageSectionsField(tripSectionOptions),
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      required: true,
      maxLength: 220,
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
          'Use the block menu to insert Boxed Content: upload an image and add a heading and description for a responsive, image-left feature.',
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
              admin: { width: '25%' },
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
              admin: { width: '25%' },
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

    // Browse Places is a frontend taxonomy, shared with posts and the dedicated
    // /places pages. Optional and multi-select, so legacy trips stay valid.
    placeCategoriesField(),

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
          },
        },
        {
          name: 'tripForDescription',
          type: 'richText',
          editor: contentEditor(),
          label: 'Description',
          localized: true,
          admin: {
            className: 'hg-trip-compact-editor',
            description:
              'Insert Boxed Content from the toolbar’s block menu for an image-and-copy feature inside this panel.',
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
          },
        },
        {
          name: 'tripNotForDescription',
          type: 'richText',
          editor: contentEditor(),
          label: 'Description',
          localized: true,
          admin: {
            className: 'hg-trip-compact-editor',
            description:
              'Insert Boxed Content from the toolbar’s block menu for an image-and-copy feature inside this panel.',
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
              name: 'place',
              label: 'Place (chart label)',
              type: 'text',
              localized: true,
              maxLength: 40,
              admin: {
                description:
                  'The short place name plotted under this day on the altitude chart — "Namche ' +
                  'Bazaar", not "Phakding to Namche Bazaar (3,440 m)". Left empty, the chart ' +
                  'prints "Day n" instead.',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
            },
            {
              type: 'collapsible',
              label: 'Day photos',
              admin: {
                description:
                  'Add up to three images for this day. They appear together beneath the description.',
              },
              fields: [1, 2, 3].map((number) => ({
                name: `image${number}`,
                label: `Image ${number}`,
                type: 'upload' as const,
                relationTo: 'media' as const,
                filterOptions: { mimeType: { contains: 'image/' } },
              })),
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'accommodation',
                  type: 'text',
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'altitude',
                  label: 'Highest point (m)',
                  type: 'number',
                  min: 0,
                  max: 8850,
                  admin: {
                    width: '25%',
                    description:
                      'Metres above sea level at the highest point reached on this day — a pass, ' +
                      'a viewpoint, a summit — not where you sleep. Two or more days with an ' +
                      'altitude are drawn as the trip’s altitude chart.',
                  },
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
            components: { Field: '@/components/admin/instant-trip-array' },
            initCollapsed: true,
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              required: true,
            },
            {
              name: 'content',
              type: 'richText',
              editor: contentEditor(),
              required: true,
              admin: {
                className: 'hg-trip-compact-editor',
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
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Route map, live map and altitude chart',
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
          },
        },
        coordinatesField({
          label: 'Trailhead / route coordinates',
          description:
            'Pins the live map for the route. Right-click the trailhead (or the place the route ' +
            'starts from) in Google Maps → “Copy coordinates”, then paste the pair — the first ' +
            'number is latitude.',
        }),
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
                  },
                },
                {
                  name: 'note',
                  label: 'Note',
                  type: 'text',
                  admin: {
                    width: '33%',
                    placeholder: 'e.g. 4 spots left',
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
          fields: [linkField({ name: 'link', label: 'Booking link', newTab: false })],
        },
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
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
