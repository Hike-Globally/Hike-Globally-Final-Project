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

/** Keep the shared editor's toolbar and tables alongside both preview blocks. */
export function contentEditor() {
  return lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      EXPERIMENTAL_TableFeature(),
      BlocksFeature({ blocks: [inlineLinkPreviewBlock, inlineMultiUrlPreviewBlock] }),
    ],
    admin: { placeholder: 'Start writing…' },
  })
}
