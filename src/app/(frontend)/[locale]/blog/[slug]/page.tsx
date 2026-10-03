import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PostDetail } from '@/components/views/post-detail'
import { isLocale, localizedPath, type Locale } from '@/i18n/config'
import { getAllPostSlugs, getPost, getRelatedPosts, getSettings } from '@/lib/data'
import { buildMetadata, seoFromDoc } from '@/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map(({ locale, slug }) => ({ locale, slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}

  const post = await getPost(locale, slug)
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
    path: localizedPath(locale, `/blog/${slug}`),
    locale,
    type: 'article',
    noIndex: seo.noIndex,
    publishedTime: post.publishedAt ?? post.createdAt,
    modifiedTime: post.updatedAt,
    authorName:
      post.author && typeof post.author !== 'number' ? post.author.name : undefined,
  })
}

/** BLOG SINGLE — `/[locale]/blog/[slug]` */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: localeParam, slug } = await params
  if (!isLocale(localeParam)) notFound()

  const locale = localeParam as Locale
  const post = await getPost(locale, slug)

  if (!post) notFound()

  const [related, settings] = await Promise.all([
    getRelatedPosts(locale, post, 3),
    getSettings(locale),
  ])

  return <PostDetail post={post} locale={locale} related={related} siteName={settings.siteName} />
}
