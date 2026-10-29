import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  shouldRevalidateAfterChange,
  shouldRevalidateAfterDelete,
  slugOf,
} from './revalidate-rules'

describe('shouldRevalidateAfterChange', () => {
  it('skips editor autosaves on unpublished drafts', () => {
    assert.equal(
      shouldRevalidateAfterChange({
        doc: { id: 1, slug: 'everest', _status: 'draft' },
        previousDoc: { id: 1, slug: 'everest', _status: 'draft' },
        req: { query: { autosave: 'true', draft: 'true' } },
      }),
      false,
    )
  })

  it('skips editor autosaves and manual draft saves on top of an already-published document', () => {
    assert.equal(
      shouldRevalidateAfterChange({
        doc: { id: 1, slug: 'everest', _status: 'draft' },
        previousDoc: { id: 1, slug: 'everest', _status: 'published' },
        req: { query: { autosave: 'true', draft: 'true' } },
      }),
      false,
    )

    assert.equal(
      shouldRevalidateAfterChange({
        doc: { id: 1, slug: 'everest', _status: 'draft' },
        previousDoc: { id: 1, slug: 'everest', _status: 'published' },
        req: { query: { draft: 'true' } },
      }),
      false,
    )
  })

  it('skips creating or updating an unpublished draft via the Local API', () => {
    assert.equal(
      shouldRevalidateAfterChange({
        doc: { id: 1, slug: 'new-trip', _status: 'draft' },
        previousDoc: undefined,
      }),
      false,
    )

    assert.equal(
      shouldRevalidateAfterChange({
        doc: { id: 1, slug: 'new-trip', _status: 'draft' },
        previousDoc: { id: 1, slug: 'new-trip', _status: 'draft' },
      }),
      false,
    )
  })

  it('revalidates immediately when a document is published', () => {
    assert.equal(
      shouldRevalidateAfterChange({
        doc: { id: 1, slug: 'everest', _status: 'published' },
        previousDoc: { id: 1, slug: 'everest', _status: 'draft' },
      }),
      true,
    )

    assert.equal(
      shouldRevalidateAfterChange({
        doc: { id: 1, slug: 'everest', _status: 'published' },
        previousDoc: { id: 1, slug: 'everest', _status: 'published' },
      }),
      true,
    )
  })

  it('revalidates when a published document is explicitly unpublished', () => {
    assert.equal(
      shouldRevalidateAfterChange({
        doc: { id: 1, slug: 'everest', _status: 'draft' },
        previousDoc: { id: 1, slug: 'everest', _status: 'published' },
        req: { query: { unpublishAllLocales: 'true' } },
      }),
      true,
    )
  })

  it('revalidates collections without draft status fields', () => {
    assert.equal(
      shouldRevalidateAfterChange({
        doc: { id: 1, slug: 'item' },
      }),
      true,
    )
  })
})

describe('shouldRevalidateAfterDelete', () => {
  it('revalidates when a published document is deleted', () => {
    assert.equal(
      shouldRevalidateAfterDelete({ doc: { id: 1, slug: 'everest', _status: 'published' } }),
      true,
    )
  })

  it('skips revalidation when a never-published draft is deleted', () => {
    assert.equal(
      shouldRevalidateAfterDelete({ doc: { id: 1, slug: 'draft-only', _status: 'draft' } }),
      false,
    )
  })
})

describe('slugOf', () => {
  it('extracts non-empty string slugs only', () => {
    assert.equal(slugOf({ slug: 'everest' }), 'everest')
    assert.equal(slugOf({ slug: '' }), undefined)
    assert.equal(slugOf(null), undefined)
  })
})
