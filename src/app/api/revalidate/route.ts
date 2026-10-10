import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

import { CACHE_TAG } from '@/lib/cache-tags'

/**
 * Every shared cache tag the frontend reads with (see `src/lib/data.ts`). Per-document tags such
 * as `trip:<slug>` don't need listing: each of those entries also carries its collection tag.
 */
const ALL_TAGS: string[] = [
  CACHE_TAG.trips,
  CACHE_TAG.destinations,
  CACHE_TAG.posts,
  CACHE_TAG.pages,
  CACHE_TAG.header,
  CACHE_TAG.footer,
  CACHE_TAG.settings,
]

/**
 * On-demand revalidation webhook.
 *
 * Payload's own hooks already revalidate on save (see `src/hooks/revalidate.ts`), so this
 * endpoint is a belt-and-braces escape hatch: point a Payload webhook, a cron job, or a
 * deployment script at it to purge caches manually.
 *
 *   curl -X POST https://your-site.com/api/revalidate \
 *        -H "Authorization: Bearer $REVALIDATE_SECRET" \
 *        -H "Content-Type: application/json" \
 *        -d '{"tags":["trips"],"paths":["/trips"]}'
 *
 * Send no body (or `{}`) to purge the whole site: every data-cache tag, including the header,
 * footer and settings globals, plus the rendered HTML of every route under the root layout.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET

  if (!secret) {
    return Response.json({ message: 'REVALIDATE_SECRET is not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader

  if (provided !== secret) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 })
  }

  let body: { tags?: string[]; paths?: string[] } = {}

  try {
    body = (await request.json()) as typeof body
  } catch {
    // An empty body is valid: it means "revalidate everything".
  }

  const purgeEverything = !body.tags?.length && !body.paths?.length
  const tags = body.tags?.length ? body.tags : ALL_TAGS
  const paths = body.paths?.length ? body.paths : ['/']

  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  // `'layout'` on `/` purges every page that shares the root layout, i.e. the whole site.
  if (purgeEverything) revalidatePath('/', 'layout')
  else for (const path of paths) revalidatePath(path)

  return Response.json({ revalidated: true, tags, paths, now: Date.now() })
}
