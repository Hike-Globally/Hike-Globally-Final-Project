import { cache } from 'react'

import configPromise from '@payload-config'
import { getPayload, type Payload, type TypedLocale } from 'payload'

/**
 * Returns true when a Postgres connection string is present in the environment.
 * Accepts Payload (`DATABASE_URI`), Neon/Supabase (`DATABASE_URL`), and Vercel Postgres (`POSTGRES_URL`).
 */
export const isDatabaseConfigured = (): boolean => {
  const uri = (
    process.env.DATABASE_URI ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ''
  ).trim()

  if (!uri) return false
  if (uri.includes('@host:') || uri.includes('user:password@host')) return false
  return true
}

let buildTimeInitError: Error | null = null

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
  if (!isDatabaseConfigured()) {
    throw new Error(
      'Database connection string (DATABASE_URI / DATABASE_URL / POSTGRES_URL) is not configured.',
    )
  }

  if (buildTimeInitError && process.env.NEXT_PHASE === 'phase-production-build') {
    throw buildTimeInitError
  }

  try {
    return await getPayload({ config: configPromise })
  } catch (error) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      buildTimeInitError = error instanceof Error ? error : new Error(String(error))
    }
    throw error
  }
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
