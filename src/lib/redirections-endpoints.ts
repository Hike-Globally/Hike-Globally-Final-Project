/**
 * Custom endpoints for SEO → Redirections, mounted on the collection itself, so every URL lives
 * under Payload's own API (`/api/redirections/…`) and inherits its CORS, cookie auth and error
 * shape.
 *
 * | Method | Path         | Who        | Why                                                     |
 * | ------ | ------------ | ---------- | ------------------------------------------------------- |
 * | GET    | /rules       | internal   | the proxy's cached rule map (active rules only)          |
 * | POST   | /hit         | internal   | one batched `hit_count` / `last_hit_at` update           |
 * | GET    | /export      | admin      | CSV download                                            |
 * | POST   | /import      | admin      | CSV upload → summary of added / skipped / failed rows    |
 * | POST   | /bulk        | admin      | activate · deactivate · delete selected rows             |
 * | GET    | /analyse     | admin      | live loop / chain feedback for the edit form             |
 *
 * Payload matches collection endpoints *before* its generated `/:id` routes, so `/export` is never
 * mistaken for a document id. Every handler still checks the permission itself — the admin panel
 * hiding a button is not an access control.
 */

import type { Endpoint, PayloadRequest } from 'payload'

import { canManageRedirections } from '../access'
import { trustedOrigins } from './trusted-origins'
import { analyseRedirection, type RedirectionRule, toRedirectionRule } from './redirections'
import {
  planRedirectionsImport,
  serializeRedirectionsCsv,
  type ImportOutcome,
} from './redirections-csv'
import {
  REDIRECTIONS_INTERNAL_HEADER,
  applyRedirectionHits,
  redirectionsInternalSecret,
} from './redirections-runtime'
import { resolveSiteUrl } from './site-url'

const MAX_BULK_IDS = 200
const MAX_IMPORT_ROWS = 500

const json = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } })

const forbidden = (message = 'You are not allowed to manage redirections.'): Response =>
  json({ message }, 403)

const badRequest = (message: string): Response => json({ message }, 400)

/**
 * Cookie-authenticated writes must come from this site. Payload already validates `Origin` against
 * its CSRF allowlist when it authenticates the cookie; this repeats the check for the custom
 * handlers, which Payload does not wrap in the same guard, and lets the middleware's same-origin
 * relaxation (no `Origin`) through untouched.
 */
const isTrustedOrigin = (req: PayloadRequest): boolean => {
  const origin = req.headers.get('origin')
  if (!origin) return true

  const host = req.headers.get('host')
  try {
    if (host && new URL(origin).host === host) return true
  } catch {
    return false
  }

  return trustedOrigins().includes(origin)
}

const requireManager = (req: PayloadRequest): Response | null => {
  if (!canManageRedirections(req.user)) return forbidden()
  if (!isTrustedOrigin(req)) return forbidden('This request did not come from the admin panel.')
  return null
}

const allRules = async (req: PayloadRequest): Promise<RedirectionRule[]> => {
  const result = await req.payload.find({
    collection: 'redirections',
    depth: 0,
    limit: 5000,
    pagination: false,
    overrideAccess: true,
    sort: 'sourcePath',
  })

  return result.docs
    .map((doc) => toRedirectionRule(doc))
    .filter((rule): rule is RedirectionRule => rule !== null)
}

const readJson = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  try {
    const body = (await req.json?.()) as unknown
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Internal: the proxy's data                                                                    */
/* -------------------------------------------------------------------------------------------- */

/**
 * The proxy's rule map. Public by nature — a redirect is observable by anyone who visits the URL —
 * so no session is required. Internal notes and counters are never included.
 * `REDIRECTIONS_INTERNAL_SECRET`, when set, closes it to everyone but this deployment.
 */
export const rulesEndpoint: Endpoint = {
  path: '/rules',
  method: 'get',
  handler: async (req) => {
    const secret = redirectionsInternalSecret()
    if (secret && req.headers.get(REDIRECTIONS_INTERNAL_HEADER) !== secret) {
      return forbidden('A valid internal token is required.')
    }

    const rules = await allRules(req)

    return json(
      {
        rules: rules
          .filter((rule) => rule.isActive !== false)
          .map((rule) => ({
            id: rule.id,
            source: rule.sourcePath,
            destination: rule.destinationUrl,
            statusCode: rule.statusCode,
          })),
      },
      200,
      { 'cache-control': 'no-store' },
    )
  },
}

/** Batched hit counter write. Called by the proxy, never by the admin panel. */
export const hitEndpoint: Endpoint = {
  path: '/hit',
  method: 'post',
  handler: async (req) => {
    const secret = redirectionsInternalSecret()
    if (secret && req.headers.get(REDIRECTIONS_INTERNAL_HEADER) !== secret) {
      return forbidden('A valid internal token is required.')
    }

    const body = await readJson(req)
    const hits = Array.isArray(body.hits) ? body.hits : []
    if (hits.length === 0 || hits.length > MAX_BULK_IDS) return badRequest('Expected 1–200 hits.')

    const updated = await applyRedirectionHits(
      req.payload,
      hits as { id: number | string; count: number; lastHitAt: string }[],
    )

    return json({ updated }, 202)
  },
}

/* -------------------------------------------------------------------------------------------- */
/* Admin: bulk actions                                                                           */
/* -------------------------------------------------------------------------------------------- */

export const bulkEndpoint: Endpoint = {
  path: '/bulk',
  method: 'post',
  handler: async (req) => {
    const denied = requireManager(req)
    if (denied) return denied

    const body = await readJson(req)
    const action = String(body.action ?? '')
    const ids = Array.isArray(body.ids)
      ? body.ids
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : []

    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return badRequest('action must be activate, deactivate or delete.')
    }
    if (ids.length === 0) return badRequest('Select at least one redirection.')
    if (ids.length > MAX_BULK_IDS) return badRequest(`Select at most ${MAX_BULK_IDS} redirections.`)

    const where = { id: { in: ids } }

    if (action === 'delete') {
      const result = await req.payload.delete({
        collection: 'redirections',
        where,
        overrideAccess: false,
        user: req.user,
        req,
      })
      return json({ action, affected: result.docs.length })
    }

    const result = await req.payload.update({
      collection: 'redirections',
      where,
      data: { isActive: action === 'activate' },
      overrideAccess: false,
      user: req.user,
      req,
    })

    return json({ action, affected: result.docs.length })
  },
}

