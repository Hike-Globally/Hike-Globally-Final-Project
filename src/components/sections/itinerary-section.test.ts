import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ItinerarySection } from './itinerary-section'
import type { Media, Trip } from '@/payload-types'

const image = (id: number): Media => ({
  id,
  alt: `Trail view ${id}`,
  url: `/api/media/file/trail-${id}.jpg`,
  mimeType: 'image/jpeg',
  createdAt: '',
  updatedAt: '',
})
const render = (photos: Partial<NonNullable<Trip['itinerary']>[number]>) =>
  renderToStaticMarkup(
    createElement(ItinerarySection, {
      days: [{ day: 1, title: 'The trail', description: 'A day in the mountains.', ...photos }],
    }),
  )

test('shows up to three day photos in order with their accessible alt text', () => {
  const html = render({ image1: image(1), image2: image(2), image3: image(3) })
  assert.match(html, /grid-cols-3/)
  assert.ok(html.indexOf('Trail view 1') < html.indexOf('Trail view 2'))
  assert.ok(html.indexOf('Trail view 2') < html.indexOf('Trail view 3'))
})

test('partial and missing images do not leave empty gallery slots', () => {
  assert.match(render({ image2: image(2), image3: image(3) }), /grid-cols-2/)
  assert.match(render({ image3: image(3) }), /grid-cols-1/)
  assert.doesNotMatch(render({ image1: 123 }), /aspect-square/)
  assert.doesNotMatch(render({}), /aspect-square/)
})
