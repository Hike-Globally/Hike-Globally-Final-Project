/**
 * Tests for the Postgres media adapter. The adapter only talks to a `pg`-shaped pool, so a small
 * recorder stands in for Postgres: it captures the SQL/params and returns scripted rows. That
 * covers the parts that matter — what gets stored, what gets deleted, and how a stored file is
 * served (status, headers, ranges, 404s) — without a database in the loop.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import type { Payload } from 'payload'

import {
  databaseStorageAdapter,
  ensureMediaStorageSchema,
  mediaStorePool,
  readUploadBytes,
  storageKeyFor,
} from './database-adapter'
import { MEDIA_FILES_TABLE, MAX_DATABASE_FILE_SIZE } from '../lib/media-storage-schema'

type Call = { text: string; values: unknown[] }

const createFakePool = (script: { rows?: Record<string, unknown>[]; error?: Error } = {}) => {
  const calls: Call[] = []
  const pool = {
    query: async (text: string, values: unknown[] = []) => {
      calls.push({ text, values })
      if (script.error) {
        throw script.error
      }
      return { rows: script.rows ?? [] }
    },
  }
  return { pool, calls }
}

const collection = { slug: 'media', fields: [], upload: true } as never

const adapter = databaseStorageAdapter({ collection })

const requestWith = (pool: unknown, headers: Record<string, string> = {}) =>
  ({
    headers: new Headers(headers),
    payload: {
      config: { cors: [] },
      db: { pool },
      logger: { error: () => {}, warn: () => {} },
    } as unknown as Payload,
  }) as never

const uploadFile = (overrides: Record<string, unknown> = {}) =>
  ({
    buffer: undefined,
    filename: 'photo.jpg',
    filesize: 4,
    mimeType: 'image/jpeg',
    tempFilePath: undefined,
    ...overrides,
  }) as never

describe('mediaStorePool', () => {
  it('reads the pool off a Postgres database adapter', () => {
    const { pool } = createFakePool()
    assert.equal(mediaStorePool({ db: { pool } } as never), pool)
  })

  it('returns null for adapters without a pool', () => {
    assert.equal(mediaStorePool({ db: {} } as never), null)
    assert.equal(mediaStorePool(undefined), null)
  })
})

describe('storageKeyFor', () => {
  it('uses the bare filename when there is no folder', () => {
    assert.equal(storageKeyFor('photo.jpg'), 'photo.jpg')
    assert.equal(storageKeyFor('photo.jpg', ''), 'photo.jpg')
  })

  it('joins a folder the way the plugin does', () => {
    assert.equal(storageKeyFor('photo.jpg', 'covers'), 'covers/photo.jpg')
    assert.equal(storageKeyFor('photo.jpg', '/covers/'), 'covers/photo.jpg')
  })
})

describe('readUploadBytes', () => {
  it('uses the in-memory buffer when Payload provides one', async () => {
    const bytes = Buffer.from('abcd')
    assert.deepEqual(await readUploadBytes(uploadFile({ buffer: bytes })), bytes)
  })

  it('streams from the temp file when the original is not buffered', async () => {
    const tempFilePath = path.join(os.tmpdir(), `hg-upload-${Date.now()}.jpg`)
    await fs.writeFile(tempFilePath, Buffer.from('temp-bytes'))

    try {
      const bytes = await readUploadBytes(uploadFile({ tempFilePath }))
      assert.equal(bytes.toString(), 'temp-bytes')
    } finally {
      await fs.rm(tempFilePath, { force: true })
    }
  })

  it('rejects an oversized file with a message that points at Blob', async () => {
    const buffer = Buffer.alloc(MAX_DATABASE_FILE_SIZE + 1)
    await assert.rejects(
      async () => await readUploadBytes(uploadFile({ buffer })),
      /larger than the .* limit of the Postgres media store/,
    )
  })

  it('explains an upload with neither buffer nor temp file', async () => {
    await assert.rejects(
      async () => await readUploadBytes(uploadFile()),
      /neither a buffer nor a temporary file/,
    )
  })
})

describe('handleUpload', () => {
  it('upserts the bytes by storage path', async () => {
    const { pool, calls } = createFakePool()
    const bytes = Buffer.from('image-bytes')

    await adapter.handleUpload({
      data: {},
      file: uploadFile({ buffer: bytes }),
      req: requestWith(pool),
      storageFilePath: 'photo.jpg',
    } as never)

    assert.equal(calls.length, 1)
    assert.match(calls[0]!.text, new RegExp(`INSERT INTO "${MEDIA_FILES_TABLE}"`))
    assert.match(calls[0]!.text, /ON CONFLICT \("file_key"\) DO UPDATE/)
    assert.deepEqual(calls[0]!.values.slice(0, 4), ['photo.jpg', 'media', 'image/jpeg', 11])
    assert.deepEqual(Buffer.from(calls[0]!.values[4] as Uint8Array), bytes)
  })

  it('fails loudly when the database is not a Postgres adapter', async () => {
    await assert.rejects(
      async () =>
        await adapter.handleUpload({
          data: {},
          file: uploadFile({ buffer: Buffer.from('x') }),
          req: requestWith(undefined),
          storageFilePath: 'photo.jpg',
        } as never),
      /needs the Postgres database adapter/,
    )
  })
})

describe('handleDelete', () => {
  it('deletes the row by storage path', async () => {
    const { pool, calls } = createFakePool()

    await adapter.handleDelete({
      doc: {},
      filename: 'photo.jpg',
      req: requestWith(pool),
      storageFilePath: 'photo.jpg',
    } as never)

    assert.equal(calls.length, 1)
    assert.match(calls[0]!.text, new RegExp(`DELETE FROM "${MEDIA_FILES_TABLE}"`))
    assert.deepEqual(calls[0]!.values, ['photo.jpg'])
  })
})

describe('staticHandler', () => {
  const params = { collection: 'media', filename: 'photo.jpg' }

  it('returns 404 for a file that is not stored', async () => {
    const { pool } = createFakePool({ rows: [] })
    const response = await adapter.staticHandler(requestWith(pool), { params } as never)

    assert.equal(response.status, 404)
  })

  it('streams the stored bytes with cache and range headers', async () => {
    const bytes = Buffer.from('hello world')
    const { pool, calls } = createFakePool({
      rows: [{ data: bytes, mime_type: 'image/jpeg', filesize: String(bytes.length) }],
    })

    const response = await adapter.staticHandler(requestWith(pool), { params } as never)

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'image/jpeg')
    assert.equal(response.headers.get('content-length'), String(bytes.length))
    assert.equal(response.headers.get('accept-ranges'), 'bytes')
    assert.match(response.headers.get('cache-control') ?? '', /max-age=86400/)
    assert.equal(Buffer.from(await response.arrayBuffer()).toString(), 'hello world')
    assert.deepEqual(calls[0]!.values, ['photo.jpg'])
  })

  it('looks files up inside their folder', async () => {
    const { pool, calls } = createFakePool({ rows: [] })

    await adapter.staticHandler(requestWith(pool), {
      params: { ...params, prefix: 'covers' },
    } as never)

    assert.deepEqual(calls[0]!.values, ['covers/photo.jpg'])
  })

  it('serves byte ranges with 206 and rejects unsatisfiable ones with 416', async () => {
    const bytes = Buffer.from('0123456789')
    const { pool } = createFakePool({
      rows: [{ data: bytes, mime_type: 'image/jpeg', filesize: '10' }],
    })

    const partial = await adapter.staticHandler(requestWith(pool, { range: 'bytes=2-5' }), {
      params,
    } as never)
    assert.equal(partial.status, 206)
    assert.equal(partial.headers.get('content-range'), 'bytes 2-5/10')
    assert.equal(Buffer.from(await partial.arrayBuffer()).toString(), '2345')

    const invalid = await adapter.staticHandler(requestWith(pool, { range: 'bytes=500-600' }), {
      params,
    } as never)
    assert.equal(invalid.status, 416)
    assert.equal(invalid.headers.get('content-range'), 'bytes */10')
  })

  it('locks down SVG responses with the upload content-security policy', async () => {
    const bytes = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')
    const { pool } = createFakePool({
      rows: [{ data: bytes, mime_type: 'image/svg+xml', filesize: String(bytes.length) }],
    })

    const response = await adapter.staticHandler(requestWith(pool), { params } as never)

    assert.match(response.headers.get('content-security-policy') ?? '', /script-src 'none'/)
  })

  it('honours upload.modifyResponseHeaders', async () => {
    const bytes = Buffer.from('x')
    const { pool } = createFakePool({
      rows: [{ data: bytes, mime_type: 'image/jpeg', filesize: '1' }],
    })
    const withHeaders = databaseStorageAdapter({
      collection: {
        slug: 'media',
        upload: {
          modifyResponseHeaders: ({ headers }: { headers: Headers }) => {
            headers.set('x-media-store', 'postgres')
            return headers
          },
        },
        fields: [],
      } as never,
    })

    const response = await withHeaders.staticHandler(requestWith(pool), { params } as never)

    assert.equal(response.headers.get('x-media-store'), 'postgres')
  })
})

