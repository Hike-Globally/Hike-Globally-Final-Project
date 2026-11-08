import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { RichText } from '../components/content/rich-text'
import { EssentialInformationSection } from '../components/sections/essential-information-section'
import type { Trip } from '../payload-types'

/** Lexical documents are structured JSON — the shape the CMS actually saves. */
const richText = (children: Record<string, unknown>[]) => ({
  root: { type: 'root', format: '', indent: 0, version: 1, children },
})

const paragraph = (text: string) => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  children: [{ type: 'text', format: 0, style: '', text, version: 1 }],
})

const heading = (tag: string, text: string) => ({
  type: 'heading',
  tag,
  format: '',
  indent: 0,
  version: 1,
  children: [{ type: 'text', format: 0, style: '', text, version: 1 }],
})

const contentSections = [
  {
    id: 'packing',
    heading: 'Packing and gear',
    content: richText([
      // Previously saved content can use any heading level for a subheading.
      heading('h2', 'Layer system'),
      paragraph('Bring a base layer and a shell.'),
      heading('h4', 'Footwear'),
      paragraph('Broken-in boots only.'),
    ]),
  },
  {
    id: 'permits',
    heading: 'Permits and insurance',
    content: richText([heading('h3', 'TIMS card'), paragraph('Issued in Kathmandu.')]),
  },
] as unknown as NonNullable<Trip['contentSections']>

const renderSection = () =>
  renderToStaticMarkup(
    createElement(EssentialInformationSection, {
      title: 'Essential Information You Must Know',
      sections: contentSections,
    }),
  )

const headingTags = (html: string) =>
  Array.from(html.matchAll(/<(h[1-6])\b/g), (match) => Number(match[1].slice(1)))

/** The renderer wraps text nodes in <span>, so match a heading by its rendered text. */
const headingWithText = (tag: string, text: string) =>
  new RegExp(`<${tag}[^>]*><span>${text}</span></${tag}>`)

test('Essential Information: H2 title + H2 section headings + H3 subheadings, no skipped levels', () => {
  const html = renderSection()

  assert.match(html, /<h2 class="heading-lg">Essential Information You Must Know<\/h2>/)

  // The CMS Heading field is a real H2 reading the global H2 role (`heading-lg`).
  assert.equal((html.match(/<h2\b/g) ?? []).length, 3, 'section title + two CMS headings')
  assert.match(html, /Packing and gear/)
  assert.match(html, /Permits and insurance/)
  assert.equal(
    (html.match(/<h2 class="[^"]*heading-lg[^"]*"[^>]*>/g) ?? []).length,
    3,
    'every H2 uses the global H2 utility, with no local size override',
  )

  // Subheadings from the Description editor are real H3s, including legacy h2/h4 nodes.
  assert.match(html, headingWithText('h3', 'Layer system'))
  assert.match(html, headingWithText('h3', 'Footwear'))
  assert.match(html, headingWithText('h3', 'TIMS card'))
  assert.doesNotMatch(html, /<h2[^>]*>Layer system<\/h2>/)
  assert.doesNotMatch(html, /<h4[^>]*>Footwear<\/h4>/)
  assert.equal((html.match(/<h3\b/g) ?? []).length, 3)
  assert.doesNotMatch(html, /<div[^>]*>Footwear<\/div>|<p[^>]*><strong>Footwear<\/strong><\/p>/)

  // Both descriptions sit in the scoped container whose H3s read the global H3 role.
  assert.equal((html.match(/essential-information-copy/g) ?? []).length, 2)

  // No level is skipped: H1 (page) → H2 (sections) → H3 (subheadings).
  assert.deepEqual([...new Set(headingTags(html))].sort(), [2, 3])
  for (let index = 1; index < headingTags(html).length; index += 1) {
    const levels = headingTags(html)
    assert.ok(
      levels[index] - levels[index - 1] <= 1,
      `heading level jumps from h${levels[index - 1]} to h${levels[index]}`,
    )
  }
  const tripDetail = readFileSync(
    new URL('../components/views/trip-detail.tsx', import.meta.url),
    'utf8',
  )
  assert.equal((tripDetail.match(/<h1\b/g) ?? []).length, 1, 'one H1 for the page title')
})

