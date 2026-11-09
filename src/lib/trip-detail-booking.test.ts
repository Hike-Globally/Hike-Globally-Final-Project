import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { DIFFICULTY_LEVELS } from '@/lib/difficulty'
import type { Trip } from '@/payload-types'

// TripDetail imports section stylesheets, which Node cannot load when rendering in tests.
register(
  'data:text/javascript,' +
    encodeURIComponent(
      `export async function resolve(specifier, context, nextResolve) {
         if (specifier.endsWith('.css')) {
           return { url: 'data:text/javascript,export default {}', shortCircuit: true, format: 'module' }
         }
         return nextResolve(specifier, context)
       }`,
    ),
)

const { TripDetail } = await import('@/components/views/trip-detail')

const trip: Trip = {
  id: 1,
  title: 'Mountain Trek',
  slug: 'mountain-trek',
  pageSections: [{ kind: 'overview' }],
  summary: 'A mountain adventure.',
  heroImage: 1,
  destination: 1,
  tripType: 'trekking',
  durationDays: 7,
  durationNights: 6,
  difficulty: 'easy',
  priceFrom: 1850,
  priceCurrency: 'USD',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

test('booking cards show every difficulty level without a text background', () => {
  for (const level of DIFFICULTY_LEVELS) {
    const html = renderToStaticMarkup(
      createElement(TripDetail, { trip: { ...trip, difficulty: level.value }, related: [] }),
    )
    const labels = [
      ...html.matchAll(
        /<dt[^>]*>[\s\S]*?Difficulty level<\/dt><dd><span class="([^"]+)">([^<]+)<\/span><\/dd>/g,
      ),
    ]

    // The same card is rendered in the mobile body and the desktop sticky sidebar.
    assert.equal(labels.length, 2, `${level.value} should appear in both booking cards`)
    assert.match(html, /class="mb-16 lg:hidden"/)
    assert.match(html, /<aside class="hidden lg:sticky/)
    for (const [, classes, text] of labels) {
      assert.equal(text, level.label)
      assert.doesNotMatch(classes, /(?:^|\s)bg-/, `${level.label} should have no background`)
      for (const textClass of ['px-3', 'py-1', 'text-small', 'font-medium', 'text-white']) {
        assert.ok(classes.split(' ').includes(textClass), `${level.label} should keep ${textClass}`)
      }
    }

    assert.equal((html.match(/Book This Trek/g) ?? []).length, 2)
    assert.equal((html.match(/\$1,850/g) ?? []).length, 2)
    assert.equal((html.match(/7 days \/ 6 nights/g) ?? []).length, 2)
  }
})
