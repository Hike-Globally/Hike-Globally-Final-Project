import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveRobots } from 'next/dist/build/webpack/loaders/metadata/resolve-route-data.js'

import robots from '../app/robots'

/** Robots rules use the longest matching prefix, not the first matching line. */
const isAllowed = (path: string, text: string) => {
  const matches = text.split('\n').flatMap((line) => {
    const match = /^(Allow|Disallow): (.+)$/.exec(line)
    return match && path.startsWith(match[2]) ? [{ allow: match[1] === 'Allow', prefix: match[2] }] : []
  }).sort((a, b) => b.prefix.length - a.prefix.length)
  return matches[0]?.allow ?? true
}

test('public media files are crawlable without exposing the other APIs to crawling', () => {
  const text = resolveRobots(robots())
  assert.match(text, /Allow: \/api\/media\/file\//)
  for (const path of ['/', '/trips/everest', '/api/media/file/mountain.jpg', '/api/media/file/clip.mp4?prefix=trips']) {
    assert.equal(isAllowed(path, text), true, path)
  }
  for (const path of ['/api/media', '/api/users', '/api/graphql', '/api/link-preview-image?url=x', '/admin', '/preview/trip', '/cdn-cgi/email']) {
    assert.equal(isAllowed(path, text), false, path)
  }
  assert.match(text, /Sitemap: https?:\/\/.+\/sitemap.xml/)
})
