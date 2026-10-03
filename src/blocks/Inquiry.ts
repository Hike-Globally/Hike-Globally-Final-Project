import type { Block } from 'payload'

export const Inquiry: Block = {
  slug: 'inquiry',
  interfaceName: 'InquiryBlock',
  labels: { singular: 'Inquiry form', plural: 'Inquiry forms' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'note',
      type: 'text',
      admin: { description: 'Small print under the form, e.g. "We answer every enquiry within 24 hours."' },
    },
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      admin: { description: 'Optional: pre-select this trip in the form’s "Trip of interest" dropdown.' },
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
