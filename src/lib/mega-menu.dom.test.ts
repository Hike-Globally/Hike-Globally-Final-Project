import assert from 'node:assert/strict'
import { test } from 'node:test'

import { JSDOM } from 'jsdom'
import { act, createElement } from 'react'

import type { DestinationCard, TripCard } from './data'
import { buildMegaMenuData } from './mega-menu'
import type { Media } from '../payload-types'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://hikeglobally.test/',
  pretendToBeVisual: true,
})

const scope = dom.window as unknown as Record<string, unknown>
for (const key of [
  'document',
  'navigator',
  'location',
  'HTMLElement',
  'Element',
  'Node',
  'Event',
  'MouseEvent',
  'FocusEvent',
  'DocumentFragment',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
]) {
  Object.defineProperty(globalThis, key, { value: scope[key], configurable: true, writable: true })
}
Object.defineProperty(globalThis, 'window', {
  value: dom.window,
  configurable: true,
  writable: true,
})
Object.defineProperty(globalThis, 'self', {
  value: dom.window,
  configurable: true,
  writable: true,
})
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const { createRoot } = await import('react-dom/client')
const { DesktopMegaMenu, MobileMegaMenu } = await import(
  '../components/layout/mega-menu-panel'
)

const media = (url: string, alt: string): Media =>
  ({
    id: 1,
    url,
    alt,
    focalX: 50,
    focalY: 50,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }) as Media

const destinations: DestinationCard[] = [
  {
    id: 1,
    name: 'Khumbu',
    slug: 'khumbu',
    country: 'Nepal',
    tagline: 'Home of Everest and Sherpa monasteries.',
    heroImage: media('/images/admin/himalaya-01.jpg', 'Khumbu peaks'),
    region: 'khumbu',
    featured: true,
  },
  {
    id: 2,
    name: 'Mustang',
    slug: 'mustang',
    country: 'Nepal',
    tagline: 'Ochre cliffs and ancient cave monasteries.',
    heroImage: media('/images/admin/himalaya-02.jpg', 'Mustang cliffs'),
    region: 'mustang',
    featured: false,
  },
]

const trips: TripCard[] = [
  {
    id: 10,
    title: 'Everest Base Camp Trek',
    slug: 'everest-base-camp',
    summary: 'Classic Khumbu trail.',
    heroImage: media('/images/admin/himalaya-01.jpg', 'EBC'),
    tripType: 'trekking',
    durationDays: 14,
    maxAltitude: 5364,
    difficulty: 'challenging',
    bestSeasons: ['spring', 'autumn'],
    priceFrom: 1850,
    priceCurrency: 'USD',
    featured: true,
    destination: { id: 1, name: 'Khumbu', slug: 'khumbu' },
  },
  {
    id: 11,
    title: 'Upper Mustang Trail',
    slug: 'upper-mustang',
    summary: 'Walled kingdom behind the rain shadow.',
    heroImage: media('/images/admin/himalaya-02.jpg', 'Mustang'),
    tripType: 'cultural',
    durationDays: 12,
    maxAltitude: 3840,
    difficulty: 'moderate',
    bestSeasons: ['autumn'],
    priceFrom: 2200,
    priceCurrency: 'USD',
    featured: true,
    destination: { id: 2, name: 'Mustang', slug: 'mustang' },
  },
]

const megaData = buildMegaMenuData({ destinations, trips })

const mount = () => {
  const container = dom.window.document.createElement('div')
  dom.window.document.body.appendChild(container)
  const root = createRoot(container)
  return {
    container,
    render: (element: React.ReactElement) => {
      act(() => {
        root.render(element)
      })
    },
    unmount: () => {
      act(() => {
        root.unmount()
      })
      container.remove()
    },
  }
}