describe('ensureMediaStorageSchema', () => {
  it('creates the table on boot', async () => {
    const { pool, calls } = createFakePool()

    await ensureMediaStorageSchema({ db: { pool }, logger: { error: () => {} } } as never)

    assert.equal(calls.length, 3)
    assert.match(calls[0]!.text, /CREATE TABLE IF NOT EXISTS "media_files"/)
    assert.match(calls[0]!.text, /"file_key" varchar PRIMARY KEY/)
    assert.match(calls[1]!.text, /ADD COLUMN IF NOT EXISTS "prefix"/)
    assert.match(calls[2]!.text, /ADD COLUMN IF NOT EXISTS "_objectkey"/)
  })

  it('logs — but does not throw — when the role may not create tables', async () => {
    const errors: string[] = []
    const { pool } = createFakePool({ error: new Error('permission denied for schema public') })

    await ensureMediaStorageSchema({
      db: { pool },
      logger: { error: (message: string) => errors.push(message) },
    } as never)

    assert.equal(errors.length, 2)
    assert.match(errors[0]!, /could not prepare the media store schema automatically/)
    assert.match(errors[1]!, /npm run migrate/)
  })

  it('does nothing for adapters without a pool', async () => {
    await ensureMediaStorageSchema({ db: {}, logger: { error: () => {} } } as never)
  })
})
