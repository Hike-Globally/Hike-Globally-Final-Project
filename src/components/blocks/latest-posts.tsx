import { PostCard } from '@/components/cards/post-card'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from '@/components/sections/section-heading'
import type { Locale } from '@/i18n/config'
import { localizedPath } from '@/i18n/config'
import { getPosts } from '@/lib/data'
import type { LatestPostsBlock } from '@/payload-types'
import { resolveLink } from '@/lib/links'

export async function LatestPosts({ block, locale }: { block: LatestPostsBlock; locale: Locale }) {
  const limit = block.limit ?? 3
  const posts = await getPosts(locale, limit)

  if (posts.length === 0) return null

  const viewAll = resolveLink(block.viewAllLink, locale) ?? {
    href: localizedPath(locale, '/blog'),
    label: 'View all posts',
    newTab: false,
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container-content">
        <SectionHeading title={block.heading} description={block.subheading} action={viewAll} />

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, limit).map((post, index) => (
            <Reveal key={post.id} delay={index * 80}>
              <PostCard post={post} locale={locale} priority={index === 0} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
