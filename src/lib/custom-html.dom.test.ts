/**
 * Custom HTML publishes an editor's code verbatim and `CustomHtml` makes that code run. Whether a
 * pasted `<script>` executes at all — and whether it executes exactly *once* — depends on browser
 * rules `renderToStaticMarkup` cannot show:
 *
 *   - a `<script>` in HTML that arrives over the wire runs while the document is parsed;
 *   - a `<script>` created from `innerHTML` never runs, which is what `activateScripts` is for;
 *   - React hydrates over the server markup, re-renders once the client owns it, and StrictMode
 *     mounts every effect twice in development.
 *
 * So this file drives the real component in a real DOM. jsdom is the repo's only test-only
 * dependency and it earns its place here: a regression is invisible in the markup — a snippet that
 * runs twice renders its widget twice and double-fires affiliate impressions and clicks, while one
 * that never runs still looks perfectly correct in the server HTML.
 *
 * `node --test` runs each file in its own process, so the DOM globals installed below cannot leak
 * into the other suites.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { JSDOM } from 'jsdom'
import { createElement, StrictMode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { CustomHtml } from '../components/content/custom-html'
import { activateScripts, markParserInsertedScripts } from './custom-html'

/** The counters the pasted snippets write to, so a test can count executions. */
type SandboxGlobals = {
  __runs?: number
  __order?: string[]
  __edits?: number
  __strict?: number
  __cancelled?: boolean
  __marked?: number
  WidgetReady?: boolean
}

/** The shape editors actually paste: a host element, an inline loader, a JSON-LD data block. */
const affiliateSnippet =
  '<div id="tp-host">Search flights</div>' +
  '<script>window.__runs = (window.__runs || 0) + 1</script>' +
  '<script type="application/ld+json">{"@type":"Product","name":"Everest Base Camp"}</script>'

const serverMarkup = renderToStaticMarkup(createElement(CustomHtml, { html: affiliateSnippet }))

// Parsing this document is the browser's job, not React's: jsdom runs the inline script here, just
// as a visitor's browser runs it before hydration starts.
const dom = new JSDOM(
  `<!doctype html><html><body><div id="root">${serverMarkup}</div></body></html>`,
  {
    runScripts: 'dangerously',
    url: 'https://hikeglobally.test/trips/everest-base-camp',
    pretendToBeVisual: true,
  },
)

const scope = dom.window as unknown as Window & SandboxGlobals
const source = dom.window as unknown as Record<string, unknown>
for (const key of [
  'document',
  'navigator',
  'location',
  'HTMLElement',
  'Element',
  'Node',
  'Event',
  'CustomEvent',
  'DocumentFragment',
  'MutationObserver',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
]) {
  Object.defineProperty(globalThis, key, { value: source[key], configurable: true, writable: true })
}
Object.defineProperty(globalThis, 'window', {
  value: dom.window,
  configurable: true,
  writable: true,
})

const { createRoot, hydrateRoot } = await import('react-dom/client')

const { document } = scope
/** Passive effects and script loads are asynchronous; one macrotask is enough for both. */
const settle = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))
const mount = () => {
  const element = document.createElement('div')
  document.body.append(element)
  return element
}

test('the server-rendered section keeps the pasted snippet byte-for-byte', () => {
  assert.match(
    serverMarkup,
    /<script>window\.__runs = \(window\.__runs \|\| 0\) \+ 1<\/script>/,
    'an executable script is published untouched',
  )
  assert.match(serverMarkup, /<script type="application\/ld\+json">/, 'a data block is published')
  assert.equal(scope.__runs, 1, 'the browser ran it while parsing, before React arrived')
})