test('every section is open on load and uses an accessible +/- button', () => {
  const html = renderSection()

  const triggers = [...html.matchAll(/<button[^>]*data-slot="accordion-trigger"[^>]*>/g)].map(
    (match) => match[0],
  )
  assert.equal(triggers.length, contentSections.length)
  for (const trigger of triggers) {
    assert.match(trigger, /aria-expanded="true"/, 'all sections start open')
    assert.match(trigger, /data-state="open"/)
    assert.match(trigger, /type="button"/, 'real <button> works with Enter and Space')
  }

  // The badge swaps a proper SVG minus in for the plus rather than a chevron or an underscore.
  assert.equal((html.match(/lucide-minus/g) ?? []).length, contentSections.length)
  assert.equal((html.match(/lucide-plus/g) ?? []).length, contentSections.length)
  assert.doesNotMatch(html, /lucide-chevron/)
  // The swap is driven by the `group/accordion` marker on the trigger (Tailwind's data-state
  // group variant), not by a self-targeting arbitrary variant — the old `[[data-state=open]>span>&]`
  // selector pointed at a wrapper <span> that does not exist, so the icon never actually changed.
  assert.match(html, /data-state="open"[^>]*class="[^"]*group\/accordion/)
  assert.match(html, /lucide-plus[^"]*group-data-\[state=open\]\/accordion:opacity-0/)
  assert.match(html, /lucide-minus[^"]*group-data-\[state=open\]\/accordion:opacity-100/)

  // Content is present in the HTML on first load (not collapsed/hidden server-side).
  assert.match(html, /Bring a base layer and a shell\./)
  assert.match(html, /Issued in Kathmandu\./)
  assert.equal((html.match(/data-state="open"/g) ?? []).length >= 4, true)
})

test('open state is uncontrolled, independent, animated and never persisted between visits', () => {
  const source = readFileSync(
    new URL('../components/sections/essential-information-section.tsx', import.meta.url),
    'utf8',
  )

  assert.match(source, /type="multiple"/, 'each section toggles independently')
  assert.match(source, /defaultValue=\{values\}/)
  assert.doesNotMatch(source, /\bvalue=\{[^}]*\}\s*onValueChange|localStorage|sessionStorage/)
  assert.match(source, /headingTag="h3"/)
  assert.match(source, /indicator="plus-minus"/)
  assert.match(source, /headingLevel="h2"/)
  assert.match(source, /textRole="section"/)

  // The shared AccordionContent already carries the site's smooth accordion animations.
  const accordion = readFileSync(new URL('../components/ui/accordion.tsx', import.meta.url), 'utf8')
  assert.match(accordion, /data-\[state=closed\]:animate-accordion-up/)
  assert.match(accordion, /data-\[state=open\]:animate-accordion-down/)

  // Global type roles only — no hard-coded font sizes in either file or the scoped CSS rule.
  const globals = readFileSync(new URL('../app/(frontend)/globals.css', import.meta.url), 'utf8')
  const scopedRule = globals.slice(
    globals.indexOf('.essential-information-copy h3'),
    globals.indexOf('.essential-information-copy h3') + 160,
  )
  assert.match(scopedRule, /@apply heading-md/)
  assert.doesNotMatch(scopedRule, /font-size:\s*\d|px/)
})

test('RichText emits real h3 tags for description subheadings at any stored heading level', () => {
  const html = renderToStaticMarkup(
    createElement(RichText, {
      content: richText([
        heading('h1', 'First'),
        heading('h2', 'Second'),
        heading('h4', 'Third'),
        heading('h6', 'Fourth'),
        { ...heading('h3', 'Fifth'), tag: undefined },
        paragraph('Body copy'),
      ]),
      headingTag: 'h3',
      className: 'essential-information-copy',
    }),
  )

  assert.match(html, /class="prose-hg essential-information-copy"/)
  for (const label of ['First', 'Second', 'Third', 'Fourth', 'Fifth']) {
    assert.match(html, headingWithText('h3', label))
  }
  assert.equal((html.match(/<h3\b/g) ?? []).length, 5)
  assert.doesNotMatch(html, /<h[12456]\b/)
  assert.match(html, headingWithText('p', 'Body copy'))
})

test('other rich-text blocks keep their stored heading levels when no override is given', () => {
  const html = renderToStaticMarkup(
    createElement(RichText, {
      content: richText([heading('h2', 'Overview heading'), heading('h3', 'Subheading')]),
    }),
  )

  assert.match(html, headingWithText('h2', 'Overview heading'))
  assert.match(html, headingWithText('h3', 'Subheading'))
})

test('no sections renders nothing, and already-saved CMS content is not mutated', () => {
  assert.equal(
    renderToStaticMarkup(
      createElement(EssentialInformationSection, {
        title: 'Essential Information You Must Know',
        sections: [],
      }),
    ),
    '',
  )
  renderSection()
  assert.equal(contentSections[0].content.root.children[0].tag, 'h2')
})

/** Evaluate a `clamp(min, preferred, max)` type-scale token at a viewport width in pixels. */
const evaluateTerm = (expression: string, width: number) =>
  expression.split('+').reduce((sum, rawTerm) => {
    const match = rawTerm.trim().match(/^([\d.]+)(rem|px|vw)$/)
    assert.ok(match, `unexpected type-scale term: ${rawTerm}`)
    const [, value, unit] = match
    const number = Number(value)
    return sum + (unit === 'rem' ? number * 16 : unit === 'vw' ? (number / 100) * width : number)
  }, 0)

const clampToken = (css: string, name: string, width: number) => {
  const declaration = css.match(new RegExp(`--${name}:\\s*clamp\\(([^)]*)\\)`))
  assert.ok(declaration, `missing ${name} clamp token`)
  const [min, preferred, max] = declaration[1].split(',')
  return Math.min(
    Math.max(evaluateTerm(min, width), evaluateTerm(preferred, width)),
    evaluateTerm(max, width),
  )
}

test('global H2/H3 roles keep H2 larger than H3 at mobile, tablet and desktop widths', () => {
  const globals = readFileSync(new URL('../app/(frontend)/globals.css', import.meta.url), 'utf8')
  const section = readFileSync(
    new URL('../components/sections/essential-information-section.tsx', import.meta.url),
    'utf8',
  )

  // H2 = `heading-lg` → --text-section; H3 = `heading-md` → --text-card.
  assert.match(globals, /@utility heading-lg \{[^}]*font-size: var\(--text-section\)/s)
  assert.match(globals, /@utility heading-md \{[^}]*font-size: var\(--text-card\)/s)

  for (const [label, width] of [
    ['small phone', 320],
    ['mobile', 375],
    ['tablet', 768],
    ['small desktop', 1024],
    ['desktop', 1440],
    ['wide desktop', 1920],
  ] as const) {
    const h2 = clampToken(globals, 'text-section', width)
    const h3 = clampToken(globals, 'text-card', width)
    assert.ok(h2 > h3, `H2 (${h2}px) must be larger than H3 (${h3}px) at ${label} (${width}px)`)
  }

  // No locally hard-coded sizes, and the existing responsive card padding is preserved.
  assert.doesNotMatch(section, /text-\[|font-size|style=\{\{/)
  const html = renderSection()
  assert.match(html, /px-4 sm:px-6 md:px-8/)
  assert.match(html, /py-16 md:py-24/)
})
