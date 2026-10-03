import type { Block } from 'payload'

export const Testimonials: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: { singular: 'Testimonials', plural: 'Testimonials' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Testimonial', plural: 'Testimonials' },
      fields: [
        { name: 'quote', type: 'textarea', required: true },
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true, admin: { width: '40%' } },
            { name: 'role', type: 'text', admin: { width: '40%', description: 'e.g. EBC trek, April 2025' } },
            {
              name: 'rating',
              type: 'select',
              defaultValue: '5',
              options: [
                { label: '5 / 5', value: '5' },
                { label: '4 / 5', value: '4' },
                { label: '3 / 5', value: '3' },
              ],
              admin: { width: '20%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'avatar', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
            { name: 'trip', type: 'relationship', relationTo: 'trips', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'light',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
