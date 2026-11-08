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
 * A store-named token (`HikeGlobally_READ_WRITE_TOKEN`, the name Vercel gives a Blob store connected
 * from the dashboard) is reported in `reason` but never switches the mode on its own — see
 * `automaticDecision` for why that would break files already stored in Postgres.
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
  /**
   * Any other variable in the environment. Read only to *report* a store-named Blob token (see
   * `blobTokenVariable`) — never to switch modes.
   */
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

/**
 * The environment variable holding the Vercel Blob token, or `null` when there is none.
 *
 * `BLOB_READ_WRITE_TOKEN` is the conventional name this project's docs and the Payload plugin
 * expect. Vercel names the variable after the store when one is connected from the dashboard,
 * though — the store in this project is called `HikeGlobally`, so the variable is
 * `HikeGlobally_READ_WRITE_TOKEN`. Nothing read that, the startup log said "no external storage is
 * configured", and every upload went to Postgres while the Blob store sat empty.
 *
 * So the store-named variable is reported, and the operator is told exactly what to do about it.
 * It is not silently used (see `automaticDecision`): flipping storage mode is a decision about
 * existing files, not something a variable rename should do behind one's back.
 *
 * Only names ending in `_READ_WRITE_TOKEN` are considered, so an unrelated credential sharing the
 * suffix is the only thing this could pick up by accident. The exact conventional name wins, then
 * the first store-prefixed one alphabetically, so the answer is deterministic.
 */
export const blobTokenVariable = (env: MediaStorageEnv = process.env): string | null => {
  if (isSet(env.BLOB_READ_WRITE_TOKEN)) return 'BLOB_READ_WRITE_TOKEN'

  return (
    Object.keys(env)
      .filter((key) => key !== 'BLOB_READ_WRITE_TOKEN' && key.endsWith('_READ_WRITE_TOKEN'))
      .sort()
      .find((key) => isSet(env[key])) ?? null
  )
}

const automaticDecision = (env: MediaStorageEnv): MediaStorageDecision => {
  if (isSet(env.BLOB_READ_WRITE_TOKEN)) {
    return {
      mode: 'blob',
      reason: 'BLOB_READ_WRITE_TOKEN is set — files are stored in Vercel Blob',
    }
  }

  // A store-named token (`HikeGlobally_READ_WRITE_TOKEN`, the name Vercel gives a Blob store
  // connected from the dashboard) is deliberately NOT treated as an automatic switch. Existing
  // uploads already live in Postgres under `/api/media/file/<name>` URLs that only the Postgres
  // adapter serves, so flipping the mode on a variable rename would 404 every image already on the
  // site. Say so instead of guessing — the operator flips it with MEDIA_STORAGE=blob after moving
  // the files, which is a decision, not a side effect.
  const storeNamedToken = blobTokenVariable(env)
  const mismatch = storeNamedToken
    ? ` — ${storeNamedToken} is present but this app reads BLOB_READ_WRITE_TOKEN; rename it, or set ` +
      'MEDIA_STORAGE=blob to switch once existing files are moved to the store'
    : ''

  if (isServerlessHost(env)) {
    return {
      mode: 'database',
      reason:
        'no external storage is configured and this host has a read-only filesystem — files are ' +
        `stored in Postgres (set BLOB_READ_WRITE_TOKEN to move them to Vercel Blob)${mismatch}`,
    }
  }

  return {
    mode: 'local',
    reason: `no external storage is configured — files are written to public/media${mismatch}`,
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
  if (requested === 'blob' && !blobTokenVariable(env)) {
    return {
      mode: automatic.mode,
      reason: `${automatic.reason} (MEDIA_STORAGE=blob needs BLOB_READ_WRITE_TOKEN)`,
    }
  }

  return { mode: requested, reason: `MEDIA_STORAGE=${requested} — ${explanation[requested]}` }
}