test('Destinations desktop mega menu lists regions, updates photo preview on hover, and closes on click', () => {
  let closed = 0
  const host = mount()

  try {
    host.render(
      createElement(DesktopMegaMenu, {
        kind: 'destinations',
        data: megaData,
        customLinks: [
          { href: '/destinations', label: 'All destinations', newTab: false },
          { href: '/about', label: 'Meet our Sherpa guides', newTab: false },
        ],
        pathname: '/destinations/khumbu',
        onNavigate: () => {
          closed += 1
        },
      }),
    )

    // Lists both published destinations and deduplicates the root `/destinations` link
    const directoryLinks = Array.from(host.container.querySelectorAll('.pn-mega-dest-item'))
    assert.equal(directoryLinks.length, 2)
    assert.equal(directoryLinks[0]?.getAttribute('data-active'), 'true')
    assert.match(directoryLinks[0]?.textContent ?? '', /Khumbu/)
    assert.match(directoryLinks[0]?.textContent ?? '', /1 trip/)

    // Custom non-duplicate link is preserved
    assert.match(host.container.textContent ?? '', /Meet our Sherpa guides/)

    // Featured showcase starts on Khumbu
    const showcaseTitle = () => host.container.querySelector('.pn-mega-dest-card-title')?.textContent
    const showcaseImg = () =>
      host.container.querySelector('.pn-mega-dest-card-img')?.getAttribute('src')
    assert.equal(showcaseTitle(), 'Khumbu')
    assert.equal(showcaseImg(), '/images/admin/himalaya-01.jpg')

    // Hovering Mustang updates the right-hand showcase card
    act(() => {
      directoryLinks[1]!.dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true }))
    })
    assert.equal(showcaseTitle(), 'Mustang')
    assert.equal(showcaseImg(), '/images/admin/himalaya-02.jpg')

    // Keyboard focus on Khumbu switches the preview back
    act(() => {
      ;(directoryLinks[0] as HTMLElement).focus()
    })
    assert.equal(showcaseTitle(), 'Khumbu')
    assert.equal(showcaseImg(), '/images/admin/himalaya-01.jpg')

    // Clicking the footer CTA fires onNavigate
    const cta = host.container.querySelector<HTMLAnchorElement>('.pn-mega-footer-cta')
    assert.ok(cta)
    assert.equal(cta.getAttribute('href'), '/destinations')
    cta.addEventListener('click', (event) => event.preventDefault())
    act(() => {
      cta.click()
    })
    assert.equal(closed, 1)
  } finally {
    host.unmount()
  }
})

test('Trips desktop mega menu exposes region, difficulty, style, season facets and featured photo cards', () => {
  let closed = 0
  const host = mount()

  try {
    host.render(
      createElement(DesktopMegaMenu, {
        kind: 'trips',
        data: megaData,
        customLinks: [{ href: '/trips', label: 'All trips', newTab: false }],
        pathname: '/',
        onNavigate: () => {
          closed += 1
        },
      }),
    )

    const tripCards = Array.from(host.container.querySelectorAll('.pn-mega-trip-card'))
    assert.equal(tripCards.length, 2)
    assert.match(tripCards[0]?.textContent ?? '', /Everest Base Camp Trek/)
    assert.match(tripCards[0]?.textContent ?? '', /14 days/)
    assert.match(tripCards[0]?.textContent ?? '', /5,364 m/)
    assert.match(tripCards[0]?.textContent ?? '', /\$1,850/)

    const hrefs = Array.from(host.container.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    assert.ok(hrefs.includes('/trips?destination=khumbu'))
    assert.ok(hrefs.includes('/trips?difficulty=challenging'))
    assert.ok(hrefs.includes('/trips?type=cultural'))
    assert.ok(hrefs.includes('/trips?season=autumn'))
    assert.ok(hrefs.includes('/trips'))

    const firstTripCard = tripCards[0] as HTMLAnchorElement
    firstTripCard.addEventListener('click', (event) => event.preventDefault())
    act(() => {
      firstTripCard.click()
    })
    assert.equal(closed, 1)
  } finally {
    host.unmount()
  }
})

test('Mobile mega menus render compact Destinations and Trips lists and close on navigation', () => {
  let closed = 0
  const host = mount()

  try {
    host.render(
      createElement(MobileMegaMenu, {
        kind: 'trips',
        data: megaData,
        customLinks: [],
        onNavigate: () => {
          closed += 1
        },
      }),
    )

    const tripRows = host.container.querySelectorAll('.pn-mobile-mega-trip')
    assert.equal(tripRows.length, 2)
    const viewAll = host.container.querySelector<HTMLAnchorElement>('.pn-mobile-mega-all')
    assert.equal(viewAll?.getAttribute('href'), '/trips')
    viewAll?.addEventListener('click', (event) => event.preventDefault())

    act(() => {
      viewAll?.click()
    })
    assert.equal(closed, 1)

    host.render(
      createElement(MobileMegaMenu, {
        kind: 'destinations',
        data: megaData,
        customLinks: [],
        onNavigate: () => {
          closed += 1
        },
      }),
    )

    const destRows = host.container.querySelectorAll('.pn-mobile-mega-row')
    assert.equal(destRows.length, 2)
    assert.equal(
      host.container.querySelector('.pn-mobile-mega-all')?.getAttribute('href'),
      '/destinations',
    )
  } finally {
    host.unmount()
  }
})
