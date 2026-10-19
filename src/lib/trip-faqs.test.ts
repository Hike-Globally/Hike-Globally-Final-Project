import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Field } from 'payload'

import { Blog } from '../collections/Blog'
import { Trips } from '../collections/Trips'
import { faqFields } from '../fields/faqs'
import { getTripFaqGroups, tripFaqCategories } from './trip-faqs'

/** A collection's data fields, looking through rows, collapsibles and unnamed tabs. */
const dataFields = (fields: Field[]): Field[] =>
  fields.flatMap((field) => {
    if (field.type === 'row' || field.type === 'collapsible') return dataFields(field.fields)
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => ('name' in tab && tab.name ? [] : dataFields(tab.fields)))
    }
    return [field]
  })

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

test('FAQ fields are one localized question/answer list per category, in order', () => {
  const fields = faqFields()

  assert.deepEqual(
    fields.map(({ name, label }) => ({ name, label })),
    tripFaqCategories.map(({ field, heading }) => ({ name: field, label: heading })),
  )
  for (const field of fields) {
    assert.equal(field.type, 'array')
    assert.equal(field.localized, true)
    assert.deepEqual(
      field.fields.map((subfield) => ('name' in subfield ? subfield.name : null)),
      ['question', 'answer'],
    )
  }
})

test('trips and blog posts define the same FAQ fields, so both pages render the same section', () => {
  const faqNames = new Set<string>(tripFaqCategories.map(({ field }) => field))

  for (const collection of [Trips, Blog]) {
    assert.deepEqual(
      dataFields(collection.fields).filter((field) => 'name' in field && faqNames.has(field.name)),
      faqFields(),
      `${collection.slug}: take the FAQ fields from faqFields() (src/fields/faqs.ts)`,
    )
  }
})
