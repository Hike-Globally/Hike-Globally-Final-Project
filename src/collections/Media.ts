import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionConfig } from 'payload'

import { adminOrEditor, anyone } from '../access'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Media library.
 *
 * TRADE-OFF on image sizes: Payload generates every size once, at upload time, with sharp.
 * That is the single biggest performance win available to an image-heavy travel site — the
 * browser downloads a 640px card image instead of a 4MB original, and the CPU cost is paid
 * once per upload instead of once per request. The flip side is disk/Blob usage, so the list
 * below is deliberately short (5 sizes) and tuned to the actual breakpoints of this design.
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
    // Keep images and video in one library so editors can use either in the CMS.
    mimeTypes: ['image/*', 'video/*'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800, height: 600, position: 'centre' },
      { name: 'tablet', width: 1280, formatOptions: { format: 'webp', options: { quality: 82 } } },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 82 } },
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
