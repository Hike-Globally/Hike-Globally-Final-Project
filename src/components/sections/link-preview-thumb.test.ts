import assert from 'node:assert/strict'
import test from 'node:test'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'

import { imageProxyUrl, LINK_PREVIEW_FALLBACK_IMAGE } from '@/lib/link-preview-image'
import { LinkPreviewThumb } from './link-preview-thumb'

test('server markup prefers the featured image and has a local photo when no image is known', () => {
  const html = renderToStaticMarkup(
    createElement(LinkPreviewThumb, {
      image: 'https://cdn.example.com/og.jpg',
      host: 'example.com',
    }),
  )
  assert.match(html, /src="\/api\/link-preview-image\?url=/)
  assert.match(html, /referrerPolicy="no-referrer"/i)
  const fallback = renderToStaticMarkup(
    createElement(LinkPreviewThumb, { image: null, host: 'example.com' }),
  )
  assert.match(fallback, /src="\/images\/trips\/hero\.jpg"/)
  assert.doesNotMatch(fallback, /link-preview-thumb-initial/)
})

test('failed proxy and featured image fall through to page photo and then local photo', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://hike.test' })
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const previousAct = (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })
  const root = createRoot(dom.window.document.getElementById('root')!)
  try {
    await act(async () =>
      root.render(
        createElement(LinkPreviewThumb, {
          image: 'https://cdn.example.com/hero.jpg',
          host: 'example.com',
          alternatives: ['https://cdn.example.com/body.jpg'],
        }),
      ),
    )
    const src = () => dom.window.document.querySelector('img')?.getAttribute('src')
    const fail = async () => {
      await act(async () => {
        dom.window.document.querySelector('img')!.dispatchEvent(new dom.window.Event('error'))
      })
    }
    assert.equal(src(), imageProxyUrl('https://cdn.example.com/hero.jpg'))
    await fail()
    assert.equal(src(), 'https://cdn.example.com/hero.jpg')
    await fail()
    assert.equal(src(), imageProxyUrl('https://cdn.example.com/body.jpg'))
    await fail()
    assert.equal(src(), 'https://cdn.example.com/body.jpg')
    await fail()
    assert.equal(src(), LINK_PREVIEW_FALLBACK_IMAGE)
    assert.doesNotMatch(dom.window.document.body.textContent ?? '', /[A-Z]/)
  } finally {
    await act(async () => root.unmount())
    Object.assign(globalThis, {
      window: previousWindow,
      document: previousDocument,
      IS_REACT_ACT_ENVIRONMENT: previousAct,
    })
    dom.window.close()
  }
})
