import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { TripCard } from '@/components/cards/trip-card'
import { DIFFICULTY_LEVELS } from '@/lib/difficulty'
import type { TripCard as TripCardData } from '@/lib/data'

const trip: TripCardData = {
  id: 1,
  title: 'Mountain Trek',
  slug: 'mountain-trek',
  summary: 'A mountain adventure.',
  heroImage: {
    id: 1,
    alt: 'Mountains',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  tripType: 'trekking',
  durationDays: 7,
  difficulty: 'easy',
  priceFrom: 1000,
  priceCurrency: 'USD',
  destination: { id: 1, name: 'Nepal', slug: 'nepal' },
}

test('trip cards omit difficulty for every level while retaining featured and trip information', () => {
  for (const level of DIFFICULTY_LEVELS) {
    const html = renderToStaticMarkup(
      createElement(TripCard, { trip: { ...trip, difficulty: level.value, featured: true } }),
    )
    assert.doesNotMatch(html, new RegExp(level.label, 'i'))
    assert.match(html, /Featured/)
    assert.match(html, /Mountain Trek/)
    assert.match(html, /Nepal/)
    assert.match(html, /href="\/trips\/mountain-trek"/)
  }

  const html = renderToStaticMarkup(createElement(TripCard, { trip: { ...trip, featured: false } }))
  assert.doesNotMatch(html, /Featured/)
})
