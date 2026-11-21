import assert from 'node:assert/strict'
import { register } from 'node:module'
import { after, test } from 'node:test'

// Exercise the real Payload hooks without a Next request scope. Only the cache adapter is mocked.
const events: string[] = []
Object.defineProperty(globalThis, Symbol.for('rss-cache-events'), { value: events })
register('data:text/javascript,' + encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === 'next/cache') {
      return { url: 'data:text/javascript,' + encodeURIComponent(\`
        export const revalidatePath = (path) => globalThis[Symbol.for('rss-cache-events')].push(path);
        export const revalidateTag = (tag) => globalThis[Symbol.for('rss-cache-events')].push('tag:' + tag);
      \`), shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
`))
const previous = { NODE_ENV: process.env.NODE_ENV, DISABLE_REVALIDATION: process.env.DISABLE_REVALIDATION }
Object.assign(process.env, { NODE_ENV: 'production', DISABLE_REVALIDATION: 'false' })
after(() => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})
const { revalidatePost, revalidatePostDelete, revalidateTrip, revalidateGlobal } =
  await import('../hooks/revalidate')
const { PLACE_INDEX_PATH, placeCategoryPaths } = await import('./place-categories')
const doc = { id: 1, slug: 'a-post', _status: 'published' }
const placePaths = [PLACE_INDEX_PATH, ...placeCategoryPaths()]

test('publishing, editing, renaming and unpublishing a post invalidate RSS and its cached query', async () => {
  for (const [next, before] of [
    [doc, { ...doc, _status: 'draft' }],
    [doc, doc],
    [{ ...doc, slug: 'new-slug' }, doc],
    [{ ...doc, _status: 'draft' }, doc],
  ]) {
    events.length = 0
    const result = await revalidatePost({ doc: next, previousDoc: before, req: {} } as never)
    assert.equal(result, next)
    assert.ok(events.includes('/feed.xml'))
    assert.ok(events.includes('tag:posts'))
  }
})

test('publishing trips and posts refreshes every Browse Places page', async () => {
  for (const [hook, document] of [
    [revalidateTrip, { ...doc, slug: 'a-trip' }],
    [revalidatePost, doc],
  ] as const) {
    events.length = 0
    const result = await hook({ doc: document, previousDoc: undefined, req: {} } as never)
    assert.equal(result, document)
    for (const path of placePaths) {
      assert.ok(events.includes(path), `${path} should be invalidated with that document`)
    }
  }
})

test('deleting a published post invalidates RSS; draft autosaves do not', async () => {
  events.length = 0
  await revalidatePostDelete({ doc, req: {} } as never)
  assert.ok(events.includes('/feed.xml'))
  events.length = 0
  await revalidatePost({
    doc: { ...doc, _status: 'draft' }, previousDoc: doc,
    req: { query: { draft: 'true', autosave: 'true' } },
  } as never)
  await revalidatePostDelete({ doc: { ...doc, _status: 'draft' }, req: {} } as never)
  assert.deepEqual(events, [])
})

test('settings changes refresh the channel title and description', async () => {
  events.length = 0
  const settings = { siteName: 'Updated name' }
  const result = await revalidateGlobal('settings')({ doc: settings } as never)
  assert.equal(result, settings)
  assert.ok(events.includes('/feed.xml'))
  assert.ok(events.includes('tag:global:settings'))
})
