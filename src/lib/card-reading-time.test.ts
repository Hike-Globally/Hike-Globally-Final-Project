import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { register } from 'node:module'
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(specifier, context, nextResolve) { if (specifier.endsWith('.css')) return { url: 'data:text/javascript,export default {}', shortCircuit: true, format: 'module' }; return nextResolve(specifier, context) }`))
const { PostCard } = await import('@/components/cards/post-card')
import type { PostCard as PostCardData } from '@/lib/data'

test('post cards calculate reading time from the body, not the excerpt', () => {
  const post = {
    id: 1, slug: 'test', title: 'Test', excerpt: 'Short excerpt',
    createdAt: '2026-01-01', featuredImage: 1,
    content: { root: { type: 'root', children: [{ type: 'text', text: Array(660).fill('word').join(' ') }] } },
  } as unknown as PostCardData
  const html = renderToStaticMarkup(createElement(PostCard, { post }))
  assert.match(html, /3 min read/)
  const withoutContent = renderToStaticMarkup(createElement(PostCard, { post: { ...post, content: undefined } }))
  assert.doesNotMatch(withoutContent, /min read/)
})
