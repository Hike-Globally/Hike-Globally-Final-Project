import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'

import { DestinationCard } from '@/components/cards/destination-card'
import { NEPAL_REGION_CARDS, WORLD_REGION_CARDS } from '@/lib/homepage-destinations'

test('homepage destination cards link to their respective destination pages', () => {
  const destinations: Record<string, string> = {
    'Central Nepal': 'central-nepal',
    'Eastern Nepal': 'eastern-nepal',
    'Far Western Nepal': 'far-western-nepal',
    'Mid-Western Nepal': 'mid-western-nepal',
    'Western Nepal': 'western-nepal',
    Asia: 'asia',
    Africa: 'africa',
    Europe: 'europe',
    Australia: 'australia',
    'North America': 'north-america',
    'South America': 'south-america',
  }

  const cards = [...NEPAL_REGION_CARDS, ...WORLD_REGION_CARDS]
  assert.equal(cards.length, Object.keys(destinations).length)
  assert.deepEqual(new Set(cards.map((card) => card.name)), new Set(Object.keys(destinations)))
  for (const card of cards) {
    // Skip Next's image renderer in this Node test; image data does not affect the link.
    const destination = { ...card, heroImage: { ...card.heroImage, url: undefined } }
    const html = renderToStaticMarkup(createElement(DestinationCard, { destination }))
    const link = new JSDOM(html).window.document.querySelector(`a[aria-label="Explore ${card.name}"]`)
    assert.ok(link, `missing link for ${card.name}`)
    assert.equal(link.getAttribute('href'), `/destinations/${destinations[card.name]}`)
  }
})
