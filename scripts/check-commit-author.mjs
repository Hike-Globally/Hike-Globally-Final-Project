#!/usr/bin/env node
/**
 * Fail when the commit Vercel would build is authored by an address Vercel
 * cannot map to the account that owns this repository, and install the git
 * identity that prevents it in the first place.
 *
 * The rule itself lives in ./commit-identity.mjs.
 *
 * Usage:
 *   npm run verify:commit-author                     # HEAD (what Vercel builds)
 *   npm run verify:commit-author HEAD                # same
 *   npm run verify:commit-author <sha>               # one commit, ancestry ignored
 *   npm run verify:commit-author origin/main..HEAD   # every commit on the branch
 *   BASE=origin/main npm run verify:commit-author
 *
 * The check mirrors Vercel: it builds the commit at the tip of the push, so a
 * single revision is forced to `--max-count=1`. `git log <sha>` on its own
 * walks the whole ancestry, which would flag a bot commit buried in history
 * and fail every later push over a commit Vercel has already deployed.
 */

import { execFileSync } from 'node:child_process'
import { FIX, isDeployableEmail, OWNER } from './commit-identity.mjs'

const run = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim()

const requested = process.argv[2] ?? (process.env.BASE ? `${process.env.BASE}..HEAD` : '-1')

/**
 * `git log <rev>` lists every ancestor of <rev>. Only a range (`base..tip`) or
 * an explicit `-1` should limit the walk; a bare revision must mean "just that
 * commit", because that is the only commit Vercel builds.
 */
const isSingleRevision = (spec) =>
  !spec.includes('..') && !spec.endsWith('^@') && !spec.startsWith('-')

// Keep these as separate argv entries: git parses "-1 <rev>" as one token only
// if you pass it as one, and rejects it as a malformed count.
const logArgs = isSingleRevision(requested) ? ['-1', requested] : [requested]

let log
try {
  log = run(['log', ...logArgs, '--pretty=%h%x09%an <%ae>%x09%cn <%ce>%x09%s'])
} catch {
  console.error('verify:commit-author — could not read git history for range:', logArgs.join(' '))
  process.exit(1)
}

if (!log) {
  console.log('verify:commit-author — no commits in range, nothing to check.')
  process.exit(0)
}

const emailOf = (field) => field?.match(/<([^>]+)>/)?.[1] ?? ''

const commits = log.split('\n').map((line) => {
  const [sha, author, committer, subject] = line.split('\t')
  return {
    sha,
    author,
    committer,
    subject,
    email: emailOf(author),
    committerEmail: emailOf(committer),
  }
})

/**
 * Vercel matches the *author*. The committer is checked too, because a
 * committer address that resolves to nobody has the same effect on the git
 * provider side, and catching it here costs nothing.
 */
const isBad = (c) =>
  !isDeployableEmail(c.email, { kind: 'author' }) ||
  !isDeployableEmail(c.committerEmail, { kind: 'committer' })

const bad = commits.filter(isBad)

if (bad.length === 0) {
  console.log(`verify:commit-author — ${commits.length} commit(s) OK:`)
  for (const c of commits) console.log(`  ${c.sha}  ${c.author}`)
  // Self-heal: if this clone is configured with an address that cannot deploy,
  // fix it now so the *next* commit is correct even if nobody reads the docs.
  try {
    const current = run(['config', 'user.email'])
    if (!isDeployableEmail(current)) {
      run(['config', 'user.name', OWNER.name])
      run(['config', 'user.email', OWNER.email])
      console.log(`\nAlso fixed this clone's git identity (was "${current}"); future commits use ${OWNER.email}.`)
    }
  } catch {
    // No usable git config, or a read-only checkout — not worth failing the run.
  }
  process.exit(0)
}

console.error('verify:commit-author — Vercel will block these commits:\n')
for (const c of bad.slice(0, 10)) {
  console.error(`  ${c.sha}  ${c.author}`)
  console.error(`           ${c.subject}`)
}
if (bad.length > 10) console.error(`  ... and ${bad.length - 10} more`)
console.error(`\n${FIX}\n`)
process.exit(1)
