import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PostDetail } from '@/components/views/post-detail'
import { sitePath } from '@/i18n/config'
import { getAllPostSlugs, getPost, getRelatedPosts, getSettings } from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import { buildMetadata, seoFromDoc } from '@/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const includeDraft = await isLivePreviewRequest()
  const post = await getPost(slug, includeDraft)
  if (!post) return {}

  const seo = seoFromDoc(post, {
    title: post.title,
    description: post.excerpt,
    image: post.featuredImage,
  })

  return buildMetadata({
    title: seo.title,
    description: seo.description,
    image: seo.image,
    path: sitePath(`/blog/${slug}`),
    type: 'article',
    noIndex: seo.noIndex,
    publishedTime: post.publishedAt ?? post.createdAt,
    modifiedTime: post.updatedAt,
    authorName: post.author && typeof post.author !== 'number' ? post.author.name : undefined,
  })
}

/** BLOG SINGLE — `/blog/[slug]` */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const includeDraft = await isLivePreviewRequest()
  const post = await getPost(slug, includeDraft)

  if (!post) notFound()

  const [related, settings] = await Promise.all([getRelatedPosts(post, 3), getSettings()])

  return <PostDetail post={post} related={related} siteName={settings.siteName} />
}
