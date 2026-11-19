import type { Field } from 'payload'

import { httpUrl } from '../lib/http-url'

/**
 * The shared "social profiles" array — the same field on Site settings (the Organization's
 * `sameAs`) and on Users (the author's `sameAs`). One definition, so the two can never drift
 * apart: a platform added here is available in both places, and both serialize into the
 * structured data the same way (see `organizationJsonLd()` / `personJsonLd()` in src/lib/seo.ts).
 */
export const socialsField = (): Field => ({
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
        {
          name: 'url',
          type: 'text',
          required: true,
          validate: (value: unknown) =>
            Boolean(httpUrl(value)) || 'Enter a full http:// or https:// profile URL.',
          admin: { width: '50%' },
        },
      ],
    },
  ],
})
