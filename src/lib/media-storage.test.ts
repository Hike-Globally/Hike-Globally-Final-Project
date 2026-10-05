import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { isServerlessHost, resolveMediaStorage } from './media-storage'

describe('resolveMediaStorage', () => {
  it('prefers Vercel Blob whenever a token is configured', () => {
    const decision = resolveMediaStorage({
      BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_store_abc',
      VERCEL: '1',
    })

    assert.equal(decision.mode, 'blob')
    assert.match(decision.reason, /BLOB_READ_WRITE_TOKEN/)
  })

  it('falls back to Postgres on a serverless host without external storage', () => {
    const decision = resolveMediaStorage({ VERCEL: '1', VERCEL_ENV: 'production' })

    assert.equal(decision.mode, 'database')
    assert.match(decision.reason, /read-only filesystem/)
    assert.match(decision.reason, /BLOB_READ_WRITE_TOKEN/)
  })

  it('also treats a bare Lambda runtime as serverless', () => {
    assert.equal(isServerlessHost({ AWS_LAMBDA_FUNCTION_NAME: 'hike-globally' }), true)
    assert.equal(resolveMediaStorage({ AWS_LAMBDA_FUNCTION_NAME: 'hike' }).mode, 'database')
  })

  it('keeps writing to disk locally', () => {
    const decision = resolveMediaStorage({ NODE_ENV: 'development' })

    assert.equal(decision.mode, 'local')
    assert.match(decision.reason, /public\/media/)
  })

  it('honours MEDIA_STORAGE=local even on a serverless host', () => {
    const decision = resolveMediaStorage({ MEDIA_STORAGE: 'local', VERCEL: '1' })

    assert.equal(decision.mode, 'local')
    assert.match(decision.reason, /MEDIA_STORAGE=local/)
  })

  it('honours MEDIA_STORAGE=database off-serverless, for self-hosting', () => {
    const decision = resolveMediaStorage({ MEDIA_STORAGE: 'database' })

    assert.equal(decision.mode, 'database')
    assert.match(decision.reason, /MEDIA_STORAGE=database/)
  })

  it('ignores MEDIA_STORAGE=blob when there is no token, and says so', () => {
    const onVercel = resolveMediaStorage({ MEDIA_STORAGE: 'blob', VERCEL: '1' })
    assert.equal(onVercel.mode, 'database')
    assert.match(onVercel.reason, /MEDIA_STORAGE=blob needs BLOB_READ_WRITE_TOKEN/)

    const local = resolveMediaStorage({ MEDIA_STORAGE: 'blob' })
    assert.equal(local.mode, 'local')
    assert.match(local.reason, /MEDIA_STORAGE=blob needs BLOB_READ_WRITE_TOKEN/)
  })

  it('accepts a token with surrounding whitespace but not an empty one', () => {
    assert.equal(resolveMediaStorage({ BLOB_READ_WRITE_TOKEN: '  token  ' }).mode, 'blob')
    assert.equal(
      resolveMediaStorage({ BLOB_READ_WRITE_TOKEN: '   ', VERCEL: '1' }).mode,
      'database',
    )
  })

  it('falls back to the automatic mode for an unknown MEDIA_STORAGE value', () => {
    const decision = resolveMediaStorage({ MEDIA_STORAGE: 's3', VERCEL: '1' })

    assert.equal(decision.mode, 'database')
    assert.match(decision.reason, /not a valid mode/)
  })

  it('is case-insensitive about MEDIA_STORAGE', () => {
    assert.equal(resolveMediaStorage({ MEDIA_STORAGE: 'Database' }).mode, 'database')
  })
})
