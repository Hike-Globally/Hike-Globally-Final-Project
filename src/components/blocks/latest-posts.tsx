import { StoryTiles } from './story-tiles'
import { getPosts } from '@/lib/data'
import type { LatestPostsBlock } from '@/payload-types'

/**
 * Latest Stories block — renders the tile grid ported 1:1 from
 * `blog-sample.html` (see `story-tiles.tsx`). Per the design brief the
 * section shows the tiles only; the CMS heading/subheading/view-all fields
 * are intentionally not rendered.
 */
export async function LatestPosts({
  block,
  opening = false,
}: {
  block: LatestPostsBlock
  opening?: boolean
}) {
  const limit = block.limit ?? 3
  const posts = await getPosts(limit)

  if (posts.length === 0) return null

  return <StoryTiles posts={posts.slice(0, limit)} priorityFirst={opening} />
}
