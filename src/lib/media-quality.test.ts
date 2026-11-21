import assert from 'node:assert/strict'
import test from 'node:test'

import type { Media } from '../payload-types'
import {
  originalMediaUrl,
  PayloadImage,
  PayloadImageFill,
  resolveMediaImage,
} from '../components/ui/payload-image'
import { imageDimensions, imageUrl, schemaImageUrl } from './seo'

const image = {
  url: 'https://hikeglobally.com/api/media/file/original.jpg',
  width: 4000,
  height: 3000,
  alt: 'Mountain',
  sizes: {
    thumbnail: { url: '/api/media/file/thumbnail.jpg', width: 400, height: 300 },
    hero: { url: '/api/media/file/hero.webp', width: 1920, height: 1080 },
    og: { url: '/api/media/file/og.webp', width: 1200, height: 630 },
  },
} as Media

test('every frontend media resolver prefers the original over generated crops', () => {
  assert.equal(originalMediaUrl(image), '/api/media/file/original.jpg')
  assert.deepEqual(resolveMediaImage(image), {
    src: '/api/media/file/original.jpg',
    alt: 'Mountain',
  })
  assert.equal(imageUrl(image), 'https://hikeglobally.com/api/media/file/original.jpg')
  assert.equal(schemaImageUrl(image), 'https://hikeglobally.com/api/media/file/original.jpg')
  assert.deepEqual(imageDimensions(image), { width: 4000, height: 3000 })
})

test('image layouts route through the Next optimizer instead of serving raw originals', () => {
  for (const Component of [PayloadImage, PayloadImageFill]) {
    const element = Component({ media: image, sizes: '100vw' })
    assert.ok(element)
    const img = Component === PayloadImage ? element.props.children : element
    // The original upload is the optimizer's input — the stored file stays byte-for-byte.
    assert.equal(img.props.src, '/api/media/file/original.jpg')
    // …but the browser gets the optimizer's AVIF/WebP srcset, never the camera original.
    assert.ok(!img.props.unoptimized)
    assert.equal(img.props.sizes, '100vw')
    assert.equal(img.props.width ?? image.width, image.width)
  }
})

test('explicit unoptimized opt-in serves the stored original upload directly', () => {
  for (const Component of [PayloadImage, PayloadImageFill]) {
    const element = Component({ media: image, unoptimized: true })
    assert.ok(element)
    const img = Component === PayloadImage ? element.props.children : element
    assert.equal(img.props.src, '/api/media/file/original.jpg')
    assert.equal(img.props.unoptimized, true)
  }
})

test('non-priority images lazy-load; priority images defer loading to the preload', () => {
  const lazy = PayloadImage({ media: image, sizes: '100vw' })
  assert.equal(lazy?.props.children.props.loading, 'lazy')
  const eager = PayloadImage({ media: image, sizes: '100vw', priority: true })
  assert.equal(eager?.props.children.props.priority, true)
  assert.equal(eager?.props.children.props.loading, undefined)
})

test('SVG and GIF uploads bypass the optimizer and render exactly as stored', () => {
  const svg = PayloadImage({
    media: { ...image, url: '/api/media/file/logo.svg', mimeType: 'image/svg+xml' },
    sizes: '300px',
  })
  assert.equal(svg?.props.children.props.unoptimized, true)

  const gif = PayloadImage({
    media: { ...image, url: '/api/media/file/clip.gif', mimeType: 'image/gif' },
    sizes: '100vw',
  })
  assert.equal(gif?.props.children.props.unoptimized, true)

  const fillSvg = PayloadImageFill({
    media: { ...image, url: '/api/media/file/mark.svg', mimeType: 'image/svg+xml' },
    sizes: '100vw',
  })
  assert.equal(fillSvg?.props.unoptimized, true)

  // Extension-only SVG (mimeType missing) still bypasses.
  const extensionSvg = PayloadImage({
    media: { ...image, url: '/api/media/file/icon.svg', mimeType: null },
    sizes: '100px',
  })
  assert.equal(extensionSvg?.props.children.props.unoptimized, true)
})

test('video uploads keep their original file and render as videos, not broken images', () => {
  const video = { ...image, url: '/api/media/file/clip.mp4', mimeType: 'video/mp4' }
  assert.equal(resolveMediaImage(video), null)
  const inline = PayloadImage({ media: video, sizes: '100vw' })
  assert.equal(inline?.props.children.type, 'video')
  assert.equal(inline?.props.children.props.src, '/api/media/file/clip.mp4')
  assert.equal(inline?.props.children.props.controls, true)
  const background = PayloadImageFill({ media: video, sizes: '100vw' })
  assert.equal(background?.type, 'video')
  assert.equal(background?.props.src, '/api/media/file/clip.mp4')
})

test('video thumbnails are used as posters in both video layouts', () => {
  const video = {
    ...image,
    url: '/api/media/file/clip.mp4',
    mimeType: 'video/mp4',
    videoThumbnail: image,
  }
  const inline = PayloadImage({ media: video, sizes: '100vw' })
  assert.equal(inline?.props.children.props.poster, '/api/media/file/original.jpg')
  const background = PayloadImageFill({ media: video, sizes: '100vw' })
  assert.equal(background?.props.poster, '/api/media/file/original.jpg')
  const unresolved = PayloadImageFill({ media: { ...video, videoThumbnail: 23 }, sizes: '100vw' })
  assert.equal(unresolved?.props.poster, undefined)
})

test('missing originals do not silently fall back to low-resolution derivatives', () => {
  const missing = { ...image, url: null }
  assert.equal(originalMediaUrl(missing), null)
  assert.equal(resolveMediaImage(missing), null)
  assert.equal(PayloadImageFill({ media: missing, sizes: '100vw' }), null)
  assert.equal(originalMediaUrl(1), null)
})

test('external storage keeps its CDN URL', () => {
  assert.equal(
    originalMediaUrl({ ...image, url: 'https://example.public.blob.vercel-storage.com/large.jpg' }),
    'https://example.public.blob.vercel-storage.com/large.jpg',
  )
})
