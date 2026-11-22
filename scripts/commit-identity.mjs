#!/usr/bin/env node
/**
 * The single source of truth for the git identity Vercel will accept on this
 * repository.
 *
 * Vercel refuses to deploy a commit whose author email it cannot map to a
 * GitHub account, and on the Hobby plan that account has to be the one that
 * owns the project. When it cannot, the push succeeds but the deployment is
 * blocked with:
 *
 *   "The deployment was blocked because the commit email <email> could not be
 *    matched to a GitHub account. Ensure your git email matches your GitHub
 *    account."
 *
 * The earlier version of the guard used a *blocklist*: it only rejected
 * addresses it already knew about (`@arena.ai`, `@local`, ...). That is the
 * wrong shape — any new agent/tool address silently passed, was pushed, and
 * blocked the deploy. This module is an *allowlist* instead: only the verified
 * addresses on the owning account deploy, and everything else fails in CI and
 * in a local hook before it can reach Vercel.
 */

/** The account that owns this repository and the Vercel project. */
export const OWNER = {
  name: 'Hike-Globally',
  /** `ID+USERNAME@users.noreply.github.com` — stable across privacy changes. */
  email: '337236695+Hike-Globally@users.noreply.github.com',
}

/**
 * Verified addresses on the Hike-Globally GitHub account
 * (`GET /user/emails` → both `verified: true`). Vercel resolves either one to
 * the owner, so an author using `OWNER.email` or the account's primary address
 * both deploy.
 */
export const AUTHOR_EMAILS = [OWNER.email, 'hikeglobally@gmail.com']

/**
 * GitHub Web-flow is the committer on merge commits that GitHub creates for a
 * pull request. It is not an author anyone can push as, so it is allowed for
 * the committer field only.
 */
export const COMMITTER_EMAILS = ['noreply@github.com']

/**
 * Is this address one Vercel will accept?
 *
 * Comparison is on the trimmed, lower-cased address. Plus-addressing is NOT
 * normalised: Vercel treats `dev+work@example.com` and `dev@example.com` as
 * different identities, so the allowlist compares exact strings only.
 *
 * @param {string} email
 * @param {{ kind?: 'author' | 'committer' }} [options]
 * @returns {boolean}
 */
export function isDeployableEmail(email, { kind = 'author' } = {}) {
  const candidate = String(email ?? '').trim().toLowerCase()
  if (!candidate) return false

  const allowed = kind === 'committer' ? [...AUTHOR_EMAILS, ...COMMITTER_EMAILS] : AUTHOR_EMAILS
  return allowed.some((known) => known.toLowerCase() === candidate)
}

/** Printed whenever a check fails, so the fix needs no documentation lookup. */
export const FIX = `Fix it (repo-local, affects only new commits):
  git config user.name  "${OWNER.name}"
  git config user.email "${OWNER.email}"

Or let the repo do it:  npm run setup:git

For a commit that is already pushed, amend or rebase it:
  git commit --amend --no-edit --reset-author
  git push --force-with-lease origin <branch>`
