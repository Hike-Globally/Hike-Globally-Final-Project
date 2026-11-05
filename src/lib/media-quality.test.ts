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

test('both image layouts point at the original and let Next build the srcset', () => {
  for (const Component of [PayloadImage, PayloadImageFill]) {
    const element = Component({ media: image, sizes: '100vw' })
    assert.ok(element)
    const img = Component === PayloadImage ? element.props.children : element
    // The source is always the original upload, never a Payload crop ...
    assert.equal(img.props.src, '/api/media/file/original.jpg')
    // ... and no `unoptimized` flag is set, so Next serves a responsive, modern-format variant.
    assert.notEqual(img.props.unoptimized, true)
    assert.equal(img.props.sizes, '100vw')
    assert.equal(img.props.width ?? image.width, image.width)
  }
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
