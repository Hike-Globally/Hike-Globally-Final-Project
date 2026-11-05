import type { Block } from 'payload'

import { linkField } from '../fields/link'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Hero' },
  fields: [
    { name: 'eyebrow', type: 'text', admin: { description: 'Small label above the heading.' } },
    {
      name: 'heading',
      type: 'text',
      required: true,
      admin: {
        description:
          'Wrap part of the heading in <i>…</i> to set it in the italic accent face: it becomes its own second line, in Instrument Serif italic at the same size as the headline — e.g. "Walk Where The <i>Map Runs Out of Names</i>". Every hero on the site sets it the same way. Only <i> and <em> are recognised; every other tag is shown as plain text.',
      },
    },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Landscape, at least 1920px wide. The original upload is served without recompression.',
      },
    },
    linkField({ name: 'primaryLink', label: 'Primary button' }),
    linkField({ name: 'secondaryLink', label: 'Secondary button' }),
    /* There is no height setting: every hero on the site is a full-screen band
       (`.hero-region` — see `frontend/globals.css`), the same one viewport tall
       whether it opens the homepage, a listing or a detail page. An editor cannot
       shorten it, so the page rhythm is identical everywhere a hero is placed. */
    {
      name: 'overlay',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Strong (best for light photos)', value: 'strong' },
        { label: 'Medium', value: 'medium' },
        { label: 'None', value: 'none' },
      ],
      admin: { position: 'sidebar', description: 'Dark scrim behind the text, for legibility.' },
    },
  ],
}
