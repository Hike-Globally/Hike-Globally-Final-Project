'use client'

import { toast, useConfig, useTranslation } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import { RailIcon } from './rail-icons'

/**
 * Sign out — a button, not a link.
 *
 * Three things have to be true for a sign-out to be honest, and the built-in flow only guarantees
 * the first one:
 *
 *   1. the browser lands on the login screen,
 *   2. the session cookie is actually gone, and
 *   3. the admin cannot be reached again with the back button.
 *
 * Payload's default logout link navigates to the logout *page*, whose helper swallows every failure
 * and redirects anyway — so a refused request looks exactly like a successful sign-out. This button
 * instead posts the sign-out itself and then *checks* `/users/me` before leaving the page.
 *
 * The check matters because the server can legitimately refuse the request: Payload only accepts a
 * cookie-authenticated call when the browser's `Origin` is in its CSRF allowlist, so a preview URL,
 * a tunnel or a `www`/apex mismatch can produce a 400 that leaves the session alive. If that
 * happens — or the response simply never arrives — the button falls back to `/api/logout`, a route
 * that always expires the cookie server-side, and verifies again. Only if even that fails does it
 * say so instead of pretending.
 *
 * The final hop is a full document navigation (`location.replace`, so the admin is not left in the
 * back history) rather than a client-side push: sign-out has to discard every cached React tree and
 * every scrap of in-memory auth state, not just move to another route.
 */

export default function NavSignOut() {
  const { config } = useConfig()
  const { i18n, t } = useTranslation()
  const [signingOut, setSigningOut] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const apiRoute = config.routes.api
  const collection = config.admin.user
  const adminRoute = config.routes.admin
  const loginHref = `${adminRoute}${config.admin.routes.login}`

  const language = i18n.language

  /** True once the server confirms there is no session left. */
  const sessionIsGone = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiRoute}/${collection}/me`, {
        credentials: 'include',
        headers: { 'Accept-Language': language },
      })
      if (!response.ok) return false
      const session = (await response.json()) as { user?: unknown }
      return !session?.user
    } catch {
      return false
    }
  }, [apiRoute, collection, language])

  const signOut = useCallback(async () => {
    if (signingOut) return

    setSigningOut(true)
    setFailure(null)

    /** Ask Payload to end the session the canonical way (runs any `afterLogout` hooks). */
    const askPayload = async (): Promise<boolean> => {
      try {
        const response = await fetch(`${apiRoute}/${collection}/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Accept-Language': language },
        })
        return response.ok
      } catch {
        return false
      }
    }

    /** Last resort: expire the cookie on the server ourselves. Always answers. */
    const clearServerSide = async (): Promise<boolean> => {
      try {
        const response = await fetch(`${apiRoute}/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Accept-Language': language },
        })
        return response.ok
      } catch {
        return false
      }
    }

    try {
      await askPayload()
      let gone = await sessionIsGone()

      if (!gone) {
        await clearServerSide()
        gone = await sessionIsGone()
      }

      if (!gone) {
        setFailure(
          'The server still sees an active session, so signing out has been cancelled. Please try again.',
        )
        setSigningOut(false)
        return
      }

      toast.success(t('authentication:loggedOutSuccessfully'))
      window.location.replace(loginHref)
    } catch {
      setFailure('Sign out could not reach the server. Check your connection and try again.')
      setSigningOut(false)
    }
  }, [apiRoute, collection, language, loginHref, sessionIsGone, signingOut, t])

  return (
    <div className="hg-rail__signout-wrap">
      <button
        className="hg-rail__signout"
        disabled={signingOut}
        onClick={signOut}
        type="button"
      >
        <RailIcon name="sign-out" />
        <span className="hg-rail__signout-label">
          {signingOut ? t('authentication:loggingOut') : t('authentication:logOut')}
        </span>
      </button>

      {failure ? (
        <p className="hg-rail__signout-failure" role="alert">
          {failure}
        </p>
      ) : null}
    </div>
  )
}
