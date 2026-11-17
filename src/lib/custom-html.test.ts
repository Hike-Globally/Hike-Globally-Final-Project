import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { CustomHtmlSection } from '../components/content/custom-html-section'
import { isExecutableScriptType } from './custom-html'

const customHtmlStyles = readFileSync(
  new URL('../components/content/custom-html-section.css', import.meta.url),
  'utf8',
)

/**
 * Custom HTML is trusted, editor-written code: it is published exactly as pasted, scripts included.
 * These tests lock in both halves of that promise — the server-rendered markup keeps every tag an
 * editor wrote, and only real JavaScript `type`s are treated as runnable (a `application/ld+json`
 * data block must reach the page but never execute).
 */
const render = (heading: string | null, html: string, variant: 'trip' | 'blog' = 'trip') =>
  renderToStaticMarkup(
    createElement(CustomHtmlSection, { section: { kind: 'html', heading, html }, variant }),
  )

test('publishes scripts, styles, embeds, forms and event handlers exactly as pasted', () => {
  const html = render(
    null,
    '<script src="https://cdn.example/widget.js" defer data-cfasync="false"></script>' +
      '<script>(function(){window.tp=1})()</script>' +
      '<style>.tp-widget{color:#123456}</style>' +
      '<iframe src="https://map.example/embed" loading="lazy"></iframe>' +
      '<form action="/subscribe"><input name="email" onfocus="track()"></form>' +
      '<a href="javascript:void(0)">Go</a>' +
      '<img src="data:image/svg+xml,ok" onerror="fallback()">',
  )
  assert.match(html, /<script src="https:\/\/cdn\.example\/widget\.js" defer data-cfasync="false">/)
  assert.match(html, /<script>\(function\(\)\{window\.tp=1\}\)\(\)<\/script>/)
  assert.match(html, /<style>\.tp-widget\{color:#123456\}<\/style>/)
  assert.match(html, /<iframe src="https:\/\/map\.example\/embed" loading="lazy">/)
  assert.match(html, /<form action="\/subscribe"><input name="email" onfocus="track\(\)">/)
  assert.match(html, /href="javascript:void\(0\)"/)
  assert.match(html, /src="data:image\/svg\+xml,ok" onerror="fallback\(\)"/)
})

test('keeps a pasted affiliate loader byte-for-byte and in source order', () => {
  // The Travelpayouts tag from docs/reference/third-party/travelpayouts.txt is the shape editors actually paste.
  const snippet =
    '<script nowprocket data-noptimize="1" data-cfasync="false" data-cmp-ab="2">' +
    'var s=document.createElement("script");s.src="https://tpembars.com/NDgxMjc5.js?t=481279";' +
    'document.head.appendChild(s);</script>'
  const html = render(null, `<div id="tp-host">Search</div>${snippet}`)
  assert.match(html, /<div id="tp-host">Search<\/div>/)
  assert.ok(html.indexOf('tp-host') < html.indexOf('nowprocket'), 'markup stays before its script')
  assert.match(html, /nowprocket data-noptimize="1" data-cfasync="false" data-cmp-ab="2"/)
  assert.match(html, /https:\/\/tpembars\.com\/NDgxMjc5\.js\?t=481279/)
})

test('renders actual HTML, escapes the heading, and omits empty sections', () => {
  assert.match(
    render('<b>Heading</b>', '<p><strong>Body</strong></p>'),
    /&lt;b&gt;Heading&lt;\/b&gt;/,
  )
  assert.match(render(null, '<p><strong>Body</strong></p>'), /<p><strong>Body<\/strong><\/p>/)
  assert.match(render('Heading only', ''), /Heading only/)
  assert.equal(render(null, ''), '')
  assert.equal(render(null, '   '), '')
})

test('custom HTML widget containers fill the card without changing the saved markup', () => {
  assert.match(customHtmlStyles, /\.custom-html-section__content\s*\{[^}]*width:\s*100%;/)
  assert.match(customHtmlStyles, /\.custom-html-section__embed\s*\{[^}]*width:\s*100%;/)
  assert.match(
    customHtmlStyles,
    /\.custom-html-section__embed\s*>\s*:is\([^)]*\)\s*\{[^}]*width:\s*100%\s*!important;/,
  )
  assert.match(
    customHtmlStyles,
    /\.custom-html-section__embed\s+:is\(iframe, embed, object, video\)\s*\{[^}]*width:\s*100%\s*!important;/,
  )
})

test('trip and blog custom HTML use the Key Highlights card without altering the embed markup', () => {
  const html = '<div id="klook-widget">Cards</div><script>window.loaded = true</script>'
  const tripMarkup = render('Trips You May Like', html, 'trip')
  const blogMarkup = render('Recommended reading', html, 'blog')

  for (const markup of [tripMarkup, blogMarkup]) {
    assert.match(markup, /key-points-card custom-html-section__card/)
    assert.match(markup, /key-points-card-header/)
    assert.match(markup, /key-points-card-icon/)
    assert.match(markup, /key-points-card-eyebrow/)
    assert.match(markup, /key-points-card-title/)
    assert.match(markup, /custom-html-section__embed/)
    assert.doesNotMatch(markup, /prose-hg/, 'third-party markup avoids rich-text styling')
    assert.match(
      markup,
      /<div id="klook-widget">Cards<\/div><script>window\.loaded = true<\/script>/,
    )
  }

  assert.match(tripMarkup, /key-points-card-eyebrow[^>]*>Field notes<\/p>/)
  assert.match(blogMarkup, /key-points-card-eyebrow[^>]*>Field notes<\/p>/)
})

test('only JavaScript script types are runnable; data blocks are not', () => {
  for (const type of [
    undefined,
    null,
    '',
    '   ',
    'text/javascript',
    'TEXT/JAVASCRIPT',
    'text/javascript; charset=utf-8',
    'application/javascript',
    'module',
    'Module',
  ]) {
    assert.equal(isExecutableScriptType(type), true, `${JSON.stringify(type)} should run`)
  }
  for (const type of [
    'application/ld+json',
    'application/json',
    'text/plain',
    'text/template',
    'text/html',
    'importmap',
    'speculationrules',
  ]) {
    assert.equal(isExecutableScriptType(type), false, `${JSON.stringify(type)} must not run`)
  }
})
