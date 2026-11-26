import { newsCategoryOptions } from '../lib/news-categories'
import type { CollectionConfig } from 'payload'

import { adminOrEditor, publishedOrSignedIn } from '../access'
import { faqFields } from '../fields/faqs'
import { contentEditor } from '../fields/content-editor'
import { pageSectionsField } from '../fields/page-sections'
import { newsSectionOptions } from '../lib/page-sections'
import { internalLinkKeywordsSection } from '../fields/internal-link-keywords'
import { keywordsSection } from '../fields/keywords'
import { metaField } from '../fields/meta'
import { slugField } from '../fields/slug'
import { viewLiveField } from '../fields/view-live'
import { populatePublishedAt, revalidateNews, revalidateNewsDelete } from '../hooks/revalidate'
import { siteLivePreviewURL } from '../lib/live-preview-url'
import { withoutAdminHelp } from '../lib/without-admin-help'

export const News: CollectionConfig = {
  slug: 'news',
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
    // Sets publishedAt the first time an article is published, and never overwrites it afterwards.
    beforeChange: [populatePublishedAt],
    afterChange: [revalidateNews],
    afterDelete: [revalidateNewsDelete],
  },
  fields: withoutAdminHelp([
    { name: 'title', type: 'text', localized: true, required: true },
    slugField('title'),
    pageSectionsField(newsSectionOptions),
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
          'The article body. Insert Link preview or Multi-URL Preview from the toolbar’s block menu to place a card or a collection of URLs among your text. Tables are available from the toolbar’s “+” menu (or type /table): pick rows and columns, then use the hover handles to add, remove, merge or resize.',
      },
    },
    /* FAQs — the same categorised question lists as a post (src/fields/faqs.ts), rendered as a
       "Frequently Asked Questions" section. Optional, so the panel starts closed. */
    {
      type: 'collapsible',
      label: 'FAQs',
      admin: {
        initCollapsed: true,
        description:
          'Shown in a Frequently Asked Questions section, grouped under their headings exactly like on posts. Empty groups are hidden. By default the section sits right after the article body; move it with the FAQs row in Page sections.',
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
      options: newsCategoryOptions,
      admin: { description: 'Drives the category filter on /news.' },
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'news',
      hasMany: true,
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: { description: 'Leave empty to auto-fill with the most recent articles.' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Featured articles are pinned on /news.',
      },
    },
    /* Keywords — the phrases this article is targeting. Its own panel, directly above the SEO
       group, so the list is written while the article is written. See src/fields/keywords.ts. */
    keywordsSection(),
    /* The phrases that should link to this article from other pages. Separate from the SEO keywords
       above: those are what the article targets, these are what an editor wants turned into links. */
    internalLinkKeywordsSection(),
    metaField(),
    viewLiveField(),
  ]),
}
