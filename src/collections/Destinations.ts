import type { CollectionConfig } from 'payload'

import { adminOrEditor, publishedOrSignedIn } from '../access'
import { metaField } from '../fields/meta'
import { slugField } from '../fields/slug'
import { revalidateDestination, revalidateDestinationDelete } from '../hooks/revalidate'

export const Destinations: CollectionConfig = {
  slug: 'destinations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'country', 'region', 'featured', 'updatedAt'],
    group: 'Content',
    livePreview: {
      url: ({ data, locale }) => `/${locale ?? 'en'}/destinations/${data?.slug ?? ''}`,
    },
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
      localized: true,
      // Deliberately NOT required: a localized required field would block saving a language
      // until every field is translated. Fallback serves the default language instead.
      admin: { description: 'The main body of the destination page.' },
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
      admin: { description: 'Used for the map link and for geographic structured data.' },
      fields: [
        { name: 'latitude', type: 'number', required: false },
        { name: 'longitude', type: 'number', required: false },
      ],
    },
    {
      name: 'gettingThere',
      type: 'richText',
      localized: true,
      admin: { description: 'How travellers reach the region (flights, drives, permits).' },
    },
    {
      name: 'gallery',
      type: 'array',
      labels: { singular: 'Image', plural: 'Gallery' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Featured destinations surface on the homepage and get pinned on listings.' },
    },
    {
      /**
       * JOIN FIELD — a read-only, database-level view of every trip whose `destination`
       * relationship points here. This is why the destination page needs no extra query to
       * list its trips, and why it can never get out of sync.
       */
      name: 'trips',
      type: 'join',
      collection: 'trips',
      on: 'destination',
      maxDepth: 1,
      admin: { defaultColumns: ['title', 'durationDays', 'priceFrom'] },
    },
    metaField(),
  ],
}
