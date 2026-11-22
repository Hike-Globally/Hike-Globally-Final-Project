/**
 * DOM-level proof that DE/FR change rendered copy on the same URL and that
 * unknown CMS strings keep their English source.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'

import { applyFrontendTranslations, observeFrontendTranslations } from '../i18n/dom-translations'
import { setFrontendLocale } from '../i18n/frontend-locale'
import { translations as de } from '../i18n/translations/de'
import { translations as fr } from '../i18n/translations/fr'

const dom = new JSDOM(
  `<!doctype html>
   <html lang="en">
     <head>
       <title>Read more</title>
       <meta name="description" content="Read more" />
       <meta property="og:locale" content="en_US" />
     </head>
     <body>
       <p id="exact">Read more</p>
       <button id="close" aria-label="Close">x</button>
       <div data-no-i18n><span id="excluded">Read more</span></div>
       <p id="plural">3 trips</p>
       <p id="fallback">A brand new CMS sentence.</p>
       <script id="script">var keep = 'Read more'</script>
       <style id="style">.keep::after { content: 'Read more' }</style>
     </body>
   </html>`,
  { url: 'https://example.com/' },
)

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  NodeFilter: dom.window.NodeFilter,
  MutationObserver: dom.window.MutationObserver,
})

const $ = (selector: string) => dom.window.document.querySelector(selector)
const text = (selector: string) => $(selector)?.textContent ?? null
const attribute = (selector: string, name: string) => $(selector)?.getAttribute(name) ?? null

test('German translates text, attributes, head metadata and dynamic templates', () => {
  applyFrontendTranslations('de', de)

  assert.equal(text('#exact'), 'Mehr lesen')
  assert.equal(attribute('#close', 'aria-label'), 'Schließen')
  assert.equal(text('#excluded'), 'Read more')
  assert.equal(text('#plural'), '3 Reisen')
  assert.equal(text('#fallback'), 'A brand new CMS sentence.')
  assert.equal(text('#script'), "var keep = 'Read more'")
  assert.equal(text('#style'), ".keep::after { content: 'Read more' }")
  assert.equal(dom.window.document.title, 'Mehr lesen')
  assert.equal(attribute('meta[name="description"]', 'content'), 'Mehr lesen')
  assert.equal(attribute('meta[property="og:locale"]', 'content'), 'de_DE')
  assert.equal(dom.window.document.documentElement.lang, 'de')
  assert.equal(dom.window.document.documentElement.dataset.frontendLocale, 'de')
  assert.equal(dom.window.document.documentElement.dataset.frontendLocaleReady, 'true')
})

test('the MutationObserver translates content inserted after hydration', async (t) => {
  const stop = observeFrontendTranslations('de', de)
  t.after(stop)

  dom.window.document.body.insertAdjacentHTML(
    'beforeend',
    '<p id="inserted">Plan your trip</p>',
  )
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.equal(text('#inserted'), 'Planen Sie Ihre Reise')
})

test('French re-translates from the stored English originals', () => {
  applyFrontendTranslations('fr', fr)

  assert.equal(text('#exact'), 'En savoir plus')
  assert.equal(attribute('#close', 'aria-label'), 'Fermer')
  assert.equal(text('#plural'), '3 voyages')
  assert.equal(text('#inserted'), 'Planifiez votre voyage')
  assert.equal(dom.window.document.title, 'En savoir plus')
  assert.equal(attribute('meta[name="description"]', 'content'), 'En savoir plus')
  assert.equal(attribute('meta[property="og:locale"]', 'content'), 'fr_FR')
  assert.equal(dom.window.document.documentElement.lang, 'fr')
})

test('English restores the original copy without changing the URL', () => {
  applyFrontendTranslations('en', {})

  assert.equal(text('#exact'), 'Read more')
  assert.equal(attribute('#close', 'aria-label'), 'Close')
  assert.equal(text('#plural'), '3 trips')
  assert.equal(text('#inserted'), 'Plan your trip')
  assert.equal(text('#excluded'), 'Read more')
  assert.equal(text('#fallback'), 'A brand new CMS sentence.')
  assert.equal(dom.window.document.title, 'Read more')
  assert.equal(attribute('meta[name="description"]', 'content'), 'Read more')
  assert.equal(attribute('meta[property="og:locale"]', 'content'), 'en_US')
  assert.equal(dom.window.document.documentElement.lang, 'en')
  assert.equal(dom.window.document.documentElement.dataset.frontendLocale, 'en')
  assert.equal(dom.window.document.URL, 'https://example.com/')
})

test('changing the language applies it to the current detail-page DOM immediately', async () => {
  setFrontendLocale('de')
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.equal(text('#exact'), 'Mehr lesen')
  assert.equal(text('#inserted'), 'Planen Sie Ihre Reise')
  assert.equal(dom.window.document.documentElement.lang, 'de')

  setFrontendLocale('fr')
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.equal(text('#exact'), 'En savoir plus')
  assert.equal(text('#inserted'), 'Planifiez votre voyage')
  assert.equal(dom.window.document.documentElement.lang, 'fr')
})

test('release JSDOM globals', () => {
  for (const key of ['window', 'document', 'NodeFilter', 'MutationObserver']) {
    Reflect.deleteProperty(globalThis, key)
  }
})
