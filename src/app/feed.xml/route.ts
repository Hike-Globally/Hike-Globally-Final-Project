import { getRssPosts, getSettings } from '@/lib/data'
import { buildRssFeed } from '@/lib/rss'

/** RSS 2.0 summaries; ISR plus publish/delete hooks keep subscriptions current. */
export const dynamic = 'force-static'
export const revalidate = 3600

export async function GET(): Promise<Response> {
  const [posts, settings] = await Promise.all([getRssPosts(), getSettings()])
  return new Response(buildRssFeed(posts, settings), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
