/**
 * Schema for the Postgres media store — the single source of truth for both the migration
 * (`src/migrations/`) and the boot-time safety net in `src/storage/database-adapter.ts`.
 *
 * Keeping the DDL in one place matters because the store is the fallback that keeps uploads working
 * on a serverless host with no external storage configured: if the two copies ever drifted, uploads
 * would work in one environment and fail in another with a confusing Postgres error.
 *
 * Every statement is `IF NOT EXISTS`, so a database that already got the objects from another path
 * (a migration, a hand-run script) is left untouched.
 */

/** Table holding the bytes for the `database` storage mode. One row per original file *and* size. */
export const MEDIA_FILES_TABLE = 'media_files'

/**
 * Upper bound for a single file in the Postgres store.
 *
 * The bytes end up in a row, in the CMS database, so a runaway upload would bloat a hosted Postgres
 * instance long before it became a useful asset. 25 MB is generous for the photos the site renders
 * and still small enough for a free-tier database; anything larger belongs in Blob storage, and the
 * error message says so.
 */
export const MAX_DATABASE_FILE_SIZE = 25 * 1024 * 1024

/** Human-readable size for logs and error messages ("24.6 MB"). */
export const formatFileSize = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

/**
 * The media store table.
 *
 * `file_key` is the plugin's resolved storage path (the filename, since the collection has no
 * prefix configured) and doubles as the primary key: every lookup, upsert and delete addresses a
 * file by that key alone. Note that there is deliberately no `serial` id — an unowned sequence
 * would be offered up for deletion by drizzle's dev-mode schema push, which cannot see a table it
 * does not generate (see `tablesFilter` in `src/payload.config.ts`).
 */
export const mediaFilesTableStatements: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS "${MEDIA_FILES_TABLE}" (
    "file_key" varchar PRIMARY KEY,
    "collection" varchar NOT NULL,
    "mime_type" varchar,
    "filesize" bigint,
    "data" bytea NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  )`,
]

/**
 * Columns Payload's cloud-storage plugin adds to the `media` collection whenever a storage adapter
 * is active — Vercel Blob *or* the Postgres store. The plugin is configured with
 * `alwaysInsertFields: true` in every environment (including local disk), so the shape of the
 * `media` table never depends on which storage mode happens to be running.
 */
export const mediaStorageColumnStatements: readonly string[] = [
  `ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT ''`,
  `ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar`,
]

/**
 * Appended to Postgres "relation/column does not exist" errors so a missing migration reads as an
 * instruction rather than as an opaque upload failure.
 */
export const MEDIA_STORAGE_SCHEMA_HINT =
  'The media store is missing from this database. Run `npm run migrate` (or `payload migrate`) ' +
  'against it, then retry the upload.'
