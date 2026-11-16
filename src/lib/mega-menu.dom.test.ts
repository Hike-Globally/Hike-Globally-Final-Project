import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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

const extraTrips: TripCard[] = [
  ...trips,
  {
    id: 12,
    title: 'Gokyo Lakes Circuit',
    slug: 'gokyo-lakes',
    summary: 'Turquoise glacial lakes and Renjo La.',
    heroImage: media('/images/admin/himalaya-01.jpg', 'Gokyo'),
    tripType: 'trekking',
    durationDays: 13,
    maxAltitude: 5357,
    difficulty: 'challenging',
    bestSeasons: ['spring', 'autumn'],
    priceFrom: 1950,
    priceCurrency: 'USD',
    featured: true,
    destination: { id: 1, name: 'Khumbu', slug: 'khumbu' },
  },
  {
    id: 13,
    title: 'Ama Dablam Base Camp',
    slug: 'ama-dablam-base',
    summary: 'Short scenic ridge trek in lower Khumbu.',
    heroImage: media('/images/admin/himalaya-02.jpg', 'Ama Dablam'),
    tripType: 'expedition',
    durationDays: 10,
    maxAltitude: 4600,
    difficulty: 'moderate',
    bestSeasons: ['autumn'],
    priceFrom: 1650,
    priceCurrency: 'USD',
    featured: false,
    destination: { id: 1, name: 'Khumbu', slug: 'khumbu' },
  },
]

const megaData = buildMegaMenuData({ destinations, trips })
const richMegaData = buildMegaMenuData({ destinations, trips: extraTrips })

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

test('Destinations desktop mega menu lists regions, updates photo preview on hover, and exposes tablet close bar', () => {
  let navigated = 0
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
          navigated += 1
        },
        onClose: () => {
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

    // Total region count badge/text is omitted from header and section head
    assert.equal(host.container.querySelector('.pn-mega-count'), null)
    assert.doesNotMatch(host.container.textContent ?? '', /\b\d+\s+regions?\b/i)
    assert.equal(
      host.container.querySelector('.pn-mega-touchbar-title-group')?.textContent,
      'Destinations',
    )

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

    // Touch / tablet close bar exposes quick "All destinations" link and dismiss button
    const touchAll = host.container.querySelector<HTMLAnchorElement>('.pn-mega-touchbar-all')
    assert.equal(touchAll?.getAttribute('href'), '/destinations')
    const closeBtn = host.container.querySelector<HTMLButtonElement>('.pn-mega-close')
    assert.ok(closeBtn)
    assert.equal(closeBtn.getAttribute('aria-label'), 'Close destinations menu')
    act(() => {
      closeBtn.click()
    })
    assert.equal(closed, 1)

    // Clicking the footer CTA fires onNavigate
    const cta = host.container.querySelector<HTMLAnchorElement>('.pn-mega-footer-cta')
    assert.ok(cta)
    assert.equal(cta.getAttribute('href'), '/destinations')
    cta.addEventListener('click', (event) => event.preventDefault())
    act(() => {
      cta.click()
    })
    assert.equal(navigated, 1)
  } finally {
    host.unmount()
  }
})

test('Trips desktop mega menu exposes region and style facets, featured cards, and close button without trip count, difficulty, or season sections', () => {
  let navigated = 0
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
          navigated += 1
        },
        onClose: () => {
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

    // Total trip count beside "Trips", "By difficulty", and "Browse by season" are all omitted
    assert.equal(
      host.container.querySelector('.pn-mega-touchbar-title-group')?.textContent,
      'Trips',
    )
    assert.equal(host.container.querySelector('.pn-mega-count'), null)
    assert.doesNotMatch(host.container.textContent ?? '', /\b\d+\s+trips?\b/i)
    assert.doesNotMatch(host.container.textContent ?? '', /By difficulty/i)
    assert.doesNotMatch(
      host.container.textContent ?? '',
      /Easy - Moderate|Moderate - Challenging|Challenging|Strenuous - Extreme/i,
    )
    assert.doesNotMatch(host.container.textContent ?? '', /Browse by season/i)
    assert.doesNotMatch(host.container.textContent ?? '', /\b(Spring|Autumn)\b/)

    const hrefs = Array.from(host.container.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    assert.ok(hrefs.includes('/trips?destination=khumbu'))
    assert.ok(hrefs.includes('/trips?type=cultural'))
    assert.ok(hrefs.includes('/trips'))
    assert.equal(hrefs.some((href) => href?.includes('difficulty=')), false)
    assert.equal(hrefs.some((href) => href?.includes('season=')), false)

    const closeBtn = host.container.querySelector<HTMLButtonElement>('.pn-mega-close')
    assert.equal(closeBtn?.getAttribute('aria-label'), 'Close trips menu')
    act(() => {
      closeBtn?.click()
    })
    assert.equal(closed, 1)

    const firstTripCard = tripCards[0] as HTMLAnchorElement
    firstTripCard.addEventListener('click', (event) => event.preventDefault())
    act(() => {
      firstTripCard.click()
    })
    assert.equal(navigated, 1)
  } finally {
    host.unmount()
  }
})

