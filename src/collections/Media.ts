import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionConfig } from 'payload'

import { adminOrEditor, anyone } from '../access'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Media library.
 *
 * Payload's generated sizes remain available for admin thumbnails and existing CMS records.
 * The public site always uses the original upload URL instead, without cropping or recompression.
 * Retaining these size definitions also avoids a schema change for existing installations.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: anyone,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOrEditor,
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    group: 'Library',
    // The rich text editor's upload feature (the "+" menu, `/upload` in the slash menu, and
    // drag-and-drop) only offers collections that opt in here. Without this, the editor shows no
    // media library at all, so images and video could not be placed inside page, blog, trip, or
    // destination content.
    enableRichTextRelationship: true,
  },
  upload: {
    // Lets editors choose what part of a photo survives cropping (a summit, not the sky).
    focalPoint: true,
    // Where files land is decided at startup (see src/lib/media-storage.ts): Vercel Blob when
    // BLOB_READ_WRITE_TOKEN is set, the `media_files` table in Postgres on a serverless host
    // without external storage, and this directory everywhere else — which is what makes uploads
    // survive a read-only filesystem with no extra configuration.
    staticDir: path.join(dirname, '../../public/media'),
    adminThumbnail: 'card',
    // Keep images, video and documents in one library so editors can use any of them in the CMS.
    // PDF is here for the trip brochure (see the "Trip Brochure" panel in
    // `src/collections/Trips.ts`): stored as a normal upload, Payload serves it from
    // `/api/media/file/<filename>` in every storage mode (disk, Vercel Blob, Postgres), which is
    // what keeps the public "Download Trip Brochure" link working everywhere. Documents skip
    // Payload's image resizing, so the size definitions below simply do not apply to them.
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      {
        name: 'card',
        width: 1024,
        height: 768,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 86 } },
      },
      {
        name: 'tablet',
        width: 1280,
        formatOptions: { format: 'webp', options: { quality: 90 } },
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        formatOptions: { format: 'webp', options: { quality: 92 } },
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 86 } },
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description:
          'Describe the image for screen readers and image search, or briefly describe the video. Required for every media asset.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      admin: { description: 'Optional caption shown under gallery images.' },
    },
    {
      name: 'credit',
      type: 'text',
      admin: { description: 'Optional photographer / attribution.' },
    },
  ],
}
