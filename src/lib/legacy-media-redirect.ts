import { resolveMediaStorage, type MediaStorageEnv } from './media-storage'

/** Translate old public database media URLs only when the Blob adapter is active.
 * The destination host is derived exclusively from the server's token, never the request.
 */
export function legacyMediaRedirect(requestUrl: string, method: string, env: MediaStorageEnv = process.env): string | null {
  if (method !== 'GET' && method !== 'HEAD') return null
  if (resolveMediaStorage(env).mode !== 'blob') return null
  const token = env.BLOB_READ_WRITE_TOKEN?.trim()
  const match = token?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)
  if (!match) return null

  const url = new URL(requestUrl)
  const base = '/api/media/file/'
  if (!url.pathname.startsWith(base)) return null
  const rawFilename = url.pathname.slice(base.length)
  if (!rawFilename || rawFilename.includes('/')) return null
  let filename: string
  try {
    filename = decodeURIComponent(rawFilename)
  } catch {
    return null
  }
  const safeSegment = (part: string) => Boolean(part) && part !== '.' && part !== '..' && !/[\\/\u0000-\u001f\u007f]/.test(part)
  if (!safeSegment(filename)) return null
  const prefixes = url.searchParams.getAll('prefix')
  if (prefixes.length > 1) return null
  const prefix = (prefixes[0] ?? '').replace(/^\/+|\/+$/g, '')
  const parts = prefix ? prefix.split('/') : []
  if (!parts.every(safeSegment)) return null
  const key = [...parts, filename].map(encodeURIComponent).join('/')
  return `https://${match[1].toLowerCase()}.public.blob.vercel-storage.com/${key}`
}
