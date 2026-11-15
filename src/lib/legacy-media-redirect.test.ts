import assert from 'node:assert/strict'
import { test } from 'node:test'
import { legacyMediaRedirect } from './legacy-media-redirect'
import type { MediaStorageEnv } from './media-storage'

const env = { BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_Test123_secret456', VERCEL: '1' }
const url = (path: string, method = 'GET', e: MediaStorageEnv = env) => legacyMediaRedirect(`https://hikeglobally.com${path}`, method, e)

test('redirects old media originals, variants, and encoded filenames to the configured Blob store', () => {
  assert.equal(url('/api/media/file/summit.jpg'), 'https://test123.public.blob.vercel-storage.com/summit.jpg')
  assert.equal(url('/api/media/file/a%20b%26c.jpg'), 'https://test123.public.blob.vercel-storage.com/a%20b%26c.jpg')
  assert.equal(url('/api/media/file/photo.webp?prefix=folder%2Fsub'), 'https://test123.public.blob.vercel-storage.com/folder/sub/photo.webp')
  assert.equal(url('/api/media/file/summit.jpg?download=true', 'HEAD'), 'https://test123.public.blob.vercel-storage.com/summit.jpg')
})

test('does not redirect requests outside public read mode or with unsafe paths', () => {
  assert.equal(url('/api/media/file/summit.jpg', 'POST'), null)
  assert.equal(url('/api/media/file/summit.jpg', 'GET', { ...env, MEDIA_STORAGE: 'database' }), null)
  assert.equal(url('/api/media/file/summit.jpg', 'GET', { VERCEL: '1' }), null)
  assert.equal(url('/api/media/file/summit.jpg', 'GET', { ...env, BLOB_READ_WRITE_TOKEN: 'invalid' }), null)
  assert.equal(url('/api/media/file/%2F%2Fevil.com'), null)
  assert.equal(url('/api/media/file/%2e%2e%2fevil'), null)
  assert.equal(url('/api/media/file/photo.jpg?prefix=..%2Fevil'), null)
  assert.equal(url('/api/media/file/photo.jpg?prefix=a&prefix=b'), null)
  assert.equal(url('/api/media/file/%E0%A4%A'), null)
  assert.equal(url('/api/media/123'), null)
})