test('hydrating a server-rendered section does not run its scripts a second time', async () => {
  const warnings: string[] = []
  const realError = console.error
  console.error = (...args: unknown[]) => warnings.push(args.join(' '))
  try {
    const root = document.getElementById('root')
    assert.ok(root, 'the server-rendered section is on the page')
    hydrateRoot(root, createElement(CustomHtml, { html: affiliateSnippet }))
    await settle()
  } finally {
    console.error = realError
  }

  assert.equal(scope.__runs, 1, 'one paste, one execution')
  assert.deepEqual(warnings, [], 'the client render matches the server markup exactly')
  assert.equal(
    document.querySelectorAll('#root script[data-hg-script]').length,
    1,
    'only the script that already ran is marked as activated',
  )
  assert.equal(
    document.querySelector('#root script[type="application/ld+json"]')?.textContent,
    '{"@type":"Product","name":"Everest Base Camp"}',
    'structured data stays readable for crawlers and is never executed',
  )
})

test('a section rendered on the client runs its scripts once, in paste order', async () => {
  const element = mount()
  const root = createRoot(element)
  root.render(
    createElement(CustomHtml, {
      html:
        '<script>window.__order = ["loader"]</script>' +
        '<script src="https://cdn.example/widget.js" defer data-cfasync="false" id="wjs"></script>' +
        '<script>window.__order.push("init-" + window.WidgetReady)</script>',
    }),
  )
  await settle()

  assert.deepEqual([...(scope.__order ?? [])], ['loader'], 'the inline loader ran on insertion')
  const external = element.querySelector<HTMLScriptElement>('#wjs')
  assert.ok(external, 'the external file was re-inserted as a live script')
  assert.equal(external.getAttribute('src'), 'https://cdn.example/widget.js')
  assert.equal(external.getAttribute('defer'), '', 'loader flags survive verbatim')
  assert.equal(external.getAttribute('data-cfasync'), 'false')
  assert.deepEqual(
    [...(scope.__order ?? [])],
    ['loader'],
    'the init call waits for widget.js instead of running before it',
  )

  // jsdom does not fetch external resources; a browser fires load (or error) on the element.
  // `Event` here is the jsdom constructor installed on globalThis above, so it is the right realm.
  scope.WidgetReady = true
  external.dispatchEvent(new Event('load'))
  await settle()

  assert.deepEqual(
    [...(scope.__order ?? [])],
    ['loader', 'init-true'],
    '…and runs once the file has loaded',
  )
  root.unmount()
})

test('editing the section runs the new snippet once and only once', async () => {
  const element = mount()
  const root = createRoot(element)
  root.render(createElement(CustomHtml, { html: '<script>window.__edits = 1</script>' }))
  await settle()
  assert.equal(scope.__edits, 1)

  const edited = '<script>window.__edits = window.__edits + 10</script>'
  root.render(createElement(CustomHtml, { html: edited }))
  await settle()
  assert.equal(scope.__edits, 11, 'a live-preview update replaces the markup and runs the new code')

  root.render(createElement(CustomHtml, { html: edited }))
  await settle()
  assert.equal(scope.__edits, 11, 're-rendering identical markup runs nothing again')
  root.unmount()
})

test('StrictMode mounting the effect twice still runs the snippet once', async () => {
  const element = mount()
  const html = '<script>window.__strict = (window.__strict || 0) + 1</script>'
  createRoot(element).render(createElement(StrictMode, null, createElement(CustomHtml, { html })))
  await settle()
  assert.equal(scope.__strict, 1)
})

test('a cancelled activation pass runs nothing', async () => {
  const element = mount()
  element.innerHTML = '<script>window.__cancelled = true</script>'
  activateScripts(element)()
  await settle()
  assert.equal(scope.__cancelled, undefined, 'React can abandon a pass before it touches the DOM')
})

test('scripts already run by the parser are never re-activated', async () => {
  const element = mount()
  element.innerHTML = '<script>window.__marked = (window.__marked || 0) + 1</script>'
  markParserInsertedScripts(element)
  activateScripts(element)
  await settle()
  assert.equal(scope.__marked, undefined, 'marking is what keeps a hard load from double-running')
})
