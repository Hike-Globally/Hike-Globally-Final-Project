import { test } from 'node:test'
import assert from 'node:assert/strict'
import { payloadBlobUrl, verifyBlob } from './migrate-media-to-blob.mjs'

test('URL matches Payload encoding of filenames', () => {
  assert.equal(payloadBlobUrl('ABC123', 'folder/a b.jpg'), 'https://abc123.public.blob.vercel-storage.com/folder/a%20b.jpg')
})
test('verification checks file bytes and content type', async () => {
  const response = (body, type = 'image/jpeg') => async () => new Response(body, { headers: { 'content-type': type } })
  await verifyBlob('https://example.com/file', Buffer.from('abc'), 'image/jpeg', response('abc'))
  await assert.rejects(verifyBlob('https://example.com/file', Buffer.from('abc'), 'image/jpeg', response('xyz')), /bytes differ/)
  await assert.rejects(verifyBlob('https://example.com/file', Buffer.from('abc'), 'image/jpeg', response('abc', 'text/plain')), /content type mismatch/)
  await assert.rejects(verifyBlob('https://example.com/file', Buffer.from('abc'), 'image/jpeg', async () => new Response(null, { status: 404 })), /HTTP 404/)
})
