import { blogCategoryOptions } from '../lib/blog-categories'
import type { CollectionConfig } from 'payload'

import { adminOrEditor, publishedOrSignedIn } from '../access'
import { faqFields } from '../fields/faqs'
import { contentEditor } from '../fields/content-editor'
import { pageSectionsField } from '../fields/page-sections'
import { blogSectionOptions } from '../lib/page-sections'
import { internalLinkKeywordsSection } from '../fields/internal-link-keywords'
import { keywordsSection } from '../fields/keywords'
import { metaField } from '../fields/meta'
import { placeCategoriesField } from '../fields/place-categories'
import { slugField } from '../fields/slug'
import { viewLiveField } from '../fields/view-live'
import { populatePublishedAt, revalidatePost, revalidatePostDelete } from '../hooks/revalidate'
import { siteLivePreviewURL } from '../lib/live-preview-url'

export const Blog: CollectionConfig = {
  slug: 'blog',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'publishedAt', 'featured', 'updatedAt', 'viewLive'],
    group: 'Content',
    components: {
      edit: {
        beforeDocumentControls: ['@/components/admin/view-live-button'],
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
    // Sets publishedAt the first time a post is published, and never overwrites it afterwards.
    beforeChange: [populatePublishedAt],
    afterChange: [revalidatePost],
    afterDelete: [revalidatePostDelete],
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    slugField('title'),
    pageSectionsField(blogSectionOptions),
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      required: true,
      maxLength: 220,
      admin: { description: 'Shown on cards and used as the meta description fallback.' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      editor: contentEditor(),
      localized: true,
      admin: {
        description:
          'The post body. Insert Link preview, Multi-URL Preview, or Boxed Content from the toolbar’s block menu to place a card, a collection of URLs, or an image-and-copy feature among your text. Tables are available from the toolbar’s “+” menu (or type /table): pick rows and columns, then use the hover handles to add, remove, merge or resize. Handy for gear comparisons, cost breakdowns and at-a-glance facts.',
      },
    },
    /* FAQs — the same categorised question lists as a trip (src/fields/faqs.ts), rendered as the
       same "Frequently Asked Questions" section. Optional, so the panel starts closed. */
    {
      type: 'collapsible',
      label: 'FAQs',
      admin: {
        initCollapsed: true,
        description:
          'Shown in a Frequently Asked Questions section, grouped under these headings exactly like on trip pages. Empty groups are hidden. By default the section sits right after the post body; move it with the FAQs row in Page sections.',
      },
      fields: faqFields(),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'publishedAt',
          type: 'date',
          // Not required: drafts are saved before they are published. populatePublishedAt()
          // fills it in on first publish, and the frontend falls back to `createdAt`.
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    {
      name: 'categories',
      type: 'select',
      hasMany: true,
      options: blogCategoryOptions,
      admin: { description: 'Drives the category filter on /blog.' },
    },
    // Separate from editorial categories: this maps a post into the homepage
    // Browse Places taxonomy and its dedicated /places page.
    placeCategoriesField(),
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'blog',
      hasMany: true,
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: { description: 'Leave empty to auto-fill with the most recent posts.' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Featured posts are pinned on /blog and can be highlighted on the homepage.',
      },
    },
    /* Keywords — the phrases this post is targeting. Its own panel, directly above the SEO
       group, so the list is written while the post is written. See src/fields/keywords.ts. */
    keywordsSection(),
    /* The phrases that should link to this post from other pages. Separate from the SEO keywords
       above: those are what the post targets, these are what an editor wants turned into links. */
    internalLinkKeywordsSection(),
    metaField(),
    viewLiveField(),
  ],
}
