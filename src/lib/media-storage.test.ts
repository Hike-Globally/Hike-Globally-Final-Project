import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { blobTokenVariable, isServerlessHost, resolveMediaStorage } from './media-storage'

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

describe('blob token variable name', () => {
  it('reads the conventional BLOB_READ_WRITE_TOKEN', () => {
    const env = { BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_a', HikeGlobally_READ_WRITE_TOKEN: 'b' }

    assert.equal(blobTokenVariable(env), 'BLOB_READ_WRITE_TOKEN')
  })

  it('names the store-prefixed variable Vercel creates when a Blob store is connected', () => {
    // This is the production environment: a Blob store called "HikeGlobally".
    assert.equal(
      blobTokenVariable({ VERCEL: '1', HikeGlobally_READ_WRITE_TOKEN: 'vercel_blob_rw_x' }),
      'HikeGlobally_READ_WRITE_TOKEN',
    )
  })

  it('does not switch storage mode on a store-named token, but says what to do about it', () => {
    const decision = resolveMediaStorage({ VERCEL: '1', HikeGlobally_READ_WRITE_TOKEN: 'tok' })

    // Switching automatically would leave every file already stored in Postgres unreachable: those
    // are served from /api/media/file/<name> by the database adapter and nowhere else.
    assert.equal(decision.mode, 'database')
    assert.match(decision.reason, /HikeGlobally_READ_WRITE_TOKEN is present/)
    assert.match(decision.reason, /MEDIA_STORAGE=blob/)
  })

  it('recommends the same fix in local development', () => {
    const decision = resolveMediaStorage({ HikeGlobally_READ_WRITE_TOKEN: 'tok' })

    assert.equal(decision.mode, 'local')
    assert.match(decision.reason, /HikeGlobally_READ_WRITE_TOKEN is present/)
  })

  it('says nothing about tokens when none is set at all', () => {
    const decision = resolveMediaStorage({ VERCEL: '1' })

    assert.doesNotMatch(decision.reason, /is present but this app reads/)
  })

  it('ignores an empty store-named variable', () => {
    assert.equal(blobTokenVariable({ HikeGlobally_READ_WRITE_TOKEN: '   ' }), null)
  })

  it('ignores credentials that are not Blob read/write tokens', () => {
    const env = { VERCEL: '1', S3_ACCESS_KEY_ID: 'x', REVALIDATE_SECRET: 'y', PAYLOAD_SECRET: 'z' }

    assert.equal(blobTokenVariable(env), null)
    assert.equal(resolveMediaStorage(env).mode, 'database')
  })
})
