import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { CustomHtmlSection } from '../components/content/custom-html-section'
import { sanitizeCustomHtml } from './custom-html'

test('preserves content HTML, tables, images, relative links and safe formatting', () => {
  const html = sanitizeCustomHtml(
    '<h3>Gear</h3><p style="color:#123456;text-align:center">Pack light</p><ul><li>Boots</li></ul><table><tr><th scope="col">Item</th><td colspan="2">Tent</td></tr></table><img src="/media/gear.jpg" alt="Gear"><a href="/trips" target="_blank">Trips</a>',
  )
  assert.match(html, /<h3>Gear<\/h3>/)
  assert.match(html, /style="color:#123456;text-align:center"/)
  assert.match(html, /<th scope="col">Item<\/th>/)
  assert.match(html, /<td colspan="2">Tent<\/td>/)
  assert.match(html, /src="\/media\/gear.jpg"/)
  assert.match(html, /loading="lazy"/)
  assert.match(html, /href="\/trips"/)
  assert.match(html, /rel="noopener noreferrer"/)
})

test('removes executable tags, event handlers, embeds and unsafe URL schemes', () => {
  const html = sanitizeCustomHtml(
    '<script>alert(1)</script><style>body{display:none}</style><iframe src="https://evil.test"></iframe><object data="evil"></object><svg onload="alert(1)"></svg><img src="javascript:alert(1)" onerror="alert(1)"><a href="java&#x73;cript:alert(1)">Bad</a><img src="data:image/svg+xml,evil"><form action="https://evil.test"><input name="password"></form>',
  )
  assert.doesNotMatch(
    html,
    /script|alert|onload|onerror|iframe|object|svg|<style|<form|<input|javascript:|data:/i,
  )
  assert.match(html, />Bad<\/a>/)
})

test('does not allow page-covering or network-loading inline CSS', () => {
  const html = sanitizeCustomHtml(
    '<p style="position:fixed;inset:0;z-index:999999;background-image:url(https://evil.test/track);color:red; width:expression(alert(1))">Safe</p>',
  )
  assert.equal(html, '<p style="color:red">Safe</p>')
})

test('renders actual HTML, escapes the heading, and omits empty/unsafe-only sections', () => {
  const render = (heading: string | null, html: string) =>
    renderToStaticMarkup(
      createElement(CustomHtmlSection, {
        section: { kind: 'html', heading, html },
      }),
    )
  assert.match(
    render('<b>Heading</b>', '<p><strong>Body</strong></p>'),
    /&lt;b&gt;Heading&lt;\/b&gt;/,
  )
  assert.match(render(null, '<p><strong>Body</strong></p>'), /<p><strong>Body<\/strong><\/p>/)
  assert.equal(render(null, ''), '')
  assert.equal(render(null, '<script>alert(1)</script>'), '')
})
