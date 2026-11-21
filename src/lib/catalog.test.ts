import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Payload } from 'payload'
import { ArchivePagination } from '@/components/sections/archive-pagination'
import {
  PAGE_SIZE,
  parsePage,
  archiveHref,
  readPublishedSlugs,
  tripConditions,
  tripFilters,
  filterQuery,
} from './catalog'
import { canonicalUrl } from './seo'

for (const collection of ['trips', 'destinations', 'blog', 'pages'] as const) {
  test(`${collection}: the published-slug guard includes record 1,001`, async () => {
    const docs = Array.from({ length: 1001 }, (_, i) => ({ slug: `item-${i + 1}` }))
    const payload = {
      find: async (args: {
        collection: string
        page: number
        limit: number
        where: unknown
        sort: string
      }) => {
        assert.equal(args.collection, collection)
        assert.deepEqual(args.where, { _status: { equals: 'published' } })
        assert.equal(args.sort, 'id')
        const start = (args.page - 1) * args.limit
        return {
          docs: docs.slice(start, start + args.limit),
          hasNextPage: start + args.limit < docs.length,
        }
      },
    } as unknown as Pick<Payload, 'find'>
    assert.deepEqual(
      await readPublishedSlugs(payload, collection),
      docs.map((d) => d.slug),
    )
  })
}

test('archive links let a crawler reach record 101 and return to page one', () => {
  const pages = Math.ceil(101 / PAGE_SIZE)
  for (const archive of ['trips', 'destinations', 'blog'] as const) {
    for (let page = 1; page <= pages; page++) {
      const html = renderToStaticMarkup(
        createElement(ArchivePagination, { archive, page, totalPages: pages }),
      )
      if (page < pages) assert.ok(html.includes(`href="/${archive}?page=${page + 1}"`))
      else assert.ok(!html.includes('rel="next"'))
      if (page > 1) assert.ok(html.includes(`href="${archiveHref(archive, page - 1)}"`))
      else assert.ok(!html.includes('rel="prev"'))
    }
  }
})

test('pagination retains filters for visitors but only the page for crawlers', () => {
  const filters = tripFilters('?region=khumbu&season=winter&sort=price-desc', [{ slug: 'khumbu' }])
  assert.deepEqual(tripConditions(filters, 4), [
    { bestSeasons: { in: ['winter'] } },
    { destination: { equals: 4 } },
  ])
  const url = archiveHref('trips', 3, filterQuery(filters))
  assert.equal(url, '/trips?destination=khumbu&season=winter&sort=price-desc&page=3')
  assert.ok(canonicalUrl(url).endsWith('/trips?page=3'))
  assert.equal(archiveHref('trips', 1), '/trips')
  assert.equal(parsePage(undefined), 1)
  for (const invalid of ['0', '-2', '', '1.5', '1e3', '01', ['2', '3'], '999999999999999999'])
    assert.equal(parsePage(invalid), null)
})
