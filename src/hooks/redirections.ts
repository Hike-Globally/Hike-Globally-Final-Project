/**
 * Collection hooks for SEO → Redirections.
 *
 *   beforeValidate   normalises the two URLs and refuses anything that would break the site:
 *                    a duplicate source, a source that redirects to itself, a redirect loop, or a
 *                    protected system path. The error is attached to the field it belongs to, so
 *                    the admin form shows it inline instead of as a generic banner.
 *   afterChange      clears the rule cache, so a rule saved now is live for the next request this
 *                    instance serves (other instances pick it up at their next TTL refresh).
 *   afterDelete      the same, for a removed rule.
 *
 * The hook deliberately does *not* run for hit-counter writes: those touch `hit_count` and
 * `last_hit_at` only and are explicitly marked with `context.skipRedirectionValidation`.
 */

import { ValidationError } from 'payload'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
  Payload,
  PayloadRequest,
} from 'payload'

import { CACHE_TAG } from '../lib/cache-tags'
import {
  analyseRedirection,
  type RedirectionRule,
  toRedirectionRule,
} from '../lib/redirections'
import { redirectionRuntime } from '../lib/redirections-runtime'
import { resolveSiteUrl } from '../lib/site-url'

const MAX_NOTE_LENGTH = 500

const shouldSkip = (context: unknown): boolean =>
  Boolean((context as { skipRedirectionValidation?: boolean } | undefined)?.skipRedirectionValidation)

/**
 * Every rule, used both for the duplicate check and for the loop/chain walk.
 *
 * `req` is passed through so the read joins the write's own transaction: it costs no extra pool
 * connection, and a save always validates against the same snapshot it is writing into (the
 * document being edited is excluded by id, so it cannot collide with itself).
 */
export const loadRedirectionRules = async (
  payload: Payload,
  req?: PayloadRequest,
): Promise<RedirectionRule[]> => {
  const result = await payload.find({
    collection: 'redirections',
    depth: 0,
    limit: 2000,
    pagination: false,
    overrideAccess: true,
    sort: 'sourcePath',
    ...(req ? { req } : {}),
  })

  return result.docs.map((doc) => toRedirectionRule(doc)).filter((rule): rule is RedirectionRule => rule !== null)
}

export const validateRedirection: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (shouldSkip(req.context)) return data

  const incoming = (data ?? {}) as Record<string, unknown>
  const existing = (originalDoc ?? {}) as Record<string, unknown>
  const pick = (key: string): unknown =>
    incoming[key] !== undefined ? incoming[key] : existing[key]

  const sourcePath = pick('sourcePath')
  const destinationUrl = pick('destinationUrl')
  const statusCode = pick('statusCode')
  const isActive = pick('isActive')

  const currentId =
    operation === 'update' ? ((existing.id as string | number | undefined) ?? undefined) : undefined

  // Bulk import passes the rule set it is building through `context`, so an upload of N rows is
  // N inserts instead of N table reads plus N inserts.
  const contextRules = (req.context as { redirectionRules?: RedirectionRule[] } | undefined)
    ?.redirectionRules

  const rules = Array.isArray(contextRules)
    ? contextRules
    : await loadRedirectionRules(req.payload, req)

  const analysis = analyseRedirection(
    { id: currentId, sourcePath, destinationUrl, statusCode, isActive },
    rules,
    { siteUrl: resolveSiteUrl() },
  )

  const errors = [
    analysis.errors.sourcePath
      ? { path: 'sourcePath', message: analysis.errors.sourcePath }
      : null,
    analysis.errors.destinationUrl
      ? { path: 'destinationUrl', message: analysis.errors.destinationUrl }
      : null,
    analysis.errors.statusCode
      ? { path: 'statusCode', message: analysis.errors.statusCode }
      : null,
  ].filter((error): error is { path: string; message: string } => error !== null)

  if (errors.length > 0) {
    throw new ValidationError({ collection: 'redirections', errors, req })
  }

  // The chain suggestion is advisory by design: a two-hop redirect still works, it just costs the
  // visitor a hop. The form shows the same warning live (see RedirectionCheckField).
  for (const warning of analysis.warnings) {
    req.payload.logger.info(`[redirections] ${analysis.sourcePath}: ${warning.message}`)
  }

  const note = typeof incoming.note === 'string' ? incoming.note : undefined

  return {
    ...data,
    sourcePath: analysis.sourcePath,
    destinationUrl: analysis.destinationUrl,
    statusCode: String(analysis.statusCode),
    ...(note !== undefined
      ? { note: note.trim().slice(0, MAX_NOTE_LENGTH) || null }
      : {}),
  }
}

/**
 * Clears this process's cached rule map. Revalidation tags are also purged so anything that reads
 * the collection through `unstable_cache` (or a future component that does) is not left behind.
 */
const invalidateRedirectionCache = (): void => {
  redirectionRuntime.invalidate()

  if (process.env.NODE_ENV === 'test') return

  // Imported lazily: `next/cache` is only usable inside a request, and the hook also runs from the
  // Payload CLI (seeding, migrations), where importing it eagerly is pointless.
  void (async () => {
    try {
      const { revalidateTag } = await import('next/cache')
      revalidateTag(CACHE_TAG.redirections, { expire: 0 })
    } catch (error) {
      const message = (error as Error).message
      // Outside a request scope (CLI seeding, migrations, the standalone scripts) there is no cache
      // store to purge and `revalidateTag` throws this invariant. Nothing is stale, so it is not worth
      // a warning; anything else is.
      if (message.includes('static generation store missing')) return
      console.warn(`[redirections] cache tag not revalidated — ${message}`)
    }
  })()
}

export const invalidateRedirectionsAfterChange: CollectionAfterChangeHook = ({ doc, req }) => {
  if (!shouldSkip(req.context)) invalidateRedirectionCache()
  return doc
}

export const invalidateRedirectionsAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!shouldSkip(req.context)) invalidateRedirectionCache()
  return doc
}
