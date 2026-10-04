'use client'

import { Link, toast, useAuth, useConfig, useTranslation } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

/**
 * Sidebar account block: who you are signed in as, plus a sign-out button that actually works.
 *
 * Registered as `admin.components.logout.Button`, replacing Payload's icon-only logout anchor.
 * The default flow navigates to the logout *page*, whose `logOut()` helper swallows every
 * failure — so if the server rejects the request (see `src/middleware.ts` for the origin case)
 * the browser still lands on the login screen while the session cookie lives on, and the next
 * navigation drops the user straight back into the dashboard.
 *
 * This version posts to the logout endpoint itself, then *verifies* that the session is really
 * gone before leaving the page. If the session survives, we say so instead of pretending.
 * The final hop is a full document navigation, so no in-memory auth state can outlive sign-out.
 */

type SidebarUser = {
  email?: string
  name?: string
  roles?: string[]
}

const initialsOf = (user: SidebarUser): string => {
  const name = typeof user.name === 'string' ? user.name.trim() : ''
  if (name) {
    const words = name.split(/\s+/).slice(0, 2)
    return words.map((word) => word[0]?.toUpperCase() ?? '').join('')
  }
  return user.email?.[0]?.toUpperCase() ?? '?'
}

export default function NavSignOut() {
  const { user } = useAuth()
  const { config } = useConfig()
  const { i18n, t } = useTranslation()
  const [signingOut, setSigningOut] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const account = (user ?? null) as SidebarUser | null
  const role = account?.roles?.[0]
  const apiRoute = config.routes.api
  const collection = config.admin.user
  const adminRoute = config.routes.admin
  const accountHref = `${adminRoute}${config.admin.routes.account}`
  const loginHref = `${adminRoute}${config.admin.routes.login}`

  const signOut = useCallback(async () => {
    if (signingOut) return

    setSigningOut(true)
    setFailure(null)

    try {
      const response = await fetch(`${apiRoute}/${collection}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Accept-Language': i18n.language },
      })

      // Confirm the cookie is gone rather than trusting the status code alone.
      const me = await fetch(`${apiRoute}/${collection}/me`, {
        credentials: 'include',
        headers: { 'Accept-Language': i18n.language },
      })
      const session = me.ok ? ((await me.json()) as { user?: unknown }) : null

      if (response.ok && !session?.user) {
        toast.success(t('authentication:loggedOutSuccessfully'))
        // Deliberately a full document navigation, not `router.push()`: sign-out must discard
        // every cached React tree and in-memory auth state, not just move to another route.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(loginHref)
        return
      }

      setFailure(
        'Sign out was refused by the server, so your session is still active. Please try again.',
      )
      setSigningOut(false)
    } catch {
      setFailure('Sign out could not reach the server. Check your connection and try again.')
      setSigningOut(false)
    }
  }, [apiRoute, collection, i18n.language, loginHref, signingOut, t])

  return (
    <div className="hg-nav-account">
      {account ? (
        <Link className="hg-nav-account__identity" href={accountHref} prefetch={false}>
          <span aria-hidden="true" className="hg-nav-account__avatar">
            {initialsOf(account)}
          </span>
          <span className="hg-nav-account__copy">
            <span className="hg-nav-account__name">{account.name || account.email}</span>
            <span className="hg-nav-account__meta">
              {account.email}
              {role ? <span className="hg-nav-account__role">{role}</span> : null}
            </span>
          </span>
        </Link>
      ) : null}

      <button
        className="hg-nav-account__sign-out"
        disabled={signingOut}
        onClick={signOut}
        type="button"
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M14.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3.5" />
          <path d="M10 16.5 5.5 12 10 7.5" />
          <path d="M5.5 12h9" />
        </svg>
        {signingOut ? t('authentication:loggingOut') : t('authentication:logOut')}
      </button>

      {failure ? (
        <p className="hg-nav-account__failure" role="alert">
          {failure}
        </p>
      ) : null}
    </div>
  )
}
