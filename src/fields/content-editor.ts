import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'

import { linkPreviewSectionFields } from './link-preview'

/** The same card as a Page sections link preview, placed between paragraphs in Lexical. */
export const inlineLinkPreviewBlock: Block = {
  slug: 'linkPreview',
  labels: { singular: 'Link preview', plural: 'Link previews' },
  fields: linkPreviewSectionFields({ conditional: false }),
}

/** Keep the shared editor's toolbar and tables while adding the content-only card block. */
export function contentEditor() {
  return lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      EXPERIMENTAL_TableFeature(),
      BlocksFeature({ blocks: [inlineLinkPreviewBlock] }),
    ],
    admin: { placeholder: 'Start writing…' },
  })
}
