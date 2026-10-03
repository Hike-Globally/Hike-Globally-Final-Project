import type { CollectionConfig } from 'payload'

import { Cta } from '../blocks/Cta'
import { Faq } from '../blocks/Faq'
import { FeaturedDestinations } from '../blocks/FeaturedDestinations'
import { FeaturedTrips } from '../blocks/FeaturedTrips'
import { Gallery } from '../blocks/Gallery'
import { Hero } from '../blocks/Hero'
import { Inquiry } from '../blocks/Inquiry'
import { LatestPosts } from '../blocks/LatestPosts'
import { RichTextBlock } from '../blocks/RichText'
import { Stats } from '../blocks/Stats'
import { Testimonials } from '../blocks/Testimonials'
import { adminOrEditor, publishedOrSignedIn } from '../access'
import { metaField } from '../fields/meta'
import { slugField } from '../fields/slug'
import { revalidatePage, revalidatePageDelete } from '../hooks/revalidate'

/**
 * Flexible pages.
 *
 * Every page is built from blocks, so an editor can assemble a landing page without a developer.
 * The page with the slug `home` is rendered by the homepage route (`/[locale]`), which is what
 * makes the homepage editable from the CMS instead of being hard-coded.
 *
 * LOCALIZATION NOTE: the `blocks` field itself is localized, which localizes both the block
 * structure and every field inside every block. Payload does not persist localized fields that
 * sit inside a non-localized blocks/array field, so this is not optional — it is the only
 * supported way to have translatable block content. The upside: an editor can reorder, add or
 * remove sections per language when a market needs it.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Content',
    livePreview: {
      url: ({ data, locale }) => {
        const slug = (data?.slug as string | undefined) ?? ''
        return slug === 'home' ? `/${locale ?? 'en'}` : `/${locale ?? 'en'}/${slug}`
      },
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
    afterChange: [revalidatePage],
    afterDelete: [revalidatePageDelete],
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    slugField('title', {
      admin: {
        position: 'sidebar',
        description:
          'The URL this page lives at, e.g. "about-us" → /about-us. The special slug "home" is the homepage.',
      },
    }),
    {
      name: 'blocks',
      type: 'blocks',
      localized: true,
      blocks: [
        Hero,
        RichTextBlock,
        FeaturedTrips,
        FeaturedDestinations,
        LatestPosts,
        Stats,
        Gallery,
        Testimonials,
        Faq,
        Inquiry,
        Cta,
      ],
      required: true,
    },
    metaField(),
  ],
}
