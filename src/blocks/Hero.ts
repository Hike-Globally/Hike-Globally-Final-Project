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
          'The headline. Every hero is set the same way, so the homepage and a page hero cannot drift apart: wrap the second line in <i>…</i> to set it in the Instrument Serif italic accent face at headline size, e.g. "Discover Global <i>Adventures with Hike Globally</i>". The homepage hero additionally sets the first line in Cal Sans, so there it reads as two faces; on every other hero the whole heading stays Instrument Serif. Only <i> and <em> are recognised; every other tag — <br> included, so two lines are always the <i> pair — is shown as plain text.',
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
