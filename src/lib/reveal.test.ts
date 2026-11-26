import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { Reveal, shouldAnimateOnMount } from '../components/motion/reveal'
import { EssentialInformationSection } from '../components/sections/essential-information-section'
import type { Trip } from '../payload-types'

/**
 * Regression coverage for the "Essential Information is empty on first view" bug: a section that
 * sat at `opacity: 0` after a client-side navigation, and only showed up once the page was
 * reloaded (the server HTML, which never hid it).
 */

const paragraph = (text: string) => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  children: [{ type: 'text', format: 0, style: '', text, version: 1 }],
})

const contentSections = [
  {
    id: 'permits',
    heading: 'Permits and insurance',
    content: {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [paragraph('A TIMS card is issued in Kathmandu.')],
      },
    },
  },
] as unknown as NonNullable<Trip['contentSections']>

test('Essential Information is fully visible in the first render — nothing starts at opacity 0', () => {
  const html = renderToStaticMarkup(
    createElement(EssentialInformationSection, {
      title: 'Essential Information You Must Know',
      sections: contentSections,
    }),
  )

  assert.match(html, /Essential Information You Must Know/)
  assert.match(html, /Permits and insurance/)
  assert.match(html, /A TIMS card is issued in Kathmandu\./)

  // The whole section — title, accordion and copy — is painted on the first view.
  assert.match(html, /opacity:1/)
  assert.doesNotMatch(html, /opacity:0/)
  assert.doesNotMatch(html, /translate3d\(0,18px,0\)/)
})

test('Reveal keeps its content visible when no observer/motion is available', () => {
  const html = renderToStaticMarkup(
    createElement(Reveal, null, createElement('p', null, 'First-view copy')),
  )

  assert.match(html, /First-view copy/)
  assert.match(html, /opacity:1/)
  assert.doesNotMatch(html, /opacity:0/)
})

test('only content that starts entirely below the fold is hidden for the animation', () => {
  const viewport = 900

  // On screen (or spanning the viewport): must never be hidden — this is the bug case.
  assert.equal(shouldAnimateOnMount(0, viewport), false)
  assert.equal(shouldAnimateOnMount(120, viewport), false)
  assert.equal(shouldAnimateOnMount(899, viewport), false)
  // Tall section whose top edge is already visible.
  assert.equal(shouldAnimateOnMount(-40, viewport), false)
  // Scrolled past it (browser scroll restoration): leave it alone.
  assert.equal(shouldAnimateOnMount(-5000, viewport), false)
  // Fully below the fold: the fade-up is allowed.
  assert.equal(shouldAnimateOnMount(900, viewport), true)
  assert.equal(shouldAnimateOnMount(4000, viewport), true)
  // Unknown geometry degrades to "visible", never to "hidden".
  assert.equal(shouldAnimateOnMount(Number.NaN, viewport), false)
  assert.equal(shouldAnimateOnMount(4000, Number.NaN), false)
})

test('Reveal arms the animation after mount and reveals on any overlap', () => {
  const source = readFileSync(new URL('../components/motion/reveal.tsx', import.meta.url), 'utf8')

  // The first client render matches the server: `hidden` is false until an effect decides.
  assert.match(source, /const \[hidden, setHidden\] = useState\(false\)/)
  assert.doesNotMatch(
    source,
    /typeof IntersectionObserver === 'undefined' \|\|/,
    'the server/client visibility fork that caused the hydration-split must stay gone',
  )
  assert.match(
    source,
    /shouldAnimateOnMount\(element\.getBoundingClientRect\(\)\.top, window\.innerHeight\)/,
  )

  // A page that is already scrolled (reload restoring the position, or a visitor who moved
  // before hydration) keeps everything visible: no content is removed mid-page.
  assert.match(source, /if \(window\.scrollY > 0\) return/)

  // A ratio threshold can never be met by a section taller than ~8 viewports, so a long
  // Essential Information block would stay hidden forever. Any overlap must reveal.
  const observerSource = readFileSync(
    new URL('../components/motion/reveal-observer.ts', import.meta.url),
    'utf8',
  )
  assert.match(observerSource, /threshold: 0/)
  assert.doesNotMatch(observerSource, /threshold: 0\.12/)

  // Unchanged behaviour: reduced motion users just get the content, and the CSS animation
  // contract with the rest of the site (distance/delay/duration) is preserved.
  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(source, /transitionDuration: '700ms'/)
  assert.match(source, /cubic-bezier\(0\.22, 1, 0\.36, 1\)/)
})
