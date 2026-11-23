import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { after, test } from 'node:test'
import { JSDOM } from 'jsdom'
import { act, createElement } from 'react'
import { renderToString } from 'react-dom/server'

import {
  SitemapGuide,
  type SitemapNode,
  type SitemapSubsystem,
} from './sitemap-guide'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const read = (file: string): string => readFileSync(path.join(repoRoot, file), 'utf8')

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://hikeglobally.test/sitemap',
  pretendToBeVisual: true,
})
const source = dom.window as unknown as Record<string, unknown>
for (const key of [
  'document',
  'navigator',
  'HTMLElement',
  'Element',
  'Node',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
  'requestAnimationFrame',
  'cancelAnimationFrame',
]) {
  Object.defineProperty(globalThis, key, { value: source[key], configurable: true, writable: true })
}
Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true })
Object.defineProperty(globalThis, 'self', { value: dom.window, configurable: true })
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true })

Object.defineProperty(dom.window.HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: () => {},
})

const { createRoot } = await import('react-dom/client')

after(() => {
  dom.window.close()
})

const rootNode: SitemapNode = {
  title: 'Hike Globally Home',
  href: '/',
  path: '/',
  description: 'Primary platform root.',
  status: '200',
  kind: 'root',
}

const sampleSubsystems: SitemapSubsystem[] = [
  {
    id: 'core',
    code: '01',
    kicker: 'Root & Direction',
    title: 'Core & Brand',
    description: 'Primary entry points.',
    accent: 'ink',
    nodes: [
      rootNode,
      {
        title: 'Contact & Trip Enquiry',
        href: '/contact',
        path: '/contact',
        description: 'Direct expedition desk.',
        status: '200',
        kind: 'hub',
      },
      {
        title: 'About — Expedition Credo',
        href: '/about',
        path: '/about',
        description: 'Expedition philosophy.',
        status: '200',
        kind: 'endpoint',
      },
    ],
  },
  {
    id: 'trips',
    code: '02',
    kicker: 'Expedition Catalog',
    title: 'Trips & Expeditions',
    description: 'Multi-day itineraries.',
    accent: 'sage',
    nodes: [
      {
        title: 'Trips & Expeditions Hub',
        href: '/trips',
        path: '/trips',
        description: 'Catalog hub.',
        status: '200',
        kind: 'hub',
        meta: '5 published',
      },
      {
        title: 'Everest Base Camp Trek',
        href: '/trips/everest-base-camp',
        path: '/trips/everest-base-camp',
        description: 'Classic Khumbu climb.',
        status: '200',
        kind: 'endpoint',
        meta: '14d · challenging',
      },
      {
        title: 'Annapurna Base Camp',
        href: '/trips/annapurna-base-camp',
        path: '/trips/annapurna-base-camp',
        description: 'Sanctuary trek.',
        status: '200',
        kind: 'endpoint',
      },
      {
        title: 'Langtang Valley',
        href: '/trips/langtang-valley',
        path: '/trips/langtang-valley',
        description: 'Border valley.',
        status: '200',
        kind: 'endpoint',
      },
      {
        title: 'Manaslu Circuit',
        href: '/trips/manaslu-circuit',
        path: '/trips/manaslu-circuit',
        description: 'Remote circuit.',
        status: '200',
        kind: 'endpoint',
      },
    ],
  },
]

test('server-rendered visual sitemap prints diagram tree, status codes, and architectural taxonomy', () => {
  const html = renderToString(
    createElement(SitemapGuide, { subsystems: sampleSubsystems, rootNode }),
  )
  const doc = new JSDOM(html).window.document

  assert.ok(doc.querySelector('.ia-apex .ia-node--root'), 'renders root node at the diagram apex')
  assert.equal(doc.querySelectorAll('.ia-column').length, 2, 'renders subsystem tree columns')
  assert.match(html, /Six Core Subsystems at a Glance/)
  assert.match(html, /\+ 1 more endpoint/, 'shows overflow endpoint count on taxonomy preview cards')
  assert.equal(doc.querySelectorAll('.ia-view-tab').length, 3, 'renders Diagram, Cards, Index tabs')
})

test('view switcher toggles cleanly between Diagram, Cards, and Index modes and subsystem filters work', async (t) => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  t.after(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  await act(async () => {
    root.render(createElement(SitemapGuide, { subsystems: sampleSubsystems, rootNode }))
  })

  assert.ok(container.querySelector('.ia-canvas'), 'starts in Diagram view')

  const viewTabs = container.querySelectorAll<HTMLButtonElement>('.ia-view-tab')
  // Switch to Cards
  await act(async () => {
    viewTabs[1]?.click()
  })
  assert.equal(container.querySelector('.ia-canvas'), null)
  assert.ok(container.querySelector('.ia-cards-view'), 'renders Cards view')

  // Switch to Index
  await act(async () => {
    viewTabs[2]?.click()
  })
  assert.ok(container.querySelector('.ia-index-view'), 'renders Index ledger view')
  assert.equal(container.querySelectorAll('.ia-index-row').length, 8)

  // Trigger "Filter this subsystem" from Architectural Taxonomy card 2 (Trips & Expeditions)
  const taxButtons = container.querySelectorAll<HTMLButtonElement>('.ia-tax-card__filter-btn')
  await act(async () => {
    taxButtons[1]?.click()
  })
  assert.equal(container.querySelectorAll('.ia-index-row').length, 5)
  assert.match(container.querySelector('.ia-status-strip')?.textContent ?? '', /Showing 5 of 8/)
})

test('sitemap route and stylesheet adhere strictly to brand tokens, canonical metadata, and protocol links', () => {
  const pageSource = read('src/app/(frontend)/sitemap/page.tsx')
  const cssSource = read('src/app/(frontend)/sitemap/sitemap.css')

  assert.match(pageSource, /data-header-hero/)
  assert.match(pageSource, /Visual Sitemap &amp; <em>Information Flow<\/em>/)
  assert.match(pageSource, /Engine Protocol &amp; Sitemap XML Feed/)
  assert.match(pageSource, /href="\/sitemap\.xml"/)
  assert.match(pageSource, /href="\/feed\.xml"/)
  assert.match(pageSource, /href="\/llms\.txt"/)
  assert.doesNotMatch(
    cssSource,
    /#[0-9a-fA-F]{3,8}\b/,
    'sitemap.css must use design-system CSS variables instead of raw hex literals',
  )
  assert.match(cssSource, /var\(--radius-button\)/)
  assert.match(cssSource, /prefers-reduced-motion:\s*reduce/)
})
