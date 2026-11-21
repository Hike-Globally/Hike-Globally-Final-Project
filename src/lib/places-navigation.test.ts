import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { dictionary } from '../i18n/dictionaries'
import { translations as de } from '../i18n/translations/de'
import { translations as fr } from '../i18n/translations/fr'
import { withPlacesFooterLink, withPlacesHeaderLink } from './places-navigation'

const places = { href: '/places', label: dictionary.nav.places, newTab: false }
const trips = { href: '/trips', label: 'Trips', newTab: false }
const destinations = { href: '/destinations', label: 'Destinations', newTab: false }
const journal = { href: '/blog', label: 'Journal', newTab: false }

test('header adds a direct Places link after destinations and preserves existing links', () => {
  assert.deepEqual(withPlacesHeaderLink([trips, destinations, journal], places), [
    trips, destinations, places, journal,
  ])
  assert.deepEqual(withPlacesHeaderLink([], places), [places])
  assert.deepEqual(withPlacesHeaderLink([journal], places), [journal, places])
  const existing = { ...places, href: '/places/?ref=menu', label: 'Explore places' }
  assert.deepEqual(withPlacesHeaderLink([trips, existing], places), [trips, existing])
})

test('footer adds Places once in a travel column, or the first available column', () => {
  const columns = [
    { heading: 'Company', links: [journal] },
    { heading: 'Trips', links: [trips, destinations] },
  ]
  assert.deepEqual(withPlacesFooterLink(columns, places), [
    columns[0],
    { heading: 'Trips', links: [trips, destinations, places] },
  ])
  assert.deepEqual(withPlacesFooterLink([columns[0]!], places), [
    { heading: 'Company', links: [journal, places] },
  ])
  const existing = [{ heading: 'Custom', links: [{ ...places, href: '/places/' }] }]
  assert.deepEqual(withPlacesFooterLink(existing, places), existing)
  assert.deepEqual(withPlacesFooterLink([], places), [])
})

test('header and footer apply the link to CMS and fallback menus and translate the label', () => {
  const header = readFileSync(new URL('../components/layout/header.tsx', import.meta.url), 'utf8')
  const footer = readFileSync(new URL('../components/layout/footer.tsx', import.meta.url), 'utf8')
  assert.match(header, /withPlacesHeaderLink\(fallbackLinks/)
  assert.match(footer, /withPlacesFooterLink\(cmsColumns\.length \? columnsWithSitemap : fallbackColumns/)
  for (const source of [header, footer]) {
    assert.match(source, /href: sitePath\('\/places'\)/)
    assert.match(source, /label: dict\.nav\.places/)
  }
  assert.equal(de.Places, 'Orte')
  assert.equal(fr.Places, 'Lieux')
})
