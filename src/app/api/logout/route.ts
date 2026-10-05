import config from '@payload-config'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload, type CollectionSlug } from 'payload'

export const dynamic = 'force-dynamic'

/**
 * POST /api/logout — the sign-out backstop.
 *
 * Payload's own `POST /api/:collection/logout` refuses a request (400, session untouched) whenever
 * it cannot satisfy its CSRF rules — for example when the admin is served from a host that is not
 * in the `csrf` allowlist and the browser's same-origin signals were lost by a proxy. The admin's
 * sign-out button posts there first, then verifies the session really ended; if it did not, it
 * calls this route.
 *
 * This route never refuses. It resolves the caller with the Local API (no CSRF, no cookies to
 * validate), ends the session as best it can, and — whether or not a session was found — expires
 * the `payload-token` cookie with exactly the attributes Payload issued it with, so the browser
 * cannot keep presenting it.
 *
 * It is a backstop, not the primary path: hooking into the normal flow keeps Payload's own
 * `afterLogout` hooks and session bookkeeping authoritative.
 */
export async function POST() {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  let collection: string | undefined
  let revokeSession = false
  let userId: number | string | undefined
  let sessionId: string | undefined

  try {
    const { user } = await payload.auth({ headers: requestHeaders })
    if (user?.collection && user.id !== undefined) {
      collection = user.collection
      userId = user.id
      sessionId = (user as { _sid?: string })._sid
      revokeSession = true
    }
  } catch {
    // No resolvable session: there is nothing to revoke, and the cookie still gets expired below.
  }

  if (revokeSession && collection && userId !== undefined) {
    try {
      const userDoc = (await payload.findByID({
        collection: collection as CollectionSlug,
        id: userId,
        depth: 0,
        overrideAccess: true,
        showHiddenFields: true,
      })) as unknown as { sessions?: Array<{ id?: string }> } | null

      const sessions = Array.isArray(userDoc?.sessions) ? userDoc.sessions : []
      if (sessions.length) {
        // Mirrors Payload's own logout operation: drop this browser's session, keep the others.
        const remaining = sessionId ? sessions.filter((session) => session.id !== sessionId) : []
        await (
          payload.db as unknown as {
            updateOne: (args: Record<string, unknown>) => Promise<unknown>
          }
        ).updateOne({
          id: userId,
          collection,
          data: { ...(userDoc as object), sessions: remaining, updatedAt: null },
          returning: false,
        })
      }
    } catch {
      // Revocation is best-effort; expiring the cookie below is what signs the browser out.
    }
  }

  const authConfig =
    payload.collections[payload.config.admin.user as CollectionSlug]?.config.auth
  const configuredSameSite = authConfig?.cookies?.sameSite
  // Payload spells SameSite the HTTP way ('Lax'); the cookie API wants the lowercase form.
  const sameSite =
    configuredSameSite === true || configuredSameSite === 'Strict'
      ? ('strict' as const)
      : configuredSameSite === 'None'
        ? ('none' as const)
        : configuredSameSite === 'Lax'
          ? ('lax' as const)
          : undefined

  const response = NextResponse.json({ ok: true, revoked: revokeSession })
  response.cookies.set({
    name: `${payload.config.cookiePrefix}-token`,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: Boolean(authConfig?.cookies?.secure),
    ...(sameSite ? { sameSite } : {}),
    ...(authConfig?.cookies?.domain ? { domain: authConfig.cookies.domain } : {}),
  })

  return response
}
