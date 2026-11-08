import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { register } from 'node:module'
import test from 'node:test'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { PackingListRow } from '@/lib/trip-packing'

/**
 * The component imports its own stylesheet (like `trip-audience-section.tsx`), which Node cannot
 * load. A one-line resolve hook turns any `.css` specifier into an empty module for this file only,
 * so the real component can still be rendered here — no build step, no config, and nothing about
 * the component has to change to make it testable.
 */
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

const { TripPackingSection } = await import('./trip-packing-section')

/**
 * The packing section is a client component, but its markup is server-renderable — and that is the
 * half a static trip page actually ships. These tests render it for real (no DOM needed) and assert
 * the things a redesign must never lose:
 *
 *   - three accordions, in the order the request names them, all open on load;
 *   - an accessible header per group (real <button> with aria-expanded) plus a count;
 *   - a dashboard whose numbers match the list;
 *   - one real checkbox per item, so the checklist works with a keyboard and a screen reader.
 */
const rows: PackingListRow[] = [
  { id: 'a', item: 'Trekking boots', category: 'clothing-footwear' },
  { id: 'b', item: 'Down jacket', category: 'clothing-footwear' },
  { id: 'c', item: 'Sleeping bag', category: 'trekking-equipment' },
  { id: 'd', item: 'Passport and permits', category: 'personal-items' },
]

const render = (list: PackingListRow[] = rows) =>
  renderToStaticMarkup(
    createElement(TripPackingSection, { rows: list, tripSlug: 'everest-base-camp' }),
  )

test('renders the three packing accordions in the requested order', () => {
  const html = render()

  const headings = [...html.matchAll(/class="packing-group-title">([^<]+)</g)].map(
    (match) => match[1],
  )
  assert.deepEqual(headings, ['Clothing and Footwear', 'Trekking Equipment', 'Personal Items'])
})

test('every group is open on load and is a real button', () => {
  const html = render()
  const triggers = [...html.matchAll(/<button[^>]*data-slot="accordion-trigger"[^>]*>/g)]

  assert.equal(triggers.length, 3)
  for (const [trigger] of triggers) {
    assert.match(trigger, /type="button"/, 'Enter and Space work without extra handlers')
    assert.match(trigger, /aria-expanded="true"/, 'the list is visible without a click')
    assert.match(trigger, /data-state="open"/)
  }

  // A group heading is an H3 wrapped around the trigger — the section title is the only H2, so
  // the outline goes H2 → H3 → (list) with no skipped level.
  assert.equal((html.match(/<h3/g) ?? []).length, 3)
  assert.equal((html.match(/<h2 class="heading-lg">/g) ?? []).length, 1)
})

test('the dashboard totals match the items on the page', () => {
  const html = render()

  const stats = [...html.matchAll(/class="packing-stat">.*?<dd>([^<]*)(?:<span[^>]*>([^<]*)<\/span>)?/g)]
  // Items, groups, packed — three readouts, in that order.
  assert.equal(stats.length, 3)
  assert.equal(stats[0][1], '4', 'every non-blank CMS item is counted')
  assert.equal(stats[1][1], '3')
  assert.equal(stats[2][1], '0', 'nothing is packed before the visitor ticks anything')
})

test('each item is a real checkbox inside a label, with its own drawn box', () => {
  const html = render()

  assert.equal((html.match(/type="checkbox"/g) ?? []).length, 4)
  assert.equal((html.match(/class="packing-item-input"/g) ?? []).length, 4)
  assert.equal((html.match(/<label class="packing-item"/g) ?? []).length, 4)

  // Checkboxes start unchecked, so the server HTML and the first client render agree.
  assert.doesNotMatch(html, /checked=""/)

  // The label wraps input → box → text, in that order, for the CSS sibling selectors.
  assert.match(html, /<label class="packing-item"[^>]*><input[^>]*class="packing-item-input"[^>]*\/><span class="packing-item-box"[^>]*>[\s\S]*?<\/span><span class="packing-item-text">Trekking boots<\/span>/)
})

test('a group that has no items is not rendered at all', () => {
  const html = render([{ item: 'Sleeping bag', category: 'trekking-equipment' }])

  assert.equal((html.match(/class="packing-group-title"/g) ?? []).length, 1)
  assert.doesNotMatch(html, /Clothing and Footwear/)
  assert.doesNotMatch(html, /Personal Items/)
})

test('an empty packing list renders nothing', () => {
  assert.equal(render([]), '')
})

test('the checklist is read back from and written to this browser only', () => {
  const source = readFileSync(new URL('./trip-packing-section.tsx', import.meta.url), 'utf8')

  assert.match(source, /localStorage/, 'a visitor keeps their ticks between visits')
  assert.match(source, /`\$\{STORAGE_PREFIX\}\$\{tripSlug\}`/, 'ticks are scoped to the trip')
  // No network: the page is static and a trip page has no session to write to.
  assert.doesNotMatch(source, /\bfetch\(|'use server'/)
})