/* -------------------------------------------------------------------------------------------- */
/* Admin: CSV                                                                                    */
/* -------------------------------------------------------------------------------------------- */

export const exportEndpoint: Endpoint = {
  path: '/export',
  method: 'get',
  handler: async (req) => {
    const denied = requireManager(req)
    if (denied) return denied

    const result = await req.payload.find({
      collection: 'redirections',
      depth: 0,
      limit: 5000,
      pagination: false,
      overrideAccess: false,
      user: req.user,
      sort: 'sourcePath',
    })

    const csv = serializeRedirectionsCsv(
      result.docs.map((doc) => ({
        sourcePath: doc.sourcePath,
        destinationUrl: doc.destinationUrl,
        statusCode: doc.statusCode,
        isActive: doc.isActive !== false,
        note: doc.note ?? '',
      })),
    )

    return new Response(csv, {
      status: 200,
      headers: {
        'cache-control': 'no-store',
        'content-disposition': 'attachment; filename="redirections.csv"',
        'content-type': 'text/csv; charset=utf-8',
      },
    })
  },
}

export const importEndpoint: Endpoint = {
  path: '/import',
  method: 'post',
  handler: async (req) => {
    const denied = requireManager(req)
    if (denied) return denied

    const body = await readJson(req)
    const csv = typeof body.csv === 'string' ? body.csv : ''
    if (!csv.trim()) return badRequest('Choose a CSV file to import.')
    if (csv.length > 2_000_000) return badRequest('That file is too large (2 MB maximum).')

    const rules = await allRules(req)
    const plan = planRedirectionsImport({
      csv,
      existingRules: rules,
      siteUrl: resolveSiteUrl(),
      maxRows: MAX_IMPORT_ROWS,
    })

    if (plan.parseError) return badRequest(plan.parseError)

    const outcomes: ImportOutcome[] = [...plan.outcomes]
    // The hook validates every row again; passing the growing rule set through `context` keeps it
    // from re-reading the table for each one while still catching a chain introduced mid-file.
    const contextRules = [...rules]

    for (const [index, outcome] of plan.outcomes.entries()) {
      if (outcome.status !== 'added') continue

      try {
        const created = await req.payload.create({
          collection: 'redirections',
          data: {
            sourcePath: outcome.row.sourcePath,
            destinationUrl: outcome.row.destinationUrl,
            statusCode: outcome.row.statusCode,
            isActive: outcome.row.isActive,
            note: outcome.row.note ?? null,
          },
          overrideAccess: false,
          user: req.user,
          req,
          context: { redirectionRules: contextRules },
        })

        const rule = toRedirectionRule(created)
        if (rule) contextRules.push(rule)
      } catch (error) {
        outcomes[index] = {
          line: outcome.line,
          source: outcome.source,
          status: 'failed',
          reason: (error as Error).message || 'Could not save this row.',
        }
      }
    }

    const count = (status: ImportOutcome['status']): number =>
      outcomes.filter((outcome) => outcome.status === status).length

    return json({
      added: count('added'),
      skipped: count('skipped'),
      failed: count('failed'),
      rows: outcomes,
    })
  },
}

/* -------------------------------------------------------------------------------------------- */
/* Admin: live analysis for the edit form                                                        */
/* -------------------------------------------------------------------------------------------- */

export const analyseEndpoint: Endpoint = {
  path: '/analyse',
  method: 'get',
  handler: async (req) => {
    const denied = requireManager(req)
    if (denied) return denied

    const query = req.query ?? {}
    const first = (value: unknown): unknown => (Array.isArray(value) ? value[0] : value)

    const rules = await allRules(req)
    const id = first(query.id)
    const current = id === undefined ? null : rules.find((rule) => String(rule.id) === String(id))

    const analysis = analyseRedirection(
      {
        id: id === undefined || id === '' ? undefined : (id as string),
        sourcePath: first(query.source) ?? current?.sourcePath ?? '',
        destinationUrl: first(query.destination) ?? current?.destinationUrl ?? '',
        statusCode: first(query.status) ?? current?.statusCode ?? '301',
        isActive: first(query.active) ?? current?.isActive ?? true,
      },
      rules,
      { siteUrl: resolveSiteUrl() },
    )

    return json({
      source: analysis.sourcePath,
      destination: analysis.destinationUrl,
      errors: analysis.errors,
      warnings: analysis.warnings,
      loop: analysis.loop ?? null,
      chain: analysis.chain ?? null,
    })
  },
}

export const redirectionEndpoints: Endpoint[] = [
  // Internal (proxy) — registered first so a future `/:id`-shaped custom route cannot shadow them.
  rulesEndpoint,
  hitEndpoint,
  // Admin
  bulkEndpoint,
  exportEndpoint,
  importEndpoint,
  analyseEndpoint,
]
