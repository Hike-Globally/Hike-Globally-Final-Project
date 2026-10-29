/**
 * Postgres-backed storage adapter for Payload's cloud-storage plugin.
 *
 * Why: a Payload upload writes to disk (`upload.staticDir`) unless a storage adapter takes over.
 * On a serverless host the filesystem is read-only, so with no external store (Vercel Blob et al.)
 * every upload fails — which is the bug this adapter removes. Files are kept in the Postgres
 * database the CMS already requires, so uploading works on a fresh deployment with no extra
 * configuration. When `BLOB_READ_WRITE_TOKEN` is present the config prefers Vercel Blob (see
 * `src/lib/media-storage.ts`); this stays the zero-setup fallback.
 *
 * Because the adapter plugs into `@payloadcms/plugin-cloud-storage`, URLs, admin thumbnails,
 * `next/image` and the REST upload endpoint behave exactly as they do for Blob: files are served
 * from `/api/media/file/<filename>` by the static handler below.
 *
 * Limits worth knowing: `/api/media/file/<filename>` streams rows straight from Postgres with
 * Range support and immutable-ish cache headers, and uploads are capped at
 * `MAX_DATABASE_FILE_SIZE` (25 MB) so a runaway upload cannot bloat the database. On Vercel the
 * platform's ~4.5 MB request-body limit is the practical ceiling anyway; larger files need Blob
 * (and `BLOB_CLIENT_UPLOADS=true` for the browser-upload path).
 */
import { readFile, stat } from 'node:fs/promises'

import type {
  Adapter,
  File as UploadFile,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'
import { APIError, headersWithCors, type Payload, type PayloadRequest } from 'payload'
import { isXmlMimeType, parseRangeHeader, UPLOAD_CONTENT_SECURITY_POLICY } from 'payload/internal'

import {
  MEDIA_FILES_TABLE,
  MEDIA_STORAGE_SCHEMA_HINT,
  MAX_DATABASE_FILE_SIZE,
  formatFileSize,
  mediaFilesTableStatements,
  mediaStorageColumnStatements,
} from '../lib/media-storage-schema'

/** The subset of `pg.Pool` this module needs — also trivial to fake in tests. */
export type MediaStorePool = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>
}

type QueryResult = { rows: Record<string, unknown>[] }

/** Postgres errors for "relation/column/schema does not exist". */
const MISSING_OBJECT_CODES = new Set(['42P01', '42703', '3F000'])

/** The Postgres pool behind Payload's database adapter, when this deployment uses one. */
export const mediaStorePool = (payload: Payload | null | undefined): MediaStorePool | null => {
  const db = payload?.db as unknown as { pool?: MediaStorePool } | undefined
  return db?.pool ?? null
}

const storeTable = (): string => `"${MEDIA_FILES_TABLE}"`

/**
 * Runs a query, turning "the media store is missing" into an error that says what to do about it.
 * A missing migration otherwise shows up as an opaque upload failure.
 */
const runStoreQuery = async <T extends QueryResult>(
  action: string,
  run: () => Promise<T>,
): Promise<T> => {
  try {
    return await run()
  } catch (error) {
    const code = (error as { code?: string } | null)?.code
    if (code && MISSING_OBJECT_CODES.has(code)) {
      throw new APIError(`${action} failed. ${MEDIA_STORAGE_SCHEMA_HINT}`, 500)
    }
    throw error
  }
}

/**
 * Creates the media store table and the plugin's `media` columns when they are missing. Runs on
 * boot, so a database that has not had the migration applied yet still accepts uploads; a role
 * without DDL rights only gets a loud log line, never a crash — a missing table must not take the
 * whole site down.
 */
