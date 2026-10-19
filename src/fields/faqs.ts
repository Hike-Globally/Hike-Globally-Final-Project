import type { ArrayField } from 'payload'

import { tripFaqCategories } from '../lib/trip-faqs'

/**
 * One localized question/answer list per FAQ category (General Questions, Best Time To Trek, …).
 *
 * Shared by Trips and Blog so both collections store FAQs in the same shape and both pages render
 * the same "Frequently Asked Questions" section (`FaqSection`). The categories, their order and
 * their headings come from `tripFaqCategories`, so a heading changed there changes in the CMS and
 * on every page at once.
 */
export function faqFields(): ArrayField[] {
  return tripFaqCategories.map(({ field, heading }) => ({
    name: field,
    type: 'array',
    localized: true,
    label: heading,
    labels: { singular: 'FAQ', plural: 'FAQs' },
    admin: { initCollapsed: true },
    fields: [
      { name: 'question', type: 'text', required: true },
      { name: 'answer', type: 'textarea', required: true },
    ],
  }))
}
