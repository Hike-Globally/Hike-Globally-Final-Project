import assert from 'node:assert/strict'
import test from 'node:test'
import { hasHubContent } from './hub-indexing'

test('a place is indexable with trips or posts, but not when both are empty', () => {
  assert.equal(hasHubContent({ trips: [], posts: [] }), false)
  assert.equal(hasHubContent({ trips: [1], posts: [] }), true)
  assert.equal(hasHubContent({ trips: [], posts: [1] }), true)
  assert.equal(hasHubContent({ trips: [1], posts: [1] }), true)
})
