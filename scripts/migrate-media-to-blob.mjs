/** Copy Postgres media to a public Vercel Blob store. Never modifies Postgres or overwrites blobs. */
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { list, put } from '@vercel/blob'

export function payloadBlobUrl(storeId, key) {
  const dir = path.posix.dirname(key)
  const filename = encodeURIComponent(path.posix.basename(key))
  return `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com/${dir === '.' ? filename : path.posix.join(dir, filename)}`
}

export async function verifyBlob(url, bytes, mimeType, fetchFn = fetch) {
  const response = await fetchFn(url, { redirect: 'error', cache: 'no-store' })
  if (!response.ok) throw new Error(`Public Blob verification returned HTTP ${response.status}`)
  const actual = Buffer.from(await response.arrayBuffer())
  const hash = (value) => createHash('sha256').update(value).digest('hex')
  if (actual.length !== bytes.length || hash(actual) !== hash(bytes)) {
    throw new Error('Blob bytes differ from the database file')
  }
  const actualType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  if (mimeType && actualType !== mimeType.split(';')[0].trim().toLowerCase()) {
    throw new Error(`Blob content type mismatch: expected ${mimeType}, got ${actualType || '(missing)'}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--copy') || args.length > 1) {
    throw new Error('Usage: node --env-file=.env.local scripts/migrate-media-to-blob.mjs [--copy]')
  }
  const copy = args.includes('--copy')
  const connectionString = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.POSTGRES_URL
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!connectionString) throw new Error('Set DATABASE_URI or DATABASE_URL in your local environment file.')
  const match = token?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)
  if (!match) throw new Error('Set BLOB_READ_WRITE_TOKEN to the public Blob store read/write token.')
  const storeId = match[1]
  const client = new pg.Client({ connectionString })
  await client.connect()
  try {
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const db = await client.query('SELECT current_database() AS name, current_user AS role')
    console.log(`Mode: ${copy ? 'COPY AND VERIFY' : 'INVENTORY ONLY'}; database: ${db.rows[0].name}; role: ${db.rows[0].role}; Blob store ID: ${storeId}`)
    const rows = (await client.query('SELECT file_key, mime_type, octet_length(data) AS size FROM media_files ORDER BY file_key')).rows
    const total = rows.reduce((sum, row) => sum + Number(row.size), 0)
    console.log(`Database inventory: ${rows.length} files, ${total} bytes.`)
    if (!rows.length) throw new Error('No media files found. Check the database and branch before proceeding.')
    const existing = new Map()
    let cursor
    do {
      const page = await list({ token, cursor, limit: 1000 })
      for (const blob of page.blobs) existing.set(blob.pathname, blob)
      cursor = page.hasMore ? page.cursor : undefined
      if (page.hasMore && !cursor) throw new Error('Blob listing returned no continuation cursor.')
    } while (cursor)
    const collisions = rows.filter((row) => existing.has(row.file_key)).length
    console.log(`Existing matching Blob paths: ${collisions}. Existing paths are never overwritten.`)
    if (!copy) {
      console.log('No files copied. Review the database, Blob store, and collision count before using --copy.')
      return
    }
    let verified = 0
    let uploaded = 0
    for (const row of rows) {
      const result = await client.query('SELECT data FROM media_files WHERE file_key = $1', [row.file_key])
      const bytes = result.rows[0]?.data
      if (!Buffer.isBuffer(bytes) || bytes.length !== Number(row.size)) throw new Error(`Unable to read ${row.file_key}`)
      if (!existing.has(row.file_key)) {
        const blob = await put(row.file_key, bytes, {
          token, access: 'public', addRandomSuffix: false, allowOverwrite: false,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
          contentType: row.mime_type || 'application/octet-stream',
        })
        if (blob.pathname !== row.file_key) throw new Error(`Unexpected Blob path for ${row.file_key}; stop and investigate.`)
        uploaded++
      }
      try {
        await verifyBlob(payloadBlobUrl(storeId, row.file_key), bytes, row.mime_type)
      } catch (error) {
        throw new Error(`Verification failed for ${row.file_key}: ${error.message}`)
      }
      verified++
      console.log(`[${verified}/${rows.length}] verified ${row.file_key}`)
    }
    console.log(`Complete: ${verified} verified; ${uploaded} newly uploaded; ${verified - uploaded} already existed and matched. Database unchanged.`)
  } finally {
    await client.query('ROLLBACK').catch(() => {})
    await client.end()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Migration stopped: ${error.message}`)
    process.exitCode = 1
  })
}
