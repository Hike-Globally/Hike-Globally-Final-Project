import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveLink } from './links'
import { isReservedPageSlug } from './site-routes'

test('legacy CMS enquiry links point directly to contact while preserving parameters', () => {
  assert.equal(
    resolveLink({
      type: 'custom',
      url: '/inquiry?trip=everest&startDate=2027-01-01',
      label: 'Plan your trip',
    })?.href,
    '/contact?trip=everest&startDate=2027-01-01',
  )
  assert.equal(resolveLink({ type: 'custom', url: '/inquiry#form' })?.href, '/contact#form')
  assert.equal(
    resolveLink({ type: 'custom', url: '/inquiry/thank-you' })?.href,
    '/inquiry/thank-you',
  )
  assert.equal(
    resolveLink({ type: 'custom', url: 'https://example.com/inquiry' })?.href,
    'https://example.com/inquiry',
  )
})

test('dedicated information pages reserve their CMS slugs', () => {
  for (const slug of ['about', 'contact', 'privacy', 'terms', 'inquiry', 'places'])
    assert.equal(isReservedPageSlug(slug), true)
})