export const ensureMediaStorageSchema = async (payload: Payload): Promise<void> => {
  const pool = mediaStorePool(payload)
  if (!pool) {
    return
  }

  const statements = [...mediaFilesTableStatements, ...mediaStorageColumnStatements]

  for (const statement of statements) {
    try {
      await pool.query(statement)
    } catch (error) {
      payload.logger.error(
        `[media] could not prepare the media store schema automatically: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
      payload.logger.error(`[media] ${MEDIA_STORAGE_SCHEMA_HINT}`)
      return
    }
  }
}

/** `/api/media/file/<filename>`, optionally carrying the folder that contains the object. */
const mediaFileURL = (filename: string, prefix?: string): string => {
  const base = `/api/media/file/${encodeURIComponent(filename)}`
  const folder = normalizePrefix(prefix)
  return folder ? `${base}?prefix=${encodeURIComponent(folder)}` : base
}

const normalizePrefix = (prefix?: string | null): string => (prefix ?? '').replace(/^\/+|\/+$/g, '')

/**
 * Resolves the object key for `/api/media/file/<filename>?prefix=<folder>`, mirroring the plugin's
 * own `buildStoragePathData` so URLs round-trip exactly. The collection has no prefix configured,
 * so in practice this is just the filename.
 */
export const storageKeyFor = (filename: string, prefix?: string | null): string => {
  const folder = normalizePrefix(prefix)
  return folder ? `${folder}/${filename}` : filename
}

/**
 * Reads the uploaded bytes out of the shape Payload hands to an adapter.
 *
 * With `upload.useTempFiles` enabled (the default here, and required for the 1 GB limit) the
 * original file only exists on disk — `file.buffer` is undefined — while generated image sizes
 * arrive as in-memory buffers.
 */
export const readUploadBytes = async (file: UploadFile): Promise<Buffer> => {
  const buffered = Buffer.isBuffer(file.buffer) && file.buffer.length > 0 ? file.buffer : undefined

  if (buffered) {
    assertStorableSize(buffered.length, file.filename)
    return buffered
  }

  if (!file.tempFilePath) {
    throw new APIError(
      `The upload of "${file.filename}" could not be read: it has neither a buffer nor a ` +
        'temporary file. Please retry.',
      500,
    )
  }

  const { size } = await stat(file.tempFilePath)
  assertStorableSize(size, file.filename)

  return readFile(file.tempFilePath)
}

const assertStorableSize = (size: number, filename: string): void => {
  if (size > MAX_DATABASE_FILE_SIZE) {
    throw new APIError(
      `"${filename}" is ${formatFileSize(size)} — larger than the ${formatFileSize(
        MAX_DATABASE_FILE_SIZE,
      )} per-file limit of the Postgres media store. Connect a Vercel Blob store to the project ` +
        '(and redeploy) to store larger files.',
      400,
    )
  }
}

/**
 * Zero-copy view of a Buffer that satisfies the DOM `BodyInit` types (a plain `Buffer` does not,
 * because it may be backed by a shared `ArrayBufferLike`).
 */
const asResponseBody = (bytes: Buffer): Uint8Array<ArrayBuffer> =>
  new Uint8Array(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength)

const requirePool = (req: PayloadRequest, action: string): MediaStorePool => {
  const pool = mediaStorePool(req.payload)
  if (!pool) {
    throw new APIError(
      `${action} needs the Postgres database adapter, which is not available.`,
      500,
    )
  }
  return pool
}

type ModifyResponseHeaders = (args: { headers: Headers }) => Headers | void

/**
 * Serves a stored file. Mirrors Payload's own local-disk handler: full responses, byte ranges
 * (206/416), the SVG/XML content-security policy and `upload.modifyResponseHeaders`.
 */
const serveStoredFile = async (
  req: PayloadRequest,
  pool: MediaStorePool,
  key: string,
  modifyResponseHeaders?: ModifyResponseHeaders,
): Promise<Response> => {
  const applyUploadHeaders = (headers: Headers): Headers =>
    modifyResponseHeaders?.({ headers }) || headers

  let result: QueryResult
  try {
    result = await runStoreQuery('Reading a media file', () =>
      pool.query(`SELECT "data", "mime_type" FROM ${storeTable()} WHERE "file_key" = $1 LIMIT 1`, [
        key,
      ]),
    )
  } catch {
    return new Response(`The media store is unavailable. ${MEDIA_STORAGE_SCHEMA_HINT}`, {
      status: 500,
    })
  }

  const row = result.rows[0]
  if (!row) {
    return new Response('Not Found', { status: 404 })
  }

  const bytes = row.data as Buffer
  const mimeType = typeof row.mime_type === 'string' ? row.mime_type : 'application/octet-stream'

  let headers = new Headers()
  headers.set('Content-Type', mimeType)
  headers.set('Accept-Ranges', 'bytes')
  // Cache for 1 day in browsers and 30 days at the Vercel/CDN edge (`s-maxage`) so image and video
  // traffic stays off Fluid Compute and Postgres without keeping a replaced file stale in browsers.
  headers.set(
    'Cache-Control',
    'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800',
  )
  if (isXmlMimeType(mimeType)) {
    headers.set('Content-Security-Policy', UPLOAD_CONTENT_SECURITY_POLICY)
  }

  const range = parseRangeHeader({
    fileSize: bytes.byteLength,
    rangeHeader: req.headers.get('range'),
  })

  if (range.type === 'invalid') {
    headers.set('Content-Range', `bytes */${bytes.byteLength}`)
    return new Response(null, {
      headers: headersWithCors({ headers: applyUploadHeaders(headers), req }),
      status: 416,
    })
  }

  if (range.type === 'partial' && range.range) {
    const { start, end } = range.range
    headers.set('Content-Length', String(end - start + 1))
    headers.set('Content-Range', `bytes ${start}-${end}/${bytes.byteLength}`)
    headers = applyUploadHeaders(headers)
    return new Response(asResponseBody(bytes.subarray(start, end + 1)), {
      headers: headersWithCors({ headers, req }),
      status: 206,
    })
  }

  headers.set('Content-Length', String(bytes.byteLength))
  return new Response(asResponseBody(bytes), {
    headers: headersWithCors({ headers: applyUploadHeaders(headers), req }),
    status: 200,
  })
}

export const databaseStorageAdapter: Adapter = ({ collection }): GeneratedAdapter => {
  const modifyResponseHeaders =
    typeof collection.upload === 'object' ? collection.upload.modifyResponseHeaders : undefined

  return {
    name: 'database',

    // Only consulted when Payload's own access control is bypassed (`disablePayloadAccessControl`),
    // which this project does not do — kept so the adapter is complete either way.
    generateURL: ({ filename, prefix }) => mediaFileURL(filename, prefix),

    /**
     * Writes the original file, or one of its generated sizes, into Postgres. One row per key: an
     * update replaces the previous bytes, matching Blob's `addRandomSuffix: false` behaviour.
     */
    handleUpload: async ({ file, req, storageFilePath }) => {
      const pool = requirePool(req, 'Storing an upload in the Postgres media store')
      const bytes = await readUploadBytes(file)

      await runStoreQuery('Storing an upload', () =>
        pool.query(
          `INSERT INTO ${storeTable()} ("file_key", "collection", "mime_type", "filesize", "data", "updated_at", "created_at")
           VALUES ($1, $2, $3, $4, $5, now(), now())
           ON CONFLICT ("file_key") DO UPDATE
             SET "collection" = EXCLUDED."collection",
                 "mime_type" = EXCLUDED."mime_type",
                 "filesize" = EXCLUDED."filesize",
                 "data" = EXCLUDED."data",
                 "updated_at" = now()`,
          [
            storageFilePath,
            collection.slug,
            file.mimeType,
            bytes.byteLength,
            asResponseBody(bytes),
          ],
        ),
      )
    },

    handleDelete: async ({ req, storageFilePath }) => {
      const pool = requirePool(req, 'Deleting a file from the Postgres media store')
      await runStoreQuery('Deleting a file', () =>
        pool.query(`DELETE FROM ${storeTable()} WHERE "file_key" = $1`, [storageFilePath]),
      )
    },

    staticHandler: async (req, { params }) => {
      const pool = mediaStorePool(req.payload)
      if (!pool) {
        return new Response('The media store is unavailable.', { status: 500 })
      }

      return serveStoredFile(
        req,
        pool,
        storageKeyFor(params.filename, params.prefix),
        modifyResponseHeaders,
      )
    },
  }
}
