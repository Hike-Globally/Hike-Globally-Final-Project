import type { CollectionConfig } from 'payload'

import { adminOrEditor, publishedOrSignedIn } from '../access'
import { contentEditor } from '../fields/content-editor'
import { internalLinkKeywordsSection } from '../fields/internal-link-keywords'
import { metaField } from '../fields/meta'
import { slugField } from '../fields/slug'
import { viewLiveField } from '../fields/view-live'
import { revalidateDestination, revalidateDestinationDelete } from '../hooks/revalidate'
import { siteLivePreviewURL } from '../lib/live-preview-url'

/**
 * Half a pin is not a place, so the pair either exists or it doesn't.
 *
 * `min`/`max` already keep each half inside ±90 / ±180. What they cannot catch is an editor filling
 * only one field — the destination page would then have no map and no `GeoCoordinates`, with nothing
 * in the admin to explain why. Both coordinate fields carry this check (each watches the other), so
 * whichever one the editor filled last is the one that raises the error. Drafts skip field
 * validation in Payload, so autosave still works mid-edit; the check bites on publish.
 *
 * The `0, 0` case is separate: it is the Gulf of Guinea, and it is what a number input that was
 * cleared back to zero leaves behind. It is treated as "no coordinates" rather than a pin, matching
 * `parseCoordinates()` in `src/lib/coordinates.ts`.
 */
const coordinatePairValidator =
  (other: 'latitude' | 'longitude') =>
  (value: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
    const isSet = (candidate: unknown): candidate is number =>
      typeof candidate === 'number' && Number.isFinite(candidate)

    const thisSet = isSet(value)
    const otherValue = (siblingData ?? {})[other]
    const otherSet = isSet(otherValue)

    if (thisSet !== otherSet) {
      return 'Enter both latitude and longitude, or leave both empty — one alone cannot be mapped.'
    }
    if (thisSet && value === 0 && otherValue === 0) {
      return '0, 0 is the Gulf of Guinea (the “empty pair”). Leave both fields empty instead.'
    }
    return true
  }

export const Destinations: CollectionConfig = {
  slug: 'destinations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'country', 'region', 'featured', 'updatedAt', 'viewLive'],
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
    afterChange: [revalidateDestination],
    afterDelete: [revalidateDestinationDelete],
  },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    slugField('name'),
    {
      name: 'tagline',
      type: 'textarea',
      localized: true,
      maxLength: 180,
      admin: { description: 'One line, shown on cards and at the top of the page.' },
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
      editor: contentEditor(),
      localized: true,
      // Deliberately NOT required: a localized required field would block saving a language
      // until every field is translated. Fallback serves the default language instead.
      admin: {
        description:
          'The main body of the destination page. Insert Boxed Content from the toolbar’s block menu for an image-and-copy feature.',
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'country', type: 'text', localized: true, required: true, admin: { width: '50%' } },
        {
          name: 'region',
          type: 'select',
          required: true,
          options: [
            { label: 'Khumbu / Everest', value: 'khumbu' },
            { label: 'Annapurna', value: 'annapurna' },
            { label: 'Langtang', value: 'langtang' },
            { label: 'Manaslu', value: 'manaslu' },
            { label: 'Mustang', value: 'mustang' },
            { label: 'Dolpo', value: 'dolpo' },
            { label: 'Kanchenjunga', value: 'kanchenjunga' },
            { label: 'Pokhara & Lakeside', value: 'pokhara' },
            { label: 'Kathmandu Valley', value: 'kathmandu' },
            { label: 'Other', value: 'other' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'bestSeasons',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Spring (Mar–May)', value: 'spring' },
        { label: 'Summer / Monsoon (Jun–Aug)', value: 'summer' },
        { label: 'Autumn (Sep–Nov)', value: 'autumn' },
        { label: 'Winter (Dec–Feb)', value: 'winter' },
      ],
      admin: { description: 'Drives the "best time to visit" row on the destination page.' },
    },
    {
      name: 'coordinates',
      type: 'group',
      label: 'Map coordinates',
      admin: {
        description:
          'Pins the destination page map and fills the geographic structured data. Paste any ' +
          'point from Google Maps (right-click → “Copy coordinates”) into either field: both are ' +
          'also editable as text, so “27.7172, 85.3240” can go straight into Latitude. Leave both ' +
          'empty to publish without a map.',
      },
      fields: [
        {
          name: 'latitude',
          label: 'Latitude',
          type: 'number',
          required: false,
          min: -90,
          max: 90,
          admin: {
            width: '50%',
            step: 0.000001,
            placeholder: '27.7172',
            description: '−90 (south) to 90 (north). The first number of a pasted pair.',
          },
          validate: coordinatePairValidator('longitude'),
        },
        {
          name: 'longitude',
          label: 'Longitude',
          type: 'number',
          required: false,
          min: -180,
          max: 180,
          admin: {
            width: '50%',
            step: 0.000001,
            placeholder: '85.3240',
            description: '−180 (west) to 180 (east). The second number of a pasted pair.',
          },
          validate: coordinatePairValidator('latitude'),
        },
      ],
    },
    {
      name: 'gettingThere',
      type: 'richText',
      editor: contentEditor(),
      localized: true,
      admin: {
        description:
          'How travellers reach the region (flights, drives, permits). Boxed Content is available from the block menu.',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      labels: { singular: 'Image', plural: 'Gallery' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Featured destinations surface on the homepage and get pinned on listings.',
      },
    },
    {
      /**
       * JOIN FIELD — a read-only, database-level view of every trip whose `destination`
       * relationship points here, so the list can never get out of sync.
       *
       * WATCH OUT: joined documents are populated only as deep as this field's `maxDepth`.
       * At the default of 1 each joined trip still has `heroImage` (and its own `destination`)
       * as a bare ID, so anything that draws a trip CARD must not read it from here — the
       * frontend reads trips directly at depth 1 instead (`getDestinationTrips` in
       * `src/lib/data.ts`). Raise `maxDepth` only together with the query's `depth`.
       */
      name: 'trips',
      type: 'join',
      collection: 'trips',
      on: 'destination',
      maxDepth: 1,
      admin: { defaultColumns: ['title', 'durationDays', 'priceFrom'] },
    },
    /* The phrases that should link to this destination from other pages. Destinations have no SEO
       Keywords panel, so this is the only place their anchor phrases are written. */
    internalLinkKeywordsSection(),
    metaField(),
    viewLiveField(),
  ],
}
