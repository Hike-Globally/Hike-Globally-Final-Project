/**
 * Wires the media collection to whichever storage the deployment can actually use.
 *
 * Every mode goes through `@payloadcms/plugin-cloud-storage`. When Vercel Blob is active (`blob`),
 * `disablePayloadAccessControl: true` hands out direct `*.public.blob.vercel-storage.com` CDN URLs
 * instead of proxying every image and video byte stream through `/api/media/file/<filename>` on
 * Fluid Compute CPU (`Media` read access is `anyone`, so public reads need no Payload auth gate).
 *
 * `alwaysInsertFields: true` in *all* modes is deliberate: the plugin's hidden `prefix` and
 * `_objectKey` fields then exist in the collection schema even on a developer's laptop, so the
 * shape of the `media` table never depends on which storage mode happens to be running — which is
 * exactly how "it works locally, it breaks in production" used to happen.
 */
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import type { Config, Payload, Plugin } from 'payload'

import { resolveMediaStorage, type MediaStorageMode } from '../lib/media-storage'
import { databaseStorageAdapter, ensureMediaStorageSchema } from './database-adapter'

/**
 * Blob storage, the intended production home for media. `disablePayloadAccessControl: true` serves
 * assets straight from Vercel Blob's edge CDN (zero serverless invocations or Active CPU).
 * `clientUploads` is opt-in (`BLOB_CLIENT_UPLOADS=true`) to bypass Vercel's ~4.5 MB function body
 * ceiling once CORS is configured on the store.
 */
const blobPlugin = (): Plugin =>
  vercelBlobStorage({
    collections: { media: { disablePayloadAccessControl: true } },
    clientUploads: process.env.BLOB_CLIENT_UPLOADS === 'true',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
    alwaysInsertFields: true,
  })

/** The Postgres fallback: uploads land in the `media_files` table of the CMS database. */
const databasePlugin = (): Plugin =>
  cloudStoragePlugin({
    collections: { media: { adapter: databaseStorageAdapter } },
    alwaysInsertFields: true,
  })

/**
 * Local disk keeps Payload's normal upload path; the plugin is registered *disabled* so the
 * `prefix` / `_objectKey` fields (and therefore the database schema) match every other mode.
 */
const diskPlugin = (): Plugin =>
  cloudStoragePlugin({
    collections: { media: { adapter: null } },
    alwaysInsertFields: true,
    enabled: false,
  })

const selectPlugin = (mode: MediaStorageMode): Plugin => {
  switch (mode) {
    case 'blob':
      return blobPlugin()
    case 'database':
      return databasePlugin()
    default:
      return diskPlugin()
  }
}

/**
 * Adds a boot-time schema check to the chosen plugin. Payload runs `onInit` after the database
 * connection is live and before the first request, which is the right moment to create the media
 * store if the migration has not been run against this database yet.
 */
const withSchemaCheck = (config: Config, mode: MediaStorageMode): Config => {
  if (mode === 'local') {
    // Nothing to prepare: the files live on disk and Payload's own dev-mode schema push manages
    // the collection columns.
    return config
  }

  const previousOnInit = config.onInit

  return {
    ...config,
    onInit: async (payload: Payload) => {
      await previousOnInit?.(payload)
      await ensureMediaStorageSchema(payload)
    },
  }
}

export const mediaStoragePlugin = (mode: MediaStorageMode = resolveMediaStorage().mode): Plugin => {
  const plugin = selectPlugin(mode)

  return (config: Config): Config | Promise<Config> => {
    const result = plugin(config)
    return result instanceof Promise
      ? result.then((resolved) => withSchemaCheck(resolved, mode))
      : withSchemaCheck(result, mode)
  }
}
