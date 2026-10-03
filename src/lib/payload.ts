import { cache } from 'react'

import configPromise from '@payload-config'
import { getPayload, type Payload, type TypedLocale } from 'payload'

/**
 * Payload Local API client.
 *
 * WHY THE LOCAL API: it runs the query directly against Postgres inside your server component —
 * no HTTP round-trip to your own REST/GraphQL endpoint, no double serialization, and it bypasses
 * the network entirely. It is consistently the fastest way to read Payload data from Next.js.
 *
 * React `cache()` deduplicates the instance for the duration of a single request, so any number
 * of components can call `getPayloadClient()` and share one connection from the pool.
 */
export const getPayloadClient = cache(async (): Promise<Payload> => {
  return getPayload({ config: configPromise })
})

/**
 * Queries to use for public (non-preview) reads: published content only, never drafts.
 *
 * When an editor turns on Next.js Draft Mode, callers pass `draft: true`, which makes Payload
 * read from the versions table and serve the newest unsaved changes.
 */
export const publicQueryOptions = {
  draft: false,
  overrideAccess: false,
  where: {
    _status: {
      equals: 'published',
    },
  },
} as const

export type { Payload, TypedLocale }
