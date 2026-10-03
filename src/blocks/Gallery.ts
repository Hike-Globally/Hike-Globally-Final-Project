import type { Block } from 'payload'

export const Gallery: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Gallery', plural: 'Gallery' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Image', plural: 'Images' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 columns', value: '2' },
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'aspectRatio',
      type: 'select',
      defaultValue: '4/3',
      options: [
        { label: '4:3 landscape', value: '4/3' },
        { label: '1:1 square', value: '1/1' },
        { label: '3:4 portrait', value: '3/4' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
