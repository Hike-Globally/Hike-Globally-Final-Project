/**
 * The fallback tile on the link card. It is what a reader sees when the linked page declares no
 * image or its host refuses to serve one, so the letter has to be sensible for the hosts that
 * actually show up in a Page sections URL: `www.` prefixes, punycode domains, ports.
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import { initialOf } from './link-preview-thumb'

test('the fallback tile uses the first letter of the site, without the www', () => {
  assert.equal(initialOf('booking.com'), 'B')
  assert.equal(initialOf('www.booking.com'), 'B')
  assert.equal(initialOf('guide-to-iceland.example'), 'G')
  assert.equal(initialOf('9flats.com'), '9')
})

test('the fallback tile copes with odd host strings', () => {
  assert.equal(initialOf(''), '?')
  assert.equal(initialOf('www.'), '?')
  assert.equal(initialOf('-leading-dash.example'), 'L')
  assert.equal(initialOf('xn--80ak6aa92e.com'), 'X')
})
