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

/**
 * Coerce a legacy plain-text Boxed Content description into a Lexical editor state.
 *
 * Boxed Content descriptions used to be stored as plain `textarea` strings. Converting strings on
 * read and before validation keeps previously saved Trip and Blog documents editable in the
 * Lexical editor without throwing a "value passed to the Lexical editor is not an object" error.
 */
export function coerceBoxedContentDescriptionToLexical(value: unknown): unknown {
  if (typeof value !== 'string') return value

  const normalized = value.replace(/\r\n?/g, '\n').trim()
  if (!normalized) {
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        direction: null,
        children: [
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: null,
            textFormat: 0,
            textStyle: '',
            children: [],
          },
        ],
      },
    }
  }

  const paragraphs = normalized.split(/\n{2,}/).map((block) => {
    const lines = block.split('\n')
    const children: Record<string, unknown>[] = []
    lines.forEach((line, index) => {
      if (index > 0) {
        children.push({ type: 'linebreak', version: 1 })
      }
      if (line.length > 0) {
        children.push({
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: line,
          version: 1,
        })
      }
    })
    return {
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      textFormat: 0,
      textStyle: '',
      children,
    }
  })

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs,
    },
  }
}

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

/**
 * Rich-text editor for Boxed Content descriptions.
 *
 * Exposes the full editorial toolbar (add menu, inline blocks, text/heading styles, alignment,
 * indentation, inline formatting, links, and tables) without including Boxed Content itself so the
 * block schema never recurses infinitely.
 */
export function boxedContentEditor() {
  return lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      EXPERIMENTAL_TableFeature(),
      BlocksFeature({
        blocks: [inlineLinkPreviewBlock, inlineMultiUrlPreviewBlock],
      }),
    ],
    admin: { placeholder: 'Write a concise description…' },
  })
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
      type: 'richText',
      editor: boxedContentEditor(),
      required: true,
      hooks: {
        afterRead: [({ value }) => coerceBoxedContentDescriptionToLexical(value)],
        beforeValidate: [({ value }) => coerceBoxedContentDescriptionToLexical(value)],
      },
      admin: {
        className: 'hg-trip-compact-editor',
        description:
          'Format copy with headings, alignment, lists, links, tables, and inline blocks. Keep this focused; the copy sits beside the image on larger screens.',
      },
    },
    {
      name: 'image',
      label: 'Image',
      type: 'upload',
      relationTo: 'media',
      // Optional: admins can publish a Boxed Content block with copy alone. The public renderer
      // already degrades to a single full-width copy column when no image is attached.
      required: false,
      filterOptions: { mimeType: { contains: 'image/' } },
      admin: {
        description:
          'Optional. Choose an image from the media library; without one the block renders as copy only. When set, its alt text is used for accessibility.',
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