test('Mobile mega menus render featured destination banner, trip cards, more itineraries, and full filter chips', () => {
  let closed = 0
  const host = mount()

  try {
    host.render(
      createElement(MobileMegaMenu, {
        kind: 'trips',
        data: richMegaData,
        customLinks: [{ href: '/contact', label: 'Private departures', newTab: false }],
        pathname: '/',
        onNavigate: () => {
          closed += 1
        },
      }),
    )

    // 3 featured trip cards + 1 overflow itinerary row
    const tripCards = host.container.querySelectorAll('.pn-mobile-mega-trip')
    assert.equal(tripCards.length, 3)
    const moreRows = host.container.querySelectorAll('.pn-mobile-more-grid .pn-mobile-mega-row')
    assert.equal(moreRows.length, 1)
    assert.match(moreRows[0]?.textContent ?? '', /Ama Dablam Base Camp/)

    // Mobile Trips menu exposes Region, Style, and custom links, while omitting total count, Difficulty, and Season
    assert.equal(host.container.querySelector('.pn-mega-count'), null)
    assert.doesNotMatch(host.container.textContent ?? '', /\b\d+\s+trips?\b/i)
    assert.doesNotMatch(host.container.textContent ?? '', /By difficulty/i)
    assert.doesNotMatch(host.container.textContent ?? '', /By season/i)

    const tripHrefs = Array.from(host.container.querySelectorAll('a')).map((a) =>
      a.getAttribute('href'),
    )
    assert.ok(tripHrefs.includes('/trips?destination=khumbu'))
    assert.ok(tripHrefs.includes('/trips?type=cultural'))
    assert.ok(tripHrefs.includes('/contact'))
    assert.ok(tripHrefs.includes('/trips'))
    assert.equal(tripHrefs.some((href) => href?.includes('difficulty=')), false)
    assert.equal(tripHrefs.some((href) => href?.includes('season=')), false)

    const viewAll = host.container.querySelector<HTMLAnchorElement>('.pn-mobile-mega-all')
    assert.equal(viewAll?.getAttribute('href'), '/trips')
    viewAll?.addEventListener('click', (event) => event.preventDefault())

    act(() => {
      viewAll?.click()
    })
    assert.equal(closed, 1)

    // Mobile Destinations menu renders featured photo card + active route highlight + guide link
    host.render(
      createElement(MobileMegaMenu, {
        kind: 'destinations',
        data: richMegaData,
        customLinks: [{ href: '/about', label: 'Local guides', newTab: false }],
        pathname: '/destinations/mustang',
        onNavigate: () => {
          closed += 1
        },
      }),
    )

    const destHero = host.container.querySelector<HTMLAnchorElement>('.pn-mobile-dest-hero')
    assert.equal(destHero?.getAttribute('href'), '/destinations/khumbu')
    assert.match(destHero?.textContent ?? '', /Khumbu/)

    const destRows = Array.from(
      host.container.querySelectorAll<HTMLAnchorElement>('.pn-mobile-dest-grid .pn-mobile-mega-row'),
    )
    assert.equal(destRows.length, 2)
    assert.equal(destRows[0]?.getAttribute('data-active'), null)
    assert.equal(destRows[1]?.getAttribute('data-active'), 'true')

    assert.equal(host.container.querySelector('.pn-mega-count'), null)
    assert.doesNotMatch(host.container.textContent ?? '', /\b\d+\s+regions?\b/i)

    const destHrefs = Array.from(host.container.querySelectorAll('a')).map((a) =>
      a.getAttribute('href'),
    )
    assert.ok(destHrefs.includes('/destinations'))
    assert.ok(destHrefs.includes('/contact'))
    assert.ok(destHrefs.includes('/about'))
  } finally {
    host.unmount()
  }
})

