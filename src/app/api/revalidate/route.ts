import { revalidatePath, revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

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

  const tags = body.tags?.length ? body.tags : ['trips', 'destinations', 'posts', 'pages']
  const paths = body.paths?.length ? body.paths : ['/']

  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  for (const path of paths) revalidatePath(path)

  return Response.json({ revalidated: true, tags, paths, now: Date.now() })
}
