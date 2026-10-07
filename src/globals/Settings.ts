import type { GlobalConfig } from 'payload'

import { adminOrEditor, anyone } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'
import { siteLivePreviewURL } from '../lib/live-preview-url'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Site settings',
  admin: {
    components: {
      elements: {
        beforeDocumentControls: ['@/components/admin/live-preview-toggle'],
      },
    },
    livePreview: { url: siteLivePreviewURL },
  },
  access: {
    read: anyone,
    update: adminOrEditor,
  },
  hooks: {
    afterChange: [revalidateGlobal('settings')],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'siteName', type: 'text', required: true, defaultValue: 'Hike Globally', admin: { width: '50%' } },
        { name: 'tagline', type: 'text', localized: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'logo', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
        {
          name: 'defaultOgImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Default social share image',
          admin: { width: '50%', description: 'Used when a page has no image of its own. 1200×630px.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', required: true, admin: { width: '33%' } },
        { name: 'phone', type: 'text', admin: { width: '33%' } },
        { name: 'whatsapp', type: 'text', admin: { width: '33%', description: 'Digits only, e.g. 9779851000000' } },
      ],
    },
    {
      name: 'address',
      type: 'textarea',
      localized: true,
      admin: { description: 'Shown in the footer and used for LocalBusiness structured data.' },
    },
    {
      name: 'socials',
      type: 'array',
      labels: { singular: 'Social profile', plural: 'Social profiles' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'platform',
              type: 'select',
              required: true,
              options: [
                { label: 'Instagram', value: 'instagram' },
                { label: 'Facebook', value: 'facebook' },
                { label: 'YouTube', value: 'youtube' },
                { label: 'TikTok', value: 'tiktok' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'X', value: 'x' },
              ],
              admin: { width: '50%' },
            },
            { name: 'url', type: 'text', required: true, admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'formsubmitEmail',
          type: 'email',
          label: 'Inquiry form email (Formsubmit.co)',
          admin: {
            width: '50%',
            description:
              'Enquiries are delivered here via Formsubmit.co. Falls back to NEXT_PUBLIC_FORMSUBMIT_EMAIL.',
          },
        },
        {
          name: 'responseTimeNote',
          type: 'text',
          localized: true,
          defaultValue: 'We reply to every enquiry within 24 hours.',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'legalName',
      type: 'text',
      admin: { description: 'Registered company name, used for Organization structured data.' },
    },
  ],
}