test('Live-scale catalog omits 6 trips, 11 regions, all By difficulty levels, and Browse by season: Spring Autumn', () => {
  const elevenDestinations: DestinationCard[] = Array.from({ length: 11 }, (_, idx) => ({
    id: 100 + idx,
    name: `Region ${idx + 1}`,
    slug: `region-${idx + 1}`,
    country: 'Nepal',
    tagline: `Alpine valley ${idx + 1}.`,
    heroImage: media('/images/admin/himalaya-01.jpg', `Region ${idx + 1}`),
    region: 'khumbu',
    featured: idx === 0,
  }))

  const difficulties = [
    'easy-moderate',
    'moderate',
    'moderate-challenging',
    'challenging',
    'strenuous-extreme',
    'moderate',
  ] as const

  const sixTrips: TripCard[] = difficulties.map((difficulty, idx) => ({
    id: 200 + idx,
    title: `Himalayan Route ${idx + 1}`,
    slug: `himalayan-route-${idx + 1}`,
    summary: 'Guided mountain trek.',
    heroImage: media('/images/admin/himalaya-01.jpg', `Route ${idx + 1}`),
    tripType: 'trekking',
    durationDays: 10 + idx,
    maxAltitude: 4500,
    difficulty,
    bestSeasons: idx % 2 === 0 ? ['spring', 'autumn'] : ['autumn'],
    priceFrom: 1500 + idx * 100,
    priceCurrency: 'USD',
    featured: idx < 3,
    destination: {
      id: elevenDestinations[idx]!.id,
      name: elevenDestinations[idx]!.name,
      slug: elevenDestinations[idx]!.slug,
    },
  }))

  const catalogData = buildMegaMenuData({ destinations: elevenDestinations, trips: sixTrips })
  const host = mount()

  try {
    for (const Component of [DesktopMegaMenu, MobileMegaMenu]) {
      host.render(
        createElement(Component, {
          kind: 'trips',
          data: catalogData,
          customLinks: [],
          pathname: '/',
          onNavigate: () => {},
        }),
      )
      const tripsText = host.container.textContent ?? ''
      assert.doesNotMatch(tripsText, /6 trips/i)
      assert.doesNotMatch(tripsText, /By difficulty/i)
      for (const label of [
        'Easy - Moderate',
        'Moderate',
        'Moderate - Challenging',
        'Challenging',
        'Strenuous - Extreme',
      ]) {
        assert.equal(tripsText.includes(label), false, `Unexpected difficulty label: ${label}`)
      }
      assert.doesNotMatch(tripsText, /Browse by season/i)
      assert.doesNotMatch(tripsText, /By season/i)
      assert.doesNotMatch(tripsText, /\b(Spring|Autumn)\b/)

      host.render(
        createElement(Component, {
          kind: 'destinations',
          data: catalogData,
          customLinks: [],
          pathname: '/',
          onNavigate: () => {},
        }),
      )
      const destText = host.container.textContent ?? ''
      assert.doesNotMatch(destText, /11 regions/i)
    }

    // Empty rail collapses cleanly to single-column layout without an empty rail container
    const emptyData = buildMegaMenuData({ destinations: [], trips: [] })
    host.render(
      createElement(DesktopMegaMenu, {
        kind: 'trips',
        data: emptyData,
        customLinks: [],
        pathname: '/',
        onNavigate: () => {},
      }),
    )
    assert.equal(host.container.querySelector('.pn-mega-rail'), null)
    assert.ok(host.container.querySelector('.pn-mega-trips-body--single'))
  } finally {
    host.unmount()
  }
})

test('Responsive mega-menu CSS and touch tablet navigation contracts hold across viewports', () => {
  const megaCss = readFileSync(new URL('../components/layout/mega-menu.css', import.meta.url), 'utf8')
  const pillNavSrc = readFileSync(new URL('../components/layout/pill-nav.tsx', import.meta.url), 'utf8')
  const headerFrameSrc = readFileSync(
    new URL('../components/layout/header-frame.tsx', import.meta.url),
    'utf8',
  )

  // Never hide the 3rd featured trip card on tablets — promote it to a balanced full-width card
  assert.doesNotMatch(
    megaCss,
    /\.pn-mega-trip-card:nth-child\(3\)[^{]*\{[^}]*display:\s*none/,
  )
  assert.match(megaCss, /\.pn-mega-trip-card:nth-child\(3\):last-child\s*\{[^}]*grid-column:\s*1 \/ -1/)

  // Dedicated responsive tiers cover compact phones, large phones, portrait & landscape tablets, and coarse pointers
  assert.match(megaCss, /@media \(max-width: 359\.98px\)/)
  assert.match(megaCss, /@media \(min-width: 560px\) and \(max-width: 809\.98px\)/)
  assert.match(megaCss, /@media \(min-width: 680px\) and \(max-width: 809\.98px\)/)
  assert.match(megaCss, /@media \(min-width: 810px\) and \(max-width: 959\.98px\)/)
  assert.match(megaCss, /@media \(min-width: 810px\) and \(max-width: 1140px\)/)
  assert.match(megaCss, /\(hover:\s*none\)\s*or\s*\(pointer:\s*coarse\)/)

  // Touch/pen tablets tap to toggle mega menus and clamp geometry to viewport bounds
  assert.match(pillNavSrc, /isTouchLikePointer/)
  assert.match(pillNavSrc, /TOUCH_MOUSE_GUARD_MS/)
  assert.match(pillNavSrc, /--pn-mega-max-w/)
  assert.match(pillNavSrc, /--pn-mega-max-h/)
  assert.match(pillNavSrc, /--pn-mega-offset-x/)
  assert.match(pillNavSrc, /data-panel-open/)

  // Sticky header stays pinned while a desktop/tablet mega menu is open
  assert.match(headerFrameSrc, /data-panel-open/)
})
