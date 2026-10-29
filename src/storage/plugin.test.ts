import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Config } from 'payload'

import { Media } from '../collections/Media'
import { mediaStoragePlugin } from './plugin'

describe('mediaStoragePlugin', () => {
  it('serves Vercel Blob media directly from the Blob CDN without proxying through /api/media/file', async () => {
    const previousToken = process.env.BLOB_READ_WRITE_TOKEN
    process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_teststore123_secret456'

    try {
      const baseConfig = { collections: [Media] } as unknown as Config
      const configured = await mediaStoragePlugin('blob')(baseConfig)
      const media = configured.collections?.find((c) => c.slug === 'media')
      assert.ok(media)

      // When `disablePayloadAccessControl: true` is active and clientUploads is off, the cloud
      // storage plugin registers NO proxy `staticHandler` on `/api/media/file/*` and instead
      // computes direct `*.public.blob.vercel-storage.com` URLs in the `url` field's afterRead hook.
      const upload = typeof media.upload === 'object' ? media.upload : undefined
      assert.ok(upload)
      assert.deepEqual(upload.handlers ?? [], [])

      const urlField = media.fields.find((f) => 'name' in f && f.name === 'url')
      assert.ok(urlField && 'hooks' in urlField && urlField.hooks?.afterRead?.[0])

      const computedUrl = await urlField.hooks.afterRead[0]({
        data: { filename: 'summit.jpg' },
        value: '/api/media/file/summit.jpg',
      } as never)

      assert.equal(
        computedUrl,
        'https://teststore123.public.blob.vercel-storage.com/summit.jpg',
      )
    } finally {
      if (previousToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN
      else process.env.BLOB_READ_WRITE_TOKEN = previousToken
    }
  })
})
