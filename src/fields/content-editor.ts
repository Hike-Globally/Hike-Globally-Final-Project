import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'

import { MULTI_URL_PREVIEW_NAME } from '../lib/multi-url-preview'
import { linkPreviewSectionFields } from './link-preview'
import { multiUrlPreviewFields } from './multi-url-preview'

/** The same card as a Page sections link preview, placed between paragraphs in Lexical. */
export const inlineLinkPreviewBlock: Block = {
  slug: 'linkPreview',
  labels: { singular: 'Link preview', plural: 'Link previews' },
  fields: linkPreviewSectionFields({ conditional: false }),
}

/** A collection of cards placed at the cursor, including inside a Trip Content section. */
export const inlineMultiUrlPreviewBlock: Block = {
  slug: 'multiUrlPreview',
  labels: { singular: MULTI_URL_PREVIEW_NAME, plural: MULTI_URL_PREVIEW_NAME },
  fields: multiUrlPreviewFields({ conditional: false }),
}

/** An editorial image-and-copy feature, inserted inline in Trip and Blog rich text. */
export const inlineBoxedContentBlock: Block = {
  slug: 'boxedContent',
  labels: { singular: 'Boxed Content', plural: 'Boxed Content' },
  fields: [
    {
      name: 'heading',
      label: 'Heading',
      type: 'text',
      required: true,
      maxLength: 120,
      admin: {
        placeholder: 'A moment worth remembering',
        description: 'The feature heading shown beside the image.',
      },
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      maxLength: 900,
      admin: {
        rows: 5,
        placeholder: 'Write a concise description…',
        description: 'Keep this focused; the copy sits beside the image on larger screens.',
      },
    },
    {
      name: 'image',
      label: 'Image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: { mimeType: { contains: 'image/' } },
      admin: {
        description:
          'Choose an image from the media library. Its alt text is used for accessibility.',
      },
    },
  ],
}

/** Keep the shared editor's toolbar and tables alongside its inline content blocks. */
export function contentEditor() {
  return lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      EXPERIMENTAL_TableFeature(),
      BlocksFeature({
        blocks: [inlineLinkPreviewBlock, inlineMultiUrlPreviewBlock, inlineBoxedContentBlock],
      }),
    ],
    admin: { placeholder: 'Start writing…' },
  })
}
