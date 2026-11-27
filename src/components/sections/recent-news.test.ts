import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { RecentNews } from './recent-news'
import type { NewsCard } from '../../lib/data'

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

const posts: NewsCard[] = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  title: `Dispatch ${index + 1}`,
  slug: `dispatch-${index + 1}`,
  excerpt: 'News from the trail.',
  featuredImage: {
    id: 100 + index,
    url: '/images/admin/himalaya-01.jpg',
    alt: 'Himalayan landscape',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  publishedAt: `2026-11-${25 - index}T00:00:00.000Z`,
  createdAt: '2026-11-01T00:00:00.000Z',
}))

test('recent news renders five accessible story links with dates and no signup form', () => {
  const dom = new JSDOM(renderToStaticMarkup(createElement(RecentNews, { posts })))
  try {
    const document = dom.window.document
    assert.equal(document.querySelector('h2')?.textContent, 'Recent News')
    assert.equal(document.querySelector('section')?.getAttribute('aria-labelledby'), 'recent-news-title')
    assert.equal(document.querySelectorAll('li').length, 5)
    assert.deepEqual(
      [...document.querySelectorAll('a')].map((link) => link.getAttribute('href')),
      posts.map((post) => `/news/${post.slug}`),
    )
    assert.deepEqual(
      [...document.querySelectorAll('time')].map((time) => time.getAttribute('datetime')),
      posts.map((post) => post.publishedAt),
    )
    assert.equal(document.querySelector('form, input, button'), null)
  } finally {
    dom.window.close()
  }
})

test('recent news hides an empty rail and supports fewer than five available stories', () => {
  assert.equal(renderToStaticMarkup(createElement(RecentNews, { posts: [] })), '')
  const dom = new JSDOM(renderToStaticMarkup(createElement(RecentNews, { posts: posts.slice(0, 2) })))
  try {
    assert.equal(dom.window.document.querySelectorAll('li').length, 2)
  } finally {
    dom.window.close()
  }
})

test('article loads recent published news separately from curated related news and excludes itself', () => {
  const route = readSource('../../app/(frontend)/news/[slug]/page.tsx')
  const data = readSource('../../lib/data.ts')
  assert.match(route, /getNews\(6\)/)
  assert.match(route, /latestNews\.filter\(\(item\) => item\.id !== post\.id\)\.slice\(0, 5\)/)
  assert.match(route, /recent=\{recent\}/)
  const query = data.split('export const getNews =')[1].split('export const getFeaturedNews')[0]
  assert.match(query, /sort: '-publishedAt'/)
  assert.match(query, /_status: \{ equals: 'published' \}/)
  assert.match(query, /\['news', String\(limit\)\]/)
})

test('news shares the blog archive canvas and heading structure, including top clearance', () => {
  const css = readSource('../../app/(frontend)/blog/blog.css')
  const page = readSource('../../app/(frontend)/news/page.tsx')
  assert.match(css, /\[data-blog-page\],\s*\[data-news-page\]\s*\{/)
  assert.match(css, /padding: clamp\(6rem, 8vw, 8rem\)/)
  assert.match(page, /import '\.\.\/blog\/blog\.css'/)
  assert.match(page, /<div data-news-page="">/)
  assert.match(page, /<header className="blog-archive-intro">\s*<h1>/)
})

test('news sidebar does not depend on article headings and remains available on mobile', () => {
  const detail = readSource('../views/news-detail.tsx')
  assert.match(detail, /const hasSidebar = headings\.length > 0 \|\| recent\.length > 0/)
  assert.match(detail, /<RecentNews posts=\{recent\}/)
  const asideClasses = detail.match(/<aside className="([^"]+)"/)?.[1]
  assert.ok(asideClasses)
  assert.doesNotMatch(asideClasses, /\bhidden\b/)
  assert.doesNotMatch(readSource('../../i18n/dictionaries.ts'), /newsletterTitle|newsletterText|newsletterEmail|newsletterCta/)
})
