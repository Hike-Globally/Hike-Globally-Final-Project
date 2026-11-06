/**
 * The trip brochure's rules — when the sidebar button appears, what it says, and what the
 * downloaded file is named.
 *
 * These are the details that decide whether the feature *looks* finished on the live site: a
 * relationship Payload returned unpopulated must not render a dead button, an editor's own title
 * must beat the default CTA, and the saved file must not arrive as `itinerary-final-v3 (2).pdf`.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import type { Media, Trip } from '../payload-types'
import { brochureDownloadName, formatFileSize, resolveTripBrochure } from './trip-brochure'

const CTA = 'Download Trip Brochure'

const media = (overrides: Partial<Media> = {}): Media =>
  ({
    id: 7,
    alt: 'Everest Base Camp trek brochure',
    url: '/api/media/file/everest-brochure.pdf',
    filename: 'everest-brochure.pdf',
    mimeType: 'application/pdf',
    filesize: 2_412_953,
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }) as Media

type BrochureFields = Pick<Trip, 'brochureFile' | 'brochureTitle' | 'brochureNote'>

/** Only the three brochure fields matter to the resolver; everything else stays empty. */
const tripWith = (fields: Partial<BrochureFields>): BrochureFields => ({
  brochureFile: null,
  brochureTitle: null,
  brochureNote: null,
  ...fields,
})

test('a trip with no brochure renders no button', () => {
  assert.equal(resolveTripBrochure(tripWith({}), 'ebc', CTA), null)
  assert.equal(resolveTripBrochure(tripWith({ brochureFile: null }), 'ebc', CTA), null)
})

test('an unpopulated relationship (a bare id) renders no button', () => {
  assert.equal(resolveTripBrochure(tripWith({ brochureFile: 7 }), 'ebc', CTA), null)
})

test('an upload with no URL (a missing storage object) renders no button', () => {
  assert.equal(
    resolveTripBrochure(tripWith({ brochureFile: media({ url: null }) }), 'ebc', CTA),
    null,
  )
})

test('a PDF brochure uses the default CTA, its kind and its file size', () => {
  const brochure = resolveTripBrochure(
    tripWith({ brochureFile: media() }),
    'everest-base-camp',
    CTA,
  )

  assert.ok(brochure)
  assert.equal(brochure.label, CTA)
  assert.equal(brochure.kindLabel, 'PDF')
  // The button points at the site's own route, not at the storage URL (see below).
  assert.equal(brochure.url, '/trips/everest-base-camp/brochure')
  assert.equal(brochure.filename, 'everest-base-camp-brochure.pdf')
  assert.equal(brochure.note, 'PDF · 2.3 MB')
})

test('an image brochure is labelled Image and keeps its own extension', () => {
  const brochure = resolveTripBrochure(
    tripWith({
      brochureFile: media({
        url: '/api/media/file/page-1.jpg',
        filename: 'page-1.jpg',
        mimeType: 'image/jpeg',
      }),
    }),
    'annapurna',
    CTA,
  )

  assert.ok(brochure)
  assert.equal(brochure.kindLabel, 'Image')
  assert.equal(brochure.note, 'Image · 2.3 MB')
  assert.equal(brochure.filename, 'annapurna-brochure.jpg')
})

test("an editor's title and note win over the defaults", () => {
  const brochure = resolveTripBrochure(
    tripWith({
      brochureFile: media(),
      brochureTitle: 'Download 2027 brochure',
      brochureNote: '12 pages, includes maps',
    }),
    'ebc',
    CTA,
  )

  assert.ok(brochure)
  assert.equal(brochure.label, 'Download 2027 brochure')
  assert.equal(brochure.note, '12 pages, includes maps')
})

test('blank overrides fall back to the CTA and the automatic kind-and-size note', () => {
  const brochure = resolveTripBrochure(
    tripWith({ brochureFile: media(), brochureTitle: '   ', brochureNote: '  ' }),
    'ebc',
    CTA,
  )

  assert.ok(brochure)
  assert.equal(brochure.label, CTA)
  assert.equal(brochure.note, 'PDF · 2.3 MB')
})

test('a file with no recorded size still says what kind of file it is', () => {
  const brochure = resolveTripBrochure(
    tripWith({ brochureFile: media({ filesize: null }) }),
    'ebc',
    CTA,
  )

  assert.ok(brochure)
  assert.equal(brochure.note, 'PDF')
})

test('the download always goes through the same-origin route, wherever the bytes live', () => {
  // Local disk, same-site absolute, and a Vercel Blob CDN URL all resolve to the same link: the
  // route serves the bytes with `Content-Disposition: attachment`, which is the only thing that
  // makes a cross-origin file actually download instead of opening in a PDF viewer.
  for (const stored of [
    '/api/media/file/everest-brochure.pdf',
    'https://hikeglobally.com/api/media/file/everest-brochure.pdf',
    'https://abc.public.blob.vercel-storage.com/everest-brochure.pdf',
  ]) {
    const brochure = resolveTripBrochure(
      tripWith({ brochureFile: media({ url: stored }) }),
      'everest-base-camp',
      CTA,
    )

    assert.ok(brochure)
    assert.equal(brochure.url, '/trips/everest-base-camp/brochure')
  }
})

test('the download name falls back safely', () => {
  assert.equal(brochureDownloadName(null, media({ filename: null })), 'trip-brochure')
  assert.equal(brochureDownloadName('  ', media({ filename: 'no-extension' })), 'trip-brochure')
})

test('file sizes read like a human wrote them', () => {
  assert.equal(formatFileSize(null), '')
  assert.equal(formatFileSize(0), '')
  assert.equal(formatFileSize(900), '1 KB')
  assert.equal(formatFileSize(512 * 1024), '512 KB')
  assert.equal(formatFileSize(2_412_953), '2.3 MB')
})
