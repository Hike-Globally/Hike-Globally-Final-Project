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
    // Local disk fallback for development. In production, @payloadcms/storage-vercel-blob
    // takes over as soon as BLOB_READ_WRITE_TOKEN is present (see payload.config.ts).
    staticDir: path.join(dirname, '../../public/media'),
    adminThumbnail: 'card',
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800, height: 600, position: 'centre' },
      { name: 'tablet', width: 1280, formatOptions: { format: 'webp', options: { quality: 82 } } },
      { name: 'hero', width: 1920, height: 1080, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'og', width: 1200, height: 630, position: 'centre', formatOptions: { format: 'webp', options: { quality: 82 } } },
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
          'Describe the image for screen readers and image search. Required — it is also the single biggest accessibility win on the site.',
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
