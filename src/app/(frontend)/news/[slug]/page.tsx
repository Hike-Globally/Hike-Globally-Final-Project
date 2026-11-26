import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { NewsDetail } from '@/components/views/news-detail'
import { sitePath } from '@/i18n/config'
import {
  createInternalLinker,
  getAllNewsSlugs,
  getNewsArticle,
  getRelatedNews,
  getSettings,
} from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import { buildMetadata, seoFromDoc } from '@/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllNewsSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const includeDraft = await isLivePreviewRequest()
  const post = await getNewsArticle(slug, includeDraft)
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
    // From the article's "Keywords" section — published as <meta name="keywords">, as
    // `article:tag` Open Graph tags and as `keywords` in the NewsArticle markup (see NewsDetail).
    keywords: seo.keywords,
    path: sitePath(`/news/${slug}`),
    type: 'article',
    noIndex: seo.noIndex,
    publishedTime: post.publishedAt ?? post.createdAt,
    modifiedTime: post.updatedAt,
    authorName: post.author && typeof post.author !== 'number' ? post.author.name : undefined,
  })
}

/** NEWS SINGLE — `/news/[slug]` */
export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const includeDraft = await isLivePreviewRequest()
  const post = await getNewsArticle(slug, includeDraft)

  if (!post) notFound()

  const [related, settings, linker] = await Promise.all([
    getRelatedNews(post, 3),
    getSettings(),
    /**
     * Automated internal keyword linking (see `src/lib/internal-links.ts`): mentions of other
     * documents' target phrases in this article's body become real links, under a per-page budget.
     * Passing the article as `self` is what stops it linking to itself.
     */
    createInternalLinker({ collection: 'news', id: post.id }),
  ])

  return <NewsDetail post={post} related={related} settings={settings} linker={linker} />
}
