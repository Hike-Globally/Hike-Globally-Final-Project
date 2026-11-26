import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test, { after } from 'node:test'

import { JSDOM } from 'jsdom'
import { act, createElement } from 'react'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'

import { BlogArchiveFilter } from '../views/blog-archive-filter'
import { archiveHref, filterQuery } from '../../lib/catalog'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://hikeglobally.test/blog',
})
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'Event']) {
  Object.defineProperty(globalThis, key, {
    value: (dom.window as unknown as Record<string, unknown>)[key],
    configurable: true,
    writable: true,
  })
}
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true })
const { createRoot } = await import('react-dom/client')
after(() => dom.window.close())

test('the archive keeps the post cards server-side, with a small client filter', () => {
  const archive = readFileSync(new URL('../views/blog-explorer.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(archive, /^['"]use client['"]/m)
  assert.match(archive, /<BlogArchiveFilter/)
  assert.match(archive, /<ArchiveCard post=\{lead\} featured priority=\{index === 0\}/)
})

test('filter selection and reset navigate to the same archive URLs without scrolling', async () => {
  const calls: Array<[string, unknown]> = []
  const router = {
    push: (href: string, options: unknown) => calls.push([href, options]),
    back: () => {},
    forward: () => {},
    refresh: () => {},
    replace: () => {},
    prefetch: () => {},
  } as unknown as React.ContextType<typeof AppRouterContext>
  const container = document.getElementById('root')!
  const root = createRoot(container)
  const props = {
    category: 'gear',
    allLabel: 'All topics',
    allHref: archiveHref('blog', 1),
    options: [
      {
        value: 'gear',
        label: 'Gear & packing',
        href: archiveHref('blog', 1, filterQuery({ category: 'gear' })),
      },
      {
        value: 'culture',
        label: 'Culture',
        href: archiveHref('blog', 1, filterQuery({ category: 'culture' })),
      },
    ],
  }
  await act(async () => {
    root.render(
      createElement(
        AppRouterContext.Provider,
        { value: router },
        createElement(BlogArchiveFilter, props),
      ),
    )
  })
  const select = container.querySelector('select')!
  assert.equal(select.getAttribute('aria-label'), 'Filter by topic')
  assert.equal(select.value, 'gear')
  assert.deepEqual(
    [...select.options].map((option) => option.textContent),
    ['All topics', 'Gear & packing', 'Culture'],
  )

  await act(async () => {
    select.value = 'culture'
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
  })
  await act(async () => {
    select.value = 'all'
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
  })
  assert.deepEqual(calls, [
    ['/blog?category=culture', { scroll: false }],
    ['/blog', { scroll: false }],
  ])
  await act(async () => root.unmount())
})
