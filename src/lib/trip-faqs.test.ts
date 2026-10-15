import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getTripFaqGroups, tripFaqCategories } from './trip-faqs'

test('trip FAQ categories use the requested headings and order', () => {
  assert.deepEqual(
    tripFaqCategories.map(({ heading }) => heading),
    [
      'General Questions',
      'Best Time To Trek',
      'Required Permits For The Trek',
      "Trekker's Safety and Well-Being",
      'Packing List',
      'Altitude Sickness',
      'Accommodation During The Trek',
    ],
  )
})

test('trip FAQ groups keep category order and omit empty questions and categories', () => {
  const groups = getTripFaqGroups({
    accommodationFaqs: [{ question: 'Where do we stay?', answer: 'In teahouses.' }],
    faqs: [
      { question: 'How fit should I be?', answer: 'Comfortably fit.' },
      { question: '   ', answer: 'This question should not render.' },
      { answer: 'This answer has no question.' },
    ],
    altitudeSicknessFaqs: [{ question: 'How do I prevent altitude sickness?' }],
  })

  assert.deepEqual(
    groups.map(({ heading, faqs }) => ({ heading, questions: faqs.map(({ question }) => question) })),
    [
      { heading: 'General Questions', questions: ['How fit should I be?'] },
      {
        heading: 'Altitude Sickness',
        questions: ['How do I prevent altitude sickness?'],
      },
      { heading: 'Accommodation During The Trek', questions: ['Where do we stay?'] },
    ],
  )
})
