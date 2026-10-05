/**
 * Media storage mode resolution — decides *where* uploaded files physically live.
 *
 * Why this exists: Payload writes an upload to `upload.staticDir` on disk unless something else
 * takes over. That works on a laptop and on a normal server, but a serverless host (Vercel, Lambda,
 * …) mounts the function's filesystem read-only, so a disk upload there can only fail — with an
 * opaque error and no way for an editor to tell what is wrong.
 *
 * There are three storage modes:
 *
 * | Mode       | Where the bytes go                    | Used when                                     |
 * | ---------- | ------------------------------------- | --------------------------------------------- |
 * | `blob`     | Vercel Blob (`BLOB_READ_WRITE_TOKEN`) | the token is configured — the preferred path  |
 * | `database` | the `media_files` table in Postgres   | serverless host with no external storage      |
 * | `local`    | `./public/media` on disk              | local development / a normal server           |
 *
 * `blob` is preferred whenever a token exists: it is what the CDN and the one-click Vercel store
 * flow are built around. `database` is the fallback that keeps a serverless deployment working
 * *today* with no extra configuration, by using the Postgres database the CMS already needs.
 *
 * `MEDIA_STORAGE` can override the automatic choice (`blob` | `database` | `local`) — the escape
 * hatch for unusual hosts. A request that cannot be honoured (e.g. `blob` without a token) falls
 * back to the automatic mode with an explanation in `reason`, so the startup log always tells the
 * truth about where uploads are going.
 *
 * This module must stay dependency-free (it is imported by `payload.config.ts`, which the Payload
 * CLI, the build and the server all load) and pure, so it can be tested directly.
 */

export type MediaStorageMode = 'blob' | 'database' | 'local'

export type MediaStorageEnv = {
  /** Vercel Blob read/write token. Present and non-empty ⇒ Blob storage is usable. */
  BLOB_READ_WRITE_TOKEN?: string
  /** Optional explicit override: `blob`, `database` or `local`. */
  MEDIA_STORAGE?: string
  /** Set to `1` by every Vercel deployment (build and runtime). */
  VERCEL?: string
  /** `production` | `preview` | `development` on Vercel; handy in logs, not used for the choice. */
  VERCEL_ENV?: string
  /** Vercel's Node.js runtime is a Lambda function, and this is set there too. */
  AWS_LAMBDA_FUNCTION_NAME?: string
  /** Keeps `process.env` assignable, and lets tests pass any environment shape. */
  [key: string]: string | undefined
}

export type MediaStorageDecision = {
  /** Where uploads are written, and where existing files are served from. */
  mode: MediaStorageMode
  /** Human-readable justification — logged once at startup so the mode is never a mystery. */
  reason: string
}

const MODES: readonly MediaStorageMode[] = ['blob', 'database', 'local']

const isSet = (value: string | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0

/** Hosts whose function filesystem cannot be written to (and does not survive the request). */
export const isServerlessHost = (env: MediaStorageEnv): boolean =>
  isSet(env.VERCEL) || isSet(env.AWS_LAMBDA_FUNCTION_NAME)

const automaticDecision = (env: MediaStorageEnv): MediaStorageDecision => {
  if (isSet(env.BLOB_READ_WRITE_TOKEN)) {
    return {
      mode: 'blob',
      reason: 'BLOB_READ_WRITE_TOKEN is set — files are stored in Vercel Blob',
    }
  }

  if (isServerlessHost(env)) {
    return {
      mode: 'database',
      reason:
        'no external storage is configured and this host has a read-only filesystem — files are ' +
        'stored in Postgres (set BLOB_READ_WRITE_TOKEN to move them to Vercel Blob)',
    }
  }

  return {
    mode: 'local',
    reason: 'no external storage is configured — files are written to public/media',
  }
}

const explanation: Record<MediaStorageMode, string> = {
  blob: 'files are stored in Vercel Blob',
  database: 'files are stored in Postgres (media_files)',
  local: 'files are written to public/media',
}

const isMode = (value: string): value is MediaStorageMode =>
  (MODES as readonly string[]).includes(value)

export const resolveMediaStorage = (env: MediaStorageEnv = process.env): MediaStorageDecision => {
  const automatic = automaticDecision(env)
  const requested = env.MEDIA_STORAGE?.trim().toLowerCase()

  if (!requested) {
    return automatic
  }

  if (!isMode(requested)) {
    return {
      mode: automatic.mode,
      reason: `${automatic.reason} (MEDIA_STORAGE=${requested} is not a valid mode)`,
    }
  }

  // Blob without a token cannot work: Payload's Blob plugin disables itself and the upload would
  // fall back to a filesystem that is not there. Warn via `reason` and use the automatic mode.
  if (requested === 'blob' && !isSet(env.BLOB_READ_WRITE_TOKEN)) {
    return {
      mode: automatic.mode,
      reason: `${automatic.reason} (MEDIA_STORAGE=blob needs BLOB_READ_WRITE_TOKEN)`,
    }
  }

  return { mode: requested, reason: `MEDIA_STORAGE=${requested} — ${explanation[requested]}` }
}
